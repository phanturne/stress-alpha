# StressAlpha — Modern Equity Earnings & Stress Simulation Platform

A forward-looking financial decision and scenario-simulation platform for fundamental equity analysts, tech investors, and quant researchers. Built as a high-performance **Next.js 14 App Router** application with pure client-side deterministic arithmetic, dynamic valuation bands, and an autonomous AI pipeline skill.

---

## 🚀 Key Features

### 1. Direct Report Selector from `reports/` (New Feature)
- Automatically discovers and lists all earnings analysis report directories under the project's [`reports/`](./reports) folder.
- Allows switching seamlessly between tickers and quarters directly from the dashboard header dropdown or welcome screen without needing to upload files or select directories manually.
- Live API endpoints:
  - `GET /api/reports`: Scans and returns summaries for all folders in [`reports/`](./reports).
  - `GET /api/reports/[slug]`: Ingests and serves the full set of artifacts for a selected report.
- URL deep-linking: `http://localhost:3000/?report=AMZN-Q2-2026-analysis` or `LITE-Q4-2026-analysis`.

### 2. Sticky Flow-Through Cockpit
- **Live P&L Strip:** Stressed Revenue, Gross Profit, Operating Income, Net Income, and Stressed Diluted EPS.
- **Valuation Outcome Regimes:**
  - 🐂 **Bull Regime:** Multiple expansion / enterprise acceleration scenario.
  - ⚖️ **Base Regime:** Normalized multiple and guidance execution.
  - 🚨 **Panic Floor:** Multiple de-rating and recessionary drawdown floor.
- **Visual Valuation Meter:** Real-time gauge pin positioning current stock price against panic and bull regime boundaries.
- **2x2 Risk Asymmetry Matrix:** Calculates Upside to Bull, Downside to Panic, Priced-In Multiple, and Risk/Reward Asymmetry Skew.
- **Upstream Demand Shock Sliders:** Continuous sensitivity sliders (<1ms response) perturbing Hyperscaler CapEx, Consumer Demand, Digital Ad Budgets with exposure shares and elasticities.
- **Operating Margin & Leverage Controls:** Perturb gross margin (bps) and fixed OpEx shifts (%).
- **Income Quality Guardrail:** Identifies and strips non-operating one-time gains (e.g. Amazon's $53.4B Anthropic unrealized paper mark under ASU 2016-01) to surface the true Operating EPS.

### 3. Intelligence Workspace Tabs
- **Catalysts:** Directional growth and risk drivers with quantified probability anchors, horizons, and interactive weight sliders.
- **Scenario Tree:** Interactive Bull/Base/Bear matrix with inline-editable forward EPS and exit multiples with real-time fair value recalculation.
- **Segments & Guidance:** Segment revenue breakdowns, YoY velocities, and management forward guidance ranges.
- **Management Tone:** 5-dimension call sentiment scorecard, executive confidence index (/10), analyst concern frequencies, and key executive quotes.
- **10-Q & SEC Filing Risks:** Escalated risk factors with severity badges and novel disclosure diffs.
- **Historical Reactions:** Historical post-earnings day-1 moves and conditional market framing.
- **Sensitivity Heatmap:** Isolated dollar impact on fair value per fundamental parameter shift.
- **Full Report Markdown:** View the generated `report.md` memo directly within the dashboard.

### 4. Investment Committee Memo Mode
- Toggle with one click into a publication-ready 1-page PDF / printable memorandum for investment committee review.

---

## 🤖 AI Skill Integration (`stress-alpha`)

StressAlpha includes a dedicated AI Skill installed at:
- Project level: [`.agents/skills/stress-alpha/SKILL.md`](./.agents/skills/stress-alpha/SKILL.md)
- Global level: `~/.agents/skills/stress-alpha/SKILL.md`

### Running the Complete Flow with 1 Command:
```bash
# Analyze and display a report in the web app
/Users/krding/Projects/stress-alpha/scripts/run_flow.sh AMZN-Q2-2026-analysis
```

### CLI Analysis Engine:
```bash
# Compute deterministic valuation and report markdown
npx tsx scripts/analyze.ts reports/LITE-Q4-2026-analysis
```

### Quick Browser Opener:
```bash
# Launch web app directly to a chosen report
/Users/krding/Projects/stress-alpha/scripts/open_report.sh LITE-Q4-2026-analysis
```

---

## 🛠️ Project Structure

```
stress-alpha/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── reports/                          # Direct report directory
│   ├── AMZN-Q2-2026-analysis/        # Amazon Q2 2026 dataset
│   └── LITE-Q4-2026-analysis/        # Lumentum Q4 2026 dataset
├── prompts/                          # LLM extraction prompt templates
├── scripts/
│   ├── analyze.ts                    # CLI valuation engine
│   ├── run_flow.sh                   # Flow runner
│   └── open_report.sh                # Browser opener
├── src/
│   ├── app/
│   │   ├── layout.tsx                # App layout
│   │   ├── page.tsx                  # Main dashboard (Cockpit + Intelligence Tabs)
│   │   ├── globals.css               # Theme & styles
│   │   └── api/
│   │       └── reports/              # API to list and load reports from reports/
│   ├── components/
│   │   ├── Header.tsx                # Navigation & live metrics
│   │   ├── Cockpit.tsx               # Sticky left flow-through simulator
│   │   ├── ReportSelector.tsx        # Dropdown report browser
│   │   ├── PriceMeter.tsx            # Visual price range meter
│   │   ├── MemoView.tsx              # Committee memorandum mode
│   │   ├── FileUploader.tsx          # Upload modal fallback
│   │   └── tabs/                     # Tab components
│   └── lib/
│       ├── schemas.ts                # Zod schemas & types
│       ├── valuation.ts              # Deterministic arithmetic engine
│       ├── report.ts                 # Markdown report generator
│       └── utils.ts                  # Helpers
└── .agents/
    └── skills/
        └── stress-alpha/             # AI Skill definition
```

---

## 🏃 Getting Started

1. **Install dependencies:**
   ```bash
   cd /Users/krding/Projects/stress-alpha
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   ```
   http://localhost:3000
   ```
