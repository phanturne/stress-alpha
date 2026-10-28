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
  serial,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
  MarketEvent,
  TransmissionPayload,
  ValuationRevisionStateDiff,
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

    // Denormalized 30-point Snowflake Radar metrics
    snowflakeScore: integer("snowflake_score"),
    snowflakeTier: varchar("snowflake_tier", { length: 32 }),
    snowflakePillars: jsonb("snowflake_pillars").$type<{
      valuation: number;
      future: number;
      earnings: number;
      moat: number;
      resilience: number;
    }>(),

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

// ---------------------------------------------------------------------------
// 3. Authentication Tables (Better Auth Core Schema)
// ---------------------------------------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// Convenience aliases
export const usersTable = user;
export const sessionsTable = session;
export const accountsTable = account;
export const verificationsTable = verification;

// ---------------------------------------------------------------------------
// 4. User Watchlist Table (Cloud synchronization for user watchlists)
// ---------------------------------------------------------------------------
export const userWatchlistsTable = pgTable(
  "user_watchlists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_user_watchlists_user").on(table.userId),
    uniqueIndex("idx_user_watchlists_user_ticker").on(
      table.userId,
      table.ticker
    ),
  ]
);

// ---------------------------------------------------------------------------
// 5. Market Events & News Intelligence Table
// ---------------------------------------------------------------------------
export const marketEventsTable = pgTable(
  "market_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker")
      .notNull()
      .references(() => tickersTable.ticker, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    sourceUrl: text("source_url"),
    publisher: text("publisher").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    eventType: text("event_type").notNull(), // 'upstream_earnings' | 'product_release' | 'analyst_rating' | 'sec_filing' | 'general_catalyst'
    priceMovePct: numeric("price_move_pct", { precision: 6, scale: 2 }),
    abnormalReturnSigma: numeric("abnormal_return_sigma", {
      precision: 4,
      scale: 2,
    }),
    transmissionType: text("transmission_type").default("none").notNull(),
    transmissionPayload: jsonb(
      "transmission_payload"
    ).$type<TransmissionPayload>(),
    impliedWfvImpactPct: numeric("implied_wfv_impact_pct", {
      precision: 6,
      scale: 2,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_market_events_ticker").on(table.ticker),
    index("idx_market_events_published").on(table.publishedAt),
    index("idx_market_events_type").on(table.eventType),
  ]
);

// ---------------------------------------------------------------------------
// 6. Cross-Company Upstream Dependency Graph
// ---------------------------------------------------------------------------
export const upstreamDependenciesTable = pgTable(
  "upstream_dependencies",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sourceTicker: text("source_ticker")
      .notNull()
      .references(() => tickersTable.ticker, { onDelete: "cascade" }),
    targetTicker: text("target_ticker")
      .notNull()
      .references(() => tickersTable.ticker, { onDelete: "cascade" }),
    driverId: text("driver_id").notNull(),
    driverName: text("driver_name"),
    exposureShare: numeric("exposure_share", {
      precision: 4,
      scale: 2,
    }).notNull(),
    elasticity: numeric("elasticity", { precision: 4, scale: 2 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_upstream_target").on(table.targetTicker),
    index("idx_upstream_source").on(table.sourceTicker),
    uniqueIndex("idx_upstream_pair_driver").on(
      table.sourceTicker,
      table.targetTicker,
      table.driverId
    ),
  ]
);

// ---------------------------------------------------------------------------
// 7. Valuation Revisions Table (Fair Value Revision Ledger)
// ---------------------------------------------------------------------------
export const valuationRevisionsTable = pgTable(
  "valuation_revisions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ticker: text("ticker")
      .notNull()
      .references(() => tickersTable.ticker, { onDelete: "cascade" }),
    revisionDate: timestamp("revision_date", { withTimezone: true }).notNull(),
    triggerType: text("trigger_type").notNull(), // 'quarterly_filing' | 'peer_earnings_shock' | 'sec_8k' | 'consensus_wave' | 'catalyst_activation'
    triggerEventId: text("trigger_event_id").references(
      () => marketEventsTable.id,
      { onDelete: "set null" }
    ),
    headline: text("headline").notNull(),
    rationale: text("rationale").notNull(),

    // Outcome Values
    priorWfv: numeric("prior_wfv", { precision: 12, scale: 2 }).notNull(),
    newWfv: numeric("new_wfv", { precision: 12, scale: 2 }).notNull(),
    wfvDeltaPct: numeric("wfv_delta_pct", { precision: 6, scale: 2 }).notNull(),

    // Full State Diff Payload
    fullStateDiff: jsonb("full_state_diff")
      .$type<ValuationRevisionStateDiff>()
      .notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_val_revisions_ticker").on(table.ticker),
    index("idx_val_revisions_date").on(table.revisionDate),
  ]
);

// ---------------------------------------------------------------------------
// 8. Financial Metrics Table (Normalized relational time-series statements)
// ---------------------------------------------------------------------------
export const financialMetricsTable = pgTable(
  "financial_metrics",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker")
      .notNull()
      .references(() => tickersTable.ticker, { onDelete: "cascade" }),
    fiscalYear: integer("fiscal_year").notNull(),
    fiscalQuarter: text("fiscal_quarter").notNull(), // "Q1", "Q2", "Q3", "Q4"
    periodEndDate: text("period_end_date").notNull(), // "YYYY-MM-DD"
    revenue: numeric("revenue", { precision: 16, scale: 2 }).notNull(),
    grossProfit: numeric("gross_profit", { precision: 16, scale: 2 }).notNull(),
    operatingIncome: numeric("operating_income", {
      precision: 16,
      scale: 2,
    }).notNull(),
    netIncome: numeric("net_income", { precision: 16, scale: 2 }).notNull(),
    operatingCashFlow: numeric("operating_cash_flow", {
      precision: 16,
      scale: 2,
    }),
    freeCashFlow: numeric("free_cash_flow", { precision: 16, scale: 2 }),
    capex: numeric("capex", { precision: 16, scale: 2 }),
    dilutedEps: numeric("diluted_eps", { precision: 10, scale: 4 }).notNull(),
    dilutedShares: numeric("diluted_shares", { precision: 16, scale: 2 }),
    grossMarginPct: numeric("gross_margin_pct", {
      precision: 6,
      scale: 2,
    }).notNull(),
    operatingMarginPct: numeric("operating_margin_pct", {
      precision: 6,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_financial_metrics_ticker_quarter").on(
      table.ticker,
      table.fiscalYear,
      table.fiscalQuarter
    ),
    index("idx_financial_metrics_ticker_period").on(
      table.ticker,
      table.periodEndDate
    ),
  ]
);

// ---------------------------------------------------------------------------
// 9. Relations
// ---------------------------------------------------------------------------
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  watchlists: many(userWatchlistsTable),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const userWatchlistsRelations = relations(
  userWatchlistsTable,
  ({ one }) => ({
    user: one(user, {
      fields: [userWatchlistsTable.userId],
      references: [user.id],
    }),
  })
);

export const valuationRevisionsRelations = relations(
  valuationRevisionsTable,
  ({ one }) => ({
    ticker: one(tickersTable, {
      fields: [valuationRevisionsTable.ticker],
      references: [tickersTable.ticker],
    }),
    triggerEvent: one(marketEventsTable, {
      fields: [valuationRevisionsTable.triggerEventId],
      references: [marketEventsTable.id],
    }),
  })
);

export const financialMetricsRelations = relations(
  financialMetricsTable,
  ({ one }) => ({
    ticker: one(tickersTable, {
      fields: [financialMetricsTable.ticker],
      references: [tickersTable.ticker],
    }),
  })
);

export type UserSelect = typeof user.$inferSelect;
export type UserInsert = typeof user.$inferInsert;
export type SessionSelect = typeof session.$inferSelect;
export type AccountSelect = typeof account.$inferSelect;
export type VerificationSelect = typeof verification.$inferSelect;
export type UserWatchlistSelect = typeof userWatchlistsTable.$inferSelect;
export type UserWatchlistInsert = typeof userWatchlistsTable.$inferInsert;
export type MarketEventSelect = typeof marketEventsTable.$inferSelect;
export type MarketEventInsert = typeof marketEventsTable.$inferInsert;
export type UpstreamDependencySelect =
  typeof upstreamDependenciesTable.$inferSelect;
export type UpstreamDependencyInsert =
  typeof upstreamDependenciesTable.$inferInsert;
export type ValuationRevisionSelect =
  typeof valuationRevisionsTable.$inferSelect;
export type ValuationRevisionInsert =
  typeof valuationRevisionsTable.$inferInsert;
export type FinancialMetric = typeof financialMetricsTable.$inferSelect;
export type FinancialMetricsInsert = typeof financialMetricsTable.$inferInsert;
export type FinancialMetricSelect = FinancialMetric;
