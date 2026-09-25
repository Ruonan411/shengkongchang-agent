"use client";

import { Reveal, Section, SectionHeading } from "./primitives";
import { ASRDemo } from "./ASRDemo";

const STEPS = [
  { n: "1", t: "填口令", d: "在左侧 A·口令配置里定义「口令 → 平台动作」，可自由增删改。" },
  { n: "2", t: "说 / 点口令", d: "点「开始聆听」用麦克风说，或点示例、手动输入模拟。" },
  { n: "3", t: "看 Agent 动一步", d: "状态机流转到意图解析 / 槽位抽取，高危动作需确认，低危自动下发，全程留痕。" },
];

export function Demo() {
  return (
    <Section id="demo">
      <Reveal>
        <SectionHeading
          index="09"
          title="产品 Demo · 语音动作 Agent"
          subtitle="说一句口令，看 Agent 如何走完状态机：实时聆听 → 语义过滤 → 意图分类（明确 / 模棱两可 / 蓄力 / 多步）→ 执行或候选或蓄力触发，并完整记录日志与手机端模拟器状态。"
        />
      </Reveal>

      <Reveal delay={0.05} className="mt-12">
        <ASRDemo />
      </Reveal>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08}>
            <div className="flex h-full gap-4 rounded-card border border-dark-border/10 bg-light-card p-5 shadow-soft">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue/15 font-mono text-[14px] font-semibold text-accent-blue">
                {s.n}
              </span>
              <div>
                <h4 className="text-[15px] font-semibold leading-snug">{s.t}</h4>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-muted-light">
                  {s.d}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
