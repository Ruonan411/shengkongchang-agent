"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, Check, Gift, Hourglass, Mic } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Web 悬浮 Agent 工作台 · 自动演示实拍                                  */
/* 叙事：吸附在直播伴侣侧边的暗色高对比面板（占屏 ≈25%），                */
/* 主播口播 → 意图卡弹出 → 一键确认 → 执行日志；否定句被语义过滤拦截。     */
/* ------------------------------------------------------------------ */

interface WBIntent {
  kind: "fudai" | "prepare";
  action: string;
  filter: string;
  slots: string;
  conf: string;
}

interface WBPhase {
  hearing: string;
  status: "idle" | "listening" | "executing" | "blocked";
  intent: WBIntent | null;
  confirmed: boolean;
  log: string | null;
  block: string | null;
}

const EMPTY: WBPhase = {
  hearing: "",
  status: "idle",
  intent: null,
  confirmed: false,
  log: null,
  block: null,
};

/* 自动演示脚本（累计时间点，单位 ms） */
const SCRIPT: { at: number; apply: (p: WBPhase) => WBPhase }[] = [
  {
    at: 600,
    apply: (p) => ({
      ...p,
      hearing: "给大家发个福袋",
      status: "listening",
      intent: {
        kind: "fudai",
        action: "发放福袋",
        filter: "PASS · 非否定 / 假设句",
        slots: "门槛 ¥1 · 数量 10 份",
        conf: "96%",
      },
    }),
  },
  { at: 2300, apply: (p) => ({ ...p, confirmed: true, status: "executing" }) },
  {
    at: 3500,
    apply: (p) => ({ ...p, log: "✓ 福袋已下发 · 端到端 0.9s", status: "listening" }),
  },
  {
    at: 5400,
    apply: (p) => ({
      ...p,
      hearing: "准备开价",
      confirmed: false,
      log: null,
      status: "listening",
      intent: {
        kind: "prepare",
        action: "修改售价（蓄力）",
        filter: "PASS",
        slots: "蓄力策略 · 固定延迟 6s",
        conf: "94%",
      },
    }),
  },
  { at: 7000, apply: (p) => ({ ...p, confirmed: true, status: "executing" }) },
  {
    at: 8200,
    apply: (p) => ({ ...p, log: "✓ 蓄力完成 · 已开价 ¥99", status: "listening" }),
  },
  {
    at: 10000,
    apply: (p) => ({
      ...p,
      hearing: "今天不发福袋了",
      intent: null,
      confirmed: false,
      log: null,
      status: "blocked",
      block: "语义过滤 · 否定句 · 不触发",
    }),
  },
];

const LOOP_END = 12200; // 一轮结束 → 清空后重播

const STATUS_META = {
  idle: { text: "待机", dot: "bg-white/30", bar: false },
  listening: { text: "聆听中", dot: "bg-safe", bar: true },
  executing: { text: "执行中", dot: "bg-accent-blue", bar: false },
  blocked: { text: "已过滤", dot: "bg-white/30", bar: false },
} as const;

