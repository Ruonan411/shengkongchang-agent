"use client";

import { Reveal, Section, SectionHeading } from "./primitives";

const STEPS = [
  { day: "Day 1", title: "痛点 + 映射", desc: "梳理用户痛点，设计意图—动作映射与蓄力动作延迟策略，用 v0 生成核心界面。" },
  { day: "Day 2", title: "ASR + 意图引擎", desc: "接入流式 ASR 与热词增强，编写意图理解 Prompt，落地语义过滤与规则快速召回。" },
  { day: "Day 3", title: "执行闭环", desc: "明确口令直接执行、模棱两可弹候选、蓄力动作延迟策略、Function Calling 与平台适配层、Mock 接口。" },
  { day: "Day 4", title: "部署", desc: "Cursor 编码 + Vercel 部署，上线进入主播试用与反馈收集。" },
  { day: "内测", title: "找 10+ 主播验证", desc: "重点看 ASR 是否听准、否定/假设句是否过滤、候选排序、蓄力策略是否合习惯、发福袋是否够快、是否破坏节奏。" },
];

export function Timeline() {
  return (
    <Section>
      <Reveal>
        <SectionHeading
          index="11"
          title="构建时间线"
          subtitle="4 天跑通 MVP，工具链是 Vibe Coding 范式：v0 生成界面、Cursor 编码、Vercel 部署、AI 协同开发。"
        />
      </Reveal>

      <Reveal delay={0.05} className="mt-12">
        <div className="relative">
          <div className="absolute left-0 right-0 top-[18px] hidden h-px bg-dark-border/20 lg:block" />
          <div className="grid gap-8 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <div key={s.day} className="relative">
                <div className="flex items-center gap-3 lg:block">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent-blue/40 bg-light-card font-mono text-[12px] font-semibold text-accent-blue shadow-soft">
                    {i + 1}
                  </span>
                  <div className="lg:mt-4">
                    <div className="font-mono text-[12px] text-muted-light">{s.day}</div>
                    <h4 className="text-[16px] font-semibold leading-tight">{s.title}</h4>
                    <p className="mt-1.5 text-[13px] leading-[1.55] text-muted-light">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
