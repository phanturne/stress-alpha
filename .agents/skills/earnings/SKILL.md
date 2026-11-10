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
   - Consensus recommendations (`/stock/recommendation`), company profile (`/stock/profile2`), and SEC filings links (`/stock/filings`).
3. **SEC EDGAR Direct Footnote Ingestion (`extractSecFilingExcerpts`)**:
   - Free, zero-API-key public utility extracting targeted 10-Q and 8-K disclosures in milliseconds:
     - **Note: Commitments and Contingencies**: Off-balance-sheet supply capacity obligations (e.g. $279B), total future commitments ($366B), and credit/power guarantees (e.g. $105B SB Energy guarantee).
     - **Note: Customer and Segment Concentrations**: Single-customer (16%) and top-tier customer concentration (44%) to drive QPCE downside stress.
     - **Form 8-K & Exhibits**: Verbatim CEO (Jensen Huang) and CFO (Colette Kress) commentary, forward quarterly guidance, and architecture transition timelines (e.g. Vera Rubin production in Q3).
4. **Yahoo Finance & Local Telemetry**:
   - Zero-config automatic fallback for consensus price targets and broker rating history.

#### Qualitative AI Review & Synthesis (Zero Quantitative Guessing)
> [!IMPORTANT]
> **Deterministic Quantitative Hydration:** All quantitative peer metrics (`marketCapBillions`, `revenueBillions`, `revenueGrowthPct`, `grossMarginPct`, `operatingMarginPct`, `forwardPe`, `marketSharePct`), analyst price targets (`low`, `average`, `median`, `high`, `priceTarget`, `priorPriceTarget`, `upsidePct`), scenario quantitative parameters (`forwardEps`, `multiple`, `probability`, `calibratedProbability`), and historical reaction `priceMovePct` are deterministically fetched and hydrated by TypeScript (`npm run fetch:data`, `fetchPeerBenchmarks`, `analyze.ts`). **The LLM must NEVER guess, invent, or overwrite those numbers.**

With all quantitative financials and starter schemas scaffolded, the LLM only audits and enriches qualitative context using the prompt templates in `/Users/krding/Projects/stress-alpha/prompts/`:
- `facts.json`: Audit **income quality** (isolate clean `epsOperating`), **forward consensus sanity** (verify `forwardEpsConsensus` against operational realities), sector-relevant KPIs (e.g. DAU for consumer, NRR for SaaS, backlog for defense, gross margins for semis), and **forensic governance** (`governanceRisk`: 'none'|'low'|'moderate'|'severe', `accountingFlags`, `materialLitigationOrDoj`).
- `moat-competitors.json`: Morningstar 5-pillar moat evaluation and direct competitor qualitative comparison (`productComparison`, `pricingPower`, `keyAdvantageOrVulnerability`). Quantitative peer metrics (`marketCapBillions`, `revenueBillions`, `revenueGrowthPct`, `grossMarginPct`, `operatingMarginPct`, `forwardPe`, `marketSharePct`) are deterministically hydrated via `fetchPeerBenchmarks` (`npm run fetch:data` / `analyze.ts`) — never invent peer numbers. Audit distribution channel vulnerability (e.g. third-party search, platform gatekeepers) and ensure `moatTrend` critically reflects channel decay if not offset by direct channel retention.
- `scenarios.json`: Enrich qualitative regime `assumptions` and `keyDrivers` for discrete Bull, Base, and Panic regimes while preserving deterministically scaffolded `forwardEps`, `multiple`, and calibrated `probability` (`analyze.ts`). Ensure Base forward EPS is grounded in operational run-rate and guidance; ensure Panic regime stress-tests the specific business model's primary vulnerability.
- `stress-baseline.json`: Refine upstream driver shocks and operational leverage.
- `earnings-sentiment.json`: Verify management tone scorecard across 5 dimensions, analyst concerns (user growth, traffic, AI risks), and key executive quotes.
- `filing-extracts.json`: Extract novel 10-Q risk disclosures and MD&A trends.
- `reactions.json`: Provide conditional qualitative `context` and `conditionalFraming` around deterministically fetched historical `priceMovePct` values.

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
