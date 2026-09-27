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

#### Institutional Data Feeds & Pricing Tiers
StressAlpha sources quantitative filings, market telemetry, sell-side consensus, and qualitative transcripts from two primary institutional financial data providers:

1. **[Massive.com Financial Data](https://massive.com/pricing)** (formerly Polygon.io):
   - **Company Financials & Ratios** (`/stocks/financials/v1/*`): Point-in-time standardized SEC 10-K/10-Q income statements, balance sheets, cash flow statements, and financial ratios for `facts.json` and peer matrices in `moat-competitors.json`.
   - **Historical Market Aggregates** (`/v2/aggs/ticker/{TICKER}/range/1/day/*`): Point-in-time EOD prices and historical day-1 post-earnings price reactions for `reactions.json`.
   - **Pricing Context**: Sourced under Stocks Developer/Advanced tiers or the Financials & Ratios expansion (`https://massive.com/pricing`). Partner datasets (Benzinga $99/mo) can supply live rating revisions.

2. **[Finnhub.io Financial API](https://finnhub.io/pricing)**:
   - **Earnings Call Transcripts API** (`/stock/transcripts`): Full audio call transcripts and analyst Q&A sessions for management tone audits and quotes in `earnings-sentiment.json` (Stage 0c). Sourced under Fundamentals tier ($50–$200/mo).
   - **SEC Filings API** (`/stock/filings`): Real-time 10-Q / 10-K search and Item 1A risk disclosure diffs for `filing-extracts.json` (Stage 0b).
   - **Analyst Price Targets & Recommendations** (`/stock/price-target`, `/stock/recommendation`, `/stock/upgrade-downgrade`): Street consensus ratings, 52W target distributions (Low/Mean/Median/High), and sell-side brokerage revisions for `analyst-estimates.json` (Stage 1c). Sourced under Estimates tier ($75–$200/mo) or Free tier (60 req/min).

3. **Zero-Config Local Fallback**:
   When API keys (`MASSIVE_API_KEY`, `FINNHUB_API_KEY`) are not provided, run the local Python extractors powered by Yahoo Finance / EDGAR:
   ```bash
   python3 /Users/krding/Projects/stress-alpha/scripts/fetch_fundamental_profile.py <TICKER> /Users/krding/Projects/stress-alpha/reports/<TICKER>-<QUARTER>-<YEAR>-analysis
   ```

Follow the institutional prompt templates in `/Users/krding/Projects/stress-alpha/prompts/` to assemble:
- `facts.json`: Headline financials, segment unit economics, management forward guidance, income quality clean operating EPS, **forensic governance audit** (`governanceRisk`: 'none'|'low'|'moderate'|'severe', `accountingFlags`, `materialLitigationOrDoj`), and **valuation archetype & capital runway** (`valuationArchetype`: 'compounder'|'operating_scaler'|'venture_hypergrowth', `grossMarginPct`, `cashAndEquivalentsBillions`, `quarterlyCashBurnBillions`, `cashRunwayMonths`). *(Sourced via Massive Financials API `/stocks/financials/v1/*` or profile extractor)*.
- `moat-competitors.json`: Morningstar 5-pillar moat evaluation, sector-velocity calibrated durability, and direct competitor benchmarking. *(Peer metrics enriched via Massive Financials & Ratios)*.
- `analyst-estimates.json` / `analyst-estimates_zh.json`: Wall Street analyst consensus breakdown, 52W price target range (low/mean/high), sell-side estimates roster with prior targets, and synthesis narrative. Run automated tool or query Finnhub Estimates:
  ```bash
  python3 /Users/krding/Projects/stress-alpha/scripts/fetch_analyst_estimates.py <TICKER> /Users/krding/Projects/stress-alpha/reports/<TICKER>-<QUARTER>-<YEAR>-analysis --price <CURRENT_PRICE>
  ```
- `scenarios.json`: Discrete Bull, Base, Panic regimes with forward EPS, multiples, and initial raw prior probabilities (`rawProbability`).
- `stress-baseline.json`: Baseline revenue, operating cost leverage, and upstream driver elasticities.
- `earnings-sentiment.json`: Management tone scorecard across 5 dimensions, analyst Q&A topics, and key executive quotes. *(Sourced via Finnhub Transcripts API `/stock/transcripts`)*.
- `filing-extracts.json` / `filing-extracts_zh.json`: 10-Q Item 1A risk disclosure diffs and novel commitments. *(Sourced via Finnhub Filings API or SEC EDGAR)*.
- `reactions.json`: Historical post-earnings day-1 moves and conditional reaction framing. *(Sourced via Massive Aggregates API)*.
- `catalysts.json`: Growth and downside drivers with probability anchors and evidence.

### Step 3: Run the Deterministic Engine & Save to Neon Database
```bash
npx tsx /Users/krding/Projects/stress-alpha/scripts/analyze.ts /Users/krding/Projects/stress-alpha/reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```
This runs the **Quantitative Probability Calibration Engine (QPCE)** across 4 pillars (Lexicographic Governance Veto, Archetype-Aware Resilience & Cash Runway Dilution Guardrails, Sell-Side Skew, Market Shrinkage Anchor), validates all schemas, renders bilingual reports, and persists the record directly into **Neon PostgreSQL** (`tickers` and `reports` tables).

### Step 4: Open in the Web Cockpit
```bash
/Users/krding/Projects/stress-alpha/scripts/open_report.sh <TICKER>-<QUARTER>-<YEAR>-analysis
```
The web application queries Neon PostgreSQL directly via `DrizzleReportRepository` with nightly live price updates.
