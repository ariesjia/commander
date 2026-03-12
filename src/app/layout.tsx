import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/contexts/Providers";
import { ModeTransition } from "@/components/mode-switch/ModeTransition";

export const metadata: Metadata = {
  title: "MotiMech | 学生游戏化激励系统",
  description: "学生游戏化激励系统 — 完成任务，养成机甲，兑换奖励",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head />
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <ModeTransition />
        </Providers>
      </body>
    </html>
  );
}
