# StressAlpha Pipeline Stages & Prompt Reference

StressAlpha strictly decouples qualitative intelligence extraction from mathematical computation:

## Stage 0b: 10-Q Filing Audit (`prompts/stage0b-filing.md`)
* Extracts newly added or escalated risk disclosures in Item 1A.
* Identifies accounting changes, revenue recognition nuances, or novel commitments.
* Output: `filing-extracts.json`

## Stage 0c: Earnings Call Tone & Sentiment (`prompts/stage0c-sentiment.md`)
* Audits management voice across 5 dimensions (Specificity, Forward Confidence, CapEx Justification, Competitive Positioning, Risk Acknowledgment).
* Aggregates analyst concern frequencies and captures high-conviction quotes.
* Output: `earnings-sentiment.json`

## Stage 1: Ingest & Income Quality Audit (`prompts/stage1-ingest.md`)
* Ingests headline revenues, operating margins, segment data, and forward guidance.
* **Core Rule (Income Quality Guardrail):** Identifies non-operating or transitory items (e.g. unrealized mark-to-market equity gains/losses under ASU 2016-01) and calculates true **Operating EPS**.
* Output: `facts.json`

## Stage 1b: Economic Moat & Competitor Benchmarking (`prompts/stage1b-moat.md`)
* **Framework:** Morningstar 5-Pillar Economic Moat Assessment (Intangible Assets, Switching Costs, Cost Advantage, Network Effects, Efficient Scale) and Moat Trend (Widening, Stable, Narrowing).
* **Modern Sector-Velocity Calibration (Timeline Adjustment):**
  - Replaces rigid 20y/10y blanket perpetuity assumptions with velocity-adjusted durability horizons.
  - *High-Velocity Hardware / AI & Optics:* 4–8 years (2–4 year architecture and tape-out cycles).
  - *Enterprise Cloud & Data Workloads:* 10–15 years (IAM security, database gravitation).
  - *Regulated Biopharma & Therapeutics:* 10–15 years (composition-of-matter patent protection bounded by IRA price negotiation).
  - *Physical Distribution & Scaled Hubs:* 15–20+ years (densified robotics and logistics grids).
* **Multi-Metric Peer Matrix:** Benchmark 3–5 direct peers across Market Cap, Revenue, YoY Growth %, Gross Margin %, Operating Margin %, Forward P/E, Market Share %, Pricing Power (`Superior` | `Parity` | `Inferior`), Product Comparison, and Advantage/Vulnerability.
* Output: `moat-competitors.json` and `moat-competitors_zh.json`

## Stage 2: Catalysts & Probability Anchors (`prompts/stage2-catalysts.md`)
* Defines distinct directional growth and risk drivers with quantified probability anchors and time horizons.
* Output: `catalysts.json`

## Stage 3: Scenarios & Stress Baseline (`prompts/stage3-scenarios.md`)
* Constructs discrete Bull, Base, and Panic scenarios with EPS and multiple assumptions.
* Formulates `stress-baseline.json` specifying upstream demand drivers (with exposure shares and elasticities), fixed cost leverage, and valuation multiple regimes.
* Output: `scenarios.json` and `stress-baseline.json`

## Stage 4: Historical Reaction Framing (`prompts/stage4-reactions.md`)
* Gathers historical 1-day post-earnings price reactions and synthesizes the conditional market reaction rule.
* Output: `reactions.json`

## Stage 5: Deterministic Computation & Display
* Runs `npx tsx scripts/analyze.ts reports/<folder>` to compute `valuation.json` and `report.md`.
* Automatically loads in the Next.js web application at `http://localhost:3000/?report=<folder>`.
