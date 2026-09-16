---
name: earnings
description: >-
  Execute the end-to-end equity earnings analysis pipeline, audit quarterly financial results and 10-Q filings, evaluate economic moats and competitors, construct scenario stress valuation trees, and launch the interactive StressAlpha analysis cockpit.
---

# Earnings Analysis & Stress Valuation Skill

This is the global shortcut for the **StressAlpha** earnings analysis skill.

Full workflow instructions:
[StressAlpha Skill Guide](/Users/krding/Projects/stress-alpha/.agents/skills/stress-alpha/SKILL.md)

## Complete Workflow Steps

### Step 1: Create the Report Directory
```bash
mkdir -p /Users/krding/Projects/stress-alpha/reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```

### Step 2: Extract & Ingest Artifacts
Follow the institutional prompt templates in `/Users/krding/Projects/stress-alpha/prompts/` to generate:
- `facts.json`: Headline financials, segment unit economics, management forward guidance, and income quality clean operating EPS.
- `moat-competitors.json`: Morningstar 5-pillar moat evaluation, sector-velocity calibrated durability, and direct competitor benchmarking.
- `scenarios.json`: Discrete Bull, Base, Panic regimes with forward EPS and multiples.
- `stress-baseline.json`: Baseline revenue, operating cost leverage, and upstream driver elasticities.
- `catalysts.json` / `earnings-sentiment.json` / `filing-extracts.json` / `reactions.json`: Qualitative audit logs.

### Step 3: Run the Deterministic Engine
```bash
npx tsx /Users/krding/Projects/stress-alpha/scripts/analyze.ts /Users/krding/Projects/stress-alpha/reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```

### Step 4: Open in the Web Cockpit
```bash
/Users/krding/Projects/stress-alpha/scripts/open_report.sh <TICKER>-<QUARTER>-<YEAR>-analysis
```
