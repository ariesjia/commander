# PWA 与离线缓存

项目使用 [next-pwa](https://github.com/shadowwalker/next-pwa)（Workbox），配置在根目录 `next.config.ts`。

## 预缓存（Precache）

- **生产构建**（`pnpm build`）时，会对 `public/` 目录做 **glob**（排除 `sw.js`、`workbox-*.js` 等），将匹配到的静态资源写入 Service Worker 的预缓存清单，并带 **内容 MD5 revision**。
- 因此 `public/mecha/**`、`public/sounds/**`、`logo.svg` 等都会参与预缓存（文件不要过大）。
- **`maximumFileSizeToCacheInBytes`** 已从 Workbox 默认的 2MB 提高到 **15MB**，避免高清机甲图被排除在预缓存之外。

开发模式（`pnpm dev`）下 PWA 默认关闭，便于调试。

## 运行时缓存（Runtime Caching）

在预缓存之外，`next.config.ts` 中配置了：

| 规则 | 策略 | 说明 |
|------|------|------|
| `/mecha/*` | CacheFirst | 机甲图片等，最多约 500 条，约 90 天 |
| `/sounds/*` | CacheFirst + range | 音效，支持 Range，最多约 64 条 |
| 图片扩展名通配 | StaleWhileRevalidate | 其余 PNG/JPG/SVG 等，最多 256 条 |
| `/_next/static/*` | StaleWhileRevalidate | Next 打包的 JS/CSS/字体等，最多约 256 条，约 30 天 |
| `.js` / `.mjs` | StaleWhileRevalidate | 其余脚本（如 `public` 下），最多约 128 条 |
| `.css` / `.less` | StaleWhileRevalidate | 样式表，最多约 96 条 |
| 其余 | next-pwa 默认 | 字体、`_next/data`、API、页面等（其中与上重复的扩展名由靠前规则先匹配） |

首次访问仍依赖网络；命中后会进入对应 Cache Storage，弱网或二次访问更稳。

## 验证

1. 执行生产构建并启动：`pnpm build && pnpm start`
2. 浏览器 DevTools → **Application** → **Service Workers** / **Cache Storage** 查看预缓存与运行时缓存条目。
