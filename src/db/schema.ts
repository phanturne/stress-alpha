import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import type {
  Facts,
  Scenarios,
  Valuation,
  FinancialModelBaseline,
  MoatCompetitors,
  AnalystEstimates,
  Catalysts,
  EarningsSentiment,
  FilingExtracts,
  Reactions,
} from "@/lib/schemas";

// ---------------------------------------------------------------------------
// 1. Tickers Table (Market pricing & universe coverage)
// ---------------------------------------------------------------------------
export const tickersTable = pgTable("tickers", {
  ticker: text("ticker").primaryKey(), // e.g. "NVDA", "AMZN"
  company: text("company").notNull(), // e.g. "NVIDIA Corporation"
  sector: text("sector"), // e.g. "Semiconductors"
  currency: text("currency").default("USD").notNull(),

  // Dynamic market pricing (Updated nightly)
  currentPrice: numeric("current_price", { precision: 12, scale: 2 }).notNull(),
  previousClose: numeric("previous_close", { precision: 12, scale: 2 }),
  priceUpdatedAt: timestamp("price_updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  marketCap: numeric("market_cap", { precision: 16, scale: 2 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// 2. Reports Table (Quarterly earnings & valuation models)
// ---------------------------------------------------------------------------
export const reportsTable = pgTable(
  "reports",
  {
    slug: text("slug").primaryKey(), // e.g. "NVDA-Q2-2027-analysis"
    ticker: text("ticker")
      .notNull()
      .references(() => tickersTable.ticker, { onDelete: "cascade" }),
    quarter: text("quarter").notNull(), // e.g. "Q2 2027"
    year: integer("year").notNull(), // e.g. 2027
    reportDate: text("report_date").notNull(), // "2026-08-26"
    status: text("status").default("published").notNull(), // 'draft' | 'published' | 'archived'

    // Historical stock price at the moment of report generation
    reportPrice: numeric("report_price", { precision: 12, scale: 2 }).notNull(),

    // Denormalized metrics for fast universe screener querying
    weightedFairValue: numeric("weighted_fair_value", {
      precision: 12,
      scale: 2,
    }).notNull(),
    baseFairValue: numeric("base_fair_value", {
      precision: 12,
      scale: 2,
    }).notNull(),
    bullFairValue: numeric("bull_fair_value", {
      precision: 12,
      scale: 2,
    }).notNull(),
    bearFairValue: numeric("bear_fair_value", {
      precision: 12,
      scale: 2,
    }).notNull(),
    panicFairValue: numeric("panic_fair_value", { precision: 12, scale: 2 }),
    moatRating: text("moat_rating"), // "Wide", "Narrow", "None"
    moatTrend: text("moat_trend"), // "Widening", "Stable", "Narrowing"
    operatingMarginPct: numeric("operating_margin_pct", {
      precision: 6,
      scale: 2,
    }),
    revenueGrowthPct: numeric("revenue_growth_pct", { precision: 6, scale: 2 }),

    // Strongly-typed JSONB artifact payloads (bound directly to Zod schemas)
    facts: jsonb("facts").$type<Facts>().notNull(),
    scenarios: jsonb("scenarios").$type<Scenarios>().notNull(),
    valuation: jsonb("valuation").$type<Valuation>().notNull(),
    baseline: jsonb("baseline").$type<FinancialModelBaseline>(),
    moat: jsonb("moat").$type<MoatCompetitors>(),
    estimates: jsonb("estimates").$type<AnalystEstimates>(),
    catalysts: jsonb("catalysts").$type<Catalysts>(),
    sentiment: jsonb("sentiment").$type<EarningsSentiment>(),
    filing: jsonb("filing").$type<FilingExtracts>(),
    reactions: jsonb("reactions").$type<Reactions>(),

    // Chinese translations (optional)
    factsZh: jsonb("facts_zh").$type<Facts>(),
    scenariosZh: jsonb("scenarios_zh").$type<Scenarios>(),
    moatZh: jsonb("moat_zh").$type<MoatCompetitors>(),
    estimatesZh: jsonb("estimates_zh").$type<AnalystEstimates>(),
    catalystsZh: jsonb("catalysts_zh").$type<Catalysts>(),
    sentimentZh: jsonb("sentiment_zh").$type<EarningsSentiment>(),
    filingZh: jsonb("filing_zh").$type<FilingExtracts>(),
    reactionsZh: jsonb("reactions_zh").$type<Reactions>(),

    // Cached rendered markdown
    reportMd: text("report_md"),
    reportMdZh: text("report_md_zh"),

    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_reports_ticker").on(table.ticker),
    index("idx_reports_published").on(table.publishedAt),
    uniqueIndex("idx_reports_ticker_quarter").on(
      table.ticker,
      table.quarter,
      table.year
    ),
  ]
);

export type TickerSelect = typeof tickersTable.$inferSelect;
export type TickerInsert = typeof tickersTable.$inferInsert;

export type ReportSelect = typeof reportsTable.$inferSelect;
export type ReportInsert = typeof reportsTable.$inferInsert;
