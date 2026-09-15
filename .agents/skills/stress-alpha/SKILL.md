---
name: stress-alpha
description: >-
  Run the StressAlpha equity earnings analysis pipeline, execute multi-stage audit extractions (facts, catalysts, scenarios, stress baselines), compute deterministic valuations, and display the interactive cockpit and memorandum on the StressAlpha Next.js web application.
---

# StressAlpha: Earnings Analysis & Scenario Stress Skill

This skill teaches the agent how to run the end-to-end StressAlpha earnings analysis pipeline for any public equity, audit earnings quality, compute deterministic valuation bands, and display the live simulation dashboard in the modern Next.js web application.

## Architectural Philosophy
> **LLMs extract and audit qualitative context; pure deterministic TypeScript handles 100% of the arithmetic.**
> The LLM must never invent or guess weighted fair values, upside percentages, or multiple deltas.

---

## Complete Workflow Steps

### Step 1: Create the Report Folder
All reports are organized under `/Users/krding/Projects/stress-alpha/reports/`:
```bash
mkdir -p /Users/krding/Projects/stress-alpha/reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```
Example: `/Users/krding/Projects/stress-alpha/reports/NVDA-Q2-2027-analysis`

### Step 2: Extract & Ingest Artifacts
Generate the following structured JSON artifacts inside the report folder using the prompt templates in `/Users/krding/Projects/stress-alpha/prompts/`:

1. `facts.json` (Required):
   - Ingest headline earnings, segments, and guidance.
   - **Income Quality Guardrail:** Identify any non-operating one-time gains/losses (e.g. ASU 2016-01 equity marks) and isolate clean `epsOperating`.
2. `scenarios.json` (Required):
   - Formulate 3-4 scenarios (Bull, Base, Bear) with forward EPS, P/E multiples, and assumptions. Probabilities must sum to 1.0.
3. `stress-baseline.json` (Recommended):
   - Define base revenue, gross margin %, fixed OpEx, shares outstanding, and upstream drivers (with exposure shares and elasticities).
4. `catalysts.json` (Optional):
   - Catalysts with probability anchors, horizons, and documented evidence.
5. `earnings-sentiment.json` (Optional):
   - Management tone scorecard across 5 dimensions, analyst Q&A topics, and key executive quotes.
6. `filing-extracts.json` (Optional):
   - 10-Q Item 1A risk disclosure diffs and novel findings.
7. `reactions.json` (Optional):
   - Historical post-earnings day-1 moves and conditional reaction framing.

### Step 3: Run the Deterministic Valuation Engine
Execute the deterministic valuation engine:
```bash
cd /Users/krding/Projects/stress-alpha
npx tsx scripts/analyze.ts reports/<TICKER>-<QUARTER>-<YEAR>-analysis
```
This automatically validates all schemas and generates:
- `valuation.json`: Exact mathematical fair values, valuation bands (Bull, Base, Panic), and risk asymmetry metrics.
- `report.md`: Complete human-readable English markdown report.
- `report_zh.md`: Complete human-readable Chinese markdown report with institutional financial terminology (概率加权公允价值, 收益质量防线, 压力预测EPS, 估值区间).

### Step 4: Display Output on the Web Application
Launch the report directly in the browser:
```bash
/Users/krding/Projects/stress-alpha/scripts/open_report.sh <TICKER>-<QUARTER>-<YEAR>-analysis
```
Or run the all-in-one helper script:
```bash
/Users/krding/Projects/stress-alpha/scripts/run_flow.sh <TICKER>-<QUARTER>-<YEAR>-analysis
```

The web application:
- Automatically detects and lists all folders under `reports/` in the top report selector.
- Provides sub-millisecond client-side sensitivity sliders (<1ms) for testing upstream shocks.
- Allows viewing both English (`report.md`) and Chinese (`report_zh.md`) reports under the **Full Report** tab.
- Supports switching between the interactive **Cockpit View** and the publication-ready **Committee Memo View** (with 1-click English and Chinese memo options).

---

## Useful References & Scripts
- [Pipeline Stages Reference](./references/pipeline-stages.md)
- Flow Runner Script: [scripts/run_flow.sh](/Users/krding/Projects/stress-alpha/scripts/run_flow.sh)
- Browser Opener Script: [scripts/open_report.sh](/Users/krding/Projects/stress-alpha/scripts/open_report.sh)
- CLI Valuation Engine: [scripts/analyze.ts](/Users/krding/Projects/stress-alpha/scripts/analyze.ts)
