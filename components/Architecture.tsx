"use client";

import { ArrowRight, Cpu, Gauge, ShieldCheck, Webhook, GitBranch, Layers3 } from "lucide-react";
import { Reveal, Section, SectionHeading } from "./primitives";

/* 技术链路：按层分组 */
const PIPELINE = [
  {
    group: "输入层",
    items: [
      { t: "音频采集", d: "浏览器麦克风 / 平台中控台实时字幕" },
      { t: "VAD 端点检测", d: "切分人声片段，省算力、抗噪声" },
    ],
  },
  {
    group: "识别层",
    items: [
      { t: "流式 ASR", d: "边说边出字，首字 ≤300ms" },
      { t: "清洗 + 热词增强", d: "过滤口头禅、注入品类热词提升准度" },
    ],
  },
  {
    group: "理解层",
    items: [
      { t: "规则快速召回", d: "口令 / 同义词 / 正则，零延迟兜底" },
      { t: "LLM 语义理解", d: "自然语言→明确意图，置信度打分" },
      { t: "语义过滤", d: "拦截否定句 / 假设句 / 条件句 / 举例句" },
      { t: "槽位抽取", d: "金额 / 商品编号 / 福袋门槛" },
    ],
  },
  {
    group: "执行层",
    items: [
      { t: "意图分类", d: "明确指令 / 模棱两可 / 蓄力动作 / 多步" },
      { t: "动作编排 + 平台适配", d: "抖音 / 快手 / 视频号统一抽象" },
      { t: "接口下发 + 日志", d: "执行留痕，可追溯可审计" },
    ],
  },
];

/* 前端状态机 */
const STATES = [
  "IDLE",
  "LISTENING",
  "ASR_STREAMING",
  "INTENT_PARSING",
  "SEMANTIC_FILTER",
];

const BRANCHES = [
  { label: "BLOCK", tone: "text-danger border-danger/40 bg-danger/10", desc: "否定/假设/举例 → IDLE，不打扰" },
  { label: "明确指令", tone: "text-safe border-safe/40 bg-safe/10", desc: "高置信 → EXECUTING → DONE" },
  { label: "模棱两可", tone: "text-warn border-warn/40 bg-warn/10", desc: "CANDIDATE_DISPLAY → 主播选择" },
  { label: "蓄力动作", tone: "text-accent-cyan border-accent-cyan/40 bg-accent-cyan/10", desc: "PREPARE_STATE → 等待触发策略" },
  { label: "多步指令", tone: "text-accent-blue border-accent-blue/40 bg-accent-blue/10", desc: "PLAN_EXECUTE → 顺序执行" },
];

/* 蓄力动作四策略 */
const PREPARE_STRATEGIES = [
  { icon: Gauge, t: "固定延迟", d: "触发后 N 秒自动开价，主播习惯“准备开价”后 10 秒开。" },
  { icon: GitBranch, t: "口令触发", d: "主播说“上车”“开价”“上链接”时执行，主播看时机。" },
  { icon: Layers3, t: "条件触发", d: "在线人数达 X 或弹幕达 Y 时执行，数据驱动型主播。" },
  { icon: ShieldCheck, t: "手动触发", d: "助播 / 主播点一下按钮执行，最保守，保留控制权。" },
];

/* Function Calling 设计 */
const FCS = [
  { name: "send_fu_bag", desc: "触发平台发福袋原生互动", params: "duration* · product_id" },
  { name: "show_product_card", desc: "触发平台商品讲解卡", params: "product_id*" },
  { name: "start_price", desc: "触发平台上架开价", params: "product_id* · price*" },
];

