import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/contexts/Providers";
import { ModeTransition } from "@/components/mode-switch/ModeTransition";

export const metadata: Metadata = {
  title: "机甲指挥官 | MechCommander",
  description: "学生游戏化激励系统 — 完成任务，养成机甲，兑换奖励",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <ModeTransition />
        </Providers>
      </body>
    </html>
  );
}
