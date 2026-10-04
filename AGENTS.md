# AGENTS.md: Engineering & Architecture Guidelines

This document defines the architectural conventions, data modeling rules, internationalization standards, and engineering practices for agents and developers working in the **StressAlpha** codebase.

---

## 1. Core Philosophy & Cardinal Rule

> **LLMs extract and audit qualitative context; pure deterministic TypeScript handles 100% of the arithmetic.**

1. **Zero LLM Math Hallucinations**:
   - The LLM must **never** calculate, invent, or guess weighted fair values (WFV), target prices, upside percentages, P/E multiple spreads, or snowflake scores in prompts or raw markdown text.
   - All financial mathematics, operating leverage flows, and risk/reward asymmetries are strictly calculated by deterministic TypeScript engines (`src/lib/valuation.ts`, `src/lib/snowflake.ts`).
2. **Audited SEC Data Extraction & Financial Feeds**:
   - Extract facts directly from SEC 10-K / 10-Q filings, press releases, and earnings call transcripts via **Massive.com** ([pricing](https://massive.com/pricing)) for point-in-time statements & ratios, and **Finnhub.io** ([pricing](https://finnhub.io/pricing)) for audio transcripts, SEC filings, and sell-side estimates.
   - Enforce the **Income Quality Guardrail**: Identify non-operating, mark-to-market, or one-off items (e.g., ASU 2016-01 equity adjustments) and isolate normalized `epsOperating` to prevent valuation base inflation.
   - Decoupled Deterministic Data Ingestion & 8-Module Scaffolding (`src/lib/services/financial-data.ts`, `POST /api/pipeline/data`, `npm run fetch:data`):
     - Zero LLM tool-calling overhead or hallucinations for quantitative financial statements, market caps, consensus price targets, broker upgrade/downgrade history, or SEC filing links.
     - Automatically scaffolds complete, schema-valid starter drafts for all 8 quarterly modules (both English & Chinese) with non-destructive preservation of manual analyst edits.
     - Accessible via REST API (`POST /api/pipeline/data`) and CLI (`npm run fetch:data -- <TICKER> [--stage | STAGING_DIR]`), reusable across automated cron schedules, UI trigger buttons, and AI skills.

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
3. **Isolated Integration Testing via Neon Ephemeral Branching**:
   - Automated via `tests/setup/neon-branch-global.ts` and `tests/helpers/neon-branch.ts`.
   - When `NEON_API_KEY` and `NEON_PROJECT_ID` are configured, Vitest spins up an isolated copy-on-write database branch (`test-vitest-<timestamp>`) from `production` in ~1.0s.
   - Tests run against this pristine replica with 100% cloud parity, executing read and write operations without corrupting production data.
   - The ephemeral branch is automatically deleted upon test completion, with background reaping of stale branches (>30m) to prevent quota exhaustion.
   - Tests assert **schema and contract invariants** (`toBeGreaterThan(0)`, `typeof x === 'number'`) rather than brittle magic numbers that drift when market prices or analyst targets update.

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

### Event-Driven Fundamental Transmission & News Pipeline
To factor in real-time news, product announcements, and cross-company supply chain updates without LLM price hallucinations:
1. **Materiality & Junk Gating (`src/lib/news-filter.ts`)**:
   - Deterministic regex & publisher blacklisting filters out ~95% of syndication clickbait before any LLM is invoked.
   - Mandatory pass gates for Form 8-K filings, verified brokerage rating revisions, and statistical return anomalies ($|R| \ge 2.5\sigma$ or $\ge \pm 3.0\%$).
2. **Deterministic Transmission Engine (`src/lib/news-transmission.ts`)**:
   - Qualitative news is strictly mapped into typed transmission vectors (`driver_shock`, `catalyst_prob`, `qpce_skew`, `segment_growth`).
   - Pure TypeScript calculates implied $\Delta \text{Revenue}$, $\Delta \text{EPS}$, and implied WFV impact directly via [`computeStressedValuation()`](file:///Users/krding/Projects/stress-alpha/src/lib/valuation.ts#L41) with zero LLM math.
3. **Cross-Company Dependency Graph**:
   - Captures supplier/customer ripples (e.g. TSMC CapEx $\to$ NVIDIA revenue) via `upstreamDependenciesTable`.

### Deterministic Sanity & Variant Perception Audit Engine (`src/lib/sanity.ts`)
To safeguard database integrity and quantify buy-side variant perception against Wall Street sell-side consensus:
1. **Defensive Data Integrity Gatekeeper**:
   - Audits 8 quarterly modules (`facts`, `scenarios`, `baseline`, `moat`, `estimates`, `filing`, `sentiment`, `catalysts`) to compute a deterministic Data Completeness Score ($0-100\%$).
   - Enforces hard failure gates on ticker mismatch, non-positive stock price, non-positive operating EPS, share count validity, and probability simplex sum ($1.00 \pm 0.05$), aborting before corrupt records can be written to Neon DB.
2. **Offensive Variant Perception & Consensus Divergence**:
   - Quantifies the divergence spread $\Delta = (\text{WFV} - T_{\text{cons}}) / T_{\text{cons}} \times 100\%$.
   - Classifies spread into 4 analytical tiers:
     - `in_line` ($|\Delta| < 5\%$)
     - `moderate_alpha` ($5\% \le |\Delta| < 15\%$)
     - `high_conviction_alpha` ($15\% \le |\Delta| < 30\%$)
     - `extreme_divergence` ($|\Delta| \ge 30\%$)
   - Decomposes the spread into Base Scenario multiple delta, earnings delta, and dynamic regime stress haircut (Bear/Panic drag on Base).
   - Generates pre-localized analytical commentary in English and Chinese attached directly to `ValuationSchema.sanityAudit`.

---

## 5. 5-Pillar Snowflake Radar Scoring

The **Snowflake Fundamental Radar** ([`src/lib/snowflake.ts`](file:///Users/krding/Projects/stress-alpha/src/lib/snowflake.ts)) provides a circular 30-point fundamental audit:

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

1. **Design System & Dual-Theme Engine**:
   - Dark-mode first design inspired by Bloomberg Terminal and FactSet.
   - **Dark (Default)**: `#07090e` base, dark glassmorphism, cyan `#38bdf8` accent, neon subtle glows.
   - **Light**: High-contrast FactSet/WSJ day mode (`#f8fafc` base, `#ffffff` card surfaces, high-contrast `#0f172a` typography, `#0284c7` sky accent, crisp slate borders, calibrated WCAG AA financial indicators).
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
   - Maintain export cards via `html-to-image` ([`src/lib/social-card.ts`](file:///Users/krding/Projects/stress-alpha/src/lib/social-card.ts)).
   - Support 5 card templates (`valuation`, `earnings`, `thesis`, `summary`, `snowflake`) across 3 standard social aspect ratios (16:9, 1:1, 4:5).
   - Official watermark domain: `https://stressalpha.vercel.app/`.
5. **Mobile-First Responsive Hierarchy & Workspace Navigation**:
   - Zero horizontal overflow on mobile viewports (`max-w-[calc(100vw-24px)]` on dropdowns and drawers).
   - Sticky mobile segmented switcher (`[⚡ Model] [📊 Deep Dive (7)]`) separating the flow-through model from the 7 intelligence tabs to eliminate vertical scroll fatigue.
   - Dual-view Screener (`viewMode: "cards" | "table"`): Defaults to adaptive cards on mobile (`< md`), rendering mini Snowflake radars, moat status, and price spectrum bars without horizontal table truncation.
   - Responsive Workspace tab layouts: Dedicated card views for multi-column tables (`EstimatesTab`, `MoatTab`, `ToneTab`) on screens `< md`.
   - **Desktop Dual-Pane Independent Scroll Architecture (`lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden`)**:
     - Global window scroll is completely locked on desktop; eliminates double scrollbars, height jumping, and scroll chaining.
     - **Left Pane (Model)**: Dedicated full-height vertical scroll container (`lg:h-full lg:overflow-y-auto custom-scrollbar`). Model sliders, shock presets, and valuation telemetry stay permanently anchored on the left.
     - **Right Pane (Intelligence Workspaces)**: Dedicated scroll container (`flex-1 overflow-y-auto custom-scrollbar`) with the workspace navigation ribbon docked statically above. Deep analyst tables, 10-Q risk factors, and raw notes scroll smoothly with 0% visual impact on the left Model.
     - **Information Architecture Separation**: Primary header navigation features a Segmented Navigation Bar in the center: when a stock ticker has been visited, an active ticker model segment is dynamically included (`[ ⚡ {TICKER} · Model ]` / `[ ⚡ {TICKER} · 模型 ]`), alongside `[ 📊 Screener ]` and `[ ★ Watchlist (count) ]`, allowing 1-click seamless roundtrip navigation between the universe screener/watchlist and the active deep-dive valuation model; when no stock has been visited yet, the model button remains hidden to keep the navigation clean. Ticker and report quarter are unified into a single financial capsule (`ReportSelector`) with quick-switch quarter chips, multi-quarter history, and search; Research Memo is a clearly labeled `[ 📄 Research Memo [M] ]` action button docked at the right end of the workspace navigation ribbon.
   - **Clutter-Free Deep Dive Navigation**:
     - **Sticky Navigation Ribbon** (`sticky top-14 z-30 glass-header` on mobile, static on desktop): Matches the main Header's opacity (`0.90` dark / `0.92` light), heavy frosted glass blur (`backdrop-filter: blur(24px) saturate(180%)`), and border tokens, completely obscuring underlying scrolled text and sitting flush against Header with 0px gap.
     - **Desktop Zero-Scroll Responsive Capsule**: On desktop (`lg:` to `2xl:`), pre-localized concise labels (`tab.shortLabel`, e.g. "Valuation", "Estimates", "Moat" / "估值", "共识", "护城河") ensure all 7 workspaces fit simultaneously in a single segmented row without manual horizontal scrolling; full titles activate on `2xl:`. Includes desktop step chevrons (`<` and `>`), mouse wheel horizontal scroll translation (`onWheel`), and automatic scroll-to-top on workspace change.
     - **Auto-Centering Active Tab**: Smoothly scrolls the active button to center in the horizontal container upon tab switch.
     - **Mobile-Only Bottom Workspace Pager** (`lg:hidden`): Sequential bottom pager (`← Prev Workspace` | dots indicator | `Next Workspace →`) is reserved for mobile screens, eliminating vertical clutter on desktop.
     - **Floating Desktop "Back to Top" Action**: Seamlessly appears when vertical scroll exceeds 350px in the workspace container (`lg:flex`), returning to top with smooth animation.
     - **Keyboard Ergonomics**: Instant switching via numeric keys `1-7` and brackets `[` / `]` for previous/next workspace.

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
   - **[`README.md`](file:///Users/krding/Projects/stress-alpha/README.md)**: Keep feature lists, model capabilities, CLI scripts, and API endpoint documentation synchronized with active code.
   - **[`AGENTS.md`](file:///Users/krding/Projects/stress-alpha/AGENTS.md)**: Update engineering conventions, math modeling invariants (e.g. QPCE logit-space calibration), and CI requirements immediately whenever system behavior changes.
   - **Architecture & Methodology Docs**: If valuation algorithms, risk factors, or accounting guardrails are added or modified, update the interactive methodology guide ([`src/app/methodology/`](file:///Users/krding/Projects/stress-alpha/src/app/methodology/)) and skill references ([`.agents/skills/`](file:///Users/krding/Projects/stress-alpha/.agents/skills/)).
2. **Zero Documentation Drift**:
   - Never leave documentation behind code changes. Outdated documentation is treated with the same rigor as a failing unit test or broken TypeScript build.
