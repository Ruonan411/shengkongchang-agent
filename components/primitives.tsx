"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { ImageOff } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Layout container                                                    */
/* ------------------------------------------------------------------ */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-content px-6 md:px-10 lg:px-20 ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section vertical rhythm                                             */
/* ------------------------------------------------------------------ */
export function Section({
  id,
  children,
  className = "",
  tone = "light",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 py-24 lg:py-32 ${
        tone === "dark" ? "bg-dark-bg text-dark-text" : "bg-light-bg text-light-text"
      } ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Scroll reveal (fade-up 200ms, respects reduced motion)              */
/* ------------------------------------------------------------------ */
const revealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, delay, ease: "easeOut" },
  }),
};

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      variants={revealVariants}
      custom={delay}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Eyebrow / section index                                             */
/* ------------------------------------------------------------------ */
export function Eyebrow({ index, tone = "light" }: { index: string; tone?: "light" | "dark" }) {
  const accent = tone === "dark" ? "text-accent-cyan" : "text-accent-blue";
  const rule = tone === "dark" ? "bg-dark-border" : "bg-dark-border/25";
  return (
    <div className="flex items-center gap-3">
      <span className={`font-mono text-[13px] font-medium tracking-widest ${accent}`}>
        {index}
      </span>
      <span className={`h-px w-8 ${rule}`} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading                                                     */
/* ------------------------------------------------------------------ */
export function SectionHeading({
  index,
  title,
  subtitle,
  tone = "light",
  className = "",
}: {
  index: string;
  title: string;
  subtitle?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const sub = tone === "dark" ? "text-muted-dark" : "text-muted-light";
  return (
    <div className={`max-w-prose ${className}`}>
      <Eyebrow index={index} tone={tone} />
      <h2 className="mt-4 text-[32px] font-semibold leading-[1.2] tracking-tight sm:text-[40px] lg:text-[46px]">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-[17px] leading-[1.7] ${sub}`}>{subtitle}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Risk tag                                                            */
/* ------------------------------------------------------------------ */
export function RiskTag({
  level,
  children,
}: {
  level: "warn" | "danger" | "info";
  children: ReactNode;
}) {
  const map = {
    warn: "border-warn/30 bg-warn/12 text-warn",
    danger: "border-danger/30 bg-danger/12 text-danger",
    info: "border-accent-blue/30 bg-accent-blue/12 text-accent-blue",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${map[level]}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Data card                                                           */
/* ------------------------------------------------------------------ */
export function DataCard({
  value,
  label,
  tone = "light",
  hint,
}: {
  value: string;
  label: string;
  tone?: "light" | "dark";
  hint?: string;
}) {
  const card =
    tone === "dark"
      ? "border-dark-border bg-dark-card"
      : "border-dark-border/10 bg-light-card";
  const sub = tone === "dark" ? "text-muted-dark" : "text-muted-light";
  return (
    <div className={`rounded-card border px-5 py-5 ${card}`}>
      <div className="font-mono text-[26px] font-semibold leading-none tracking-tight text-accent-blue sm:text-[30px]">
        {value}
      </div>
      <div className={`mt-2 text-[13px] ${sub}`}>{label}</div>
      {hint && <div className={`mt-0.5 text-[11px] ${sub} opacity-70`}>{hint}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Placeholder (image / screenshot / video area)                       */
/* ------------------------------------------------------------------ */
export function Placeholder({
  label,
  ratio = "16 / 9",
  tone = "light",
  note,
  icon,
}: {
  label: string;
  ratio?: string;
  tone?: "light" | "dark";
  note?: string;
  icon?: ReactNode;
}) {
  const border =
    tone === "dark" ? "border-dark-border bg-dark-bg/40" : "border-dark-border/20 bg-light-card";
  const text = tone === "dark" ? "text-muted-dark" : "text-muted-light";
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative flex w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed ${border} p-6`}
      style={{ aspectRatio: ratio }}
    >
      <div className={`flex flex-col items-center gap-2 ${text}`}>
        {icon ?? <ImageOff className="h-6 w-6 opacity-60" strokeWidth={1.5} />}
        <span className="text-[13px] font-medium">{label}</span>
        {note && <span className="text-[11px] opacity-70">{note}</span>}
      </div>
    </div>
  );
}
