# PanHub · 全网最全的网盘搜索

用一个搜索框，搜遍阿里云盘、夸克、百度网盘、115、迅雷等热门网盘资源。即搜即得、聚合去重、免费开源、零广告、轻量部署。

在线体验：<https://panhub.shenzjd.com>

> 免责声明：本项目仅用于技术学习与搜索聚合演示，不存储、不传播任何受版权保护的内容。请勿用于商业或侵权用途。

---

## 一键部署到 Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/shenzjd/panhub.shenzjd.com)

- 点击上方按钮，按向导授权并创建项目即可自动构建与发布。
- 若你已 fork 本仓库，点击后可在向导中选择你的 fork 进行部署。

部署完成后，可在 Cloudflare Dashboard 为 Worker 绑定自定义域名，一般 1 分钟内全球生效。

---

## 为什么选择 PanHub

- 强聚合：聚合多个优质资源站与公开频道，一次搜索多源命中
- 智能排序：默认先给出“快速结果”，随后自动补全“深度结果”并覆盖显示
- 分类型展示：阿里、夸克、百度、115、迅雷等分类清晰，直达链接可复制
- 极速部署：原生支持 Cloudflare Workers，0 服务器运维成本，免费起步
- 轻定制：内置多插件，支持按需启用/禁用，参数化并发与缓存

---

## 快速开始（本地）

```bash
git clone https://github.com/shenzjd/panhub.shenzjd.com.git
cd panhub.shenzjd.com
npm install
npm run dev
```

打开浏览器访问 `http://localhost:3000`，输入关键词开始搜索。

---

## 手动部署到 Cloudflare（CLI）

如需通过命令行部署：

```bash
# 1) 安装 wrangler（Cloudflare 官方 CLI）
npm i -g wrangler

# 2) 安装依赖并构建
npm install
npm run build

# 3) 首次登录 Cloudflare 账号（按提示完成）
wrangler login

# 4) 一键发布
npm run deploy:cf
```

本项目已提供 `wrangler.toml`：

- 运行时：Module Worker（`cloudflare-module`）
- 主入口：`.output/server/index.mjs`
- 静态资源：`.output/public` 作为 `ASSETS` 绑定

整个构建/部署过程无需额外环境变量即可运行。

---

## 使用说明

1) 打开页面，输入关键词，如“奥本海默 4K”或“Photoshop 2024”。

2) 页面会先返回“快速搜索”结果，随后在后台进行“深度搜索”，并自动用更多、更准的结果覆盖显示。

3) 顶部快捷筛选可在“全部/单个平台”之间切换视图；每个平台卡片内支持展开更多与复制链接。

---

## 进阶配置（可选）

- 并发与缓存：在 `nuxt.config.ts` 的 `runtimeConfig` 中可调整 `defaultConcurrency`、`cacheEnabled`、`cacheTtlMinutes`。
- 频道与数据源：`runtimeConfig.defaultChannels` 为默认的公开频道集合；插件由服务端内置并聚合。
- SEO：`app.head` 内已预置标题、描述、Keywords、OG 标签，可按需修改。

如需扩展插件或站点源，可在 `server/core/plugins/` 目录中查看现有实现并新增对应文件。

---

## 接口（仅供参考）

前端仅调用一个接口：`GET /api/search`

示例入参：

- `kw`：关键词（必填）
- `res`：`merged_by_type | results | all`，默认 `merged_by_type`
- `src`：`all | tg | plugin`，默认 `all`
- `plugins`：可指定插件名，逗号分隔

响应示例（节选）：

```json
{
  "code": 0,
  "data": {
    "total": 123,
    "merged_by_type": {
      "quark": [{
        "url": "https://pan.quark.cn/...",
        "password": "abcd",
        "note": "示例标题",
        "datetime": "2025-01-01T00:00:00.000Z"
      }],
      "baidu": [ ... ]
    }
  }
}
```

---

## 版权与合规

- PanHub 不存储任何搜索结果内容，所有链接均来自公开网络。
- 请在遵守当地法律法规与平台使用条款的前提下使用本项目。
- 若您是权利人并认为存在侵权线索，请先联系源站处理。

---

## 许可证

本项目采用 MIT License 开源许可，商业使用请遵守许可证条款并自担合规责任。
