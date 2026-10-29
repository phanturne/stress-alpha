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
   - Inverted Earnings Calendar & Autonomous Scaffolding Engine (`src/lib/services/earnings-calendar.ts`, `scripts/sync_earnings_calendar.ts`, `.github/workflows/earnings_sync.yml`, `npm run sync:earnings`):
     - Inverted single-call polling queries Finnhub's earnings calendar (`GET /calendar/earnings?from=DATE&to=DATE`) to retrieve reporting companies across US markets without fragile webhooks.
     - Gated by session (`bmo` at 8:45 AM EST, `amc` at 5:15 PM EST) and active coverage universe.
     - Non-destructive deduplication skips populated reports (`revenueBillions > 0`) while enabling forced re-scaffolding (`--force`) and safe simulation (`--dry-run`).
     - Automatically runs deterministic valuation (`computeStressedValuation`) and sanity audit (`computeSanityAudit`), persisting bilingual report data and recording initial revision snapshots in `valuation_revisions`.
   - Institutional Universe Seeding & Batch Price Telemetry (`scripts/seed_universe.ts`, `scripts/sync_prices.ts`, `npm run seed:universe`, `npm run sync:prices`):
     - Ingests official S&P 500 (~503 constituents) and NASDAQ-100 (101 constituents), deduplicating and normalizing symbols into an institutional universe of 518+ core US equities.
     - Batch-accelerates Yahoo Finance quote synchronization into 50-ticker chunks, refreshing closing prices, prior closes, and market capitalization across the full universe in seconds without hitting rate limits.
     - Seamlessly expands the active coverage gate for autonomous earnings calendar ingestion and the global news firehose.
   - Bulk Scaffolding & Batch Report Persistence (`scripts/bulk_scaffold.ts`, `npm run scaffold:universe`):
     - Ingests 8-module pipeline bundles, computes deterministic valuations, runs sanity audits, renders bilingual memos, and persists full institutional reports into Neon PostgreSQL.
     - Prioritizes by market cap with configurable limits (`--limit=50`), single-ticker targets (`--ticker=JPM`), or universe-wide backfills (`--all`), with non-destructive skipping of already populated reports.

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
   - `getFinancialMetrics(ticker: string): Promise<FinancialMetric[]>`
   - `saveFinancialMetrics(metrics: FinancialMetricsInsert[]): Promise<void>`
2. **Normalized Relational Financial Metrics Time-Series (`financialMetricsTable`, `scripts/migrate_financial_metrics.ts`, `npm run migrate:metrics`)**:
   - Resolves JSONB database anti-patterns by decomposing quarterly financial statements and historical quarters into typed relational rows with composite indexing on `(ticker, fiscalYear, fiscalQuarter)` and `(ticker, periodEndDate)`.
   - Normalizes revenue, gross profit, operating income, net income, operating cash flow, FCF, CapEx, diluted EPS, diluted shares, gross margin %, and operating margin %.
3. **Resilient Network Ingestion & Error Budgeting (`src/lib/services/http-client.ts`)**:
   - Unified `resilientFetch` utility replacing raw `fetch` across `financial-data.ts`, `news-ingestion.ts`, and `earnings-calendar.ts`.
   - Enforces exponential backoff with random jitter, automatic HTTP 429 rate limit parsing (`Retry-After` header support for seconds and HTTP dates), transient 5xx error retries (500, 502, 503, 504), and timeout budgeting via `AbortController` (default 10s).
4. **Factory Selection**:
   - Always use `getReportRepository()` which instantiates `DrizzleReportRepository` connected directly to Neon PostgreSQL.
   - **Never bypass repository interfaces** in API routes or extraction scripts.
5. **Isolated Integration Testing via Neon Ephemeral Branching**:
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

### Mathematical Sensitivity Modeling & Cash Flow Telemetry
- **Upstream Volume Shocks**:
  $$\Delta \text{Revenue} = \text{Base Revenue} \times \sum_{i} (\text{Shock}_i \times \text{Exposure}_i \times \text{Elasticity}_i)$$
