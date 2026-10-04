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

### Step 1 & 2: Automated Ingestion & 8-Module Scaffolding

Execute the unified TypeScript data ingestion engine. With `--stage`, it automatically resolves the fiscal quarter staging folder (e.g. `reports/<TICKER>-Q2-2026-analysis`), fetches all institutional feeds, and generates valid starter drafts for all 8 quarterly modules (in both English and Chinese):

```bash
npm run fetch:data -- <TICKER> --stage
```

*Or pass an explicit directory path:*
```bash
npm run fetch:data -- <TICKER> reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```

*Or invoke the programmatic REST API endpoint:*
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

#### Institutional Data Feeds & Pricing Matrix
StressAlpha leverages two primary institutional financial data APIs for report ingestion:

| Artifact | Primary Provider & Endpoint | Pricing Tier ([Massive Pricing](https://massive.com/pricing) / [Finnhub Pricing](https://finnhub.io/pricing)) | Zero-Key Fallback |
| :--- | :--- | :--- | :--- |
| `facts.json` | **Massive**: `/stocks/financials/v1/*` (income, balance, cashflow, ratios) | Massive Stocks Advanced / Financials Expansion | Yahoo Finance / SEC EDGAR |
| `moat-competitors.json` | **Massive**: `/stocks/financials/v1/ratios` & peer statements | Massive Stocks Developer / Advanced | EDGAR 10-K / Web peer filings |
| `analyst-estimates.json` | **Finnhub**: `/stock/price-target`, `/stock/recommendation`, `/stock/upgrade-downgrade` | Finnhub Estimates Tier ($75–$200/mo) or Free (60 req/min) | Yahoo Finance API |
| `earnings-sentiment.json` | **Finnhub**: `/stock/transcripts` (list & audio text) | Finnhub Fundamentals Tier ($50–$200/mo) | Press release Q&A search |
| `filing-extracts.json` | **Finnhub**: `/stock/filings?symbol={TICKER}` | Finnhub Fundamentals Tier ($50–$200/mo) or Free | SEC EDGAR full-text search |
| `reactions.json` | **Massive**: `/v2/aggs/ticker/{TICKER}/range/1/day/*` | Massive Stocks Starter ($29/mo) / Developer | Yahoo Finance historical quotes |

#### Qualitative Review & Specialized Artifact Assembly
With all quantitative financials automatically staged, the agent audits and enriches qualitative context using the prompt templates in `/Users/krding/Projects/stress-alpha/prompts/`:

1. `facts.json` (Required):
   - Ingest headline earnings, segments, and guidance.
   - **Income Quality Guardrail:** Identify any non-operating one-time gains/losses (e.g. ASU 2016-01 equity marks) and isolate clean `epsOperating`.
   - **Forensic Governance & Accounting Audit (QPCE Anchor):** Audit for `governanceRisk` (`none` | `low` | `moderate` | `severe`), `accountingFlags` (auditor resignations, restatements, internal control weaknesses, related-party pull-forwards), and `materialLitigationOrDoj`.
   - **Valuation Archetype & Capital Runway:** Classify archetype (`compounder` | `operating_scaler` | `venture_hypergrowth`), gross margin %, and Net Liquid Runway months.
2. `scenarios.json` (Required):
   - Formulate 3-4 scenarios (Bull, Base, Panic/Bear) with forward EPS, P/E multiples, and assumptions. Probabilities must sum to 1.0 (these act as initial raw priors `rawProbability` to be deterministically calibrated by QPCE into `calibratedProbability`).
3. `moat-competitors.json` (Recommended):
   - Morningstar 5-pillar economic moat evaluation (Intangible Assets, Switching Costs, Cost Advantage, Network Effects, Efficient Scale) and moat trend (Widening, Stable, Narrowing).
   - Peer comparison matrix (Ticker, Market Cap, Revenue, YoY Growth %, Gross Margin %, Operating Margin %, Forward P/E, Market Share %, Pricing Power, Product Comparison, Advantage/Vulnerability).
4. `stress-baseline.json` (Recommended):
   - Define base revenue, gross margin %, fixed OpEx, shares outstanding, and upstream drivers (with exposure shares and elasticities).
5. `catalysts.json` (Optional):
   - Catalysts with probability anchors, horizons, and documented evidence.
6. `earnings-sentiment.json` (Optional):
   - Management tone scorecard across 5 dimensions, analyst Q&A topics, and key executive quotes.
7. `filing-extracts.json` & `filing-extracts_zh.json` (Optional):
   - 10-Q Item 1A risk disclosure diffs and novel findings in English and institutional Chinese.
8. `reactions.json` (Optional):
   - Historical post-earnings day-1 moves and conditional reaction framing.

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
cd /Users/krding/Projects/stress-alpha
npm run analyze -- reports/<TICKER>-<QUARTER>-<YEAR>-analysis
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

---

### Step 5: Display Output on the Web Application

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
- Deterministic Data Ingestion: [scripts/fetch_data.ts](/Users/krding/Projects/stress-alpha/scripts/fetch_data.ts)
- Database Query Tool: [scripts/db_query.ts](/Users/krding/Projects/stress-alpha/scripts/db_query.ts)
- Market Price Sync: [scripts/sync_prices.ts](/Users/krding/Projects/stress-alpha/scripts/sync_prices.ts)
- Browser Opener Script: [scripts/open_report.sh](/Users/krding/Projects/stress-alpha/scripts/open_report.sh)
- CLI Valuation Engine: [scripts/analyze.ts](/Users/krding/Projects/stress-alpha/scripts/analyze.ts)
- Universe Probability Backfill: [scripts/backfill_qpce.ts](/Users/krding/Projects/stress-alpha/scripts/backfill_qpce.ts)
