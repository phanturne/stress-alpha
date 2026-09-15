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
