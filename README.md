# StressAlpha — Modern Equity Earnings & Stress Simulation Platform

A forward-looking financial decision and scenario-simulation platform for fundamental equity analysts, tech investors, and quant researchers. Built as a high-performance **Next.js 16 App Router** application (powered by **React 19** and **Turbopack**) with pure client-side deterministic arithmetic, dynamic valuation bands, and autonomous earnings intelligence pipelines.

> **"LLMs extract and audit qualitative context; pure deterministic TypeScript handles 100% of the arithmetic."**

---

## 📸 Platform Interface Gallery

### 1. Interactive Flow-Through Cockpit (Desktop Dual-Pane)
The left pane anchors the deterministic flow-through valuation model and sensitivity sliders, while the right pane navigates 8 deep-dive intelligence workspaces with independent scrolling.

<p align="center">
  <img src="./docs/images/cockpit-preview.png" alt="StressAlpha Dual-Pane Cockpit Preview" width="100%" />
</p>

### 2. Cross-Ticker Universe Screener & Radar Matrix
Analyze valuation multiples, consensus upside spreads, and 30-point Snowflake Fundamental Radars across 630+ covered equities with adaptive card and table views.

<p align="center">
  <img src="./docs/images/screener-preview.png" alt="StressAlpha Universe Screener Preview" width="100%" />
</p>

### 3. Dedicated Watchlist Portfolio & Telemetry
Track coverage lists with real-time quote updates, valuation spreads, operating margins, and multi-quarter earnings history.

<p align="center">
  <img src="./docs/images/watchlist-preview.png" alt="StressAlpha Watchlist Preview" width="100%" />
</p>

### 4. 1-Click Investment Committee Memorandum (`[M]` key)
Instant publication-ready PDF-styled research memo rendering thesis bullets, variant perception commentary, catalyst timetables, and valuation sensitivity ranges.

<p align="center">
  <img src="./docs/images/memo-preview.png" alt="StressAlpha Investment Memorandum Preview" width="100%" />
</p>

---

## ✨ Key Capabilities

* **Zero LLM Math Hallucinations**: Target prices, weighted fair values (WFVs), multiple spreads, and snowflake scores are strictly calculated by deterministic TypeScript engines (`src/lib/valuation.ts`, `src/lib/snowflake.ts`). LLMs extract qualitative context only.
* **Sub-Millisecond Sensitivity Modeling**: Sliders perturbing upstream volume shocks (Hyperscaler CapEx, Consumer Demand, Digital Ad spend), gross margin shifts, and fixed OpEx rigidity evaluate instantly (`<1ms`) client-side.
* **4-Regime Valuation Spectrum**: Dynamically models cash generation across Bull, Base, Bear, and Panic Floor regimes with Softmax tail-risk heuristics and governance vetos.
* **3-Tier Price Corridors & Regime Confluence**: Classical floor pivots ($P, S_1-S_3, R_1-R_3$), unfilled gap edges, 1-year volume profile Point of Control (POC), and Anchored VWAPs synthesized into 3 institutional corridors with automated $\pm 2.5\%$ fundamental regime confluence detection and interactive TradingView charting.
* **30-Point Snowflake Fundamental Radar**: Circular 5-pillar health audit covering Valuation, Future Growth, Earnings Quality, Moat, and Downside Resilience.
* **Autonomous Ingestion & Scaffolding**: Twice-daily scheduled earnings calendar ingestion (Finnhub API) and SEC 10-Q/10-K statements (Massive API) auto-scaffold complete bilingual quarterly models.
* **Bilingual English / Chinese Parity**: First-class internationalization (`en` / `zh`) across all 9 research workspaces, memos, and interactive methodology pages.

---

## 🏃 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/phanturne/stress-alpha.git
cd stress-alpha
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and add your database and API credentials:
```bash
cp .env.example .env.local
```
*(Requires `DATABASE_URL` for Neon PostgreSQL, plus optional `FINNHUB_API_KEY` and `MASSIVE_API_KEY` for live pipeline fetching).*

### 3. Run Automated Tests
Spins up an isolated, ephemeral copy-on-write Neon DB branch in ~0.85s with 100% cloud parity:
```bash
npm test
```

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to launch the interactive cockpit.

---

## 📚 Deep-Dive Documentation

For detailed architectural blueprints, mathematical derivations, and CLI commands:

* 📐 **[System Architecture Documentation (`docs/architecture.md`)](./docs/architecture.md)**:
  * High-Level Data Pipelines & Flowcharts
  * Desktop Dual-Pane Layout Hierarchy & Design System
  * Neon Serverless PostgreSQL Relational Schemas & DAL Pattern
  * Autonomous Earnings Calendar Scaffolding & News DAG Pipelines
  * 30-Point Snowflake Fundamental Radar Matrix
  * CLI Tooling & Repository Directory Structure
* 🔬 **[Valuation Methodology & Proofs (`/methodology`)](https://stressalpha.vercel.app/methodology)**:
  * Mathematical derivations for top-line volume shocks, fixed OpEx rigidity, and FCF yields.
  * Softmax Multi-Regime Weighting with Tail Risk Heuristics in log-odds space.

---

## 🏗️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 App Router (Turbopack, Server Actions) |
| **UI & Styling** | React 19, Tailwind CSS, Pure SVG Charts, Dual-Theme Engine |
| **Database & ORM** | Neon Serverless PostgreSQL, Drizzle ORM |
| **Testing** | Vitest with ephemeral Neon copy-on-write branching (244 tests) |
| **Data Feeds** | SEC EDGAR, Massive API, Finnhub API |
