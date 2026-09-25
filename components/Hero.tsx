"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Github, PlayCircle, Mic, Gift, Presentation } from "lucide-react";
import { Container, DataCard } from "./primitives";

/* Illustrative floating agent workbench mock (visualises the product, not a screenshot) */
function ProductMock() {
  return (
    <div className="rounded-card border border-dark-border bg-dark-card p-3 shadow-panel">
      <div className="mb-3 flex items-center justify-between border-b border-dark-border pb-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-safe/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent-cyan/70" />
          <span className="ml-2 text-[12px] text-muted-dark">
            声控场 Copilot · 语音动作 Agent
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted-dark">占屏 ≈25%</span>
      </div>

      {/* Module B — ASR streaming */}
      <div className="mb-3 rounded-md border border-accent-cyan/30 bg-accent-cyan/5 p-2.5">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-accent-cyan">
          <Mic className="h-3 w-3" /> 实时聆听 · 流式 ASR
        </div>
        <div className="font-mono text-[13px] text-dark-text">
          “这个款给大家上福利，门槛九块九”
        </div>
      </div>

      {/* Module C — intent card */}
      <div className="mb-3 rounded-md border border-dark-border bg-dark-bg p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] text-muted-dark">C · 意图识别</span>
          <span className="rounded-full bg-safe/15 px-1.5 text-[11px] text-safe">
            置信度 0.94
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-dark-text">
          <Gift className="h-3.5 w-3.5 text-warn" />
          发放福袋
          <span className="text-muted-dark">· 门槛 ¥9.9</span>
        </div>
      </div>

      {/* Module D — action queue */}
      <div className="rounded-md border border-dark-border bg-dark-bg p-2.5">
        <div className="mb-1 text-[11px] text-muted-dark">D · 动作预备队列</div>
        <div className="flex items-center justify-between text-[12px] text-dark-text">
          <span>🎁 发放福袋</span>
          <span className="rounded bg-warn/15 px-1.5 text-[11px] text-warn">
            待确认
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[12px] text-dark-text">
          <span>
            <Presentation className="mr-1 inline h-3 w-3 text-accent-cyan" />
            讲解卡已就位
          </span>
          <span className="text-safe">✓</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const fade = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay, ease: "easeOut" as const },
        };

  return (
    <section id="hero" className="relative overflow-hidden bg-dark-bg text-dark-text">
      {/* faint grid + radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:48px_48px] opacity-[0.5]" />
      <div className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-accent-blue/10 blur-[120px]" />

      <Container className="relative pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <motion.div {...fade(0)}>
              <span className="inline-flex items-center gap-2 rounded-full border border-dark-border bg-dark-card px-3 py-1.5 text-[12px] text-muted-dark">
                <span className="h-1.5 w-1.5 rounded-full bg-safe" />
                Voice Agent · 4 天 MVP 上线
              </span>
            </motion.div>

            <motion.h1
              {...fade(0.06)}
              className="mt-6 text-[44px] font-bold leading-[1.08] tracking-tight sm:text-[56px] lg:text-[74px]"
            >
              声控场 <span className="text-accent-cyan">Copilot</span>
            </motion.h1>

            <motion.p
              {...fade(0.12)}
              className="mt-4 text-[18px] text-muted-dark lg:text-[20px]"
            >
              主播说一句，直播间自动动一步
            </motion.p>

            <motion.p
              {...fade(0.18)}
              className="mt-6 max-w-[520px] text-[20px] leading-[1.5] text-dark-text/90 lg:text-[22px]"
            >
              一个 AI 语音识别驱动的直播动作触发 Agent：把主播口播转成平台原生动作，
              <span className="text-accent-cyan">口令即动作，动口不动手</span>。
            </motion.p>

            <motion.div {...fade(0.24)} className="mt-8 flex flex-wrap gap-3">
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-btn bg-accent-blue px-5 py-3 text-[15px] font-medium text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                体验语音 Demo <PlayCircle className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-btn border border-dark-border px-5 py-3 text-[15px] font-medium text-dark-text transition-transform duration-200 hover:-translate-y-0.5"
              >
                查看代码 <Github className="h-4 w-4" />
              </a>
            </motion.div>
          </div>

          <motion.div {...fade(0.2)} className="lg:pl-6">
            <ProductMock />
          </motion.div>
        </div>

        {/* data cards */}
        <motion.div
          {...fade(0.32)}
          className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <DataCard tone="dark" value="≤1s" label="口令响应延迟" hint="本地意图解析" />
          <DataCard tone="dark" value="A–F" label="六大功能模块" hint="配置→识别→执行" />
          <DataCard tone="dark" value="0" label="替主播说话" hint="只动手，不抢戏" />
          <DataCard tone="dark" value="3+" label="覆盖平台" hint="抖音 / 快手 / 视频号" />
        </motion.div>

        <div className="mt-10 flex items-center gap-2 text-[12px] text-muted-dark">
          <ArrowUpRight className="h-3.5 w-3.5" />
          滚动查看完整案例研究
        </div>
      </Container>
    </section>
  );
}
