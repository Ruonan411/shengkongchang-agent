"use client";

import { Github, Mail, Mic, Video } from "lucide-react";
import { Container, Reveal } from "./primitives";

const LINKS = [
  { icon: Mic, label: "语音 Demo", value: "【Demo 链接】", href: "#demo" },
  { icon: Github, label: "源代码", value: "【GitHub 链接】", href: "#" },
  { icon: Video, label: "完整录屏", value: "【录屏链接】", href: "#" },
  { icon: Mail, label: "联系交流", value: "【邮箱 / 微信】", href: "#" },
];

export function CTA() {
  return (
    <section className="bg-dark-bg text-dark-text">
      <Container className="py-24 lg:py-32">
        <Reveal>
          <div className="mx-auto max-w-prose text-center">
            <h2 className="text-[34px] font-semibold leading-[1.2] tracking-tight sm:text-[44px]">
              主播说一句，
              <br className="hidden sm:block" />
              直播间自动动一步。
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-muted-dark">
              独立产品负责人 & AI 协同开发者 · 4 天 MVP · 直播语音动作 Agent
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="group flex items-center gap-3 rounded-card border border-dark-border bg-dark-card p-4 transition-colors hover:border-accent-cyan/40"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-cyan">
                  <l.icon className="h-4 w-4" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[13px] text-muted-dark">{l.label}</span>
                  <span className="text-[14px] font-medium text-dark-text group-hover:text-accent-cyan">
                    {l.value}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-14 text-center text-[15px] text-muted-dark">
            感谢阅读，欢迎交流。
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
