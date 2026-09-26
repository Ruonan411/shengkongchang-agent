"use client";

import { Mic, ShieldAlert, Sparkles, User } from "lucide-react";
import { Reveal, Section, SectionHeading } from "./primitives";

const PERSONAS = [
  {
    name: "小李",
    role: "女装 / 美妆 个人主播（一人开播）",
    icon: User,
    accent: "text-accent-cyan",
    traits: [
      "直播间只有她自己：没有中控、没有助播，讲品、上链接、发福袋全靠自己",
      "发福袋、弹讲解卡这类高频动作，一忙就忘、一断就掉转化",
      "不想为了点鼠标而中断口播节奏",
    ],
    need: "口令即动作，动口不动手，把双手从鼠标里解放出来。",
    scene: "口播进行中，顺嘴一句「上福利」，福袋自动发放——不用腾手点后台。",
  },
  {
    name: "王哥",
    role: "中小白牌商家老板，自己兼场控",
    icon: ShieldAlert,
    accent: "text-danger",
    traits: [
      "没有专职中控：老板一边盯生意一边盯直播，后台操作常常没人接",
      "最怕喊了福利没人跟：主播喊「发张优惠券」，后台还在忙别的，观众催半天券没发出去",
      "不想为标准化运营再加一个人手",
    ],
    need: "用语音稳定触发平台原生动作，不漏动作、不抢戏。",
    scene: "主播喊「发张优惠券」，语音直接触发发放——不等中控、不漏动作。",
  },
];

export function Personas() {
  return (
    <Section>
      <Reveal>
        <SectionHeading
          index="03"
          title="目标用户画像"
          subtitle="两类高频人群，共同痛点：没有专职中控、主播既要讲又要操作、动作容易漏。"
        />
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {PERSONAS.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.08}>
            <div className="flex h-full flex-col rounded-card border border-dark-border/10 bg-light-card p-7 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-dark-bg/5 text-light-text">
                  <p.icon className={`h-5 w-5 ${p.accent}`} />
                </span>
                <div>
                  <div className="text-[20px] font-semibold leading-tight">
                    {p.name}
                  </div>
                  <div className="text-[13px] text-muted-light">{p.role}</div>
                </div>
              </div>

              <ul className="mt-5 space-y-2.5">
                {p.traits.map((t) => (
                  <li
                    key={t}
                    className="flex gap-2 text-[15px] leading-[1.55] text-muted-light"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" />
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-start gap-2 rounded-lg bg-accent-blue/5 p-3.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
                <p className="text-[14px] leading-[1.55] text-light-text">
                  <span className="font-medium">核心诉求：</span>
                  {p.need}
                </p>
              </div>

              <div className="mt-auto flex items-start gap-2 pt-5 text-[13px] leading-[1.55] text-muted-light">
                <Mic className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="font-medium text-light-text">典型场景：</span>
                  {p.scene}
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
