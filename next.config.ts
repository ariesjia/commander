import type { NextConfig } from "next";

// next-pwa 构建时会 glob public/**/*（排除 sw / workbox 自身）写入 precache，并带文件 revision
// eslint-disable-next-line @typescript-eslint/no-require-imports
const defaultRuntimeCaching = require("next-pwa/cache");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  /** 默认 2MB，机甲 level 图略过会不进 precache；提高到 15MB */
  maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
  /**
   * 运行时缓存：机甲资源、音效优先 CacheFirst + 大 maxEntries；
   * 其余沿用 next-pwa 默认（字体、图片通配、/_next/data、API 等）
   */
  runtimeCaching: [
    {
      urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/mecha/"),
      handler: "CacheFirst",
      options: {
        cacheName: "mecha-assets",
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 90 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/sounds/"),
      handler: "CacheFirst",
      options: {
        cacheName: "sound-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
        rangeRequests: true,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|webp|svg|ico)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-images-wide",
        expiration: {
          maxEntries: 256,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    /** Next 构建产物：JS/CSS/字体等，优先于下面通配 .js/.css */
    {
      urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/_next/static/"),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-static-assets",
        expiration: {
          maxEntries: 256,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    /** 其余同源 .js / .mjs（含 public 下脚本等） */
    {
      urlPattern: /\.(?:js|mjs)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "runtime-js-assets",
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    /** 其余同源 .css / .less */
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "runtime-css-assets",
        expiration: {
          maxEntries: 96,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    ...defaultRuntimeCaching,
  ],
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
};

export default withPWA(nextConfig);
