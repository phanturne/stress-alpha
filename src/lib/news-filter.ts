/**
 * Deterministic News Materiality & Clickbait Filtering Engine
 * Filters out syndication spam, automated bot articles, and noise before LLM extraction.
 */

// Known low-signal / automated clickbait syndicators
export const JUNK_PUBLISHERS = new Set([
  "Motley Fool",
  "The Motley Fool",
  "Zacks Investment Research",
  "Zacks",
  "InvestorPlace",
  "Simply Wall St",
  "TipRanks",
  "24/7 Wall St.",
  "Barchart",
  "Insider Monkey",
]);

// Algorithmic headline clickbait patterns
export const JUNK_HEADLINE_PATTERNS = [
  /why .* is (up|down|moving|plunging|surging) today/i,
  /3 (stocks|tech stocks|dividend stocks) to (buy|sell|avoid)/i,
  /forget .*, (buy|invest in) .* instead/i,
  /options trading alert/i,
  /better buy:/i,
  /zacks rank/i,
  /here's why/i,
  /should you buy/i,
  /could soar \d+%/i,
  /millionaire-maker/i,
  /bull of the day/i,
  /bear of the day/i,
  /unusual options activity/i,
];

export interface RawNewsArticle {
  title: string;
  publisher: string;
  url?: string;
  publishedAt?: string;
  tickers?: string[];
  summary?: string;
}

/**
 * Checks if a news article is algorithmic syndication junk or clickbait.
 * Pure deterministic string & regex check with 0 LLM cost.
 */
export function isClickbaitOrJunk(title: string, publisher: string): boolean {
  if (!title || !publisher) return true;

  // Check publisher blacklist
  if (JUNK_PUBLISHERS.has(publisher.trim())) {
    return true;
  }

  // Check headline regex patterns
  for (const pattern of JUNK_HEADLINE_PATTERNS) {
    if (pattern.test(title)) {
      return true;
    }
  }

  return false;
}

export interface MaterialityEvaluationParams {
  title: string;
  publisher: string;
  priceMovePct?: number;
  abnormalReturnSigma?: number;
  isSecFiling?: boolean;
  isAnalystRevision?: boolean;
}

/**
 * Determines if a market headline meets the institutional materiality threshold
 * to justify structured transmission extraction.
 */
export function isMaterialMarketEvent(
  params: MaterialityEvaluationParams
): boolean {
  // If it's pure clickbait, reject immediately unless backed by verified SEC filing
  if (!params.isSecFiling && isClickbaitOrJunk(params.title, params.publisher)) {
    return false;
  }

  // 1. Mandatory pass for SEC Filings (Form 8-K, 10-Q, 10-K)
  if (params.isSecFiling) {
    return true;
  }

  // 2. Verified sell-side analyst rating / price target revision
  if (params.isAnalystRevision) {
    return true;
  }

  // 3. Statistical volatility anomaly (|R| >= 2.5 sigma or absolute move >= 3.0%)
  if (
    params.abnormalReturnSigma !== undefined &&
    Math.abs(params.abnormalReturnSigma) >= 2.5
  ) {
    return true;
  }

  if (params.priceMovePct !== undefined && Math.abs(params.priceMovePct) >= 3.0) {
    return true;
  }

  // 4. Structural keyword matching in headline (CapEx, Antitrust, Acquisition, Lawsuit, Foundry, Guideline)
  const STRUCTURAL_KEYWORDS = [
    /capex/i,
    /capital expenditure/i,
    /guidance/i,
    /antitrust/i,
    /subpoena/i,
    /doj/i,
    /sec probe/i,
    /acquisition/i,
    /merger/i,
    /restructuring/i,
    /layoff/i,
    /foundry/i,
    /packaging/i,
    /fda approval/i,
    /patent/i,
  ];

  return STRUCTURAL_KEYWORDS.some((re) => re.test(params.title));
}

/**
 * Deduplicate news articles by canonical title similarity
 * Discards repetitive wire syndication reporting the exact same news item.
 */
export function deduplicateArticles(
  articles: RawNewsArticle[]
): RawNewsArticle[] {
  const seenHeadlines = new Set<string>();
  const results: RawNewsArticle[] = [];

  for (const article of articles) {
    if (isClickbaitOrJunk(article.title, article.publisher)) {
      continue;
    }

    // Normalized headline token representation (lowercase, strip punctuation)
    const normalized = article.title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 8)
      .join(" ");

    if (seenHeadlines.has(normalized)) {
      continue;
    }

    seenHeadlines.add(normalized);
    results.push(article);
  }

  return results;
}
