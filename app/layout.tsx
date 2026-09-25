import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "声控场 Copilot — 主播说一句，直播间自动动一步",
  description:
    "声控场 Copilot 是 AI 语音识别驱动的直播动作触发 Agent：主播说一句，直播间自动动一步。覆盖抖音 / 快手 / 视频号，口令即动作、动口不动手。浏览器端实时语音识别 + 本地意图解析，4 天 MVP。",
  keywords: [
    "声控场 Copilot",
    "直播语音 Agent",
    "语音动作触发",
    "直播场控",
    "ASR",
    "直播副驾",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-light-bg font-sans text-light-text antialiased">
        {children}
      </body>
    </html>
  );
}
