import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="cyber"]'],
  theme: {
    extend: {
      spacing: {
        4.5: "1.125rem",
      },
      colors: {
        background: "rgb(var(--bg-rgb) / <alpha-value>)",
        foreground: "rgb(var(--text-primary-rgb) / <alpha-value>)",
        surface: {
          0: "rgb(var(--surface-0-rgb) / <alpha-value>)",
          1: "rgb(var(--surface-1-rgb) / <alpha-value>)",
          2: "rgb(var(--surface-2-rgb) / <alpha-value>)",
          3: "rgb(var(--surface-3-rgb) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border-rgb) / <alpha-value>)",
          light: "rgb(var(--border-light-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          hover: "rgb(var(--accent-hover-rgb) / <alpha-value>)",
          glow: "var(--accent-glow)",
        },
        fintech: {
          green: "rgb(var(--green-rgb) / <alpha-value>)",
          greenGlow: "var(--green-glow)",
          red: "rgb(var(--red-rgb) / <alpha-value>)",
          redGlow: "var(--red-glow)",
          amber: "rgb(var(--amber-rgb) / <alpha-value>)",
          amberGlow: "var(--amber-glow)",
          purple: "#a855f7",
        },
      },
      boxShadow: {
        glow: "0 0 20px -5px var(--accent-glow)",
        "glow-green": "0 0 20px -5px var(--green-glow)",
        "glow-red": "0 0 20px -5px var(--red-glow)",
        "glow-amber": "0 0 20px -5px var(--amber-glow)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