- **Operating Leverage Rigidity**: Fixed operating expenditures (`fixedOpexBillions`) do not contract proportionally with revenue, modeling operational deleverage during downturns.
- **Free Cash Flow (FCF) Conversion & Yield**:
  $$\text{FCF} = \text{Operating Income} \times (1 - \text{Tax Rate}) + \text{D\&A} - \text{CapEx}$$
  $$\text{FCF Conversion } \% = \frac{\text{FCF}}{\text{Net Income}} \times 100, \quad \text{FCF Yield } \% = \frac{\text{FCF Per Share}}{\text{Stock Price}} \times 100$$
- **Asymmetry Skew Ratio**:
  $$\text{Asymmetry} = \frac{\text{Upside to Bull } \%}{|\text{Downside to Panic } \%|}$$

### Deterministic Scenario Calibration Matrix & Archetypes
Scenario probabilities are calibrated using **Softmax Multi-Regime Weighting with Tail Risk Heuristics** rather than naively assigned or obscured under academic pretension:
- **Pillar 1: Lexicographic Governance Tail Veto**: Severe governance risk (e.g. auditor resignation, DOJ probes, multiple accounting flags) applies asymmetric log-odds shifts ($\Delta z_{\text{panic}} = +1.35, \Delta z_{\text{bull}} = -1.60$). This overrides standard margin cushions, forcing Panic probability $\ge 45-50\%$ and capping Bull $\le 8\%$, reflecting the institutional fiduciary reality that no operational margin can protect an un-auditable firm.
- **Pillar 2: Archetype-Aware Resilience & Capital Runway**:
  - `compounder` (Archetype A): Operating margin $>30\%$ rewarded; $<15\%$ penalized unless protected by durable Wide Moat (`Costco Compounder Exemption`).
  - `operating_scaler` (Archetype B): Fast growth ($\ge 25\%$), high gross margins ($\ge 60\%$) rewarded for operating leverage velocity.
  - `venture_hypergrowth` (Archetype C): Scale-up stage ($\ge 50\%$ growth, negative operating margin). Must satisfy deterministic gating ($\text{gross margin} \ge 35\%$) to grant the **Unit Economics Exemption** (waiving operating margin penalty). Audited for **Net Liquid Runway** ($\tau_{\text{net}} = (\text{cash} - \text{short-term debt}) / \text{monthly burn}$):
    - $\tau_{\text{net}} < 9$ months: Acute dilution penalty ($\Delta z_{\text{panic}} = +1.25, \Delta z_{\text{bull}} = -1.10$) reflecting emergency secondary equity dilution.
    - $9 \le \tau_{\text{net}} < 18$ months: Moderate dilution overhang ($\Delta z_{\text{panic}} = +0.50, \Delta z_{\text{bull}} = -0.35$).
    - $\tau_{\text{net}} \ge 18$ months: Abundant runway ($\Delta z_{\text{bull}} = +0.15$).
- **Pillar 3: Wall Street Consensus Skew & Dispersion**: Analyzes analyst bullish ratio and 52W target dispersion.
- **Pillar 4: Market-Implied Risk Anchor & Regularization**: Reverse-engineers market-priced-in disaster risk with a dampening regularization weight ($w_{\text{mkt}} = 0.20$), rather than claiming an unproven prior distribution. It anchors 20% to real-time market pricing to prevent dogmatic detachment from reality while preserving 80% weight for independent fundamental alpha.
- **Simplex Regularization**: Convex contraction ensuring probabilities strictly remain within $[0.05, 0.85]$ and sum precisely to $1.000$.
- **Methodology & Interview Guidance Note**: In investment committee and quant interviews, the baseline logit shifts ($\Delta z$) are clearly articulated as transparent heuristic bounds modeling downside tail asymmetries. In systematic production setups, these coefficients can be empirically calibrated by minimizing Brier scores ($B = \frac{1}{N} \sum (p_i - o_i)^2$) and multinomial log-loss across multi-quarter earnings outturns.

