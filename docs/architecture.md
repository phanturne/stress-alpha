# StressAlpha — System Architecture Documentation

> **Document Version:** 1.3.0  
> **Status:** Active / Production Baseline  
> **Target Framework:** Next.js 16 (App Router), React 19, TypeScript 5.5, Neon PostgreSQL, Drizzle ORM  
> **Test Coverage:** 244 automated unit & integration tests across 24 test suites (100% passing)  
> **Last Updated:** October 2026  

---

## 1. Executive Summary & Core Philosophy

**StressAlpha** is an institutional equity earnings analysis and deterministic scenario stress-testing platform. It bridges the gap between raw corporate financial filings (SEC 10-Q/8-K, earnings call transcripts) and real-time investment committee decision-making.

### Architectural Tenets
1. **Zero LLM Math Hallucinations**: Large Language Models are used exclusively for qualitative context extraction and forensic auditing (e.g. governance flags, accounting risk excerpts). All financial arithmetic, operating leverage flows, regime probability distributions (via QPCE), valuation bands, and risk asymmetry skews are computed by pure deterministic TypeScript engines (`src/lib/valuation.ts`, `src/lib/snowflake.ts`).
2. **Audited SEC Data Extraction & Financial Feeds**: Extract facts directly from SEC 10-K / 10-Q filings, press releases, and earnings call transcripts via **Massive.com** (point-in-time statements and ratios) and **Finnhub.io** (audio transcripts, SEC filings, consensus targets, and earnings calendar).
3. **Event-Driven Fundamental Transmission**: Real-time market news and corporate announcements are filtered for clickbait and legal solicitations, then converted into typed fundamental transmission vectors (driver shocks, segment growth, consensus skews) that flow deterministically into valuation models without AI price speculation.
4. **Autonomous Earnings Calendar Scaffolding**: An inverted daily polling model queries Finnhub's earnings calendar twice daily (post-BMO and post-AMC), auto-scaffolding complete bilingual 8-module report models, computing valuations, and logging sanity audits into Neon PostgreSQL.
5. **Strict Zod Contract Validation**: Every piece of incoming data is validated against strongly-typed Zod schemas (`src/lib/schemas.ts`). Malformed inputs fail fast before reaching the valuation engine or presentation layer.
6. **Sub-Millisecond Client-Side Simulation**: Once a report payload is loaded into the browser, all sensitivity sliders (upstream demand shocks, gross margin shifts, fixed OpEx elasticity) execute client-side at `<1ms` latency without round-trip network overhead.
7. **Isolated Ephemeral Integration Testing**: Vitest integration tests run against copy-on-write database branches spun up from production Neon PostgreSQL in ~0.85s, providing 100% cloud parity without polluting production data.

---

