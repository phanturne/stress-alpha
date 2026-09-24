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

### Quantitative Probability Calibration Engine (QPCE) & Archetypes
Scenario probabilities are calibrated in multinomial logit (softmax) space rather than naively assigned:
- **Pillar 1: Lexicographic Governance Veto**: Severe governance risk (e.g. auditor resignation, DOJ probes, multiple accounting flags) overrides standard margin cushions, forcing Panic probability $\ge 45-50\%$ and capping Bull $\le 8\%$.
- **Pillar 2: Archetype-Aware Resilience & Capital Runway**:
  - `compounder` (Archetype A): Operating margin $>30\%$ rewarded; $<15\%$ penalized unless protected by durable Wide Moat (`Costco Compounder Exemption`).
  - `operating_scaler` (Archetype B): Fast growth ($\ge 25\%$), high gross margins ($\ge 60\%$) rewarded for operating leverage velocity.
  - `venture_hypergrowth` (Archetype C): Scale-up stage ($\ge 50\%$ growth, negative operating margin). Must satisfy deterministic gating ($\text{gross margin} \ge 35\%$) to grant the **Unit Economics Exemption** (waiving operating margin penalty). Audited for **Net Liquid Runway** ($\tau_{\text{net}} = (\text{cash} - \text{short-term debt}) / \text{monthly burn}$):
    - $\tau_{\text{net}} < 9$ months: Acute dilution penalty ($\Delta z_{\text{panic}} = +1.25, \Delta z_{\text{bull}} = -1.10$) reflecting emergency secondary equity dilution.
    - $9 \le \tau_{\text{net}} < 18$ months: Moderate dilution overhang ($\Delta z_{\text{panic}} = +0.50, \Delta z_{\text{bull}} = -0.35$).
    - $\tau_{\text{net}} \ge 18$ months: Abundant runway ($\Delta z_{\text{bull}} = +0.15$).
- **Pillar 3: Wall Street Consensus Skew & Dispersion**: Analyzes analyst bullish ratio and 52W target dispersion.
- **Pillar 4: Market-Implied Reality Check**: Reverse-engineers market-priced-in disaster risk with a 20% Bayesian shrinkage anchor.
- **Simplex Regularization**: Convex contraction ensuring probabilities strictly remain within $[0.05, 0.85]$ and sum precisely to $1.000$.

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

1. **Institutional Cockpit Aesthetic & Dual-Theme Engine**:
   - Dark-mode first design inspired by Bloomberg Terminal and FactSet.
   - **Cyber Obsidian (Default Dark)**: `#07090e` base, dark glassmorphism, cyan `#38bdf8` accent, neon subtle glows.
   - **Institutional Light**: High-contrast FactSet/WSJ day mode (`#f8fafc` base, `#ffffff` card surfaces, high-contrast `#0f172a` typography, `#0284c7` sky accent, crisp slate borders).
   - Driven by `ThemeProvider` ([`src/context/ThemeContext.tsx`](file:///Users/krding/Projects/stress-alpha/src/context/ThemeContext.tsx)), persisted in `localStorage` (`stress_alpha_theme`), synchronized via `data-theme` and `dark`/`light` classes on `<html>` with 0ms FOUC prevention.
   - 1-click Sun/Moon quick toggle in global header ([`src/components/Header.tsx`](file:///Users/krding/Projects/stress-alpha/src/components/Header.tsx)) and dedicated theme switcher in Settings dropdown.
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
   - Enforce ticker-first hierarchy, full-width radar layout, verified SEC disclosures, and data availability gating (`isSectionAvailableForReport`) preventing cut-off sections.
   - Official watermark domain: `https://stressalpha.vercel.app/`.

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
4. **Documentation & Architecture Audit**:
   - Inspect whether [`README.md`](file:///Users/krding/Projects/stress-alpha/README.md), architecture guidelines ([`AGENTS.md`](file:///Users/krding/Projects/stress-alpha/AGENTS.md)), methodology docs (`src/app/methodology/`), or skill guides (`.agents/skills/`) need to be updated to reflect the new feature, schema adjustment, or fix.

---

## 8. Continuous Documentation & Architecture Synchronization

Whenever you implement a new feature, modify calculation engines, adjust data schemas, or resolve a bug:

1. **Mandatory Documentation Review**:
   - **[`README.md`](file:///Users/krding/Projects/stress-alpha/README.md)**: Keep feature lists, cockpit capabilities, CLI scripts, and API endpoint documentation synchronized with active code.
   - **[`AGENTS.md`](file:///Users/krding/Projects/stress-alpha/AGENTS.md)**: Update engineering conventions, math modeling invariants (e.g. QPCE logit-space calibration), and CI requirements immediately whenever system behavior changes.
   - **Architecture & Methodology Docs**: If valuation algorithms, risk factors, or accounting guardrails are added or modified, update the interactive methodology guide ([`src/app/methodology/`](file:///Users/krding/Projects/stress-alpha/src/app/methodology/)) and skill references ([`.agents/skills/`](file:///Users/krding/Projects/stress-alpha/.agents/skills/)).
2. **Zero Documentation Drift**:
   - Never leave documentation behind code changes. Outdated documentation is treated with the same rigor as a failing unit test or broken TypeScript build.