export function WorkbenchMockup() {
  const [phase, setPhase] = useState<WBPhase>(EMPTY);
  const timers = useRef<number[]>([]);
  const playRef = useRef<() => void>(() => {});

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const play = useCallback(() => {
    clearTimers();
    setPhase(EMPTY);
    SCRIPT.forEach((s) => {
      timers.current.push(
        window.setTimeout(() => setPhase((p) => s.apply(p)), s.at)
      );
    });
    timers.current.push(
      window.setTimeout(() => setPhase(EMPTY), LOOP_END - 400)
    );
    timers.current.push(window.setTimeout(() => playRef.current(), LOOP_END));
  }, []);

  useEffect(() => {
    playRef.current = play;
    play();
    return () => clearTimers();
  }, [play]);

  const meta = STATUS_META[phase.status];

  return (
    <div
      role="img"
      aria-label="Web 悬浮 Agent 工作台实拍：吸附在直播伴侣侧边的暗色面板，主播口播后意图卡弹出、一键确认下发、否定句被语义过滤拦截"
      className="relative w-full overflow-hidden rounded-card border border-dark-border/20 bg-dark-bg shadow-panel"
      style={{ aspectRatio: "16 / 9" }}
    >
      {/* —— 背景：主播现有界面（直播伴侣，示意） —— */}
      <div className="bg-grid-faint absolute inset-0 opacity-70" />
      <div className="absolute inset-y-4 left-4 hidden w-[46%] flex-col gap-2.5 opacity-45 sm:flex">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-danger/80" />
          <span className="text-[11px] font-medium text-white/60">
            直播伴侣 · 中控台（主播现有界面，示意）
          </span>
        </div>
        {["商品列表 · 1 号链接", "评论实时滚屏", "优惠券设置", "数据看板"].map(
          (t) => (
            <div
              key={t}
              className="flex-1 rounded-lg border border-white/8 bg-white/[0.04] px-3 py-2.5"
            >
              <div className="text-[11px] text-white/45">{t}</div>
              <div className="mt-2 h-1.5 w-3/5 rounded-full bg-white/8" />
            </div>
          )
        )}
      </div>

      {/* —— 悬浮 Agent 工作台（占屏 ≈25%） —— */}
      <div className="absolute bottom-4 right-4 top-4 flex w-[86%] flex-col rounded-xl border border-dark-border bg-dark-card shadow-panel sm:w-[42%]">
        {/* 头部：状态 + 波形 */}
        <div className="flex items-center gap-2 border-b border-dark-border px-4 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            {meta.bar && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-safe opacity-60" />
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${meta.dot}`}
            />
          </span>
          <span className="text-[13px] font-semibold text-dark-text">
            声控场 Agent
          </span>
          <span className="text-[11px] text-muted-dark">· {meta.text}</span>
          <span className="ml-auto flex items-end gap-[3px]">
            {[0.9, 0.5, 1.1, 0.7, 1.3].map((d, i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-safe/80"
                animate={
                  meta.bar
                    ? { height: ["30%", "100%", "45%", "85%", "30%"] }
                    : { height: "18%" }
                }
                transition={
                  meta.bar
                    ? {
                        duration: d,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.08,
                      }
                    : { duration: 0.2 }
                }
                style={{ height: "18%" }}
              />
            ))}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-3.5">
          {/* ASR 实时转写（大字号高对比） */}
          <div className="rounded-lg border border-dark-border/70 bg-dark-bg/60 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-dark">
              <Mic className="h-3 w-3" /> 实时语音
            </div>
            <div className="mt-1 min-h-[30px] text-[17px] font-semibold leading-snug text-dark-text sm:text-[19px]">
              {phase.hearing ? (
                <motion.span
                  key={phase.hearing}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  「{phase.hearing}」
                </motion.span>
              ) : (
                <span className="text-white/25">……</span>
              )}
            </div>
          </div>

          {/* 语义过滤拦截 */}
          <AnimatePresence>
            {phase.block && (
              <motion.div
                key="block"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-white/60">
                  <Ban className="h-3.5 w-3.5" />
                </span>
                <span className="text-[13px] font-medium text-white/75">
                  {phase.block}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 意图卡 */}
          <AnimatePresence>
            {phase.intent && (
              <motion.div
                key={phase.intent.kind}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 360, damping: 26 }}
                className="rounded-lg border border-accent-blue/25 bg-accent-blue/[0.07] p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${
                      phase.intent.kind === "fudai"
                        ? "bg-amber-400/15 text-amber-300"
                        : "bg-accent-blue/15 text-accent-blue"
                    }`}
                  >
                    {phase.intent.kind === "fudai" ? (
                      <Gift className="h-4 w-4" />
                    ) : (
                      <Hourglass className="h-4 w-4" />
                    )}
                  </span>
                  <span className="text-[15px] font-semibold text-dark-text">
                    {phase.intent.action}
                  </span>
                  <span className="ml-auto font-mono text-[12px] text-safe">
                    {phase.intent.conf}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-[12px] leading-relaxed">
                  <div className="flex gap-2">
                    <span className="shrink-0 text-muted-dark">语义过滤</span>
                    <span className="font-medium text-safe">
                      {phase.intent.filter}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 text-muted-dark">槽位</span>
                    <span className="font-medium text-white/85">
                      {phase.intent.slots}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="min-h-0 flex-1" />

          {/* 执行日志 */}
          <AnimatePresence>
            {phase.log && (
              <motion.div
                key="log"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 font-mono text-[11px] text-safe"
              >
                <Check className="h-3.5 w-3.5" /> {phase.log}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 确认按钮 */}
          {phase.intent && (
            <button
              type="button"
              tabIndex={-1}
              className={`flex w-full items-center justify-center gap-1.5 rounded-btn py-2.5 text-[14px] font-semibold transition-colors ${
                phase.confirmed
                  ? "bg-safe/90 text-white"
                  : "bg-accent-blue text-white"
              }`}
            >
              <Check className="h-4 w-4" />
              {phase.confirmed
                ? phase.status === "executing"
                  ? "已确认 · 执行中…"
                  : "已执行"
                : "一键确认下发"}
            </button>
          )}
        </div>
      </div>

      {/* 底部图注 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-4 pb-2 pt-6 text-[10px] text-white/50">
        <span className="hidden sm:inline">左侧：主播现有界面（示意）</span>
        <span>右侧：声控场 Agent 悬浮工作台 · 暗色高对比 · 占屏 ≈25%</span>
      </div>
    </div>
  );
}
