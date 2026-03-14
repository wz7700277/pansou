import { BaseAsyncPlugin, registerGlobalPlugin } from "./manager";
import type { SearchResult } from "../types/models";
import { ofetch } from "ofetch";
import { load } from "cheerio";

const BASE = "https://4kfox.com";
const SEARCH = (kw: string, page = 1) =>
  page === 1
    ? `${BASE}/search/${encodeURIComponent(kw)}-------------.html`
    : `${BASE}/search/${encodeURIComponent(kw)}----------${page}---.html`;

const re = {
  magnet: /magnet:\?xt=urn:btih:[0-9a-fA-F]{40}[^"'\s]*/g,
  ed2k: /ed2k:\/\/\|file\|[^|]+\|[^|]+\|[^|]+\|\/?/g,
  pan: {
    baidu:
      /https?:\/\/pan\.baidu\.com\/s\/[0-9a-zA-Z_-]+(?:\?pwd=[0-9a-zA-Z]+)?/g,
    aliyun:
      /https?:\/\/(?:www\.)?(?:aliyundrive\.com|alipan\.com)\/s\/[0-9a-zA-Z_-]+/g,
    tianyi: /https?:\/\/cloud\.189\.cn\/t\/[0-9a-zA-Z_-]+/g,
    uc: /https?:\/\/drive\.uc\.cn\/s\/[0-9a-fA-F]+(?:\?[^"\s]*)?/g,
    mobile: /https?:\/\/caiyun\.139\.com\/[^"\s]+/g,
    oneonefive: /https?:\/\/115\.com\/s\/[0-9a-zA-Z_-]+/g,
    pikpak: /https?:\/\/mypikpak\.com\/s\/[0-9a-zA-Z_-]+/g,
    xunlei:
      /https?:\/\/pan\.xunlei\.com\/s\/[0-9a-zA-Z_-]+(?:\?pwd=[0-9a-zA-Z]+)?/g,
    _123: /https?:\/\/(?:www\.)?123pan\.com\/s\/[0-9a-zA-Z_-]+/g,
    lanzou: /https?:\/\/(?:www\.)?(?:lanzou|lanzo)[^\s]+/g,
  },
  quark: /https?:\/\/pan\.quark\.cn\/s\/[0-9a-fA-F]+(?:\?pwd=[0-9a-zA-Z]+)?/g,
};

function add(
  out: SearchResult["links"],
  type: string,
  url: string,
  password = ""
) {
  if (!url) return;
  if (re.quark.test(url)) return;
  if (out.some((l) => l.url === url)) return;
  out.push({ type, url, password });
}

function extractAllLinks(html: string): SearchResult["links"] {
  const links: SearchResult["links"] = [];
  const addAll = (rg: RegExp, type: string) => {
    const m = html.match(rg);
    if (m) for (const u of m) add(links, type, u);
  };
  addAll(re.magnet, "magnet");
  addAll(re.ed2k, "ed2k");
  addAll(re.pan.baidu, "baidu");
  addAll(re.pan.aliyun, "aliyun");
  addAll(re.pan.tianyi, "tianyi");
  addAll(re.pan.uc, "uc");
  addAll(re.pan.mobile, "mobile");
  addAll(re.pan.oneonefive, "115");
  addAll(re.pan.pikpak, "pikpak");
  addAll(re.pan.xunlei, "xunlei");
  addAll(re.pan._123, "123");
  addAll(re.pan.lanzou, "lanzou");
  return links;
}

async function fetchDetailLinks(
  detailUrl: string
): Promise<SearchResult["links"]> {
  try {
    const html = await ofetch<string>(detailUrl, {
      headers: { "user-agent": "Mozilla/5.0", referer: BASE + "/" },
      timeout: 10000,
    });
    const $ = load(html);
    const pageText = $.text() + "\n" + $("body").html() || "";
    return extractAllLinks(pageText);
  } catch {
    return [];
  }
}

export class Fox4kPlugin extends BaseAsyncPlugin {
  constructor() {
    super("fox4k", 3);
  }
  override async search(keyword: string): Promise<SearchResult[]> {
    const html = await ofetch<string>(SEARCH(keyword, 1), {
      headers: { "user-agent": "Mozilla/5.0", referer: BASE + "/" },
      timeout: 10000,
    }).catch(() => "");
    if (!html) return [];
    const $ = load(html);
    const items: SearchResult[] = [];
    const nodes = $(".hl-list-item");
    const tasks = nodes
      .map(async (_, el) => {
        const s = $(el);
        const a = s.find(".hl-item-pic a").first();
        let href = a.attr("href") || "";
        if (!href) return;
        if (href.startsWith("/")) href = BASE + href;
        const title = s.find(".hl-item-title a").first().text().trim();
        const detailLinks = await fetchDetailLinks(href);
        if (detailLinks.length) {
          items.push({
            message_id: "",
            unique_id: `fox4k-${href}`,
            channel: "",
            datetime: "",
            title,
            content: "",
            links: detailLinks,
          });
        }
      })
      .get();
    await Promise.allSettled(tasks);
    return items;
  }
}

registerGlobalPlugin(new Fox4kPlugin());