const TRADEOFFS = [
  {
    icon: Cpu,
    q: "为什么规则召回 + LLM 混合，而不是纯大模型？",
    a: "直播里 70% 的动作是固定口令，规则召回零延迟、零成本、可离线兜底；LLM 只做语义过滤与歧义判断。延迟、成本、准确率最平衡。",
    tags: ["低延迟", "可离线", "零成本兜底"],
  },
  {
    icon: ShieldCheck,
    q: "为什么靠语义过滤拦截否定句 / 假设句，而不是关键词？",
    a: "“今天不发福袋了”关键词命中却是否定；一次误发福袋的履约成本远高于语义理解多花的那点算力。LLM 该做的是理解上下文，而非听到关键词就执行。",
    tags: ["不误触发", "上下文理解", "成本可控"],
  },
  {
    icon: Gauge,
    q: "为什么“准备开价”不立即执行，而做成蓄力动作？",
    a: "“准备开价”是憋单不是立即开价，主播在等节奏。立即执行或弹框问都打断控场。按用户预设的延迟 / 口令 / 条件 / 手动策略触发，既尊重节奏又不用重复喊指令。",
    tags: ["尊重节奏", "不抢戏", "可配置"],
  },
  {
    icon: Webhook,
    q: "为什么有“平台适配层”？",
    a: "抖音 / 快手 / 视频号 / 淘宝直播的原生互动接口各不相同。统一 Action Schema 后，主播一次定义口令，多处执行；新增平台只补适配层，不动理解层。",
    tags: ["跨平台", "一处定义", "易扩展"],
  },
];

const PROMPT_SAMPLE = `System：你是直播场景下的动作意图理解 Agent。
职责：1) 理解主播真实意图；2) 过滤否定/假设/条件/举例句；
3) 分类为 明确指令 / 模棱两可 / 蓄力动作 / 无动作。只输出 JSON。

Input：ASR文本 / 意图规则 / 当前商品 / 在线人数 / 库存 / 历史偏好
Constraints：
· 否定/假设/举例句 → intent=NONE, semantic_filter=BLOCK
· 明确指令 → confidence>0.9, ambiguity=false, semantic_filter=PASS
· 模棱两可 → ambiguity=true，必须输出 candidates[]
· 蓄力动作 → intent=PREPARE_XXX, action_type=PREPARE
· 多步指令 → intent=MULTI_ACTION，输出 actions[]

Output：{ intent, action_type, semantic_filter,
          ambiguity, confidence, candidates[], actions[], reason }`;

