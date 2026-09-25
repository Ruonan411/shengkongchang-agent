"use client";

import { Activity, Code2, Rocket, UserRound } from "lucide-react";
import { Reveal, Section, SectionHeading } from "./primitives";

const ITEMS = [
  {
    icon: UserRound,
    k: "我的角色",
    v: "独立产品负责人 & AI 协同开发者",
    d: "从商家访谈、定义痛点，到语音 Agent 设计与前端落地，独立闭环。",
  },
  {
    icon: Rocket,
    k: "上线周期",
    v: "4 天 MVP",
    d: "Day1 痛点 → Day4 部署内测，2 轮快速迭代。",
  },
  {
    icon: Code2,
    k: "技术栈",
    v: "Next.js · Tailwind · Web Speech API · TypeScript",
    d: "浏览器端实时语音识别 + 本地意图解析，零云端往返、低延迟。",
  },
  {
    icon: Activity,
    k: "核心价值",
    v: "口令即动作 · 减负单人中播",
    d: "AI 把口播转成平台原生互动，替主播动手、不替主播说话。",
  },
];

export function Overview() {
  return (
    <Section id="overview">
      <Reveal>
        <SectionHeading
          index="01"
          title="项目概览"
          subtitle="一个由一线商家访谈驱动、4 天跑通 MVP 的 AI 语音动作触发 Agent。"
        />
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item, i) => (
          <Reveal key={item.k} delay={i * 0.05}>
            <div className="flex h-full flex-col rounded-card border border-dark-border/10 bg-light-card p-6 shadow-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
                <item.icon className="h-5 w-5" />
              </span>
              <div className="mt-4 text-[12px] font-medium uppercase tracking-wide text-muted-light">
                {item.k}
              </div>
              <div className="mt-1 text-[18px] font-semibold leading-snug text-light-text">
                {item.v}
              </div>
              <p className="mt-3 text-[14px] leading-[1.6] text-muted-light">
                {item.d}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
