# CLAUDE.md: Guidelines for StressAlpha

This document defines core conventions, architecture invariants, and coding standards for AI assistants and developers working in the **StressAlpha** codebase.

---

## 1. Cardinal Engineering Principles

### 1. Zero LLM Math Hallucinations
- LLMs extract and audit qualitative context; pure deterministic TypeScript handles 100% of arithmetic.
- The LLM must **never** calculate, invent, or guess weighted fair values (WFV), target prices, upside percentages, P/E spreads, or snowflake scores in prompts or raw markdown text.
- All valuation, operating leverage sensitivity, and snowflake scores run strictly through deterministic TypeScript engines (`src/lib/valuation.ts`, `src/lib/snowflake.ts`).

### 2. Zero Fake Placeholders & Synthetic Heuristics (Trust Guardrail)
- **Never invent numbers or fallback formulas**: UI components must never fabricate target prices (e.g. `price * 1.25`), consensus targets (`price * 1.12`), bear targets (`price * 0.7`), market caps (`$850.2bn`), or metric ratios (`operatingMargin * 0.12`).
- **Honest Missing Data (`"—"` / N/A)**: If a metric is unpopulated or pending synchronization from the backend, render `"—"`, an animated skeleton, or gracefully hide the uncomputed tag. In institutional finance, displaying missing states preserves credibility, whereas fabricated metrics destroy trust immediately.
- **No Synthetic Price Return Calculations**: Heatmaps, index bars, and movers must render real quote telemetry or neutral `0.00%` / `"—"`. Never synthesize constituent equity returns by mixing ETF moves with arbitrary constants (e.g. `etf * 1.05 + default * 0.35`).
- **Authentic Radar & Spectrum Visualizations**: If multidimensional pillar scores or scenario bounds are absent, render neutral circular boundaries or omit spectrum tracks rather than drawing fake symmetrical radar polygons or arbitrary boundary pins.

### 3. Ponytail (Pragmatic Minimalist Engineering)
- Solve the whole problem with the least new code.
- Zero unrequested abstractions, premature wrappers, or speculative configurations.
- Reuse existing utilities and schema helpers in `@/lib/` before writing new ones.

---

## 2. Architecture & Internationalization (i18n)

### Strict Prohibition on Inline Boolean Language Checks
- **NEVER** write inline language ternaries in React components or templates:
  ```tsx
  // ❌ BAD: Inline language ternary
  <span>{isZh ? "雪花图" : "Snowflake"}</span>
  ```
- **ALWAYS** retrieve strings and labels from the centralized dictionary in [`src/lib/i18n.ts`](file:///Users/krding/Projects/stress-alpha/src/lib/i18n.ts):
  ```tsx
  // ✅ GOOD: Centralized dictionary translation
  const t = getTranslations(locale).cockpit;
  <span>{t.snowflakeButton}</span>
  ```

### Dual-Artifact Report Storage
- Reports follow a bilingual dual-artifact pattern:
  - English: `facts.json`, `scenarios.json`, `catalysts.json`, `moat-competitors.json`, `analyst-estimates.json`, `report.md`.
  - Chinese: `facts_zh.json`, `scenarios_zh.json`, `catalysts_zh.json`, `moat-competitors_zh.json`, `analyst-estimates_zh.json`, `report_zh.md`.
- Stored and queried via `IReportRepository` (`DrizzleReportRepository` on Neon PostgreSQL).

---

## 3. Essential Commands

```bash
# Run full test suite (with automated Neon ephemeral copy-on-write branching)
npm test

# Development server
npm run dev

# Build production bundle
npm run build

# Synchronize universe price quotes (Yahoo Finance batch chunks)
npm run sync:prices

# Autonomous earnings calendar synchronization
npm run sync:earnings

# Bulk scaffold institutional reports
npm run scaffold:universe
```
