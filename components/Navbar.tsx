"use client";

import { useEffect, useState } from "react";
import { Mic } from "lucide-react";

const NAV_ITEMS = [
  { id: "showcase", label: "实拍" },
  { id: "background", label: "背景" },
  { id: "painpoints", label: "痛点" },
  { id: "solution", label: "方案" },
  { id: "architecture", label: "架构" },
  { id: "demo", label: "Demo" },
  { id: "results", label: "评测" },
];

export function Navbar() {
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_ITEMS.map((i) => document.getElementById(i.id)).filter(
      Boolean
    ) as HTMLElement[];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-dark-border/60 bg-dark-bg/70 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-content items-center justify-between px-6 md:px-10 lg:px-20">
        <a
          href="#hero"
          className="flex items-center gap-2 text-dark-text"
          aria-label="声控场 Copilot 首页"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-blue/15 text-accent-cyan">
            <Mic className="h-4 w-4" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">
            声控场 <span className="text-accent-cyan">Copilot</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  active === item.id
                    ? "text-accent-cyan"
                    : "text-muted-dark hover:text-dark-text"
                }`}
                aria-current={active === item.id ? "true" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#demo"
          className="rounded-btn border border-dark-border px-3.5 py-2 text-[13px] font-medium text-dark-text transition-colors hover:border-accent-cyan/50"
        >
          语音 Demo
        </a>
      </nav>
    </header>
  );
}
