"use client";

import { Reveal, Section, SectionHeading, DataCard } from "./primitives";

const NUMBERS = [
  { value: "≤1s", label: "口令响应", hint: "本地意图解析 · 零云端往返" },
  { value: "−70%", label: "操作步骤", hint: "动口代替动手（设计估算）" },
  { value: "A–G", label: "功能模块", hint: "配置→识别→执行→评测" },
  { value: "3+", label: "覆盖平台", hint: "抖音 / 快手 / 视频号" },
];

/* 量化评测体系（目标值） */
const METRICS = [
  { name: "明确指令识别准确率", target: ">95%", desc: "正确执行的明确指令 / 明确指令总数" },
  { name: "语义过滤准确率", target: ">95%", desc: "正确拦截否定/假设/条件句数 / 总过滤数" },
  { name: "语义过滤召回率", target: ">90%", desc: "正确拦截数 / 应拦截总数" },
  { name: "歧义识别准确率", target: ">90%", desc: "正确识别为歧义意图数 / 歧义意图总数" },
  { name: "候选命中率", target: ">95%", desc: "主播选择落入 Top3 候选 / 总歧义触发数" },
  { name: "误触发率", target: "<1%", desc: "不应触发却触发次数 / 总触发次数" },
  { name: "漏触发率", target: "<5%", desc: "应触发却未触发次数 / 应触发总次数" },
  { name: "ASR 首字延迟", target: "<300ms", desc: "从主播说完到 ASR 返回首字" },
  { name: "端到端延迟", target: "<800ms", desc: "从识别到平台执行完成" },
  { name: "任务完成率", target: ">95%", desc: "成功执行的 Agent 任务 / 总任务" },
];

const FEEDBACK = [
  {
    quote: "口令能不能让我自己定？不同品类说法差太多。",
    fix: "引入「语音宏」：口令 → 动作完全由主播自填，系统零硬编码盲区。",
  },
  {
    quote: "自动发福袋、改价会不会误操作、平台不让？",
    fix: "改为「明确口令直接执行 + 模棱两可弹候选 + 高危强制确认」，蓄力动作按策略触发，符合平台要求。",
  },
  {
    quote: "“今天不发福袋了”这种话会不会误触发？",
    fix: "加 LLM 语义过滤层：否定句 / 假设句 / 条件句 / 举例句一律拦截，不执行也不打扰主播。",
  },
];

export function Results() {
  return (
    <Section id="results">
      <Reveal>
        <SectionHeading
          index="10"
          title="原型价值与评测体系"
          subtitle="相对「手动点鼠标」，声控场的关键不是更多功能，而是更少打断、更稳不漏、动作可追溯、效果可量化。"
        />
      </Reveal>

      <Reveal delay={0.05} className="mt-12">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {NUMBERS.map((n, i) => (
            <Reveal key={n.label} delay={i * 0.05}>
              <DataCard value={n.value} label={n.label} hint={n.hint} />
            </Reveal>
          ))}
        </div>
      </Reveal>

      {/* 量化评测体系 */}
      <Reveal delay={0.1} className="mt-12">
        <div className="rounded-card border border-dark-border/10 bg-light-card p-6 shadow-soft">
          <div className="text-[13px] font-medium uppercase tracking-wide text-muted-light/70">
            量化评测体系 · 目标值
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {METRICS.map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-dark-border/10 bg-light-bg px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-light-text">{m.name}</div>
                  <div className="mt-0.5 text-[12px] leading-[1.4] text-muted-light">{m.desc}</div>
                </div>
                <span className="shrink-0 font-mono text-[16px] font-semibold text-accent-blue">
                  {m.target}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {FEEDBACK.map((f, i) => (
          <Reveal key={f.quote} delay={i * 0.06}>
            <div className="flex h-full flex-col rounded-card border border-dark-border/10 bg-light-card p-6 shadow-soft">
              <div className="text-[12px] font-medium uppercase tracking-wide text-muted-light/70">
                验证反思
              </div>
              <p className="mt-2 text-[16px] leading-[1.5] text-light-text">“{f.quote}”</p>
              <div className="mt-4 rounded-lg bg-safe/5 p-3.5 text-[14px] leading-[1.55] text-light-text">
                <span className="font-medium text-safe">迭代动作：</span>
                {f.fix}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
