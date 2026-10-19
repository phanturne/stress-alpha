import * as dotenv from "dotenv";
import path from "node:path";
import { getReportRepository, type IReportRepository } from "@/lib/repository";
import type { MarketEventInsert, MarketEventSelect } from "@/db/schema";
import {
  type MarketEvent,
  type MarketEventType,
  type TransmissionType,
  type TransmissionPayload,
  type ReportData,
} from "@/lib/schemas";
import {
  filterCandidateNews,
  isRelevantToTicker,
  type RawNewsArticle,
} from "@/lib/news-filter";
import { calculateNewsTransmissionImpact } from "@/lib/news-transmission";
import { fetchFinnhubFilings } from "./financial-data";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function getFinnhubApiKey(provided?: string): string | undefined {
  return provided || process.env.FINNHUB_API_KEY;
}

function getPolygonApiKey(provided?: string): string | undefined {
  return provided || process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY;
}

/**
 * Fetch company-specific news articles from Finnhub within a given date window.
 */
export async function fetchFinnhubCompanyNews(
  ticker: string,
  from: string,
  to: string,
  apiKey?: string
): Promise<RawNewsArticle[]> {
  const token = getFinnhubApiKey(apiKey);
  if (!token) {
    return [];
  }

  try {
    const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(
      ticker.toUpperCase()
    )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(
      to
    )}&token=${encodeURIComponent(token)}`;

    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item: any) => ({
      title: item.headline || "",
      publisher: item.source || "Finnhub",
      url: item.url,
      publishedAt: item.datetime
        ? new Date(item.datetime * 1000).toISOString()
        : new Date().toISOString(),
      tickers: [ticker.toUpperCase()],
      summary: item.summary || "",
    }));
  } catch (err) {
    console.warn(
      `⚠️ Warning fetching Finnhub company news for ${ticker}:`,
      err
    );
    return [];
  }
}

/**
 * Fetch SEC Form 8-K filings from Finnhub and format them as news articles.
 */
export async function fetchSec8KNews(
  ticker: string,
  apiKey?: string
): Promise<RawNewsArticle[]> {
  try {
    const filings = await fetchFinnhubFilings(ticker, apiKey);
    const eightKs = filings.filter((f) => f.form === "8-K");

    return eightKs.map((item) => ({
      title: `Form 8-K: Material Event Filing (${item.filedDate})`,
      publisher: "SEC EDGAR",
      url: item.reportUrl || item.filingUrl,
      publishedAt: item.acceptedDate || `${item.filedDate}T00:00:00Z`,
      tickers: [ticker.toUpperCase()],
      summary: `Official Form 8-K current report filing submitted to the SEC. Accession number: ${item.accessNumber || "N/A"}.`,
    }));
  } catch (err) {
    console.warn(`⚠️ Warning fetching SEC 8-K filings for ${ticker}:`, err);
    return [];
  }
}

export interface MappedTransmission {
  eventType: MarketEventType;
  transmissionType: TransmissionType;
  transmissionPayload?: TransmissionPayload;
}

/**
 * Deterministically maps raw news article content into typed transmission vectors
 * (CapEx, packaging, analyst revisions, product catalysts, or qualitative).
 */
export function mapArticleToTransmission(
  article: RawNewsArticle
): MappedTransmission {
  const text = `${article.title} ${article.summary || ""}`.toLowerCase();
  const title = article.title;

  // 1. SEC Filings
  if (
    article.publisher.toLowerCase().includes("sec") ||
    /form 8-k/i.test(title)
  ) {
    if (/guidance|forecast/i.test(text)) {
      const isPositive = /raised|increased|higher|strong/i.test(text);
      return {
        eventType: "sec_filing",
        transmissionType: "segment_growth",
        transmissionPayload: {
          segmentName: "Core Business",
          segmentDeltaGrowthPct: isPositive ? 5 : -5,
          rationale: "SEC Form 8-K revision to financial outlook.",
        },
      };
    }

    return {
      eventType: "sec_filing",
      transmissionType: "none",
      transmissionPayload: undefined,
    };
  }

  // 2. Wall Street Sell-Side Rating & Price Target Changes
  const analystKeywords =
    /upgrade|downgrade|raises target|lowers target|price target raised|price target lowered|target price/i;
  if (analystKeywords.test(text)) {
    let action = "Reiterated";
    if (/upgrade/i.test(text)) action = "Upgraded";
    else if (/downgrade/i.test(text)) action = "Downgraded";
    else if (/raises target|raised target|price target raised/i.test(text))
      action = "TargetRaised";
    else if (/lowers target|lowered target|price target lowered/i.test(text))
      action = "TargetLowered";

    const targetMatch = text.match(/\$(\d+(?:\.\d+)?)/);
    const newTarget = targetMatch ? parseFloat(targetMatch[1]) : 150;

    const firmRegex =
      /(morgan stanley|goldman sachs|jpmorgan|jp morgan|bank of america|bofa|citi|citigroup|barclays|jefferies|bernstein|rosenblatt|wells fargo|ubs|deutsche bank|mizuho)/i;
    const firmMatch = text.match(firmRegex);
    const firm = firmMatch
      ? firmMatch[0].replace(/\b\w/g, (c) => c.toUpperCase())
      : article.publisher || "Wall Street Consensus";

    return {
      eventType: "analyst_rating",
      transmissionType: "qpce_skew",
      transmissionPayload: {
        analystAction: {
          firm,
          action,
          newTarget,
        },
        rationale: `${firm} ${action} with price target $${newTarget}.`,
      },
    };
  }

  // 3. Share Buybacks & Capital Return (Expands forward EPS)
  const buybackKeywords =
    /buyback|share repurchase|repurchases? shares|betting \$?\d+.*on its own stock/i;
  if (buybackKeywords.test(text)) {
    return {
      eventType: "general_catalyst",
      transmissionType: "segment_growth",
      transmissionPayload: {
        segmentName: "Capital Allocation",
        grossMarginBpsDelta: 120,
        rationale: "Share repurchase authorization expands forward EPS.",
      },
    };
  }

  // 4. Legal & Patent Settlements (One-off expense impact)
  const legalKeywords =
    /settlement|patent litigation|patent settlement|antitrust fine|legal judgment|lawsuit settlement/i;
  if (legalKeywords.test(text)) {
    const isFavorable = /wins|prevails|favorable|cleared/i.test(text);
    return {
      eventType: "sec_filing",
      transmissionType: "segment_growth",
      transmissionPayload: {
        segmentName: "Operating Expenses",
        grossMarginBpsDelta: isFavorable ? 50 : -60,
        rationale: isFavorable
          ? "Favorable litigation outcome clears legal overhang."
          : "Litigation settlement requires cash outflow and margin absorption.",
      },
    };
  }

  // 5. Upstream Supplier Earnings & Packaging Expansion
  const supplierKeywords =
    /(tsmc|tsm|asml|broadcom|cowos|foundry).*(record results|profit rose|quarterly profit|record revenue|bottleneck|capacity expansion|revenue surge|ai chip supply turns into a bottleneck)/i;
  if (supplierKeywords.test(text)) {
    return {
      eventType: "upstream_earnings",
      transmissionType: "driver_shock",
      transmissionPayload: {
        driverId: "tsmc-cowos-supply",
        deltaShockPct: 10,
        rationale:
          "Upstream foundry / packaging earnings expansion lifts component delivery velocity.",
      },
    };
  }

  // 6. Sell-Side Broker Commentary (Without explicit target numbers)
  const brokerKeywords =
    /(goldman sachs|morgan stanley|jpmorgan|citi|bank of america|ubs|barclays|jefferies|bernstein).*(overdone|top pick|reiterates buy|overweight|underweight|bullish|bearish)/i;
  if (brokerKeywords.test(text)) {
    const isPositive = !/underweight|bearish|downgrade|cautious/i.test(text);
    const firmMatch = text.match(
      /(goldman sachs|morgan stanley|jpmorgan|citi|bank of america|ubs|barclays|jefferies|bernstein)/i
    );
    const firm = firmMatch
      ? firmMatch[0].replace(/\b\w/g, (c) => c.toUpperCase())
      : "Wall Street";
    return {
      eventType: "analyst_rating",
      transmissionType: "qpce_skew",
      transmissionPayload: {
        analystAction: {
          firm,
          action: isPositive ? "Upgraded" : "Downgraded",
          newTarget: isPositive ? 160 : 110,
        },
        rationale: `${firm} institutional assessment: ${isPositive ? "Overweight / Overdone selloff" : "Cautious outlook"}.`,
      },
    };
  }

  // 7. Upstream Driver Shock & CapEx / Supply Chain
  const upstreamKeywords =
    /capex|capital expenditure|cowos|packaging|foundry|wafer|fab expansion|hbm|high bandwidth memory/i;
  if (upstreamKeywords.test(text)) {
    const isCut = /cuts|slashes|reduces|decreases|lowers/i.test(text);
    const isBoost = /raises|expands|boosts|increases|accelerates/i.test(text);

    const pctMatch = text.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
    let shockPct = pctMatch
      ? parseFloat(pctMatch[1])
      : isCut
        ? -15
        : isBoost
          ? 20
          : 10;
    if (isCut && shockPct > 0) shockPct = -shockPct;

    const isPackaging = /cowos|packaging|advanced packaging/i.test(text);
    const driverId = isPackaging ? "advanced-packaging" : "hyperscaler-capex";

    return {
      eventType: "upstream_earnings",
      transmissionType: "driver_shock",
      transmissionPayload: {
        driverId,
        deltaShockPct: shockPct,
        rationale: `Supply chain shock: ${isPackaging ? "Packaging capacity" : "CapEx allocation"} shifted by ${shockPct > 0 ? "+" : ""}${shockPct}%.`,
      },
    };
  }

  // 8. Product Catalyst & Commercial Release
  const catalystKeywords =
    /\b(product launch|commercial release|general availability|commercial rollout|rollout|fda approval|patent grant)\b|(\bunveils?\s+(new|next-gen|latest|flagship|ai|chip|platform|gpu|accelerator|system|model|architecture|vehicle|feature|service|hardware|software|lineup)\b)/i;
  if (catalystKeywords.test(text)) {
    return {
      eventType: "product_release",
      transmissionType: "catalyst_prob",
      transmissionPayload: {
        catalystId: "product-catalyst",
        newProbability: 0.8,
        rationale: "Commercial product rollout or milestone confirmed.",
      },
    };
  }

  // 9. Segment Growth Outlook
  const segmentKeywords =
    /revenue guidance|guidance raised|guidance cut|forecast raised|sales outlook/i;
  if (segmentKeywords.test(text)) {
    const isRaised = /raised|higher|beat|accelerating/i.test(text);
    return {
      eventType: "general_catalyst",
      transmissionType: "segment_growth",
      transmissionPayload: {
        segmentName: "Core Business",
        segmentDeltaGrowthPct: isRaised ? 5 : -5,
        rationale: `Segment growth trajectory adjusted by ${isRaised ? "+5%" : "-5%"}.`,
      },
    };
  }

  // 10. Qualitative Context / None
  return {
    eventType: "general_catalyst",
    transmissionType: "none",
    transmissionPayload: undefined,
  };
}

/**
 * Helper to locate the active ReportData for a ticker in the repository.
 */
export async function getActiveReportForTicker(
  ticker: string,
  repo: IReportRepository
): Promise<ReportData | null> {
  const upper = ticker.toUpperCase();
  const reports = await repo.listReports();
  const matching = reports.find((r) => r.ticker?.toUpperCase() === upper);
  if (!matching) return null;
  return repo.getReport(matching.slug);
}

export interface IngestNewsOptions {
  lookbackDays?: number;
  apiKey?: string;
  repository?: IReportRepository;
}

/**
 * Orchestrator: Fetches, filters, classifies, calculates impact, and persists
 * market events and catalysts for a specific ticker.
 */
export async function ingestNewsForTicker(
  ticker: string,
  options?: IngestNewsOptions
): Promise<{
  success: boolean;
  ingestedCount: number;
  events: MarketEventSelect[];
}> {
  const repo = options?.repository || getReportRepository();
  const lookbackDays = options?.lookbackDays ?? 7;
  const upper = ticker.toUpperCase();

  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - lookbackDays * 86400 * 1000)
    .toISOString()
    .split("T")[0];

  // 1. Fetch raw articles from Finnhub & SEC 8-K
  const [finnhubNews, secNews] = await Promise.all([
    fetchFinnhubCompanyNews(upper, from, to, options?.apiKey),
    fetchSec8KNews(upper, options?.apiKey),
  ]);

  const rawArticles = [...finnhubNews, ...secNews];

  // 2. Filter candidates (clickbait & junk removal, ticker relevance, deduplication)
  const filteredCandidates = filterCandidateNews(rawArticles, {
    ticker: upper,
  });

  // 3. Load active report for ticker (if available) for deterministic WFV impact calculation
  const reportData = await getActiveReportForTicker(upper, repo);

  // 4. Map and save events
  let ingestedCount = 0;
  const seenThemes = new Set<string>();

  for (const article of filteredCandidates) {
    const { eventType, transmissionType, transmissionPayload } =
      mapArticleToTransmission(article);

    const isSec =
      article.publisher === "SEC EDGAR" || /form 8-k/i.test(article.title);

    // Institutional Materiality Guardrail:
    // Only persist events with an active fundamental transmission vector or official SEC Form 8-K
    if (transmissionType === "none" && !isSec) {
      continue;
    }

    // Deduplicate repetitive events with identical transmission payload (e.g. wire echoes for a single buyback)
    const themeKey = `${transmissionType}-${transmissionPayload?.driverId || transmissionPayload?.segmentName || (transmissionPayload as any)?.analystAction?.firm || eventType}`;
    if (seenThemes.has(themeKey) && eventType !== "analyst_rating") {
      continue;
    }
    seenThemes.add(themeKey);

    const publishedAt = article.publishedAt
      ? new Date(article.publishedAt)
      : new Date();

    const eventId = `evt-${upper.toLowerCase()}-${publishedAt.getTime()}-${Math.random().toString(36).substring(2, 6)}`;

    // Build temporary MarketEvent for deterministic WFV calculation
    const tempEvent: MarketEvent = {
      id: eventId,
      ticker: upper,
      title: article.title,
      summary: article.summary || article.title,
      sourceUrl: article.url,
      publisher: article.publisher,
      publishedAt: publishedAt.toISOString(),
      eventType,
      transmissionType,
      transmissionPayload,
      sources: article.url
        ? [
            {
              url: article.url,
              title: article.title,
              publisher: article.publisher,
            },
          ]
        : [],
    };

    // Deterministic arithmetic via TypeScript engine (Zero LLM math)
    const impactPct = calculateNewsTransmissionImpact(tempEvent, reportData);

    const eventInsert: MarketEventInsert = {
      id: eventId,
      ticker: upper,
      title: article.title,
      summary: article.summary || article.title,
      sourceUrl: article.url,
      publisher: article.publisher,
      publishedAt,
      eventType,
      transmissionType,
      transmissionPayload,
      impliedWfvImpactPct: impactPct != null ? String(impactPct) : undefined,
    };

    await repo.saveMarketEvent(eventInsert);
    ingestedCount++;
  }

  // 5. Fetch all events for ticker
  const events = await repo.getMarketEvents(upper, 50);

  return {
    success: true,
    ingestedCount,
    events,
  };
}

export interface FetchPolygonGlobalNewsOptions {
  lookbackDays?: number;
  limit?: number;
  apiKey?: string;
}

/**
 * Fetch top global marketplace news articles across all US exchanges
 * from Polygon.io / Massive.com Reference News API.
 */
export async function fetchPolygonGlobalNews(
  options?: FetchPolygonGlobalNewsOptions
): Promise<RawNewsArticle[]> {
  const token = getPolygonApiKey(options?.apiKey);
  if (!token) {
    return [];
  }

  const limit = options?.limit ?? 1000;
  const url = new URL("https://api.polygon.io/v2/reference/news");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("order", "desc");
  url.searchParams.set("sort", "published_utc");
  url.searchParams.set("apiKey", token);

  if (options?.lookbackDays && options.lookbackDays > 0) {
    const gteDate = new Date(
      Date.now() - options.lookbackDays * 86400 * 1000
    ).toISOString();
    url.searchParams.set("published_utc.gte", gteDate);
  }

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((item: any) => ({
      title: item.title || "",
      publisher:
        (typeof item.publisher === "object"
          ? item.publisher?.name
          : item.publisher) || "Polygon News",
      url: item.article_url || item.url,
      publishedAt:
        item.published_utc || item.publishedAt || new Date().toISOString(),
      tickers: Array.isArray(item.tickers) ? item.tickers : [],
      summary: item.description || item.summary || "",
    }));
  } catch (err) {
    console.warn("⚠️ Warning fetching Polygon global news:", err);
    return [];
  }
}

export interface IngestFirehoseOptions {
  lookbackDays?: number;
  limit?: number;
  apiKey?: string;
  repository?: IReportRepository;
}

export interface IngestFirehoseResult {
  success: boolean;
  totalFetched: number;
  totalIngested: number;
  eventsByTicker: Record<string, MarketEventSelect[]>;
}

/**
 * Ingests global marketplace news firehose via Polygon.io Reference News API,
 * matches candidates against the active universe in memory, filters noise & legal spam,
 * maps deterministic fundamental transmissions, calculates implied WFV impact,
 * and persists verified events to Neon DB.
 */
export async function ingestGlobalNewsFirehose(
  options?: IngestFirehoseOptions
): Promise<IngestFirehoseResult> {
  const repo = options?.repository || getReportRepository();
  const rawArticles = await fetchPolygonGlobalNews(options);

  // 1. Identify active universe from repository reports and active database tickers
  const reportSummaries = await repo.listReports();
  const activeTickers = new Set<string>();

  for (const s of reportSummaries) {
    if (s.ticker) {
      activeTickers.add(s.ticker.toUpperCase());
    }
  }

  try {
    if (process.env.DATABASE_URL) {
      const { getDb } = await import("@/db");
      const { tickersTable } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      const db = getDb();
      const rows = await db
        .select({ ticker: tickersTable.ticker })
        .from(tickersTable)
        .where(eq(tickersTable.active, true));

      for (const r of rows) {
        if (r.ticker) {
          activeTickers.add(r.ticker.toUpperCase());
        }
      }
    }
  } catch {
    // Ignore DB errors in mock / test environments
  }

  if (activeTickers.size === 0 || rawArticles.length === 0) {
    return {
      success: true,
      totalFetched: rawArticles.length,
      totalIngested: 0,
      eventsByTicker: {},
    };
  }

  // 2. Pre-load active reports for covered tickers
  const reportsByTicker = new Map<string, ReportData | null>();
  for (const ticker of activeTickers) {
    const reportData = await getActiveReportForTicker(ticker, repo);
    reportsByTicker.set(ticker, reportData);
  }

  let totalIngested = 0;
  const tickersWithNewEvents = new Set<string>();

  // 3. For each active ticker, match and ingest relevant candidate articles
  for (const ticker of activeTickers) {
    const matchedArticles = rawArticles.filter((article) =>
      isRelevantToTicker(article, ticker)
    );

    if (matchedArticles.length === 0) {
      continue;
    }

    // Filter candidates (clickbait, legal solicitation spam, wire deduplication)
    const filteredCandidates = filterCandidateNews(matchedArticles, {
      ticker,
    });

    const reportData = reportsByTicker.get(ticker) ?? null;
    const seenThemes = new Set<string>();

    for (const article of filteredCandidates) {
      const { eventType, transmissionType, transmissionPayload } =
        mapArticleToTransmission(article);

      const isSec =
        article.publisher === "SEC EDGAR" || /form 8-k/i.test(article.title);

      // Materiality Guardrail:
      // Only persist events with an active fundamental transmission vector or official Form 8-K
      if (transmissionType === "none" && !isSec) {
        continue;
      }

      // Deduplicate repetitive events with identical transmission payload per ticker
      const themeKey = `${ticker}-${transmissionType}-${
        transmissionPayload?.driverId ||
        transmissionPayload?.segmentName ||
        (transmissionPayload as any)?.analystAction?.firm ||
        eventType
      }`;
      if (seenThemes.has(themeKey) && eventType !== "analyst_rating") {
        continue;
      }
      seenThemes.add(themeKey);

      const publishedAt = article.publishedAt
        ? new Date(article.publishedAt)
        : new Date();

      const eventId = `evt-${ticker.toLowerCase()}-${publishedAt.getTime()}-${Math.random()
        .toString(36)
        .substring(2, 6)}`;

      const tempEvent: MarketEvent = {
        id: eventId,
        ticker,
        title: article.title,
        summary: article.summary || article.title,
        sourceUrl: article.url,
        publisher: article.publisher,
        publishedAt: publishedAt.toISOString(),
        eventType,
        transmissionType,
        transmissionPayload,
        sources: article.url
          ? [
              {
                url: article.url,
                title: article.title,
                publisher: article.publisher,
              },
            ]
          : [],
      };

      // Pure TypeScript deterministic WFV impact calculation
      const impactPct = calculateNewsTransmissionImpact(tempEvent, reportData);

      const eventInsert: MarketEventInsert = {
        id: eventId,
        ticker,
        title: article.title,
        summary: article.summary || article.title,
        sourceUrl: article.url,
        publisher: article.publisher,
        publishedAt,
        eventType,
        transmissionType,
        transmissionPayload,
        impliedWfvImpactPct: impactPct != null ? String(impactPct) : undefined,
      };

      await repo.saveMarketEvent(eventInsert);
      totalIngested++;
      tickersWithNewEvents.add(ticker);
    }
  }

  // 4. Retrieve event pools for updated tickers
  const eventsByTicker: Record<string, MarketEventSelect[]> = {};
  for (const ticker of tickersWithNewEvents) {
    eventsByTicker[ticker] = await repo.getMarketEvents(ticker, 50);
  }

  return {
    success: true,
    totalFetched: rawArticles.length,
    totalIngested,
    eventsByTicker,
  };
}
