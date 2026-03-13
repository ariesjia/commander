import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { Providers } from "@/contexts/Providers";
import { ModeTransition } from "@/components/mode-switch/ModeTransition";

const notoSansSC = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-sc",
});

export const metadata: Metadata = {
  title: "MotiMech | 学生游戏化激励系统",
  description: "学生游戏化激励系统 — 完成任务，养成机甲，兑换奖励",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MotiMech",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={notoSansSC.variable}>
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
