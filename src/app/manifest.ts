import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MotiMech",
    short_name: "MotiMech",
    description: "学生游戏化激励系统 — 完成任务，养成机甲，兑换奖励",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#3b82f6",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/apple-touch-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
