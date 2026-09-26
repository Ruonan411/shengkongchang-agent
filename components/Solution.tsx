"use client";

import {
  ArrowDown,
  Command,
  Radio,
  Brain,
  Layers,
  Globe2,
  ScrollText,
  ShieldCheck,
  Gauge,
  ListChecks,
  Hourglass,
  Zap,
} from "lucide-react";
import { Reveal, Section, SectionHeading } from "./primitives";
import { WorkbenchMockup } from "./WorkbenchMockup";

/* 设计原则三型 */
const PRINCIPLES = [
  {
    icon: Zap,
    tag: "明确指令",
    title: "明确口令直接执行，不弹框",
    desc: "“发福袋”“上库存”“讲解商品”这类高频明确动作，置信度够高就直接执行，不弹确认框，不打断节奏。",
  },
  {
    icon: ListChecks,
    tag: "模棱两可",
    title: "弹候选卡片，主播选择后执行",
    desc: "“给家人们整点福利”不知是福袋还是券，系统弹出候选（福袋/优惠券/红包/抽奖），主播点一下即执行。",
  },
  {
    icon: Hourglass,
    tag: "蓄力动作",
    title: "不立即执行，按预设延迟策略触发",
    desc: "“准备开价”是憋单不是立即开价。可设固定延迟 / 口令触发 / 条件触发 / 手动触发，尊重主播节奏。",
  },
];

const MODULES = [
  {
    tag: "A",
    icon: Command,
    title: "意图与策略配置中心",
    desc: "配置意图描述、绑定动作、参数与蓄力动作延迟策略；口令由主播自填，零硬编码盲区。",
  },
  {
    tag: "B",
    icon: Radio,
    title: "实时 ASR 监听与热词增强",
    desc: "音频采集 + VAD 静音检测 + 流式 ASR；注入商品名、口令、平台术语热词，噪声环境监控 WER。",
  },
  {
    tag: "C",
    icon: Brain,
    title: "Agent 意图理解与语义过滤",
    desc: "规则快速召回 + LLM 语义理解；过滤否定句 / 假设句 / 条件句 / 举例句，分类明确指令 / 模棱两可 / 蓄力动作。",
  },
  {
    tag: "D",
    icon: ShieldCheck,
    title: "动作执行与安全保护",
    desc: "明确口令直接执行、模棱两可弹候选、蓄力动作按策略触发；冷却期去重，同动作 60 秒内不重复触发。",
  },
  {
    tag: "E",
    icon: Globe2,
    title: "工具调用与平台适配层",
    desc: "统一 Action Schema + Function Calling；适配抖音 / 快手 / 视频号 / 淘宝直播原生互动接口。",
  },
  {
    tag: "F",
    icon: Layers,
    title: "失败恢复与降级",
    desc: "超时指数退避重试；工具调用失败 → 替代工具 → 转人工；异常按 ASR 错 / 意图错 / 接口超时归因。",
  },
  {
    tag: "G",
    icon: ScrollText,
    title: "执行日志与评测体系",
    desc: "记录动作 / 时间 / 参数 / 结果；量化意图准确率、语义过滤准确率、误触发率、漏触发率、端到端延迟。",
  },
];

const FLOW = [
  "主播口播",
  "流式 ASR",
  "语义过滤",
  "意图分类",
  "执行 / 候选 / 蓄力",
  "平台原生互动",
  "执行日志",
];

export function Solution() {
  return (
    <Section id="solution">
      <Reveal>
        <SectionHeading
          index="05"
          title="产品方案与设计原则"
          subtitle="一个吸附在直播伴侣 / 浏览器侧边的轻量悬浮 Agent 工作台，占屏约 25%，暗色高对比大字号，适配补光灯直射环境。"
        />
      </Reveal>

      {/* 设计原则三型 */}
      <Reveal delay={0.05} className="mt-12">
        <div className="grid gap-4 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <div
              key={p.tag}
              className="flex h-full flex-col rounded-card border border-dark-border/10 bg-light-card p-6 shadow-soft"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
                <p.icon className="h-5 w-5" />
              </span>
              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-full bg-accent-blue/12 px-2 py-0.5 font-mono text-[11px] text-accent-blue">
                  {p.tag}
                </span>
              </div>
              <h4 className="mt-2 text-[18px] font-semibold leading-snug">{p.title}</h4>
              <p className="mt-2 text-[14px] leading-[1.6] text-muted-light">{p.desc}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 功能蓝图 A–G */}
      <Reveal delay={0.08} className="mt-8">
        <div className="relative rounded-card border border-dark-border/10 bg-light-card p-4 shadow-soft sm:p-8">
          <WorkbenchMockup />

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <div
                key={m.tag}
                className="rounded-xl border border-dark-border/10 bg-light-bg p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-blue/15 font-mono text-[12px] font-semibold text-accent-blue">
                    {m.tag}
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center text-accent-blue">
                    <m.icon className="h-4 w-4" />
                  </span>
                </div>
                <h4 className="mt-2.5 text-[15px] font-semibold leading-snug">{m.title}</h4>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-muted-light">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* 业务流转 */}
      <Reveal delay={0.1} className="mt-10">
        <div className="flex items-center gap-2 text-[14px] font-medium text-muted-light">
          <Gauge className="h-4 w-4 text-accent-cyan" /> 业务流转：一条明确指令如何走到平台原生互动
        </div>
        <div className="mt-4 flex flex-col items-stretch gap-2 lg:flex-row lg:items-center lg:gap-0">
          {FLOW.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex-1 rounded-lg border border-dark-border/10 bg-light-card px-4 py-3 text-center text-[14px] font-medium shadow-soft">
                {step}
              </div>
              {i < FLOW.length - 1 && (
                <ArrowDown className="mx-1 h-4 w-4 shrink-0 text-muted-light lg:rotate-[-90deg]" />
              )}
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
