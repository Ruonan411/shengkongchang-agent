"use client";

import { Quote } from "lucide-react";
import { Reveal, Section, SectionHeading, Placeholder } from "./primitives";

export function Background() {
  return (
    <Section id="background">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <SectionHeading
            index="02"
            title="为什么做：从一次手忙脚乱的中控体验出发"
            subtitle="不是凭空想的点子，而是在实际体验直播中控与助播操作时，发现了一个没人填的执行缝隙。"
          />
          <div className="mt-6 max-w-prose space-y-4 text-[17px] leading-[1.75] text-muted-light">
            <p>
              主播在直播里常说：“给大家发个福袋”“讲解一下这个商品”“准备开价”。
              但现实是，中控后台或助播还得手动找到对应入口、填参数、点发放。
              一旦中控正在忙别的操作，或没听清，就会延迟 3–5 秒，
              <span className="font-medium text-light-text">
                节奏直接被打断，甚至漏掉动作
              </span>
              。
            </p>
            <p>
              更重要的是：现在平台的跟播助手大多只“建议”不“执行”——它们能识别评论、总结弹幕、推荐主播做动作，但最后一步仍停在提示层。链路里始终留着一道缝：
              <span className="font-medium text-light-text">
                主播嘴 → 平台 AI 建议 → 主播喊中控 → 中控后台操作 → 平台原生互动
              </span>
              。
            </p>
            <p>
              我想做的是把这道缝闭合：
              <span className="font-medium text-light-text">
                主播嘴 → ASR 识别 → 意图理解 → 自动调平台接口 → 直接触发原生互动
              </span>
              。而 2026 年 AI Native / Agent / Vibe Coding 范式成熟，正好让我一个人也能快速跑出轻量 MVP 验证它。
            </p>
            <div className="rounded-lg border border-accent-blue/25 bg-accent-blue/5 p-3.5 text-[14px] leading-[1.6] text-muted-light">
              立项前提：声控场是「控制 / 管理层」，不主动开播——用户需先用 OBS 或平台原生工具开播，声控场只负责把口播转成平台原生动作。
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Placeholder
            tone="light"
            ratio="4 / 3"
            label="此处放置：抖音中控台后台实操截图（待补充）"
            note="直播中控：口播 → 手动找入口、填参数、点鼠标的执行缝隙"
          />
          <div className="mt-4 flex gap-3 rounded-card border border-dark-border/10 bg-light-card p-5 shadow-soft">
            <Quote className="h-5 w-5 shrink-0 text-accent-blue" />
            <p className="text-[15px] leading-[1.6] text-muted-light">
              “平台给我一堆建议，可最后点鼠标的还是我自己，手根本点不过来。”
              <span className="mt-1 block text-[13px] text-muted-light/80">
                —— 来自一次真实的中控上手体验
              </span>
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
