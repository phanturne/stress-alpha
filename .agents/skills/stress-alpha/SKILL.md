---
name: stress-alpha
description: >-
  Run the StressAlpha equity earnings analysis pipeline, execute multi-stage audit extractions (facts, catalysts, scenarios, stress baselines), compute deterministic valuations, and persist institutional reports directly into Neon PostgreSQL for interactive simulation in the Next.js web cockpit.
---

# StressAlpha: Earnings Analysis & Scenario Stress Skill

This skill teaches the agent how to run the end-to-end StressAlpha earnings analysis pipeline for any public equity, audit earnings quality, compute deterministic valuation bands, and persist reports directly into **Neon PostgreSQL** to power the live simulation dashboard and memorandum in the Next.js web application.

## Architectural Philosophy
> **LLMs extract and audit qualitative context; pure deterministic TypeScript handles 100% of the arithmetic.**
> The LLM must never invent or guess weighted fair values, upside percentages, or multiple deltas.
> **Database-First Data Store:** Neon PostgreSQL (`tickers` and `reports` tables) is the central database serving the web application and receiving automated nightly market price updates. Local report directories act as transient staging areas during analysis and are gitignored.

---

## Complete Workflow Steps

### Step 1: Create the Staging Directory
Create a temporary staging folder for assembling the report artifacts:
```bash
mkdir -p /Users/krding/Projects/stress-alpha/reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```
Example: `/Users/krding/Projects/stress-alpha/reports/NVDA-Q2-2027-analysis`

### Step 2: Extract & Ingest Artifacts

Run fundamental profile extractor:
```bash
python3 /Users/krding/Projects/stress-alpha/scripts/fetch_fundamental_profile.py <TICKER> reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```

Generate the following structured JSON artifacts inside the staging folder using the prompt templates in `/Users/krding/Projects/stress-alpha/prompts/`:

1. `facts.json` (Required):
   - Ingest headline earnings, segments, and guidance.
   - **Income Quality Guardrail:** Identify any non-operating one-time gains/losses (e.g. ASU 2016-01 equity marks) and isolate clean `epsOperating`.
   - **Forensic Governance & Accounting Audit (QPCE Anchor):** Audit for `governanceRisk` (`none` | `low` | `moderate` | `severe`), `accountingFlags` (auditor resignations, restatements, internal control weaknesses, related-party pull-forwards), and `materialLitigationOrDoj`.
2. `scenarios.json` (Required):
   - Formulate 3-4 scenarios (Bull, Base, Panic/Bear) with forward EPS, P/E multiples, and assumptions. Probabilities must sum to 1.0 (these act as initial raw priors `rawProbability` to be deterministically calibrated by QPCE into `calibratedProbability`).
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
8. `filing-extracts.json` & `filing-extracts_zh.json` (Optional):
   - 10-Q Item 1A risk disclosure diffs and novel findings in English and institutional Chinese.
9. `reactions.json` (Optional):
   - Historical post-earnings day-1 moves and conditional reaction framing.

### Step 3: Run the Deterministic Valuation Engine & Save to Neon Database
Execute the deterministic valuation engine:
```bash
cd /Users/krding/Projects/stress-alpha
npx tsx scripts/analyze.ts reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```
This automatically:
- Validates all schemas via Zod.
- **Calibrates probabilities via QPCE:** Converts raw scenario priors into Multinomial Log-Odds space, calibrates probabilities across 4 pillars (Lexicographic Governance Veto, Archetype-Aware Resilience with Compounder/Operating Scaler/Venture Hypergrowth and Cash Runway Dilution Guardrails, Wall Street Consensus Skew, and Market Price Bayesian Shrinkage $w_{\text{mkt}} = 0.20$), and writes `calibratedProbability` with full audit logs.
- Computes exact mathematical fair values, valuation bands (Bull, Base, Panic), and risk asymmetry metrics (`valuation.json`).
- Generates bilingual human-readable reports (`report.md` and `report_zh.md`).
- **Persists directly into Neon PostgreSQL (`tickers` and `reports` tables):** Upserts all structured JSONB artifacts, valuation bands, and rendered markdown into the database.

Verify the saved database record:
```bash
npm run db:query -- --report <TICKER>-<QUARTER>-<YEAR>-analysis
```

### Step 4: Display Output on the Web Application
Launch the report directly in the browser:
```bash
/Users/krding/Projects/stress-alpha/scripts/open_report.sh <TICKER>-<QUARTER>-<YEAR>-analysis
```

The web application:
- Queries Neon PostgreSQL via `DrizzleReportRepository` for instant report listing, dynamic upside % calculations, and full artifact bundles.
- Provides sub-millisecond client-side sensitivity sliders (<1ms) for testing upstream shocks.
- Allows viewing both English and Chinese reports under the **Full Report** tab.
- Supports switching between the interactive **Cockpit View** and the publication-ready **Committee Memo View** (with 1-click English and Chinese memo options).
- Automatically updates market pricing nightly through GitHub Actions.

---

## Useful References & Scripts
- [Pipeline Stages Reference](./references/pipeline-stages.md)
- Database Query Tool: [scripts/db_query.ts](/Users/krding/Projects/stress-alpha/scripts/db_query.ts)
- Market Price Sync: [scripts/sync_prices.ts](/Users/krding/Projects/stress-alpha/scripts/sync_prices.ts)
- Browser Opener Script: [scripts/open_report.sh](/Users/krding/Projects/stress-alpha/scripts/open_report.sh)
- CLI Valuation Engine: [scripts/analyze.ts](/Users/krding/Projects/stress-alpha/scripts/analyze.ts)
- Universe Probability Backfill: [scripts/backfill_qpce.ts](/Users/krding/Projects/stress-alpha/scripts/backfill_qpce.ts)
- Analyst Estimates Extractor: [scripts/fetch_analyst_estimates.py](/Users/krding/Projects/stress-alpha/scripts/fetch_analyst_estimates.py)
