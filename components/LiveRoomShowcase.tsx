"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Gift,
  Tag,
  Ticket,
  Smartphone,
  Play,
  RotateCcw,
  MicOff,
  Radio,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/primitives";

interface Phase {
  fudai: boolean;
  explain: boolean;
  price: "idle" | "preparing" | "set";
  priceValue: string | null;
  say: string;
  subtitle: string;
  toast: string | null;
}

const EMPTY: Phase = {
  fudai: false,
  explain: false,
  price: "idle",
  priceValue: null,
  say: "",
  subtitle: "",
  toast: null,
};

/* 自动演示脚本（累计时间点，单位 ms） */
const SCRIPT: { at: number; apply: (p: Phase) => Phase }[] = [
  {
    at: 500,
    apply: (p) => ({
      ...p,
      say: "给大家发个福袋，倒计时 3 分钟",
      subtitle: "给大家发个福袋，倒计时 3 分钟",
      fudai: true,
    }),
  },
  {
    at: 2800,
    apply: (p) => ({
      ...p,
      say: "讲解一下这个商品",
      subtitle: "讲解一下这个商品",
      explain: true,
    }),
  },
  {
    at: 5000,
    apply: (p) => ({
      ...p,
      say: "准备开价",
      subtitle: "准备开价",
      price: "preparing",
    }),
  },
  {
    at: 7200,
    apply: (p) => ({ ...p, price: "set", priceValue: "¥99" }),
  },
  {
    at: 9200,
    apply: (p) => ({
      ...p,
      say: "今天不发福袋了",
      subtitle: "今天不发福袋了",
      toast: "语义过滤：否定句，已忽略，不触发",
    }),
  },
];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LiveRoomShowcase() {
  const [phase, setPhase] = useState<Phase>(EMPTY);
  const [fudaiLeft, setFudaiLeft] = useState(180);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const play = useCallback(() => {
    clearTimers();
    setPhase(EMPTY);
    setFudaiLeft(180);
    setPlaying(true);
    SCRIPT.forEach((s) => {
      timers.current.push(
        window.setTimeout(() => setPhase((p) => s.apply(p)), s.at)
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setPhase((p) => ({ ...p, toast: null }));
        setPlaying(false);
      }, 11500)
    );
  }, []);

  useEffect(() => {
    play();
    return () => clearTimers();
  }, [play]);

  /* 福袋倒计时 */
  useEffect(() => {
    if (!phase.fudai) return;
    const id = window.setInterval(() => {
      setFudaiLeft((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase.fudai]);

  const pop = {
    initial: { opacity: 0, scale: 0.82, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.82, y: 10 },
    transition: { type: "spring" as const, stiffness: 380, damping: 26 },
  };

  return (
    <Section id="showcase" tone="light">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* 左侧说明 */}
        <div>
          <SectionHeading
            index="02"
            title="产品实拍：主播说一句，直播间自动动一步"
            subtitle="右侧就是主播视角的直播间。点击「播放演示」，看主播怎么用一句话完成发福袋、挂讲解卡、开价——全程不用碰鼠标，也无需开麦克风。"
          />

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={play}
              className="inline-flex items-center gap-2 rounded-btn bg-accent-blue px-5 py-2.5 text-[14px] font-medium text-white transition hover:opacity-90"
            >
              <Play className="h-4 w-4" /> {playing ? "重新播放" : "播放演示"}
            </button>
            <button
              onClick={play}
              className="inline-flex items-center gap-2 rounded-btn border border-dark-border px-5 py-2.5 text-[14px] font-medium text-muted-light transition hover:text-light-text"
            >
              <RotateCcw className="h-4 w-4" /> 重播
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dark-border/40 bg-light-card px-3 py-1.5 text-[12px] text-muted-light">
              <MicOff className="h-3.5 w-3.5" /> 不依赖麦克风
            </span>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { k: "福袋", v: "发放中 03:00", d: "说一句，福袋自动发放" },
              { k: "商品", v: "讲解中", d: "讲解卡自动挂上链接" },
              { k: "价格", v: "??? → ¥99", d: "开价自动跟上，不冷场" },
            ].map((x) => (
              <div
                key={x.k}
                className="rounded-card border border-dark-border/10 bg-light-card px-4 py-4"
              >
                <div className="text-[13px] font-medium text-light-text">{x.k}</div>
                <div className="mt-1 font-mono text-[15px] text-accent-blue">
                  {x.v}
                </div>
                <div className="mt-1 text-[11px] text-muted-light">{x.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧手机端直播间模拟器 */}
        <div className="flex justify-center">
          <div className="relative w-[300px] rounded-[2.5rem] border-[10px] border-dark-bg bg-dark-bg p-2 shadow-2xl">
            {/* 刘海 */}
            <div className="absolute left-1/2 top-2 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-dark-bg" />
            <div className="relative h-[600px] overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#1b1f2a] via-[#232838] to-[#11141c]">
              {/* 顶部 LIVE 标 */}
              <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-danger/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                <Radio className="h-3 w-3" /> LIVE
              </div>
              <div className="absolute right-4 top-4 z-10 rounded-full bg-black/40 px-2 py-1 text-[10px] text-white/80">
                1.2万 在线
              </div>

              {/* 直播间画面占位 */}
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-white/70">
                  <Smartphone className="h-8 w-8" />
                </div>
                <div className="mt-3 text-[13px] text-white/60">主播画面 · 商品展示中</div>

                {/* 主播口播气泡 */}
                <div className="mt-4 min-h-[40px] w-full">
                  <AnimatePresence mode="wait">
                    {phase.say && (
                      <motion.div
                        key={phase.say}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mx-auto inline-block max-w-[240px] rounded-2xl rounded-tl-sm bg-white/95 px-3 py-2 text-left text-[12px] leading-[1.4] text-dark-text"
                      >
                        <span className="mr-1 font-semibold text-accent-blue">主播：</span>
                        {phase.say}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 状态列表（福袋 / 商品 / 价格） */}
              <div className="absolute inset-x-3 bottom-[64px] space-y-2">
                <AnimatePresence>
                  {phase.fudai && (
                    <motion.div
                      key="fudai"
                      {...pop}
                      className="flex items-center gap-3 rounded-xl border border-amber-300/40 bg-white/95 px-3 py-2.5 shadow-lg"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <Gift className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <div className="text-[12px] font-semibold text-dark-text">
                          福袋 · 发放中
                        </div>
                        <div className="font-mono text-[11px] text-muted-light">
                          倒计时 {fmt(fudaiLeft)}
                        </div>
                      </div>
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-600">
                        自动
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {phase.explain && (
                    <motion.div
                      key="explain"
                      {...pop}
                      className="flex items-center gap-3 rounded-xl border border-sky-300/40 bg-white/95 px-3 py-2.5 shadow-lg"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                        <Tag className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <div className="text-[12px] font-semibold text-dark-text">
                          商品讲解中
                        </div>
                        <div className="text-[11px] text-muted-light">
                          1 号链接 · 已挂讲解卡
                        </div>
                      </div>
                      <span className="rounded-md bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-600">
                        自动
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {phase.price !== "idle" && (
                    <motion.div
                      key="price"
                      {...pop}
                      className={`flex items-center gap-3 rounded-xl border bg-white/95 px-3 py-2.5 shadow-lg ${
                        phase.price === "set"
                          ? "border-emerald-300/50"
                          : "border-dark-border/15"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          phase.price === "set"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-dark-bg/10 text-muted-light"
                        }`}
                      >
                        <Ticket className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <div className="text-[12px] font-semibold text-dark-text">
                          {phase.price === "set" ? "价格已开价" : "价格 · 准备中……"}
                        </div>
                        <div className="font-mono text-[13px] text-accent-blue">
                          {phase.price === "set" ? phase.priceValue : "???"}
                        </div>
                      </div>
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                          phase.price === "set"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-dark-bg/5 text-muted-light"
                        }`}
                      >
                        {phase.price === "set" ? "已开价" : "蓄力"}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ASR 实时字幕条 */}
              <div className="absolute inset-x-0 bottom-0 h-[52px] border-t border-white/10 bg-black/55 px-3 py-2 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-accent-blue/80 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    ASR
                  </span>
                  <span className="truncate text-[12px] text-white/90">
                    {phase.subtitle || "聆听中……"}
                  </span>
                </div>
              </div>

              {/* 语义过滤 toast */}
              <AnimatePresence>
                {phase.toast && (
                  <motion.div
                    key="toast"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.25 }}
                    className="absolute left-1/2 top-16 z-30 -translate-x-1/2 rounded-full bg-dark-bg/85 px-3 py-1.5 text-[11px] text-white/90 shadow-lg"
                  >
                    {phase.toast}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