export function Architecture() {
  return (
    <Section id="architecture" tone="dark">
      <Reveal>
        <SectionHeading
          tone="dark"
          index="07"
          title="技术架构"
          subtitle="为「语音动作 Agent」而建的轻量链路：音频 → VAD → 流式 ASR → 清洗热词 → 规则召回 → LLM 语义理解 / 语义过滤 → 意图分类 → 执行 / 候选 / 蓄力 → 平台适配层 → 接口 → 日志。"
        />
      </Reveal>

      {/* 技术链路（按层分组） */}
      <Reveal delay={0.05} className="mt-12">
        <div className="grid gap-4 lg:grid-cols-4">
          {PIPELINE.map((g) => (
            <div
              key={g.group}
              className="flex flex-col rounded-card border border-dark-border bg-dark-card p-5"
            >
              <div className="mb-3 font-mono text-[12px] uppercase tracking-widest text-accent-cyan">
                {g.group}
              </div>
              <div className="space-y-2.5">
                {g.items.map((it) => (
                  <div
                    key={it.t}
                    className="rounded-lg border border-dark-border bg-dark-bg p-3"
                  >
                    <div className="text-[14px] font-semibold text-dark-text">{it.t}</div>
                    <p className="mt-1 text-[12px] leading-[1.5] text-muted-dark">{it.d}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 前端状态机 */}
      <Reveal delay={0.1} className="mt-10">
        <div className="rounded-card border border-dark-border bg-dark-card p-6">
          <div className="text-[13px] font-medium uppercase tracking-wide text-muted-dark">
            前端状态机 · Frontend State Machine
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {STATES.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className="rounded-lg border border-accent-blue/40 bg-accent-blue/10 px-3 py-2 font-mono text-[12px] font-medium text-accent-cyan">
                  {s}
                </span>
                {i < STATES.length - 1 && <ArrowRight className="h-4 w-4 text-muted-dark" />}
              </div>
            ))}
            <ArrowRight className="h-4 w-4 text-muted-dark" />
            <span className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 font-mono text-[12px] font-medium text-warn">
              → 分支
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {BRANCHES.map((b) => (
              <div key={b.label} className={`rounded-lg border px-3 py-2 ${b.tone}`}>
                <div className="font-mono text-[12px] font-medium">{b.label}</div>
                <div className="mt-0.5 text-[11px] leading-[1.4] text-muted-dark">{b.desc}</div>
              </div>
            ))}
            <div className="rounded-lg border border-dark-border px-3 py-2">
              <div className="font-mono text-[12px] font-medium text-danger">FAILED / RETRYING</div>
              <div className="mt-0.5 text-[11px] leading-[1.4] text-muted-dark">未识别 / 接口超时指数退避</div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* 混合架构 + Prompt 示例 */}
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Reveal>
          <div className="flex h-full flex-col rounded-card border border-dark-border bg-dark-card p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-cyan">
                <Cpu className="h-4 w-4" />
              </span>
              <h3 className="text-[16px] font-semibold text-dark-text">规则 + LLM 混合架构</h3>
            </div>
            <p className="mt-3 text-[14px] leading-[1.65] text-muted-dark">
              ASR 文本先走<span className="text-dark-text"> 规则快速召回</span>（关键词、同义词、正则），命中即进语义过滤；未命中再交
              <span className="text-dark-text"> LLM 意图理解</span>。70% 固定口令由规则稳快处理，LLM 专注语义过滤与歧义判断——延迟、成本、准确率最平衡。
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              {["规则兜底", "LLM 语义过滤", "歧义候选", "不误触发"].map((t) => (
                <span key={t} className="rounded-full border border-dark-border px-2.5 py-1 font-mono text-[11px] text-muted-dark">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="flex h-full flex-col rounded-card border border-dark-border bg-dark-card p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-cyan">
                <GitBranch className="h-4 w-4" />
              </span>
              <h3 className="text-[16px] font-semibold text-dark-text">Prompt 设计（意图理解 Agent）</h3>
            </div>
            <pre className="mt-3 flex-1 overflow-x-auto rounded-lg border border-dark-border bg-dark-bg p-3 font-mono text-[11px] leading-[1.55] text-muted-dark">
              {PROMPT_SAMPLE}
            </pre>
          </div>
        </Reveal>
      </div>

      {/* 蓄力动作四策略 + Function Calling */}
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Reveal>
          <div className="rounded-card border border-dark-border bg-dark-card p-6">
            <div className="text-[13px] font-medium uppercase tracking-wide text-muted-dark">
              蓄力动作 · 可配置延迟触发策略
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PREPARE_STRATEGIES.map((s) => (
                <div key={s.t} className="rounded-lg border border-dark-border bg-dark-bg p-3">
                  <div className="flex items-center gap-2 text-[14px] font-semibold text-dark-text">
                    <s.icon className="h-4 w-4 text-accent-cyan" /> {s.t}
                  </div>
                  <p className="mt-1 text-[12px] leading-[1.5] text-muted-dark">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="rounded-card border border-dark-border bg-dark-card p-6">
            <div className="text-[13px] font-medium uppercase tracking-wide text-muted-dark">
              Function Calling · 统一 Action Schema
            </div>
            <div className="mt-4 space-y-2.5">
              {FCS.map((f) => (
                <div key={f.name} className="rounded-lg border border-dark-border bg-dark-bg p-3">
                  <div className="flex items-center justify-between">
                    <code className="font-mono text-[13px] text-accent-cyan">{f.name}</code>
                    <span className="font-mono text-[11px] text-muted-dark">{f.params}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-[1.5] text-muted-dark">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* 工程权衡 */}
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {TRADEOFFS.map((w, i) => (
          <Reveal key={w.q} delay={i * 0.06}>
            <div className="flex h-full flex-col rounded-card border border-dark-border bg-dark-card p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-cyan">
                  <w.icon className="h-4 w-4" />
                </span>
                <h3 className="text-[16px] font-semibold text-dark-text">{w.q}</h3>
              </div>
              <p className="mt-3 text-[14px] leading-[1.65] text-muted-dark">{w.a}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {w.tags.map((t) => (
                  <span key={t} className="rounded-full border border-dark-border px-2.5 py-1 font-mono text-[11px] text-muted-dark">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
