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

### Step 1 & 2: Automated Ingestion & 8-Module Scaffolding

Execute the unified TypeScript data ingestion engine. With `--stage`, it automatically resolves the fiscal quarter staging folder (e.g. `reports/<TICKER>-Q2-2026-analysis`), fetches all institutional feeds, and generates valid starter drafts for all 8 quarterly modules (in both English and Chinese):

```bash
npm run fetch:data -- <TICKER> --stage
```

*Or pass an explicit directory path:*
```bash
npm run fetch:data -- <TICKER> reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```

*Or invoke the programmatic Next.js REST API:*
```bash
curl -s -X POST http://localhost:3000/api/pipeline/data \
  -H "Content-Type: application/json" \
  -d '{"ticker": "<TICKER>", "autoStage": true}'
```

This single command automatically fetches live feeds and stages all 18 JSON artifacts:
1. **Analyst Estimates**: `analyst-estimates.json` & `analyst-estimates_zh.json` (Consensus breakdown, 52W target distributions, sell-side broker roster).
2. **Fundamental Profile**: `fundamental_profile.json` (SEC balance sheet, cash flows, and historical quarterly income statements).
3. **Reactions**: `reactions.json` (Historical post-earnings day-1 moves).
4. **SEC Filings**: `sec-filings.json` (Direct links to 10-Q, 10-K, and 8-K filings).
5. **Facts**: `facts.draft.json`, `facts.json`, `facts_zh.json` (Headline revenue, operating margin, clean operating EPS, capital runway, valuation archetype).
6. **Stress Baseline**: `stress-baseline.json` (Annualized baseline revenue, gross margin %, fixed OpEx, shares outstanding, and upstream driver elasticities).
7. **Scenarios**: `scenarios.json` & `scenarios_zh.json` (Bull, Base, Panic regimes with forward EPS, multiples, and assumptions).
8. **Moat & Competitors**: `moat-competitors.json` & `moat-competitors_zh.json` (5-pillar economic moat evaluation and competitor benchmarking).
9. **Catalysts**: `catalysts.json` & `catalysts_zh.json` (Growth & risk catalysts with probability anchors).
10. **Earnings Sentiment**: `earnings-sentiment.json` (Management tone scorecard, analyst concern topics, and key quotes).
11. **Filing Extracts**: `filing-extracts.json` & `filing-extracts_zh.json` (10-Q Item 1A risk disclosure diffs and novel findings).

> [!TIP]
> **Non-Destructive Staging:** `writePipelineArtifacts` preserves existing qualitative files (`scenarios.json`, `moat-competitors.json`, etc.) if you have already customized them. Pass `--overwrite-all` only if you wish to reset all files back to raw starter templates.

#### Institutional Data Feeds & Fallbacks
1. **[Massive.com Financial Data](https://massive.com/pricing)** (Polygon.io):
   - Standardized SEC 10-K/10-Q statements (`/stocks/financials/v1/*`) and historical price aggregates (`/v2/aggs/ticker/{TICKER}/range/1/day/*`).
2. **[Finnhub.io Financial API](https://finnhub.io/pricing)**:
   - Consensus recommendations (`/stock/recommendation`), company profile (`/stock/profile2`), SEC filings search (`/stock/filings`), and audio transcripts (`/stock/transcripts`).
3. **Yahoo Finance & Local Telemetry**:
   - Zero-config automatic fallback for consensus price targets and broker rating history.

#### Qualitative AI Review & Synthesis
With all quantitative financials and starter schemas scaffolded, the LLM only audits and enriches qualitative context using the prompt templates in `/Users/krding/Projects/stress-alpha/prompts/`:
- `facts.json`: Audit **forensic governance** (`governanceRisk`: 'none'|'low'|'moderate'|'severe', `accountingFlags`, `materialLitigationOrDoj`).
- `moat-competitors.json`: Morningstar 5-pillar moat evaluation and direct competitor benchmarking.
- `scenarios.json`: Customize discrete Bull, Base, Panic regimes with forward EPS, multiples, and initial raw prior probabilities (`rawProbability`).
- `stress-baseline.json`: Refine upstream driver shocks and operational leverage.
- `earnings-sentiment.json`: Verify management tone scorecard across 5 dimensions and key executive quotes.
- `filing-extracts.json`: Extract novel 10-Q risk disclosures.

---

### Step 3: Fast Pre-Flight & Valuation Verification (Dry-Run Mode)

Before saving to the database, test the calculation, QPCE calibration, and sanity audit locally without writing to Neon PostgreSQL:

```bash
npm run analyze -- reports/<TICKER>-<QUARTER>-<YEAR>-analysis --dry-run
```

This verifies 100% Data Completeness across all 8 modules and confirms that all schema invariants pass.

---

### Step 4: Persist to Neon Database & Render Reports

Once satisfied with qualitative audits, execute production analysis:

```bash
npm run analyze -- reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```

This runs the **Quantitative Probability Calibration Engine (QPCE)** across 4 pillars, validates all schemas, renders bilingual markdown memos (`report.md` & `report_zh.md`), and persists the report and ticker directly into **Neon PostgreSQL** (`tickers` and `reports` tables).

---

### Step 5: Open in the Web Cockpit

```bash
/Users/krding/Projects/stress-alpha/scripts/open_report.sh <TICKER>-<QUARTER>-<YEAR>-analysis
```
The web application queries Neon PostgreSQL directly via `DrizzleReportRepository` with nightly live price updates.