## 2. High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph DataSources["External Data Feeds & Schedulers"]
        FinnhubCal["Finnhub Earnings Calendar API\nGET /calendar/earnings"]
        PolygonNews["Polygon / Massive Reference News API\nGET /v2/reference/news?limit=1000"]
        MassiveSEC["Massive SEC Data Feeds\n10-Q / 10-K Point-in-Time Statements"]
        FinnhubTranscripts["Finnhub Transcripts & Sell-Side Consensus"]
        CronEarnings["GitHub Actions (8:45 AM & 5:15 PM EST)\n.github/workflows/earnings_sync.yml"]
        CronNightly["GitHub Actions (22:00 UTC)\n.github/workflows/nightly-price-sync.yml"]
    end

    subgraph AutonomousEngines["Autonomous Scaffolding & Transmission Engines"]
        CronEarnings --> IngestCal["scripts/sync_earnings_calendar.ts\n(src/lib/services/earnings-calendar.ts)"]
        FinnhubCal --> IngestCal
        IngestCal --> Scaffolder["src/lib/services/financial-data.ts\nfetchCompletePipelineBundle()"]
        MassiveSEC & FinnhubTranscripts --> Scaffolder
        Scaffolder --> EvalPipeline["Deterministic Valuation (computeStressedValuation)\n+ Sanity Audit (computeSanityAudit)"]

        CronNightly --> IngestNews["scripts/sync_news.ts\n(src/lib/services/news-ingestion.ts)"]
        PolygonNews --> IngestNews
        IngestNews --> NewsFilter["src/lib/news-filter.ts\nClickbait & Lawyer Spam Filter"]
        NewsFilter --> NewsTransmission["src/lib/news-transmission.ts\nDeterministic Transmission & DAG Propagation"]
    end

    subgraph StorageLayer["Data Access Layer (Neon PostgreSQL + Drizzle ORM)"]
        EvalPipeline --> NeonDB[("Neon Serverless Postgres\n• tickers\n• reports\n• financial_metrics\n• market_events\n• upstream_dependencies\n• valuation_revisions")]
        NewsTransmission --> NeonDB
        
        NeonDB --> DAL["DrizzleReportRepository\n(src/lib/repository/drizzle-report-repository.ts)\n15m TTL In-Memory + Next.js Data Cache"]
        DAL -.->|"Implements"| IRepo["IReportRepository\n(src/lib/repository/types.ts)"]
        IRepo --> Factory["Repository Factory\n(src/lib/repository/index.ts)"]
    end

    subgraph APILayer["Next.js 16 App Router API Layer"]
        Factory --> APIReports["GET /api/reports & /api/reports/[slug]"]
        Factory --> APINews["GET /api/news & /api/pipeline/news"]
        Factory --> APIRevisions["GET /api/revisions"]
        Factory --> APIWatchlist["GET /api/watchlist & POST /api/watchlist"]
        Factory --> APIPipeline["GET /api/pipeline/data & POST /api/pipeline/data"]
        NeonDB --> APIAuth["/api/auth/[...all] (Better Auth)"]
    end

    subgraph PresentationLayer["Presentation & Simulation Cockpit"]
        APIReports & APINews & APIRevisions & APIWatchlist --> ClientPages["Client Application"]
        ClientPages --> Dashboard["Interactive Model Cockpit (/)"]
        ClientPages --> Screener["Universe Screener (/screener)"]
        ClientPages --> Watchlist["Dedicated Watchlist (/watchlist)"]
        ClientPages --> Settings["Settings & Privacy Hub (/settings)"]
        ClientPages --> Methodology["Interactive Formulas (/methodology)"]
        ClientPages --> Memo["Committee Research Memo ([M] key)"]

        Dashboard <-->|"Sub-millisecond Reactivity"| ValEngine["Deterministic Valuation Engine\n(src/lib/valuation.ts)"]
    end
```

---

## 3. UI Architecture & Desktop Dual-Pane Independent Scroll

```mermaid
flowchart TD
    Header["Header.tsx\n• Global Brand Home • 3-Tab Segmented Bar ([⚡ NVDA · Model] [📊 Screener] [★ Watchlist])\n• Unified ReportSelector Capsule • Dual-Theme Switcher (Dark / Light) • Share & Export"]

    subgraph DualPaneLayout["Desktop Dual-Pane Workspace Container (lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden)"]
        subgraph LeftPane["Left Pane: Model Cockpit (lg:w-[480px] xl:w-[540px] lg:overflow-y-auto)"]
            PriceMeter["PriceMeter.tsx (Dynamic Regime Gauge)"]
            Sliders["Interactive Sensitivity Sliders (Demand Shocks, Margins, Fixed OpEx)"]
            Telemetry["Cash Flow Telemetry (FCF Conversion, FCF Yield, Asymmetry Skew)"]
        end

        subgraph RightPane["Right Pane: Intelligence Workspaces (flex-1 lg:overflow-y-auto)"]
            NavRibbon["Sticky Workspace Navigation Ribbon (9 Workspaces + [📄 Research Memo [M]])"]
            TabsContainer["Active Workspace Viewport\n(1. Valuation | 2. Technicals & Chart | 3. Estimates | 4. Moat\n5. Segments | 6. Catalysts | 7. News | 8. Audit & Risk | 9. Notes)"]
            BackToTop["Floating Auto-Centering 'Back to Top' Action"]
        end
    end

    Header --> DualPaneLayout
