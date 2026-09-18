---
name: stress-alpha
description: >-
  Run the StressAlpha equity earnings analysis pipeline, execute multi-stage audit extractions (facts, catalysts, scenarios, stress baselines), compute deterministic valuations, and display the interactive cockpit and memorandum on the StressAlpha Next.js web application.
---

# StressAlpha: Earnings Analysis & Scenario Stress Skill

This skill teaches the agent how to run the end-to-end StressAlpha earnings analysis pipeline for any public equity, audit earnings quality, compute deterministic valuation bands, and display the live simulation dashboard in the modern Next.js web application.

## Architectural Philosophy
> **LLMs extract and audit qualitative context; pure deterministic TypeScript handles 100% of the arithmetic.**
> The LLM must never invent or guess weighted fair values, upside percentages, or multiple deltas.

---

## Complete Workflow Steps

### Step 1: Create the Report Folder
All reports are organized under `/Users/krding/Projects/stress-alpha/reports/`:
```bash
mkdir -p /Users/krding/Projects/stress-alpha/reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```
Example: `/Users/krding/Projects/stress-alpha/reports/NVDA-Q2-2027-analysis`

### Step 2: Extract & Ingest Artifacts
Generate the following structured JSON artifacts inside the report folder using the prompt templates in `/Users/krding/Projects/stress-alpha/prompts/`:

1. `facts.json` (Required):
   - Ingest headline earnings, segments, and guidance.
   - **Income Quality Guardrail:** Identify any non-operating one-time gains/losses (e.g. ASU 2016-01 equity marks) and isolate clean `epsOperating`.
2. `scenarios.json` (Required):
   - Formulate 3-4 scenarios (Bull, Base, Bear) with forward EPS, P/E multiples, and assumptions. Probabilities must sum to 1.0.
3. `moat-competitors.json` (Recommended):
   - Morningstar 5-pillar economic moat evaluation (Intangible Assets, Switching Costs, Cost Advantage, Network Effects, Efficient Scale) and moat trend (Widening, Stable, Narrowing).
   - Peer comparison matrix (Ticker, Market Cap, Revenue, YoY Growth %, Gross Margin %, Operating Margin %, Forward P/E, Market Share %, Pricing Power, Product Comparison, Advantage/Vulnerability).
   - **Durability Calibration:** Durability years assessed per pillar, calibrated for sector velocity (e.g., 4-8 years for high-velocity AI/hardware cycles vs. 10-15 years for patent-protected biopharma or physical infrastructure).
4. `analyst-estimates.json` & `analyst-estimates_zh.json` (Recommended):
   - **Automated Extraction via Yahoo Finance API (Preferred):**
     Execute the automated extractor script to pull real-time consensus distributions, 52W price targets (Low, Mean, Median, High), and covering sell-side firm revisions directly:
     ```bash
     python3 /Users/krding/Projects/stress-alpha/scripts/fetch_analyst_estimates.py <TICKER> reports/<TICKER>-<QUARTER>-<YEAR>-analysis --price <CURRENT_PRICE>
     ```
     *(Note: If `--price` is omitted, the script automatically fetches the latest market price from Yahoo Finance).*
     This directly generates schema-valid `analyst-estimates.json` and `analyst-estimates_zh.json` in ~1.5s with zero external API keys required.
   - **Perplexity Finance Style Structure:** Wall Street analyst consensus rating (e.g. Strong Buy), total covering analysts, bullish/neutral/bearish breakdown, 52-week price target track (Low, Mean, Median, High), sell-side brokerages roster (with prior target diffs and revision badges), and executive ratings synthesis.
   - For manual web research or custom prompt fallback, refer to [prompts/stage1c-estimates.md](/Users/krding/Projects/stress-alpha/prompts/stage1c-estimates.md).
5. `stress-baseline.json` (Recommended):
   - Define base revenue, gross margin %, fixed OpEx, shares outstanding, and upstream drivers (with exposure shares and elasticities).
6. `catalysts.json` (Optional):
   - Catalysts with probability anchors, horizons, and documented evidence.
7. `earnings-sentiment.json` (Optional):
   - Management tone scorecard across 5 dimensions, analyst Q&A topics, and key executive quotes.
8. `filing-extracts.json` (Optional):
   - 10-Q Item 1A risk disclosure diffs and novel findings.
9. `reactions.json` (Optional):
   - Historical post-earnings day-1 moves and conditional reaction framing.

### Step 3: Run the Deterministic Valuation Engine & Save to Database
Execute the deterministic valuation engine:
```bash
cd /Users/krding/Projects/stress-alpha
npx tsx scripts/analyze.ts reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```
This automatically validates all schemas and generates:
- `valuation.json`: Exact mathematical fair values, valuation bands (Bull, Base, Panic), and risk asymmetry metrics.
- `report.md`: Complete human-readable English markdown report.
- `report_zh.md`: Complete human-readable Chinese markdown report with institutional financial terminology (概率加权公允价值, 收益质量防线, 压力预测EPS, 估值区间).
- **Neon Database Persistence:** If `DATABASE_URL` is set, the script automatically persists the ticker and full report record into Neon PostgreSQL (`tickers` and `reports` tables), making it immediately available in the cloud web application with live nightly price sync support.

### Step 4: Display Output on the Web Application
Launch the report directly in the browser:
```bash
/Users/krding/Projects/stress-alpha/scripts/open_report.sh <TICKER>-<QUARTER>-<YEAR>-analysis
```
Or run the all-in-one helper script:
```bash
/Users/krding/Projects/stress-alpha/scripts/run_flow.sh <TICKER>-<QUARTER>-<YEAR>-analysis
```

The web application:
- Automatically detects and lists all folders under `reports/` in the top report selector.
- Provides sub-millisecond client-side sensitivity sliders (<1ms) for testing upstream shocks.
- Allows viewing both English (`report.md`) and Chinese (`report_zh.md`) reports under the **Full Report** tab.
- Supports switching between the interactive **Cockpit View** and the publication-ready **Committee Memo View** (with 1-click English and Chinese memo options).

---

## Useful References & Scripts
- [Pipeline Stages Reference](./references/pipeline-stages.md)
- Flow Runner Script: [scripts/run_flow.sh](/Users/krding/Projects/stress-alpha/scripts/run_flow.sh)
- Browser Opener Script: [scripts/open_report.sh](/Users/krding/Projects/stress-alpha/scripts/open_report.sh)
- CLI Valuation Engine: [scripts/analyze.ts](/Users/krding/Projects/stress-alpha/scripts/analyze.ts)
- Analyst Estimates Extractor: [scripts/fetch_analyst_estimates.py](/Users/krding/Projects/stress-alpha/scripts/fetch_analyst_estimates.py)
