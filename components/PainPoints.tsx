"use client";

import { AlarmClock, Brain, Hand, MousePointerClick, ShieldAlert } from "lucide-react";
import { Reveal, RiskTag, Section, SectionHeading } from "./primitives";

const PAINS = [
  {
    level: "info" as const,
    icon: MousePointerClick,
    tag: "口播与执行脱节",
    label: "蓝色 · 打断",
    status: "现状",
    statusText:
      "主播说“发福袋”“讲解商品”“准备开价”，中控后台还要手动找入口、填参数、点发放；中控一忙或漏听，延迟 3–5 秒甚至漏动作。",
    impact: "影响",
    impactText: "直播节奏被切断，停留与转化随之中断。",
    summary: "手不够用，口播总被打断。",
  },
  {
    level: "danger" as const,
    icon: AlarmClock,
    tag: "福利易漏 / 开价易迟",
    label: "红色 · 易漏",
    status: "现状",
    statusText:
      "福利忘了发、讲解卡忘了弹、该上架时晚了一步——高频动作靠人记，一忙就漏，白白浪费已经进来的流量。",
    impact: "影响",
    impactText: "漏一个动作，整场投流的转化效率就打了折扣。",
    summary: "一忙就漏，流量被浪费。",
  },
  {
    level: "warn" as const,
    icon: Hand,
    tag: "中小商家无专职场控",
    label: "黄色 · 人力",
    status: "现状",
    statusText:
      "头部直播间有专职场控；90% 中小商家是“1 主播 + 1 助播兼场控”，助播既要盯弹幕、递话、改价、发福袋，还要弹讲解卡，忙不过来就全乱。",
    impact: "影响",
    impactText: "福利漏发、开价延迟、节奏混乱无人兜底。",
    summary: "一人多岗，忙不过来。",
  },
  {
    level: "warn" as const,
    icon: Brain,
    tag: "表达非标准化",
    label: "黄色 · 覆盖",
    status: "现状",
    statusText:
      "主播不会说标准口令：“给家人们整点福利”可能指福袋，也可能指优惠券；“准备冲一波”可能是上库存也可能是放券。",
    impact: "影响",
    impactText: "传统关键词系统只能覆盖 60–70% 表达，且处理不了否定句与条件句。",
    summary: "关键词匹配覆盖不了。",
  },
  {
    level: "danger" as const,
    icon: ShieldAlert,
    tag: "否定 / 假设句误触发",
    label: "红色 · 高危",
    status: "现状",
    statusText:
      "“今天不发福袋了”若只认“发福袋”三个字就会误触发；“如果在线到一千人就发福袋”是条件句不该立即执行；举例句“上次有个主播说发福袋……”也不是指令。",
    impact: "影响",
    impactText: "误发福袋 / 误开价的履约成本，远高于多花一点算力做语义过滤。",
    summary: "非指令表达必须靠语义理解拦截。",
  },
];

export function PainPoints() {
  return (
    <Section id="painpoints">
      <Reveal>
        <SectionHeading
          index="04"
          title="五大痛点"
          subtitle="每一个痛点，都对应一个可用「语音 Agent」产品化解决的具体动作。"
        />
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {PAINS.map((p, i) => (
          <Reveal key={p.tag} delay={i * 0.06}>
            <div className="flex h-full flex-col rounded-card border border-dark-border/10 bg-light-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-bg/5 text-light-text">
                  <p.icon className="h-5 w-5" />
                </span>
                <RiskTag level={p.level}>{p.label}</RiskTag>
              </div>

              <h3 className="mt-4 text-[22px] font-semibold leading-tight">
                {p.tag}
              </h3>

              <div className="mt-4 space-y-3 text-[14px] leading-[1.6]">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-light/70">
                    {p.status}
                  </div>
                  <p className="text-muted-light">{p.statusText}</p>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-light/70">
                    {p.impact}
                  </div>
                  <p className="text-muted-light">{p.impactText}</p>
                </div>
              </div>

              <div className="mt-auto pt-5">
                <p className="border-t border-dark-border/10 pt-4 text-[15px] font-medium text-light-text">
                  {p.summary}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
