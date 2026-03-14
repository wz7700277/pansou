import { SearchService, type SearchServiceOptions } from "./searchService";
import { PluginManager, registerGlobalPlugin } from "../plugins/manager";
import { HunhepanPlugin } from "../plugins/example/hunhepan";
import { ZhizhenPlugin } from "../plugins/zhizhen";
import { OugePlugin } from "../plugins/ouge";
import { WanouPlugin } from "../plugins/wanou";
import { LabiPlugin } from "../plugins/labi";
import { PantaPlugin } from "../plugins/panta";
import { SusuPlugin } from "../plugins/susu";
import { JikepanPlugin } from "../plugins/jikepan";
import { QupansouPlugin } from "../plugins/qupansou";
import { Fox4kPlugin } from "../plugins/fox4k";
import { Hdr4kPlugin } from "../plugins/hdr4k";
import { ThePirateBayPlugin } from "../plugins/thepiratebay";
import { DuoduoPlugin } from "../plugins/duoduo";
import { MuouPlugin } from "../plugins/muou";
import { Pan666Plugin } from "../plugins/pan666";
import { XuexizhinanPlugin } from "../plugins/xuexizhinan";
import { HubanPlugin } from "../plugins/huban";
import { PanyqPlugin } from "../plugins/panyq";
import { PansearchPlugin } from "../plugins/pansearch";
import { ShandianPlugin } from "../plugins/shandian";

let singleton: SearchService | undefined;

export function getOrCreateSearchService(runtimeConfig: any): SearchService {
  if (singleton) return singleton;
  const options: SearchServiceOptions = {
    defaultChannels: runtimeConfig.defaultChannels || [],
    defaultConcurrency: runtimeConfig.defaultConcurrency || 10,
    pluginTimeoutMs: runtimeConfig.pluginTimeoutMs || 15000,
    cacheEnabled: !!runtimeConfig.cacheEnabled,
    cacheTtlMinutes: runtimeConfig.cacheTtlMinutes || 30,
  };

  const pm = new PluginManager();
  // 直接注册内置插件（避免使用 Nitro 插件 impound 机制）
  registerGlobalPlugin(new HunhepanPlugin());
  registerGlobalPlugin(new ZhizhenPlugin());
  registerGlobalPlugin(new OugePlugin());
  registerGlobalPlugin(new WanouPlugin());
  registerGlobalPlugin(new LabiPlugin());
  registerGlobalPlugin(new PantaPlugin());
  registerGlobalPlugin(new SusuPlugin());
  registerGlobalPlugin(new JikepanPlugin());
  registerGlobalPlugin(new QupansouPlugin());
  registerGlobalPlugin(new Fox4kPlugin());
  registerGlobalPlugin(new Hdr4kPlugin());
  registerGlobalPlugin(new ThePirateBayPlugin());
  registerGlobalPlugin(new DuoduoPlugin());
  registerGlobalPlugin(new MuouPlugin());
  registerGlobalPlugin(new Pan666Plugin());
  registerGlobalPlugin(new XuexizhinanPlugin());
  registerGlobalPlugin(new HubanPlugin());
  registerGlobalPlugin(new PanyqPlugin());
  registerGlobalPlugin(new PansearchPlugin());
  registerGlobalPlugin(new ShandianPlugin());
  pm.registerAllGlobalPlugins();

  singleton = new SearchService(options, pm);
  return singleton;
}
