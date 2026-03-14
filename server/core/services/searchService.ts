import { MemoryCache } from "../cache/memoryCache";
import type {
  MergedLinks,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "../types/models";
import { PluginManager, type AsyncSearchPlugin } from "../plugins/manager";

export interface SearchServiceOptions {
  defaultChannels: string[];
  defaultConcurrency: number;
  pluginTimeoutMs: number;
  cacheEnabled: boolean;
  cacheTtlMinutes: number;
}

export class SearchService {
  private options: SearchServiceOptions;
  private pluginManager: PluginManager;
  private tgCache = new MemoryCache<SearchResult[]>();
  private pluginCache = new MemoryCache<SearchResult[]>();

  constructor(options: SearchServiceOptions, pluginManager: PluginManager) {
    this.options = options;
    this.pluginManager = pluginManager;
  }

  getPluginManager() {
    return this.pluginManager;
  }

  async search(
    keyword: string,
    channels: string[] | undefined,
    concurrency: number | undefined,
    forceRefresh: boolean | undefined,
    resultType: string | undefined,
    sourceType: "all" | "tg" | "plugin" | undefined,
    plugins: string[] | undefined,
    cloudTypes: string[] | undefined,
    ext: Record<string, any> | undefined
  ): Promise<SearchResponse> {
    const effChannels =
      channels && channels.length > 0 ? channels : this.options.defaultChannels;
    const effConcurrency =
      concurrency && concurrency > 0
        ? concurrency
        : this.options.defaultConcurrency;
    const effResultType =
      !resultType || resultType === "merge" ? "merged_by_type" : resultType;
    const effSourceType = sourceType ?? "all";

    let tgResults: SearchResult[] = [];
    let pluginResults: SearchResult[] = [];

    const tasks: Array<() => Promise<void>> = [];

    if (effSourceType === "all" || effSourceType === "tg") {
      tasks.push(async () => {
        tgResults = await this.searchTG(keyword, effChannels, !!forceRefresh);
      });
    }
    if (effSourceType === "all" || effSourceType === "plugin") {
      tasks.push(async () => {
        pluginResults = await this.searchPlugins(
          keyword,
          plugins,
          !!forceRefresh,
          effConcurrency,
          ext ?? {}
        );
      });
    }

    await Promise.all(tasks.map((t) => t()));

    const allResults = this.mergeSearchResults(tgResults, pluginResults);
    this.sortResultsByTimeDesc(allResults);

    const filteredForResults: SearchResult[] = [];
    for (const r of allResults) {
      const hasTime = !!r.datetime;
      const keywordPriority = this.getKeywordPriority(r.title);
      const pluginLevel = this.getPluginLevelBySource(this.getResultSource(r));
      if (hasTime || keywordPriority > 0 || pluginLevel <= 2)
        filteredForResults.push(r);
    }

    const mergedLinks = this.mergeResultsByType(
      allResults,
      keyword,
      cloudTypes
    );

    let total = 0;
    let response: SearchResponse = { total: 0 };
    if (effResultType === "merged_by_type") {
      total = Object.values(mergedLinks).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      response = { total, merged_by_type: mergedLinks };
    } else if (effResultType === "results") {
      total = filteredForResults.length;
      response = { total, results: filteredForResults };
    } else {
      // all
      total = filteredForResults.length;
      response = {
        total,
        results: filteredForResults,
        merged_by_type: mergedLinks,
      };
    }
    return response;
  }

  private async searchTG(
    keyword: string,
    channels: string[],
    forceRefresh: boolean
  ): Promise<SearchResult[]> {
    const cacheKey = `tg:${keyword}:${[...channels].sort().join(",")}`;
    const { cacheEnabled, cacheTtlMinutes } = this.options;
    if (!forceRefresh && cacheEnabled) {
      const cached = this.tgCache.get(cacheKey);
      if (cached.hit && cached.value) return cached.value;
    }

    // 控制并发抓取频道公开页并解析（避免一次性打满连接被限流）
    const { fetchTgChannelPosts } = await import("./tg");
    const perChannelLimit = 30;
    const runnerTasks = channels.map(
      (ch) => async () =>
        fetchTgChannelPosts(ch, keyword, { limitPerChannel: perChannelLimit })
    );
    const concurrency = Math.max(
      2,
      Math.min(this.options.defaultConcurrency, 12)
    );
    const resultsByChannel = await this.runWithConcurrency(
      runnerTasks,
      concurrency
    );
    const results: SearchResult[] = [];
    for (const arr of resultsByChannel) {
      if (Array.isArray(arr)) results.push(...(arr as SearchResult[]));
    }

    if (cacheEnabled && results.length > 0) {
      this.tgCache.set(cacheKey, results, cacheTtlMinutes * 60_000);
    }
    return results;
  }

  private async searchPlugins(
    keyword: string,
    plugins: string[] | undefined,
    forceRefresh: boolean,
    concurrency: number,
    ext: Record<string, any>
  ): Promise<SearchResult[]> {
    const cacheKey = `plugin:${keyword}:${(plugins ?? [])
      .map((p) => p?.toLowerCase())
      .filter(Boolean)
      .sort()
      .join(",")}`;
    const { cacheEnabled, cacheTtlMinutes } = this.options;
    if (!forceRefresh && cacheEnabled) {
      const cached = this.pluginCache.get(cacheKey);
      if (cached.hit && cached.value) return cached.value;
    }

    const allPlugins = this.pluginManager.getPlugins();
    let available: AsyncSearchPlugin[] = [];
    if (plugins && plugins.length > 0 && plugins.some((p) => !!p)) {
      const wanted = new Set(plugins.map((p) => p.toLowerCase()));
      available = allPlugins.filter((p) => wanted.has(p.name().toLowerCase()));
    } else {
      available = allPlugins;
    }

    const tasks = available.map((p) => async () => {
      p.setMainCacheKey(cacheKey);
      p.setCurrentKeyword(keyword);
      try {
        return await p.search(keyword, ext);
      } catch {
        return [] as SearchResult[];
      }
    });

    const resultsByPlugin = await this.runWithConcurrency(tasks, concurrency);
    const merged: SearchResult[] = [];
    for (const arr of resultsByPlugin) merged.push(...arr);

    if (cacheEnabled) {
      this.pluginCache.set(cacheKey, merged, cacheTtlMinutes * 60_000);
    }
    return merged;
  }

  private mergeSearchResults(
    a: SearchResult[],
    b: SearchResult[]
  ): SearchResult[] {
    const seen = new Set<string>();
    const out: SearchResult[] = [];
    const pushUnique = (r: SearchResult) => {
      const key = r.unique_id || r.message_id || `${r.title}|${r.channel}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(r);
    };
    for (const r of a) pushUnique(r);
    for (const r of b) pushUnique(r);
    return out;
  }

  private sortResultsByTimeDesc(arr: SearchResult[]) {
    arr.sort(
      (x, y) => new Date(y.datetime).getTime() - new Date(x.datetime).getTime()
    );
  }

  private getResultSource(_r: SearchResult): string {
    // 可根据 SearchResult 增补来源字段，这里返回空表示未知
    return "";
  }

  private getPluginLevelBySource(_source: string): number {
    return 3;
  }
  private getKeywordPriority(_title: string): number {
    return 0;
  }

  private mergeResultsByType(
    results: SearchResult[],
    _keyword: string,
    cloudTypes?: string[]
  ): MergedLinks {
    const allow =
      cloudTypes && cloudTypes.length > 0
        ? new Set(cloudTypes.map((s) => s.toLowerCase()))
        : undefined;
    const out: MergedLinks = {};
    for (const r of results) {
      for (const link of r.links || []) {
        const t = (link.type || "").toLowerCase();
        if (allow && !allow.has(t)) continue;
        if (!out[t]) out[t] = [];
        out[t].push({
          url: link.url,
          password: link.password,
          note: r.title,
          datetime: r.datetime,
          images: r.images,
        });
      }
    }
    return out;
  }

  private async runWithConcurrency<T>(
    tasks: Array<() => Promise<T>>,
    limit: number
  ): Promise<T[]> {
    const queue = tasks.slice();
    const results: T[] = [];
    let running: Promise<void>[] = [];

    const runNext = async () => {
      const task = queue.shift();
      if (!task) return;
      const p = task()
        .then((res) => {
          results.push(res);
        })
        .catch(() => {
          /* swallow */
        });
      const wrapped = p.then(() => {
        /* slot freed */
      });
      running.push(wrapped);
      if (running.length >= limit) {
        await Promise.race(running);
        running = running.filter((r) => r !== wrapped);
      }
      await runNext();
    };

    const starters = Math.min(limit, queue.length);
    await Promise.all(Array.from({ length: starters }, () => runNext()));
    await Promise.all(running);
    return results;
  }
}
