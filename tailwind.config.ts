import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#07090e",
        surface: {
          0: "#0d1117",
          1: "#131922",
          2: "#1b2330",
          3: "#242f40",
        },
        border: {
          DEFAULT: "#202b3c",
          light: "#2d3b50",
        },
        accent: {
          DEFAULT: "#38bdf8",
          hover: "#0ea5e9",
          glow: "rgba(56, 189, 248, 0.18)",
        },
        fintech: {
          green: "#10b981",
          greenGlow: "rgba(16, 185, 129, 0.18)",
          red: "#f43f5e",
          redGlow: "rgba(244, 63, 94, 0.18)",
          amber: "#f59e0b",
          amberGlow: "rgba(245, 158, 11, 0.18)",
          purple: "#a855f7",
        }
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(56, 189, 248, 0.3)",
        "glow-green": "0 0 20px -5px rgba(16, 185, 129, 0.3)",
        "glow-red": "0 0 20px -5px rgba(244, 63, 94, 0.3)",
        "glow-amber": "0 0 20px -5px rgba(245, 158, 11, 0.3)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      fontFamily: {
        sans: [
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
    },
  },
  plugins: [],
};
export default config;
