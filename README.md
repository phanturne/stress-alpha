# StressAlpha — Equity Earnings & Scenario Stress Simulation Platform

StressAlpha is an interactive financial modeling and scenario stress-simulation platform for fundamental equity analysts and institutional investors. Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Neon Serverless PostgreSQL**, it pairs deterministic real-time valuation engines with automated SEC filing ingestion pipelines.

---

## 📸 Platform Overview

### 1. Interactive Dual-Pane Cockpit
The left pane anchors deterministic flow-through valuation models and real-time sensitivity controls. The right pane navigates multi-quarter analysis modules (Technical Levels, Consensus & Multiples, Filings & News, and Variant Perception) with independent scrolling.

<p align="center">
  <img src="./docs/images/cockpit-preview.png" alt="StressAlpha Dual-Pane Cockpit Preview" width="100%" />
</p>

### 2. Universe Screener & Multi-Factor Matrix
Filter, rank, and evaluate valuation spreads, consensus price targets, and 30-point Snowflake Fundamental Radars across 521 covered equities (with 640+ multi-quarter earnings reports) with responsive card and tabular views.

<p align="center">
  <img src="./docs/images/screener-preview.png" alt="StressAlpha Universe Screener Preview" width="100%" />
</p>

### 3. Coverage Watchlist & Real-Time Telemetry
Monitor core positions with real-time quote feeds, multi-regime stress boundaries, margin trends, and historical earnings performance.

<p align="center">
  <img src="./docs/images/watchlist-preview.png" alt="StressAlpha Watchlist Preview" width="100%" />
</p>

### 4. 1-Click Investment Committee Memorandum (`[M]` key)
Generates an institutional PDF-styled research memo rendering thesis drivers, consensus divergence, catalyst timetables, and valuation sensitivity matrices.

<p align="center">
  <img src="./docs/images/memo-preview.png" alt="StressAlpha Investment Memorandum Preview" width="100%" />
</p>

---

## ✨ Key Capabilities

* **Deterministic Valuation Engine**: All financial models—including Weighted Fair Value (WFV), operating leverage flow-through, and multiple sensitivity—are calculated client-side in pure TypeScript (`<1ms` recalculation latency).
* **4-Regime Scenario Stress Testing**: Evaluates cash generation and downside floors across Bull, Base, Bear, and Panic scenarios, modeling operating margin rigidity and upstream volume shocks.
* **Microstructure & Fundamental Confluence**: Combines floor pivots ($P, S_1-S_3, R_1-R_3$), gap edges, 1-year volume profile Point of Control (POC), and Anchored VWAPs with valuation regimes to identify institutional price confluence within $\pm 2.5\%$.
* **30-Point Snowflake Fundamental Radar**: Multi-factor fundamental audit across Valuation, Future Growth, Earnings Quality, Moat Durability, and Balance Sheet Resilience.
* **Automated Data Ingestion & Scaffolding**: Scheduled batch ingestion syncing Finnhub earnings calendars and SEC 10-Q/10-K filings (Massive API) directly into typed relational schemas.
* **Bilingual Parity**: Full English and Chinese localization (`en` / `zh`) across workspaces, research memos, and interactive methodology documentation.

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
*(Requires `DATABASE_URL` for Neon PostgreSQL. Optional: `FINNHUB_API_KEY` and `MASSIVE_API_KEY` for live data ingestion).*

### 3. Run Automated Tests
Spins up an isolated, ephemeral copy-on-write Neon DB branch in ~0.85s for 100% cloud parity:
```bash
npm test
```

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the cockpit.

---

## 🏗️ Architecture & Stack

| Layer | Technology | Engineering Highlights |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 App Router, React 19, Turbopack | Server components with client-side reactive modeling |
| **Styling & UI** | Tailwind CSS, Pure SVG Charts | Zero canvas/heavy chart dependencies; dark/light FactSet theme |
| **Database & ORM** | Neon Serverless PostgreSQL, Drizzle ORM | Normalized relational time-series tables; repository pattern |
| **Testing** | Vitest, Neon Ephemeral Branching | 275+ integration tests with isolated copy-on-write cloud DB branches |
| **Data Pipelines** | SEC EDGAR, Massive API, Finnhub API | Scheduled ETL with rate-limiting, exponential backoff, and deduplication |

---

## 📚 Deep-Dive Documentation

* 📐 **[System Architecture Documentation (`docs/architecture.md`)](./docs/architecture.md)** — Relational schema design, data access patterns, and batch ingestion DAGs.
* 🔬 **[Valuation Methodology & Derivations](https://stressalpha.vercel.app/methodology)** — Mathematical models for volume shock elasticity, operating leverage rigidity, and FCF yields.