```

### Visual Verification: Desktop Cockpit & Navigation
The left model pane stays permanently anchored during simulation, while the right intelligence pane scrolls independently through 10-Q risk factors, consensus tables, and market events:

<p align="center">
  <img src="./images/cockpit-preview.png" alt="StressAlpha Dual-Pane Cockpit" width="100%" />
</p>

### Universe Screener & Multi-Ticker Radar View
Dedicated `/screener` route with dual-view modes (interactive cards for mobile, structured tables for desktop), displaying real-time 30-point Snowflake Radars and valuation regime spreads:

<p align="center">
  <img src="./images/screener-preview.png" alt="StressAlpha Universe Screener" width="100%" />
</p>

### Dedicated Watchlist Portfolio
Dedicated `/watchlist` route grouping coverage universe constituents by report quarter, with key valuation spreads and operating margins:

<p align="center">
  <img src="./images/watchlist-preview.png" alt="StressAlpha Watchlist View" width="100%" />
</p>

### 3.1 Design System, Dual-Theme Engine & Institutional Privacy
* **Dual Themes**: Default Bloomberg Terminal Dark (`#07090e`) and FactSet/WSJ Day Light (`#f8fafc`) with zero-flash (0ms FOUC) SSR persistence via `src/components/ThemeScript.tsx`.
* **Zero-Exposure Email Privacy**: User emails are omitted from header menus and mobile drawers, and masked by default on `/settings` to safeguard against shoulder-surfing and presentation leaks.
* **Desktop Dual-Pane Independent Scroll**: Locked window scroll on desktop (`lg:overflow-hidden`) eliminates jumpy double scrollbars; left model and right deep-dive workspaces scroll independently.

---

## 4. Data Layer Architecture & Ephemeral Cloud Parity

```mermaid
flowchart TD
    subgraph NeonDB["Neon PostgreSQL Database"]
        TickersTab["tickers\n(Symbol, Name, Exchange, Price, Cap)"]
        ReportsTab["reports\n(8-Module JSONB Bundles)"]
        MetricsTab["financial_metrics\n(Relational Normalized Statements)"]
        EventsTab["market_events\n(Filtered Headlines & Transmission Vectors)"]
        DepsTab["upstream_dependencies\n(Supply Chain DAG & Elasticity Weights)"]
        RevisionsTab["valuation_revisions\n(Immutable Audit Trail of WFV Changes)"]
    end

    subgraph TestingStrategy["Ephemeral Integration Testing (~0.85s Branch Lifecycle)"]
        ProdDB["Neon Production Database"]
        APIBranch["Neon API Branch Call"]
        ProdDB -->|"Copy-on-Write Clone"| APIBranch
        APIBranch --> TestBranch["Ephemeral Branch\n(test-vitest-<timestamp>)"]
        TestBranch --> VitestRuns["244 Automated Vitest Assertions\n(DAL, Pipeline, Calendar, News)"]
        VitestRuns --> ReapBranch["Automatic Branch Deletion & Cleanup"]
    end
```

### 4.1 Neon PostgreSQL Schema (`src/db/schema.ts`)

| Table | Purpose & Key Schema Columns |
| :--- | :--- |
| `tickers` | Master equity universe. Ticker, company name, exchange, sector, live `currentPrice`, `marketCapBillions`, and `lastPriceSync`. |
| `reports` | 8-module quarterly analysis bundles. Ticker, quarter slug (`nvda-2027q1`), `reportDate`, and JSONB columns for `facts`, `scenarios`, `valuation`, `baseline`, `moat`, `estimates`, `catalysts`, `sentiment`, `filings`, and `reactions`. |
| `financial_metrics` | Normalized relational time-series statement metrics decomposed from quarterly filings. Composite indexed on `(ticker, fiscalYear, fiscalQuarter)`. Stores Revenue, Gross Profit, Operating Income, Net Income, OCF, FCF, CapEx, Diluted EPS, and Margins. |
| `market_events` | Ingested and filtered market events. Ticker, headline, source URL, event category (`earnings_guidance`, `supply_chain`, `capex_driver`, `regulatory`), abnormal return, and mapped transmission vector. |
| `upstream_dependencies` | Directed supply chain graph. `sourceTicker` (e.g. `TSM`), `targetTicker` (e.g. `NVDA`), dependency type, and elasticity weight. |
| `valuation_revisions` | Immutable valuation audit trail. Ticker, trigger type (`quarterly_filing`, `market_event`, `manual_audit`), prior WFV, new WFV, delta percentage, and rationale. |
| `users`, `sessions`, `accounts`, `verifications` | Better Auth authentication and session management. |