### Event-Driven Fundamental Transmission & News Pipeline
To factor in real-time news, product announcements, and cross-company supply chain updates without LLM price hallucinations:
1. **Materiality & Junk Gating (`src/lib/news-filter.ts`)**:
   - Deterministic regex & publisher blacklisting filters out ~95% of syndication clickbait and class-action lawyer solicitation spam before any LLM is invoked.
   - Mandatory pass gates for Form 8-K filings, verified brokerage rating revisions, and statistical return anomalies ($|R| \ge 2.5\sigma$ or $\ge \pm 3.0\%$).
2. **Deterministic Transmission Engine (`src/lib/news-transmission.ts`)**:
   - Qualitative news is strictly mapped into typed transmission vectors (`driver_shock`, `catalyst_prob`, `qpce_skew`, `segment_growth`).
   - Pure TypeScript calculates implied $\Delta \text{Revenue}$, $\Delta \text{EPS}$, and implied WFV impact directly via [`computeStressedValuation()`](file:///Users/krding/Projects/stress-alpha/src/lib/valuation.ts#L41) with zero LLM math.
3. **Cross-Company Dependency Graph**:
   - Captures supplier/customer ripples (e.g. TSMC CapEx $\to$ NVIDIA revenue) via `upstreamDependenciesTable`.
4. **Global Marketplace News Firehose (`src/lib/services/news-ingestion.ts`, `scripts/sync_news.ts --firehose`)**:
   - Connects to Polygon.io / Massive Reference News API (`GET /v2/reference/news?limit=1000`) to stream top market articles in a single unparameterized query.
   - Matches articles against active universe and verified upstream partners in memory, filters noise, calculates WFV revisions, and persists vetted events into Neon DB in ~5s across all covered stocks.

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
   - Dark-mode first design inspired by Bloomberg Terminal, FactSet, Linear, and Stripe.
   - **Dark (Default)**: `#07090e` base, dark glassmorphism, cyan `#38bdf8` accent, crisp 1px institutional micro-elevation rings (`shadow-xs`), zero blurred neon halo halos.
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
     - **Information Architecture Separation**: Primary header navigation features a rock-solid 3-tab Segmented Navigation Bar in the center (`[ ⚡ {TICKER} · Model ]` / `[ ⚡ {TICKER} · 模型 ]`, alongside `[ 📊 Screener ]` and `[ ★ Watchlist (count) ]`), permanently maintaining a stable 3-tab layout across all screens to prevent 2-to-3 tab layout shifts and pop-ins, defaulting to the top constituent (e.g. NVDA) when no ticker has been explicitly selected yet. Ticker and report quarter are unified into a single financial capsule (`ReportSelector`) with quick-switch quarter chips, multi-quarter history, and search; Research Memo is a clearly labeled `[ 📄 Research Memo [M] ]` action button docked at the right end of the workspace navigation ribbon.
   - **Clutter-Free Deep Dive Navigation**:
     - **Sticky Navigation Ribbon** (`sticky top-14 z-30 glass-header` on mobile, static on desktop): Matches the main Header's opacity (`0.90` dark / `0.92` light), heavy frosted glass blur (`backdrop-filter: blur(24px) saturate(180%)`), and border tokens, completely obscuring underlying scrolled text and sitting flush against Header with 0px gap.
     - **Desktop Zero-Scroll Responsive Capsule**: On desktop (`lg:` to `2xl:`), pre-localized concise labels (`tab.shortLabel`, e.g. "Valuation", "Estimates", "Moat" / "估值", "共识", "护城河") ensure all 7 workspaces fit simultaneously in a single segmented row without manual horizontal scrolling; full titles activate on `2xl:`. Includes desktop step chevrons (`<` and `>`), mouse wheel horizontal scroll translation (`onWheel`), and automatic scroll-to-top on workspace change.
     - **Auto-Centering Active Tab**: Smoothly scrolls the active button to center in the horizontal container upon tab switch.
     - **Mobile-Only Bottom Workspace Pager** (`lg:hidden`): Sequential bottom pager (`← Prev Workspace` | dots indicator | `Next Workspace →`) is reserved for mobile screens, eliminating vertical clutter on desktop.
     - **Floating Desktop "Back to Top" Action**: Seamlessly appears when vertical scroll exceeds 350px in the workspace container (`lg:flex`), returning to top with smooth animation.
     - **Keyboard Ergonomics**: Instant switching via numeric keys `1-7` and brackets `[` / `]` for previous/next workspace.
6. **Dedicated Settings Page & Institutional Privacy Guardrail**:
   - Dedicated route at `/settings` managed by [`src/app/settings/SettingsClientPage.tsx`](file:///Users/krding/Projects/stress-alpha/src/app/settings/SettingsClientPage.tsx).
   - **Zero-Exposure Email Privacy Invariant**: User email addresses (`session.user.email`) MUST NEVER be rendered directly in global headers, user profile dropdowns, or mobile navigation drawers to safeguard against shoulder-surfing and screen sharing disclosure.
   - On `/settings`, email addresses are masked by default (`a***@domain.com`) with an explicit user visibility toggle.
   - Centralizes account authentication, dual-theme selection, language localization, quantitative valuation parameters, local storage cache clearing, and institutional telemetry.

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

---

## 9. Branching & Pull Request Workflow (Human-in-the-Loop Review)

All code and architectural contributions MUST adhere to a branch and Pull Request workflow. Agents must never push or merge directly to `main`.

1. **Feature Branch Mandate**:
   - Every change must live on a dedicated branch created from latest `origin/main`.
   - Branch naming convention:
     - `feat/<topic>`: New features, endpoints, or UI tabs
     - `fix/<bug>`: Bug fixes or data ingestion patches
     - `chore/<task>`: Dependency updates, CI workflows, or maintenance
     - `docs/<topic>`: Documentation, methodology guides, or architectural specifications
2. **Local Pre-Handoff Verification**:
   - Before pushing a branch, the agent must verify:
     - `npm run format:check`
     - `npm run lint`
     - `npx tsc --noEmit`
     - `npm test`
3. **Draft Pull Request Creation & Handoff**:
   - Push branch to remote: `git push -u origin <branch-name>`
   - **Always create as a Draft PR outright**: Execute `gh pr create --draft --title "<type>: <title>" --body "<markdown body>"` so the PR is live immediately without risk of premature merging.
   - Provide the live PR link along with the PR title and description summary directly in the turn response.
   - Wait for human review, feedback, or merge approval before proceeding with dependent work. Once approved, the PR can be marked ready (`gh pr ready`) and merged.
4. **Post-Merge Local Branch Cleanup**:
   - Once the pull request has been merged to `main`:
     - Switch back to `main`: `git checkout main`
     - Fast-forward pull latest changes: `git pull origin main`
     - Delete the merged local branch: `git branch -d <branch-name>` (or `-D` if squashed)
     - Prune remote-tracking references: `git fetch -p`
     - Verify working directory is clean: `git status`

---

## 10. Documentation & Specification Hygiene

To prevent documentation rot, token bloat, and conflicting instructions:

1. **Single Source of Truth (`docs/architecture.md`)**:
   - All architectural designs, data flows, database schemas, and mathematical mechanics MUST be documented directly in [**`docs/architecture.md`**](file:///Users/krding/Projects/stress-alpha/docs/architecture.md).
   - Never create or commit standalone proposal/spec markdown files (e.g. `docs/spec-*.md`, `RFC-*.md`) into the repository.
2. **Scratchpad & Working Notes Location**:
   - Working notes, temporary design drafts, and exploratory plans belong exclusively in the conversation scratch directory (`<appDataDir>/brain/<conversation-id>/scratch/`) or PR description.
   - Never check temporary scratchpads into git.
3. **Commit Guardrail**:
   - Do not stage or commit `docs/spec-*.md`, `*.draft.md`, or temporary design documents.
   - If a feature introduces architectural changes, update `docs/architecture.md` and document the delta in the Pull Request body.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
