# AGENTS.md: Engineering & Architecture Guidelines

This document defines the architectural conventions, data modeling rules, internationalization standards, and engineering practices for agents and developers working in the **StressAlpha** codebase.

---

## 1. Core Philosophy & Cardinal Rule

> **LLMs extract and audit qualitative context; pure deterministic TypeScript handles 100% of the arithmetic.**

1. **Zero LLM Math Hallucinations**:
   - The LLM must **never** calculate, invent, or guess weighted fair values (WFV), target prices, upside percentages, P/E multiple spreads, or snowflake scores in prompts or raw markdown text.
   - All financial mathematics, operating leverage flows, and risk/reward asymmetries are strictly calculated by deterministic TypeScript engines (`src/lib/valuation.ts`, `src/lib/snowflake.ts`).
2. **Audited SEC Data Extraction**:
   - Extract facts directly from SEC 10-K / 10-Q filings, press releases, and earnings call transcripts.
   - Enforce the **Income Quality Guardrail**: Identify non-operating, mark-to-market, or one-off items (e.g., ASU 2016-01 equity adjustments) and isolate normalized `epsOperating` to prevent valuation base inflation.

---

## 2. Internationalization (i18n) Architecture

### Strict Prohibition on Inline Boolean Language Checks
- **NEVER** write inline language ternaries in React components or view templates:
  ```tsx
  // ❌ BAD: Hardcoded inline language boolean check
  <span>{isZh ? "雪花图" : "Snowflake"}</span>
  title={isZh ? "30项全景雪花图审计 (W)" : "30-Point Snowflake Audit (W)"}
  ```
