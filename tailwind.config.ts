import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0B0F14",
          card: "#151A21",
          border: "#26303B",
          text: "#F5F7FA",
        },
        light: {
          bg: "#F7F8FA",
          card: "#FFFFFF",
          text: "#111827",
        },
        muted: {
          dark: "#9CA3AF",
          light: "#6B7280",
        },
        accent: {
          blue: "#3B82F6",
          cyan: "#22D3EE",
        },
        danger: "#EF4444",
        warn: "#F59E0B",
        safe: "#10B981",
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "Inter", "system-ui", "sans-serif"],
        display: ["Inter", '"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "1440px",
        prose: "720px",
      },
      borderRadius: {
        card: "14px",
        btn: "11px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.06)",
        panel: "0 24px 60px -20px rgba(0,0,0,0.55)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