### 4.2 The Income Quality Guardrail
StressAlpha isolates non-operating accounting anomalies in `facts.json` to compute normalized **Operating EPS**:
- **ASU 2016-01 Normalization**: Mark-to-market unrealized paper gains on equity securities (e.g. Amazon's $53.4B Anthropic valuation mark in Q2 2026) are stripped out of Reported Diluted EPS.
- The deterministic valuation engine strictly defaults to operating earnings to prevent artificial multiple distortion.

### 4.3 Data Access Layer (DAL) Pattern
All data access in Next.js routes and scripts is mediated through `IReportRepository`:

```typescript
export interface IReportRepository {
  listReports(): Promise<ReportSummary[]>;
  getReport(folderSlug: string): Promise<ReportData | null>;
  saveReport(report: ReportData): Promise<void>;
  deleteReport(folderSlug: string): Promise<void>;
  syncPrice(ticker: string, price: number): Promise<void>;
  getMarketEvents(ticker: string, limit?: number): Promise<MarketEventRecord[]>;
  saveMarketEvent(event: NewMarketEvent): Promise<void>;
  getValuationRevisions(ticker: string): Promise<ValuationRevisionRecord[]>;
  recordValuationRevision(revision: NewValuationRevision): Promise<void>;
  getFinancialMetrics(ticker: string): Promise<FinancialMetric[]>;
  saveFinancialMetrics(metrics: FinancialMetricsInsert[]): Promise<void>;
}
```

* **`DrizzleReportRepository`**: Connected directly to Neon Serverless PostgreSQL (`us-west-2`), projecting scalar JSONB fields directly in SQL (`estimates->'priceTargets'->>'average'`, etc.) to minimize network egress (~380 KB for 640+ reports). Shielded by a 4-tier caching hierarchy:
  1. **Level 1 (Browser & TanStack Query)**: 5-minute browser disk cache (`max-age=300`) and 30-minute React Query `staleTime` (`gcTime=60m`).
  2. **Level 2 (Vercel US Edge CDN)**: 1-hour Edge POP cache (`s-maxage=3600, stale-while-revalidate=86400`) across read endpoints.
  3. **Level 3 (Next.js Data Cache & `pdx1` Co-location)**: Serverless compute pinned to `pdx1` (`us-west-2` in `vercel.json`) with `unstable_cache` and automatic `revalidateTag("reports", "max")` invalidation on pipeline mutations.
  4. **Level 4 (Warm Lambda In-Memory Shield)**: 15-minute in-memory repository cache (`CACHE_TTL_MS = 900_000`), delivering <1ms warm hits.
* **`InMemoryReportRepository`**: Complete mock implementation for fast, fully isolated unit testing without external database dependencies.

---

## 5. Computational Valuation Engine (`src/lib/valuation.ts`)

```mermaid
flowchart LR
    A["Raw Financial Statements<br/>& SEC 10-Q Disclosures"] --> B["Income Quality Filter<br/>(Strip ASU 2016-01 One-Offs)"]
    B --> C["Base Operating EPS<br/>& Fixed OpEx Rigidity Model"]
    C --> D["Upstream Volume Shocks<br/>(CapEx, Demand, Ad Spend)"]
    D --> E["Free Cash Flow Telemetry<br/>(FCF Yield & Conversion %)"]
    E --> F["Softmax Multi-Regime Weighting<br/>(Governance Veto + Regularization)"]
    F --> G["Weighted Fair Value (WFV)<br/>& 4-Regime Pricing Bands"]
```

The arithmetic engine runs identically in two contexts:
1. **Server / CLI**: Executed during report compilation and autonomous earnings calendar scaffolding.
2. **Client Browser**: Executed inside `src/components/Cockpit.tsx` whenever a user adjusts a sensitivity slider (<1ms response time).

### 5.1 Sensitivity Shock Propagation Equations

1. **Top-Line Demand Shock**:
   $$\Delta \text{Revenue} = \text{Base Revenue} \times \sum_{i} \left( \text{Exposure}_i \times \text{Elasticity}_i \times \text{Shock}_i \right)$$
   Where $i \in \{\text{Hyperscaler CapEx}, \text{Consumer Demand}, \text{Digital Ad Spend}\}$.

2. **Operating Leverage & Margins**:
   $$\text{Stressed Gross Profit} = \text{Stressed Revenue} \times (\text{Gross Margin}_{\text{base}} + \Delta \text{Margin}_{\text{bps}})$$
   $$\text{Stressed OpEx} = \text{Fixed OpEx}_{\text{base}} \times (1 + \Delta \text{FixedOpEx}_{\%}) + \text{Variable OpEx}$$
   $$\text{Stressed Operating Income} = \text{Stressed Gross Profit} - \text{Stressed OpEx}$$
   $$\text{Stressed Free Cash Flow} = \text{Stressed Operating Income} \times (1 - \text{Tax Rate}) + \text{D\&A} - \text{CapEx}$$
   $$\text{FCF Conversion } \% = \frac{\text{Stressed Free Cash Flow}}{\text{Stressed Net Income}} \times 100$$
   $$\text{FCF Yield } \% = \frac{\text{FCF Per Share}}{\text{Current Price}} \times 100$$

3. **Stressed Diluted EPS**:
   $$\text{Stressed EPS} = \frac{\text{Stressed Net Income}}{\text{Diluted Shares Outstanding}}$$

4. **Risk / Reward Asymmetry Skew**:
   $$\text{Asymmetry Skew} = \frac{\text{Bull Fair Value} - \text{Current Price}}{\text{Current Price} - \text{Panic Fair Value}}$$

### 5.2 Deterministic Scenario Calibration Matrix & Archetypes

To replace naive symmetrical priors (e.g. 25/50/25) with transparent deterministic scenario probabilities, StressAlpha applies **Softmax Multi-Regime Weighting with Tail Risk Heuristics** in log-odds space:

1. **Log-Odds Transformation**: $z_i = \ln(p_i)$ for $i \in \{\text{Bull}, \text{Base}, \text{Bear}, \text{Panic}\}$.
2. **Deterministic Perturbation**: $z_i' = z_i + \Delta z_i^{\text{gov}} + \Delta z_i^{\text{archetype}} + \Delta z_i^{\text{consensus}} + \Delta z_i^{\text{mkt}}$.
3. **Softmax ($T = 1.0$)**: $p_i' = \frac{\exp(z_i')}{\sum_{j} \exp(z_j')}$.
4. **Simplex Bounding ($\epsilon = 0.05$)**: $p_i \in [0.05, 0.85]$ and $\sum_{i} p_i \equiv 1.000$.

#### The 4 Institutional Calibration Pillars
1. **Pillar 1: Forensic & Governance Tail Veto**: Severe governance risk, auditor resignations, or DOJ investigations trigger asymmetric log-odds shifts ($\Delta z_{\text{panic}} = +1.35, \Delta z_{\text{bull}} = -1.60$) and a lexicographic override capping Bull ($\le 8\%$) and flooring Panic ($\ge 45\%$), preventing high gross margins from masking accounting fraud (*Wirecard/Enron guardrail*).
2. **Pillar 2: Archetype-Aware Resilience & Capital Runway**:
   - `compounder` (Archetype A): Operating margin $>30\%$ rewarded; $<15\%$ penalized unless protected by durable Wide Moat (*Costco Compounder Exemption*).
   - `operating_scaler` (Archetype B): Fast growth ($\ge 25\%$), high gross margins ($\ge 60\%$) rewarded for operating leverage velocity.
   - `venture_hypergrowth` (Archetype C): Scale-up innovators ($\ge 50\%$ growth, negative operating margin). Must satisfy gross margin floor ($\ge 35\%$) to waive operating margin penalties (*Unit Economics Exemption*). Audits Net Liquid Runway ($\tau_{\text{net}} = (\text{cash} - \text{short-term debt}) / \text{monthly burn}$): $<9$ months triggers acute dilution penalty ($\Delta z_{\text{panic}} = +1.25, \Delta z_{\text{bull}} = -1.10$).
3. **Pillar 3: Wall Street Consensus Skew & Dispersion**: Calibrates consensus buy/hold/sell ratios and price target dispersion into tail probabilities.
4. **Pillar 4: Market-Implied Risk Anchor & Regularization**: Reverse-engineers market-priced-in disaster risk with a 20% dampening regularization weight ($w_{\text{mkt}} = 0.20$), anchoring against extreme divergence without losing fundamental alpha discovery.

<p align="center">
  <img src="./images/methodology-preview.png" alt="StressAlpha Methodology and Formula Proofs" width="100%" />
</p>

### Deterministic Technical Corridors & Confluence Engine (`src/lib/technical.ts`)
To bridge fundamental valuation models with institutional market microstructure without subjective chartist guessing:
1. **Classical Pivot Point Extensions**:
   - $P = (H + L + C) / 3$
   - $S_1 = 2P - H$, $R_1 = 2P - L$
   - $S_2 = P - (H - L)$, $R_2 = P + (H - L)$
   - Third-tier measured-move extensions: $S_3 = L - 2(H - P)$, $R_3 = H + 2(P - L)$
2. **Unfilled Gap Detection**:
   - Gaps $\ge 3\%$ between prior close and session bounds generate high-volume Gap Fill targets and day boundaries.
3. **1-Year Volume Profile POC & Anchored VWAPs**:
   - Discretizes 252-day price series into 40 equal-range volume buckets to isolate high-volume institutional nodes (POC).
   - Computes Anchored VWAPs from 52-Week High cycle peaks and highest volume trading sessions.
4. **Smart Clustering & 3-Tier Corridor Hierarchy**:
   - Levels within $\le 0.85\%$ distance merge into unified price zones.
   - Synthesizes into:
     - **Tier 1 (Immediate)**: Day-trader inventory boundaries ($S_1 / R_1$).
     - **Tier 2 (Structural)**: Multi-week congestion shelves, unfilled gap tops, and Volume POC ($S_2 / R_2$).
     - **Tier 3 (Macro)**: 52-week cycle extremes, 200-day SMA inflection, and measured breakdown extensions ($S_3 / R_3$).
5. **Regime Confluence Engine**:
   - Audits technical corridors against fundamental valuation regimes (Panic Floor, Bear Target, Base Target, Bull Target) within a $\pm 2.5\%$ tolerance band.
   - Detects high-conviction inflection zones (e.g. Volume POC converging with Base WFV within 0.2%).

---

## 6. Event-Driven News & Transmission Pipeline

```mermaid
flowchart LR
    A["Polygon / Massive News API<br/>(limit=1000)"] --> B["Layer 1: Clickbait & Lawyer Filter<br/>(src/lib/news-filter.ts)"]
    B --> C["Layer 2: Active Universe Intersect<br/>(In-Memory Set Match)"]
    C --> D["Layer 3: Transmission Engine<br/>(src/lib/news-transmission.ts)"]
    D --> E["Layer 4: Theme Deduplication<br/>(seenThemes.has(key))"]
    E --> F["Deterministic WFV Flow-Through<br/>(computeStressedValuation)"]
    F --> G["Neon DB (market_events & valuation_revisions)"]
```

1. **Materiality & Spam Filtering (`src/lib/news-filter.ts`)**: Rejects ~90% of wire syndication spam, rhetorical questions, and class-action lawsuit solicitations with 0 LLM cost.
2. **Deterministic Transmission Engine (`src/lib/news-transmission.ts`)**: Maps qualitative events into typed quantitative vectors (`driver_shock`, `catalyst_prob`, `qpce_skew`, `segment_growth`). Pure TypeScript recalculates implied fair value delta with zero LLM math.
3. **Cross-Company DAG Propagation**: Propagates upstream announcements (e.g. ASML/TSMC wafer bookings) to downstream customers (e.g. NVIDIA revenue) via `upstream_dependencies`.

---

## 7. Inverted Earnings Calendar & Autonomous Scaffolding

```mermaid
flowchart TD
    Trigger["Schedule Trigger<br/>(8:45 AM BMO / 5:15 PM AMC EST)"] --> FinnhubPoll["Single-Call Finnhub Inverted Calendar<br/>GET /calendar/earnings?from=DATE&to=DATE"]
    FinnhubPoll --> SessionGate["Filter Coverage Universe & Active Session Gate"]
    SessionGate --> Deduplication["Deduplicate: Skip if populated (revenueBillions > 0)"]
    Deduplication --> Scaffolder["scaffoldQuarterlyReport()<br/>Ingests Facts, Scenarios, Moat, Catalysts, Estimates"]
    Scaffolder --> Arithmetic["Deterministic Valuation & Sanity Audit Engine<br/>(computeStressedValuation & computeSanityAudit)"]
    Arithmetic --> DBWrite["Persist Bilingual Report Artifacts & Append to valuation_revisions"]
```

1. **Inverted Calendar Polling**: Ingests reporting companies for target dates via Finnhub (`GET /calendar/earnings`) in a single query rather than polling individual tickers.
2. **Session Splitting & Timing**:
   - `bmo` (Before Market Open): Scaffolding triggered at **8:45 AM EST**.
   - `amc` (After Market Close): Scaffolding triggered at **5:15 PM EST**.
   - Timing accounts for the 5–20 minute XBRL statement normalization delay by SEC aggregators.
3. **Deduplication**: Verifies if the report already exists in Neon DB with populated statements (`revenueBillions > 0`). Skips populated reports to avoid redundant work unless forced with `--force`.
4. **Deterministic Scaffolding**: Automatically fetches point-in-time statements, price targets, guidance, and filings, scaffolding all 8 quarterly modules in both English and Chinese, running `computeStressedValuation` and `computeSanityAudit`, and appending a baseline snapshot to `valuation_revisions`.

---

## 8. Printable Committee Memorandum (`[M]` key)

```mermaid
flowchart LR
    ReportData["ReportData Bundle"] --> MemoView["src/components/MemoView.tsx"]
    MemoView --> PDFStyles["Print Media Queries (@media print)<br/>Page-Break Clamping & FactSet Typography"]
    PDFStyles --> Output["1-Click Committee PDF Memorandum<br/>(Instant Export & Executive Distribution)"]
```

<p align="center">
  <img src="./images/memo-preview.png" alt="StressAlpha Research Memorandum Preview" width="100%" />
</p>

---

## 9. Verification & Continuous Integration

Every commit is gated by a 5-stage verification pipeline in `.husky/pre-push` and GitHub Actions (`.github/workflows/ci.yml`):

```mermaid
flowchart LR
    Step1["1. Prettier<br/>(format:check)"] --> Step2["2. ESLint<br/>(eslint .)"]
    Step2 --> Step3["3. TypeScript<br/>(tsc --noEmit)"]
    Step3 --> Step4["4. Vitest<br/>(244 tests with Neon Branching)"]
    Step4 --> Step5["5. Next.js Build<br/>(Turbopack Compile)"]
```

1. **Prettier Formatting**: `npm run format:check`
2. **ESLint Linting**: `npm run lint`
3. **TypeScript Static Analysis**: `npx tsc --noEmit` (0 errors)
4. **Vitest Unit Test Suite**: `npm test` (244 tests across 24 suites)
5. **Next.js Production Build**: `npm run build` (Turbopack compilation)

---

## 10. 5-Pillar Snowflake Fundamental Radar (`src/lib/snowflake.ts`)

The circular fundamental radar evaluates companies across 5 distinct axes (6 points each, 30 points maximum):

```mermaid
flowchart TD
    subgraph SnowflakeAxes["5-Pillar Fundamental Radar (30 Points Max)"]
        Valuation["1. Valuation & Safety (Emerald #10b981)<br/>• Upside to WFV • Discount to Consensus • Multiple Discipline"]
        Future["2. Future Growth & Catalysts (Cyan #06b6d4)<br/>• Segment Velocity • Forward Guidance • Catalyst Pipeline"]
        Earnings["3. Earnings Quality & Margins (Indigo #6366f1)<br/>• Operating Margin • Clean FCF Conversion • ASU 2016-01 Normalization"]
        Moat["4. Economic Moat & Moat Trend (Amber #f59e0b)<br/>• Pricing Power • Peer Margin Spread • Durable Switching Costs"]
        Resilience["5. Downside Floor & Resilience (Rose #ec4899)<br/>• Panic Floor Multiple • Upstream Solvency • Asymmetry Skew"]
    end
```

| Pillar | Axis ID | Focus & Evaluation Criteria | Token Color |
| :--- | :--- | :--- | :--- |
| **Valuation & Margin of Safety** | `valuation` | Upside to WFV, discount to consensus target, multiple discipline | Emerald (`#10b981`) |
| **Future Growth & Catalysts** | `future` | Segment revenue velocity, forward guidance, catalyst pipeline | Cyan (`#06b6d4`) |
| **Earnings Quality & Margins** | `earnings` | Operating margin level, clean cash conversion, GAAP equity adjustments | Indigo (`#6366f1`) |
| **Economic Moat & Benchmarking** | `moat` | Pricing power, peer margin spread, durable switching costs | Amber (`#f59e0b`) |
| **Downside Floor & Resilience** | `resilience` | Panic multiple buffer, upstream solvency, asymmetry skew ratio | Rose (`#ec4899`) |

### Scoring Tiers
* **Exceptional Alpha Conviction**: $\ge 24 / 30$
* **High-Quality Investment Grade**: $18 - 23 / 30$
* **Selective Opportunity**: $12 - 17 / 30$
* **Elevated Fundamental Risk**: $< 12 / 30$

---

## 11. CLI Tooling & Autonomous Workflows

| Command | Target Script | Operational Description |
| :--- | :--- | :--- |
| `npm run dev` | Next.js Server | Start development server at `http://localhost:3000` |
| `npm test` | Vitest Runner | Run full 244-test suite with Neon ephemeral copy-on-write branching |
| `npm run build` | Turbopack Build | Compile production Next.js bundle |
| `npm run sync:earnings -- --dry-run` | `sync_earnings_calendar.ts` | Simulate earnings calendar ingestion for today |
| `npm run sync:earnings -- --date=YYYY-MM-DD` | `sync_earnings_calendar.ts` | Ingest and scaffold earnings reports for a specific date |
| `npm run sync:news -- --firehose` | `sync_news.ts` | Ingest and filter market-wide news via Polygon global firehose |
| `npm run sync:prices` | `sync_prices.ts` | Update live market prices across coverage universe |
| `npm run fetch:data -- <TICKER> --stage` | `fetch_data.ts` | Ingest SEC statements and scaffold starter draft modules |
| `npm run migrate:metrics` | `migrate_financial_metrics.ts` | Backfill relational quarterly time-series statements into `financial_metrics` |
| `npm run capture:screenshots` | `capture_screenshots.sh` | Capture fresh headless screenshots of all core platform views |

---

## 12. Repository Directory Structure

```
stress-alpha/
├── .github/workflows/
│   ├── ci.yml                          # Continuous integration (format, lint, tsc, test, build)
│   ├── nightly-price-sync.yml          # Nightly price & news sync (22:00 UTC)
│   └── earnings_sync.yml               # Twice-daily automated earnings scaffolding (8:45 AM & 5:15 PM EST)
├── docs/
│   ├── architecture.md                 # Canonical system architecture documentation & diagrams
│   └── images/                         # Platform screenshots (cockpit, screener, watchlist, memo, methodology)
├── scripts/
│   ├── sync_earnings_calendar.ts       # Finnhub earnings calendar ingestion & scaffolding
│   ├── sync_news.ts                    # Polygon firehose news ingestion & transmission calculation
│   ├── sync_prices.ts                  # Market price synchronization (batch-accelerated)
│   ├── fetch_data.ts                   # SEC 10-Q & consensus pipeline data extractor
│   ├── seed_universe.ts                # S&P 500 & NASDAQ-100 universe ingestion & quote seeder
│   ├── bulk_scaffold.ts                # Batch valuation scaffolding & report persistence engine
│   ├── seed_upstream_dependencies.ts   # Cross-company supply chain DAG seeder
│   └── capture_screenshots.sh          # Headless browser screenshot capture script
├── src/
│   ├── app/                            # Next.js 16 App Router pages & API routes
│   │   ├── page.tsx                    # Main valuation model & workspace cockpit
│   │   ├── screener/                   # Dedicated cross-ticker screener (/screener)
│   │   ├── watchlist/                  # Dedicated coverage watchlist (/watchlist)
│   │   ├── settings/                   # Dedicated settings & privacy hub (/settings)
│   │   ├── methodology/                # Interactive mathematical methodology guide (/methodology)
│   │   └── api/                        # REST API routes (reports, news, revisions, watchlist, pipeline)
│   ├── components/                     # React 19 UI components
│   │   ├── Header.tsx                  # Global 3-tab segmented navigation bar & theme toggle
│   │   ├── Cockpit.tsx                 # Interactive flow-through model & sliders
│   │   ├── CockpitDualPane.tsx         # Desktop dual-pane independent scroll container
│   │   ├── ScreenerView.tsx            # Multi-ticker radar table & adaptive cards
│   │   ├── WatchlistView.tsx           # Dedicated watchlist telemetry strip & metrics
│   │   ├── snowflake/                  # 5-Pillar Snowflake Radar chart & modal
│   │   └── tabs/                       # 8 Specialized intelligence workspaces
│   ├── db/                             # Neon Serverless Postgres schema & connection pool
│   └── lib/                            # Core domain logic
│       ├── valuation.ts                # Deterministic arithmetic, FCF metrics & scenario calibration
│       ├── snowflake.ts                # 30-point fundamental health scoring engine
│       ├── sanity.ts                   # Variant perception & data completeness audit
│       ├── news-filter.ts              # Clickbait & class-action lawsuit spam filter
│       ├── news-transmission.ts        # Event-to-valuation transmission engine
│       ├── services/                   # Earnings calendar, financial data, and news services
│       └── repository/                 # Data Access Layer (Drizzle & InMemory repositories)
└── tests/                              # Vitest automated test suite (244 tests across 24 suites)
```
