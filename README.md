# StressAlpha — Modern Equity Earnings & Stress Simulation Platform

A forward-looking financial decision and scenario-simulation platform for fundamental equity analysts, tech investors, and quant researchers. Built as a high-performance **Next.js 16 App Router** application (powered by **React 19** and **Turbopack**) with pure client-side deterministic arithmetic, dynamic valuation bands, and an autonomous AI pipeline skill.

<p align="center">
  <img src="./docs/images/cockpit-preview.png" alt="StressAlpha Cockpit Preview" width="100%" />
</p>

---

## 🚀 Key Features

### 1. Cross-Ticker Universe Screener & Comparison Table
- **Market-Wide Valuation Radar:** Cross-ticker table comparing all covered companies (NVDA, AMZN, GOOGL, BABA, GEV, LLY, MU, LITE) side-by-side.
- **Valuation Spectrum Bars:** Visual Bear $\leftrightarrow$ Market Price $\leftrightarrow$ Base $\leftrightarrow$ Bull spread bars showing which stocks trade at deep discounts to Base Case fair value.
- **Fundamental Screening:** Real-time search and filter by Economic Moat (*Wide / Narrow*), valuation discount (*Undervalued / High Upside >20%*), margins, and growth.
- **1-Click Navigation:** Launch directly into any ticker's cockpit or memorandum from the table or by pressing the **`S`** hotkey.

<p align="center">
  <img src="./docs/images/screener-preview.png" alt="Universe Screener Preview" width="100%" />
</p>

### 2. Direct Report Selector from `reports/`
- Automatically discovers and lists all earnings analysis report directories under the project's [`reports/`](./reports) folder.
- Allows switching seamlessly between tickers and quarters directly from the dashboard header dropdown or welcome screen without needing to upload files or select directories manually.
- Live API endpoints:
  - `GET /api/reports`: Scans and returns summaries + valuation metrics for all folders in [`reports/`](./reports).
  - `GET /api/reports/[slug]`: Ingests and serves the full set of artifacts for a selected report (async route params).
- URL deep-linking: `http://localhost:3000/?report=NVDA-Q2-2027-analysis&mode=screener`.

### 3. Sticky Flow-Through Cockpit
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

### 4. Intelligence Workspace Tabs (7 Workspaces)
- **1. Valuation & Scenario Tree:** Interactive Bull/Base/Bear matrix with inline-editable forward EPS and exit multiples, real-time fair value recalculation, and integrated parameter sensitivity analysis.
- **2. Wall Street Estimates:** Sell-side consensus ratings, price target track (Low/Mean/Median/High), and analyst revision histories.
- **3. Economic Moat:** 5-pillar economic moat evaluation (Intangible Assets, Switching Costs, Cost Advantage, Network Effects, Efficient Scale) and peer comparison matrix.
- **4. Segments & Guidance:** Segment revenue breakdowns, YoY velocities, and management forward guidance ranges.
- **5. Catalysts:** Directional growth and risk drivers with quantified probability anchors, horizons, and interactive weight sliders.
- **6. Audit & Risk:** Consolidated audit workspace containing 10-Q SEC risk disclosures, management tone scorecard, and historical post-earnings price reactions.
- **7. Full Report Markdown:** View bilingual reports (`report.md` / `report_zh.md`) with 1-click clipboard copy.

### 5. Investment Committee Memo Mode
- Toggle with one click (`[M]` key) into a publication-ready 1-page PDF / printable memorandum for investment committee review.

<p align="center">
  <img src="./docs/images/memo-preview.png" alt="Investment Committee Memorandum Preview" width="100%" />
</p>

### 6. Deterministic Valuation Methodology & Formula Guide (`/methodology`)
- Comprehensive interactive documentation page explaining all mathematical algorithms and accounting guardrails powering the platform.
- Full mathematical breakdowns, parameter definitions, and worked real-world examples (e.g. NVDA CapEx elasticity, AMZN ASU 2016-01 mark-to-market normalization).
- Accessible anytime from the top navigation bar or via direct route `/methodology`, complete with instant bilingual EN/中文 switching and GitHub links.

<p align="center">
  <img src="./docs/images/methodology-preview.png" alt="Valuation Methodology Preview" width="100%" />
</p>

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

### Capture Headless UI Screenshots:
```bash
# Automatically boots background server and snaps 1600px screenshots
./scripts/capture_screenshots.sh
```

---

## 🛠️ Project Structure

```
stress-alpha/
├── package.json                      # Next.js 16 + React 19 dependencies
├── tsconfig.json                     # TypeScript configuration (react-jsx)
├── tailwind.config.ts                # Styling configuration with font variables
├── next.config.mjs                   # Next.js configuration
├── eslint.config.mjs                 # Flat ESLint configuration (core-web-vitals)
├── .github/workflows/ci.yml          # GitHub Actions CI workflow (lint, test, build)
├── docs/images/                      # High-res UI preview screenshots
├── reports/                          # Institutional earnings datasets
│   ├── NVDA-Q2-2027-analysis/        # NVIDIA Q2 2027 dataset
│   ├── AMZN-Q2-2026-analysis/        # Amazon Q2 2026 dataset
│   └── LITE-Q4-2026-analysis/        # Lumentum Q4 2026 dataset
├── prompts/                          # LLM audit & extraction prompt templates
├── scripts/
│   ├── analyze.ts                    # CLI valuation & report engine
│   ├── fetch_analyst_estimates.py    # Yahoo Finance consensus extractor
│   ├── capture_screenshots.sh        # Headless Chrome snapshot capture script
│   ├── run_flow.sh                   # Flow runner
│   └── open_report.sh                # Browser opener
├── src/
│   ├── app/
│   │   ├── layout.tsx                # App layout (next/font/google)
│   │   ├── page.tsx                  # Main dashboard (Cockpit + Intelligence Workspaces)
│   │   ├── globals.css               # Theme & styles
│   │   └── api/
│   │       └── reports/              # API to list and load reports from reports/
│   ├── components/
│   │   ├── Header.tsx                # Navigation & live metrics
│   │   ├── Cockpit.tsx               # Sticky left flow-through simulator
│   │   ├── ScreenerView.tsx          # Multi-ticker universe screener & comparison table
│   │   ├── ReportSelector.tsx        # Dropdown report browser
│   │   ├── PriceMeter.tsx            # Visual price range meter
│   │   ├── MemoView.tsx              # Committee memorandum mode
│   │   ├── FileUploader.tsx          # Upload modal fallback
│   │   └── tabs/                     # Focused intelligence workspaces
│   └── lib/
│       ├── schemas.ts                # Zod schemas & types
│       ├── valuation.ts              # Deterministic arithmetic engine
│       ├── url-state.ts              # URL search param state sync & serializer
│       ├── report.ts                 # Bilingual markdown report generator
│       ├── i18n.ts                   # Internationalization dictionary
│       └── utils.ts                  # Helpers
└── tests/                            # Vitest unit test suite (52 tests)
    ├── valuation.test.ts
    ├── schemas.test.ts
    ├── screener.test.ts
    ├── url-state.test.ts
    ├── report.test.ts
    └── utils.test.ts
```

---

## 🏃 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run test suite & verify build:**
   ```bash
   npm test
   npm run test:coverage
   npm run build
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:3000
   ```
