---
name: earnings
description: >-
  Execute the end-to-end equity earnings analysis pipeline, audit quarterly financial results and 10-Q filings, evaluate economic moats and competitors, construct scenario stress valuation trees, and persist reports into Neon PostgreSQL to launch the interactive StressAlpha analysis cockpit.
---

# Earnings Analysis & Stress Valuation Skill

This is the global shortcut for the **StressAlpha** earnings analysis skill.

Full workflow instructions:
[StressAlpha Skill Guide](/Users/krding/Projects/stress-alpha/.agents/skills/stress-alpha/SKILL.md)

## Complete Workflow Steps

### Step 1: Create the Staging Directory
```bash
mkdir -p /Users/krding/Projects/stress-alpha/reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```

### Step 2: Extract & Ingest Artifacts
Follow the institutional prompt templates in `/Users/krding/Projects/stress-alpha/prompts/` to generate:
- `facts.json`: Headline financials, segment unit economics, management forward guidance, and income quality clean operating EPS.
- `moat-competitors.json`: Morningstar 5-pillar moat evaluation, sector-velocity calibrated durability, and direct competitor benchmarking.
- `analyst-estimates.json` / `analyst-estimates_zh.json`: Wall Street analyst consensus breakdown, 52W price target range (low/mean/high), sell-side estimates roster with prior targets, and synthesis narrative. Run automated tool:
  ```bash
  python3 /Users/krding/Projects/stress-alpha/scripts/fetch_analyst_estimates.py <TICKER> /Users/krding/Projects/stress-alpha/reports/<TICKER>-<QUARTER>-<YEAR>-analysis --price <CURRENT_PRICE>
  ```
- `scenarios.json`: Discrete Bull, Base, Panic regimes with forward EPS and multiples.
- `stress-baseline.json`: Baseline revenue, operating cost leverage, and upstream driver elasticities.
- `catalysts.json` / `earnings-sentiment.json` / `filing-extracts.json` / `filing-extracts_zh.json` / `reactions.json`: Qualitative audit logs.

### Step 3: Run the Deterministic Engine & Save to Neon Database
```bash
npx tsx /Users/krding/Projects/stress-alpha/scripts/analyze.ts /Users/krding/Projects/stress-alpha/reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```
This computes the deterministic valuation math, validates all schemas, renders bilingual reports, and persists the record directly into **Neon PostgreSQL** (`tickers` and `reports` tables).

### Step 4: Open in the Web Cockpit
```bash
/Users/krding/Projects/stress-alpha/scripts/open_report.sh <TICKER>-<QUARTER>-<YEAR>-analysis
```
The web application queries Neon PostgreSQL directly via `DrizzleReportRepository` with nightly live price updates.
