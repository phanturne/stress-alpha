# StressAlpha Pipeline Stages & Prompt Reference

StressAlpha strictly decouples qualitative intelligence extraction from mathematical computation. All quantitative peer metrics (`marketCapBillions`, `revenueBillions`, `revenueGrowthPct`, `grossMarginPct`, `operatingMarginPct`, `forwardPe`, `marketSharePct`), analyst targets, scenario EPS/multiples/probabilities, and historical reaction `priceMovePct` are deterministically fetched and hydrated by TypeScript (`npm run fetch:data`, `fetchPeerBenchmarks`, `analyze.ts`) — the LLM must **NEVER** guess or invent those numbers:

## Stage 0b: 10-Q Filing Audit (`prompts/stage0b-filing.md`)
* Extracts newly added or escalated risk disclosures in Item 1A.
* Identifies accounting changes, revenue recognition nuances, or novel commitments.
* **Institutional Feeds**:
  - **Finnhub SEC Filings API** (`/stock/filings?symbol={TICKER}` - Fundamentals Tier, [Finnhub Pricing](https://finnhub.io/pricing)): Direct structured access to recent 10-Q/10-K filings.
  - SEC EDGAR RSS feed / search fallback.
* Output: `filing-extracts.json`

## Stage 0c: Earnings Call Tone & Sentiment (`prompts/stage0c-sentiment.md`)
* Audits management voice across 5 dimensions (Specificity, Forward Confidence, CapEx Justification, Competitive Positioning, Risk Acknowledgment).
* Aggregates analyst concern frequencies and captures high-conviction quotes.
* **Institutional Feeds**:
  - **Finnhub Earnings Call Transcripts API** (`/stock/transcripts?id=...` - Fundamentals Tier, [Finnhub Pricing](https://finnhub.io/pricing)): Full participant lists, prepared remarks, and analyst Q&A transcript audio/text.
* Output: `earnings-sentiment.json`

## Stage 1: Ingest & Income Quality Audit (`prompts/stage1-ingest.md`)
* Ingests headline revenues, operating margins, segment data, forward guidance, and user/customer metrics (DAU, MAU, traffic & referral sources).
* **Core Rule (Income Quality Guardrail):** Identifies non-operating or transitory items (e.g. unrealized mark-to-market equity gains/losses under ASU 2016-01) and calculates true **Operating EPS**.
* **Forward Consensus Sanity Guardrail:** Compares `forwardEpsConsensus` against annualized operating run-rate (`epsOperating * 4`). Flags stale/unadjusted feeds where forward EPS growth severely diverges from decelerating revenue growth.
* **Forensic Governance Audit (QPCE Anchor):** Audits for `governanceRisk` (`none` | `low` | `moderate` | `severe`), `accountingFlags` (auditor resignations, internal control weaknesses, related-party pull-forwards), and `materialLitigationOrDoj`.
* **Institutional Feeds**:
  - **Massive Company Financials API** (`/stocks/financials/v1/*` - Stocks Advanced / Financials expansion, [Massive Pricing](https://massive.com/pricing)): Standardized point-in-time SEC income statements, balance sheets, cash flows, and ratios (`/income-statements`, `/balance-sheets`, `/cash-flow-statements`, `/ratios`).
  - Fallback: `fetch_fundamental_profile.py` (yfinance / EDGAR).
* Output: `facts.json`

## Stage 1b: Economic Moat & Competitor Benchmarking (`prompts/stage1b-moat.md`)
* **Framework:** Morningstar 5-Pillar Economic Moat Assessment (Intangible Assets, Switching Costs, Cost Advantage, Network Effects, Efficient Scale) and Moat Trend (Widening, Stable, Narrowing).
* **Distribution Channel Vulnerability:** Checks whether platform network effects or discovery depend heavily on third-party gateways (e.g. search engine referrals, app store gatekeepers, prime contractors). If referral channels or external distribution are deteriorating without offsetting direct channel growth or pricing power, critically audit whether `moatTrend` is `Narrowing` or `Stable`.
* **Modern Sector-Velocity Calibration (Timeline Adjustment):**
  - Replaces rigid 20y/10y blanket perpetuity assumptions with velocity-adjusted durability horizons.
  - *High-Velocity Hardware / AI & Optics:* 4–8 years (2–4 year architecture and tape-out cycles).
  - *Enterprise Cloud & Data Workloads:* 10–15 years (IAM security, database gravitation).
  - *Regulated Biopharma & Therapeutics:* 10–15 years (composition-of-matter patent protection bounded by IRA price negotiation).
  - *Physical Distribution & Scaled Hubs:* 15–20+ years (densified robotics and logistics grids).
* **Multi-Metric Peer Matrix (Deterministic Hydration):** Benchmark 3–5 direct peers. Quantitative peer metrics (`marketCapBillions`, `revenueBillions`, `revenueGrowthPct`, `grossMarginPct`, `operatingMarginPct`, `forwardPe`, `marketSharePct`) are deterministically fetched and hydrated by TypeScript (`npm run fetch:data`, `fetchPeerBenchmarks`, `analyze.ts`). The LLM only selects peer `ticker` symbols and writes qualitative fields (`name`, `pricingPower`, `productComparison`, `keyAdvantageOrVulnerability`) — never guess or fabricate peer numbers.
* **Institutional Feeds**:
  - **Yahoo Finance & SEC EDGAR (`fetchPeerBenchmarks`)**: Automated multi-peer margin, growth, multiple, and market share hydration.
* Output: `moat-competitors.json` and `moat-competitors_zh.json`

## Stage 1c: Wall Street Analyst Consensus & Price Targets (`prompts/stage1c-estimates.md`)
* **Perplexity Finance Style (Deterministic Telemetry):** Sell-side Wall Street analyst consensus counts, 52W price target distributions (`low`, `average`, `median`, `high`), and broker action targets (`priceTarget`, `priorPriceTarget`, `upsidePct`) are deterministically fetched via `npm run fetch:data` (`yahoo-finance2`). The LLM must never invent or guess analyst price targets or consensus counts, and only enriches qualitative `synthesisNarrative` and broker `notes`.
* **Institutional Feeds**:
  - **Deterministic Pipeline (`npm run fetch:data`)**: Automatically fetches Yahoo Finance `financialData`, `recommendationTrend`, and `upgradeDowngradeHistory`.
* **Consensus Distribution:** Consensus Rating (`Strong Buy`, `Buy`, `Hold`, `Sell`), total covering analysts, bullish/neutral/bearish counts & percentages.
* **52-Week Target Slider:** Reference trading price, Street low, Street consensus average/mean, median, and Street high targets.
* **Individual Bank Notes Table:** Lists covering investment banks/brokerages with named analyst, rating, 52W target price (with prior target diffs), upside %, note date, revision action (`Raised`, `Lowered`, `Reiterated`), and focus notes.
* **Consensus Synthesis:** 1–2 paragraph institutional brief on post-earnings revision waves, multiple expansion expectations, and bull vs. bear target dispersion.
* Output: `analyst-estimates.json` and `analyst-estimates_zh.json`

## Stage 2: Catalysts & Probability Anchors (`prompts/stage2-catalysts.md`)
* Defines distinct directional growth and risk drivers with quantified probability anchors and time horizons.
* Output: `catalysts.json`

## Stage 3: Scenarios & Stress Baseline (`prompts/stage3-scenarios.md`)
* Scenario `forwardEps`, `multiple`, and `probability` (`calibratedProbability`) are deterministically scaffolded by `npm run fetch:data` and calibrated by `analyze.ts`. The LLM must never guess or invent scenario EPS, multiples, or probabilities, and only refines qualitative `assumptions` and `keyDrivers`.
* **Operational Consensus Realism:** Anchors Base forward EPS to realistic operational earnings power, re-normalizing against annualized run-rate (`epsOperating * 4 * (1 + growth)`) if consensus feeds are stale or unadjusted. Panic scenario MUST explicitly model distribution loss, referral decay, or customer churn.
* Formulates `stress-baseline.json` specifying upstream demand drivers (with exposure shares and elasticities), fixed cost leverage, and valuation multiple regimes.
* Output: `scenarios.json` and `stress-baseline.json`

## Stage 4: Historical Reaction Framing (`prompts/stage4-reactions.md`)
* Historical 1-day post-earnings `priceMovePct` values and event dates are deterministically extracted from daily OHLCV bars by `npm run fetch:data`. The LLM must never guess or fabricate `priceMovePct`, and only synthesizes qualitative `event` triggers, `context`, and `conditionalFraming`.
* **Institutional Feeds**:
  - **Yahoo Finance 1Y Daily OHLCV & Earnings History (`npm run fetch:data`)**: Exact post-earnings day-1 percentage price moves.
* Output: `reactions.json`

## Stage 5: Deterministic Computation & Display
* Runs `npx tsx scripts/analyze.ts reports/<folder>`.
* Executes the **Quantitative Probability Calibration Engine (QPCE)** across 4 pillars:
  1. Forensic & Governance Veto (Lexicographic override for severe accounting/DOJ flags)
  2. Moat & Margin Resilience (Gross margin buffer vs deleverage risk, plus Costco Compounder Exemption)
  3. Wall Street Consensus Skew & Dispersion
  4. Market-Implied Bayesian Shrinkage Anchor ($w_{\text{mkt}} = 0.20$)
* Computes exact mathematical fair values, valuation bands (Bull, Base, Panic), risk asymmetry metrics, and renders bilingual markdown reports.
* Persists directly into **Neon PostgreSQL** (`tickers` and `reports` tables).
* Automatically loads in the Next.js web application at `http://localhost:3000/?report=<folder>`.
