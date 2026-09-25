import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LiveRoomShowcase } from "@/components/LiveRoomShowcase";
import { Overview } from "@/components/Overview";
import { Background } from "@/components/Background";
import { Personas } from "@/components/Personas";
import { PainPoints } from "@/components/PainPoints";
import { Solution } from "@/components/Solution";
import { CoreFeatures } from "@/components/CoreFeatures";
import { Architecture } from "@/components/Architecture";
import { Demo } from "@/components/Demo";
import { Results } from "@/components/Results";
import { Timeline } from "@/components/Timeline";
import { CTA } from "@/components/CTA";

export default function Page() {
  return (
    <main className="bg-light-bg">
      <Navbar />
      <Hero />
      <LiveRoomShowcase />
      <Overview />
      <Background />
      <Personas />
      <PainPoints />
      <Solution />
      <CoreFeatures />
      <Architecture />
      <Demo />
      <Results />
      <Timeline />
      <CTA />

      <footer className="bg-dark-bg text-muted-dark">
        <div className="mx-auto flex max-w-content flex-col gap-2 px-6 py-8 text-[13px] md:flex-row md:items-center md:justify-between md:px-10 lg:px-20">
          <span>声控场 Copilot · 直播语音动作 Agent · 电商直播 AI 产品实验</span>
          <span className="font-mono">Next.js · Tailwind · TypeScript · Web Speech API</span>
        </div>
      </footer>
    </main>
  );
}