- **ALWAYS** retrieve strings and labels from the centralized dictionary in [`src/lib/i18n.ts`](file:///Users/krding/Projects/stress-alpha/src/lib/i18n.ts):
  ```tsx
  // ✅ GOOD: Centralized i18n translation
  const t = getTranslations(locale).cockpit;
  <span>{t.snowflakeButton}</span>
  title={t.snowflakeTooltip}
  ```

### Pre-Localized Calculation Engines
When deterministic engines generate human-readable labels, summaries, or audit criteria (e.g. [`computeSnowflakeScore`](file:///Users/krding/Projects/stress-alpha/src/lib/snowflake.ts)):
- The function signature must accept `locale: Locale = "en"`.
- It must resolve pre-localized fields on the returned data structure (`pillar.label`, `pillar.shortLabel`, `pillar.summary`, `criterion.name`, `criterion.description`, `ratingLabel`).
- This allows views and export cards to render `pillar.label` directly without inspecting `locale`.

### Bilingual Data Artifacts
Reports follow a dual-artifact pattern:
- **English**: `facts.json`, `scenarios.json`, `catalysts.json`, `moat-competitors.json`, `analyst-estimates.json`, `report.md`.
- **Chinese**: `facts_zh.json`, `scenarios_zh.json`, `catalysts_zh.json`, `moat-competitors_zh.json`, `analyst-estimates_zh.json`, `report_zh.md`.
- Both are loaded into typed schemas via Zod (`src/lib/schemas.ts`).

---

## 3. Data Access Layer: Repository Pattern

All data access is mediated through the **Repository Pattern** defined in [`src/lib/repository/index.ts`](file:///Users/krding/Projects/stress-alpha/src/lib/repository/index.ts):

```
┌────────────────────────────────────────────────────────┐
│                   IReportRepository                    │
└────────────────────────────────────────────────────────┘
                            ▲
                            │
                 ┌───────────────────────┐
                 │ DrizzleReportRepository│
                 │ (Neon PostgreSQL DB)  │
                 └───────────────────────┘
```

1. **`IReportRepository` Contract**:
   - `listReports(): Promise<ReportSummary[]>`
   - `getReport(folderSlug: string): Promise<ReportData | null>`
   - `saveReport(report: ReportData): Promise<void>`
   - `deleteReport(folderSlug: string): Promise<void>`
   - `syncPrice(ticker: string, price: number): Promise<void>`
2. **Factory Selection**:
   - Always use `getReportRepository()` which instantiates `DrizzleReportRepository` connected directly to Neon PostgreSQL.
   - **Never bypass repository interfaces** in API routes or extraction scripts.

---

## 4. Deterministic Valuation & Stress Flow-Through

### 4-Regime Valuation Spectrum
StressAlpha calculates four deterministic valuation regimes:
1. **Bull Regime**: Multiple expansion driven by growth catalyst execution and top-line velocity.
2. **Base Regime**: Guidance mid-point execution with normalized multiple stability.
3. **Bear Regime**: Macro headwinds and modest deceleration.
4. **Panic Floor**: Extreme multiple de-rating + severe demand contraction (liquidity safety floor).

### Mathematical Sensitivity Modeling
- **Upstream Volume Shocks**:
  $$\Delta \text{Revenue} = \text{Base Revenue} \times \sum_{i} (\text{Shock}_i \times \text{Exposure}_i \times \text{Elasticity}_i)$$
- **Operating Leverage Rigidity**: Fixed operating expenditures (`fixedOpexBillions`) do not contract proportionally with revenue, modeling operational deleverage during downturns.
- **Asymmetry Skew Ratio**:
  $$\text{Asymmetry} = \frac{\text{Upside to Bull } \%}{|\text{Downside to Panic } \%|}$$

---

## 5. 5-Pillar Snowflake Radar Scoring

The **Snowflake Fundamental Radar** ([`src/lib/snowflake.ts`](file:///Users/krding/Projects/stress-alpha/src/lib/snowflake.ts)) provides a circular 30-point institutional audit:

| Pillar | Axis ID | Focus | Color Token |
| :--- | :--- | :--- | :--- |
| **Valuation & Margin of Safety** | `valuation` | Upside to WFV, discount to consensus, disciplined multiple | Emerald (`#10b981`) |
| **Future Growth & Catalysts** | `future` | Segment revenue velocity, operating income growth, catalyst pipeline | Cyan (`#06b6d4`) |
| **Earnings Quality & Margins** | `earnings` | Clean operating conversion, GAAP adjustments, operating margin | Indigo (`#6366f1`) |
| **Economic Moat & Benchmarking** | `moat` | Pricing power, peer margin outperformance, durable switching costs | Amber (`#f59e0b`) |
| **Downside Floor & Resilience** | `resilience` | Panic multiple buffer, upstream solvency, asymmetry ratio | Rose (`#ec4899`) |

### Scoring Tiers
- **Exceptional Alpha Conviction**: Total Score $\ge 24 / 30$
- **High-Quality Investment Grade**: Total Score $18 - 23 / 30$
- **Selective Opportunity**: Total Score $12 - 17 / 30$
- **Elevated Fundamental Risk**: Total Score $< 12 / 30$

---

## 6. UI / UX Design Standards

1. **Institutional Cockpit Aesthetic**:
   - Dark-mode first design inspired by Bloomberg Terminal and FactSet.
   - Dense information hierarchy, glassmorphism panels (`glass-panel`), and micro-interactions.
   - Use `font-mono` and `tabular-nums` for all financial figures, multiples, and dates.
2. **Single Global Share Action**:
   - Keep a single unified **Share & Export** trigger in the global top header (`src/components/Header.tsx`).
   - Do **not** clutter individual dashboard cards with redundant duplicate share buttons.
3. **Pure Native Visualizations**:
   - Render charts using pure SVG and CSS (`SnowflakeRadar.tsx`, `PriceMeter.tsx`) without heavyweight canvas or WebGL dependencies.
4. **Social Media Card Generation**:
   - Maintain institutional export cards via `html-to-image` ([`src/lib/social-card.ts`](file:///Users/krding/Projects/stress-alpha/src/lib/social-card.ts)).
   - Support 5 card templates (`valuation`, `earnings`, `thesis`, `summary`, `snowflake`) across 3 standard social aspect ratios (16:9, 1:1, 4:5).

---

## 7. Verification & CI Standards

Every contribution must satisfy the following checks before committing:

1. **TypeScript Static Typing**:
   ```bash
   npx tsc --noEmit
   ```
   Must exit with **0 errors**.
2. **Vitest Unit Test Suite**:
   ```bash
   npm test
   ```
   All tests across schemas, valuation, repository, screener, url-state, snowflake, and social card must pass.
3. **Next.js Production Build**:
   ```bash
   npm run build
   ```
   Turbopack compilation and static generation must succeed cleanly.
