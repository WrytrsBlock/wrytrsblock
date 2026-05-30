import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        "surface-3": "rgb(var(--surface-3) / <alpha-value>)",
        line: "rgb(var(--border) / <alpha-value>)",
        "line-strong": "rgb(var(--border-strong) / <alpha-value>)",
        ink: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-2": "rgb(var(--accent-2) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Instrument Serif"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["10.5px", { lineHeight: "1.3" }],
        xs: ["11.5px", { lineHeight: "1.4" }],
        sm: ["12.5px", { lineHeight: "1.5" }],
        base: ["13.5px", { lineHeight: "1.55" }],
        md: ["14.5px", { lineHeight: "1.55" }],
        lg: ["16px", { lineHeight: "1.5" }],
        xl: ["18px", { lineHeight: "1.4" }],
        "2xl": ["22px", { lineHeight: "1.3" }],
        "3xl": ["28px", { lineHeight: "1.2" }],
        "4xl": ["36px", { lineHeight: "1.1" }],
        "5xl": ["48px", { lineHeight: "1.05" }],
        "6xl": ["64px", { lineHeight: "1.0" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
        tight: "-0.015em",
        normal: "-0.005em",
      },
      boxShadow: {
        hairline: "inset 0 0 0 1px rgb(var(--border))",
        soft: "0 1px 0 rgb(var(--border)), 0 8px 32px -8px rgb(0 0 0 / 0.12)",
        elevated:
          "0 1px 0 rgb(var(--border)), 0 12px 48px -12px rgb(0 0 0 / 0.24), 0 2px 8px -2px rgb(0 0 0 / 0.08)",
        pop: "0 24px 64px -16px rgb(0 0 0 / 0.4), 0 1px 0 rgb(var(--border-strong))",
        glow: "0 0 32px rgb(var(--accent) / 0.22), 0 0 80px rgb(var(--accent) / 0.08)",
        "inner-line": "inset 0 0 0 1px rgb(var(--border))",
      },
      backgroundImage: {
        "grad-accent":
          "linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)",
        "grad-ink":
          "linear-gradient(180deg, rgb(var(--text)) 0%, rgb(var(--text) / 0.85) 100%)",
        "grad-mesh":
          "radial-gradient(at 16% 12%, rgb(var(--accent) / 0.18) 0px, transparent 50%), radial-gradient(at 84% 20%, rgb(var(--accent-2) / 0.14) 0px, transparent 50%), radial-gradient(at 60% 88%, rgb(var(--accent) / 0.12) 0px, transparent 50%)",
        "grad-fade-b":
          "linear-gradient(180deg, transparent 0%, rgb(var(--bg)) 100%)",
        "grad-fade-t":
          "linear-gradient(0deg, transparent 0%, rgb(var(--bg)) 100%)",
        "grad-cinema":
          "linear-gradient(180deg, rgb(var(--bg) / 0.1) 0%, rgb(var(--bg) / 0.6) 60%, rgb(var(--bg)) 100%)",
      },
      transitionTimingFunction: {
        ease: "cubic-bezier(0.16, 1, 0.3, 1)",
        "ease-out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      keyframes: {
        "slow-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "slow-pulse": "slow-pulse 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
