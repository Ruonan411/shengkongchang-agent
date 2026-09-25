"use client";

import { Radio, Brain, Rocket, ShieldCheck } from "lucide-react";
import { Reveal, Section, SectionHeading } from "./primitives";

const FEATURES = [
  {
    icon: Radio,
    title: "听得懂",
    oneliner: "VAD 端点检测 + 流式 ASR，低延迟、抗噪，听得清主播在直播间的每一句口令，还支持热词增强。",
  },
  {
    icon: Brain,
    title: "想得清",
    oneliner: "规则召回 + LLM 语义理解：抽取槽位（金额 / 商品 / 门槛），并区分明确指令、模棱两可、蓄力动作。",
  },
  {
    icon: Rocket,
    title: "做得到",
    oneliner: "平台适配层把意图转成抖音 / 快手 / 视频号原生动作；高置信直接执行，模棱两可弹候选，蓄力动作按策略触发。",
  },
  {
    icon: ShieldCheck,
    title: "守得住",
    oneliner: "语义过滤拦截否定句 / 假设句 / 条件句 / 举例句，不误触发；蓄力动作尊重主播节奏，高危动作强制确认，每步留痕。",
  },
];

export function CoreFeatures() {
  return (
    <Section id="features">
      <Reveal>
        <SectionHeading
          index="06"
          title="核心能力"
          subtitle="声控场是一个 Agent，而不是一个简单的口令宏：它听得懂、想得清、做得到，还守得住。"
        />
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <div className="flex h-full flex-col rounded-card border border-dark-border/10 bg-light-card p-6 shadow-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[20px] font-semibold leading-tight">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-muted-light">{f.oneliner}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
