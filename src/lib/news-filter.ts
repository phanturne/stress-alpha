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
  "SeekingAlpha",
  "Seeking Alpha",
]);

// Algorithmic headline clickbait patterns & retail noise formulas
export const JUNK_HEADLINE_PATTERNS = [
  /why .* is (up|down|moving|plunging|surging) today/i,
  /\d+ (stocks|tech stocks|dividend stocks|etfs|reasons) to (buy|sell|avoid|hold|load up)/i,
  /forget .*, (buy|invest in) .* instead/i,
  /options trading alert/i,
  /better buy:/i,
  /zacks rank/i,
  /here's why/i,
  /should you buy/i,
  /could soar \d+%/i,
  /\b(make you a )?millionaire(-maker)?\b/i,
  /bull of the day/i,
  /bear of the day/i,
  // Class action & legal solicitation spam
  /securities class action|class action lawsuit|investor counsel|reminds investors of|deadline alert|shareholder rights law firm|shareholder alert|lead plaintiff|encourages .* investors to secure counsel/i,

  // Wealth prediction & future fortune formulas
  /(turn|worth|invest(ed|ing)?).*\$?\d+.*(into|by|in 20\d\d)/i,
  /\$?\d+[\d,]*\s*(invested|split across|put into|into).*(worth|by 20\d\d)/i,
  /\$?\d+[\d,]*\s*could be worth.*by 20\d\d/i,
  /here's what \$\d+[\d,]*.*(worth|by 20\d\d)/i,
  /prediction:? .*(turn|fortune|worth|10x|double|soar|millionaire|spends more)/i,
  /history says/i,
  /what history says/i,
  /buy (the dip|now|today|or wait|or pause|into strength)/i,

  // Stock comparison clickbait
  /\b(better|best) .* stock:? .* vs\.? .*/i,
  /\bwhich .* stock is the better investment\b/i,
  /how much upside is left/i,
  /\bnot\s+(nvidia|micron|tsmc|amd|apple|intel)\b/i,
  /\(hint:\s*not\b/i,
  /\b(crushing|trouncing|beating|outperforming)\s+.*(nvidia|micron|amd|tsmc|apple)\b/i,

  // Celebrity investors & political noise
  /\b(trump|president trump|white house|ballroom|biden|cramer|jim cramer|cathie wood|michael burry|burry|warren buffett|buffett|charlie munger|elon musk|musk|peter thiel|ross gerber|chamath|kevin o'leary|martin shkreli|shkreli)\b/i,

  // Rhetorical question headlines (retail blogs / opinion inquiries)
  /\b(why|is|can|does|could|what|how|who|which|should|will)\b.*\?\s*$/i,
  /\?\s*$/i,

  // Technical analysis spam
  /broke support|break(ing)? support|support levels?|golden cross|death cross|resistance levels?|oversold|overbought/i,

  // Broad market / weekly roundup digests
  /week in review|weekly wrap|weekend edition|breakfast news|stocks? of the week|tough trading|indices in the red|how major us stock indexes fared|equity indexes slide|nasdaq falls|losing streak/i,
  /\b(dow|nasdaq|s&p|sp500|futures|indices)\b.*(premarket|sinking|subdued|rise|plunge|tumble|slide|session|today|red|slump)/i,
  /stocks? in focus|featured highlights|buzzing about|trending stock|what to know beyond/i,
  /worst-performing|best-performing|cashing in on the sell-off/i,

  // Personal portfolio / opinion clickbait
  /if i had to pick|i just bought more|my top dividend|my top stock|here's what i'd buy|look who's/i,
  /opening your eyes right now/i,
  /stock alert:/i,
  /trades at \d+x forward earnings: is it a bargain/i,
  /lost its \$\d+ trillion status/i,
  /exclusive: forget/i,
  /this is the flight-to-safety play/i,
  /the moment .* realized/i,
  /won't have to die/i,
  /rides rollercoaster/i,
  /rally fizzles/i,
  /chart of the day/i,

  // FOMO / late-to-the-party prompts
  /think it's too late|missed out on|are you missing out|too cheap to ignore/i,
  /screens as a decent value/i,
  /top ai stocks:/i,
  /\b(vgt|voo|spy|qqq)\b/i,
  /etfs to shield/i,
  /high-yield .* to load up/i,

  // Third-party market research report sales pitches & paywalled study promos
  /\bmarket (analysis|research|report|size|share|growth|trends|forecast|outlook)\b.*(\d{4}[-\s]\d{4}|to reach \$|\bcagr\b)/i,
  /\b(research and markets|technavio|grand view research|marketsandmarkets|allied market research)\b/i,
];

// Common ticker aliases and related supply-chain keywords for relevance filtering
export const TICKER_KEYWORD_MAP: Record<string, string[]> = {
  NVDA: [
    "nvda",
    "nvidia",
    "blackwell",
    "hopper",
    "geforce",
    "tsmc",
    "tsm",
    "asml",
    "broadcom",
    "avgo",
    "cowos",
  ],
  MU: [
    "mu",
    "micron",
    "dram",
    "nand",
    "hbm",
    "hbm3e",
    "hbm4",
    "sk hynix",
    "samsung memory",
    "sandisk",
    "western digital",
    "wdc",
    "netlist",
  ],
  TSLA: [
    "tsla",
    "tesla",
    "cybertruck",
    "full self-driving",
    "fsd",
    "megapack",
    "dojo",
    "robotaxi",
  ],
  MSFT: ["msft", "microsoft", "azure", "copilot", "openai"],
  AAPL: [
    "aapl",
    "apple",
    "iphone",
    "apple silicon",
    "ipad",
    "macbook",
    "services",
  ],
  GOOGL: ["googl", "goog", "alphabet", "google", "gemini", "tpu", "waymo"],
  AMD: ["amd", "advanced micro devices", "mi300", "ryzen", "epyc", "tsmc"],
  TSM: ["tsm", "tsmc", "taiwan semi", "taiwan semiconductor", "cowos", "asml"],
  ASML: ["asml", "euv", "lithography", "tsmc", "intel", "samsung"],
  INTC: ["intc", "intel", "18a", "foundry", "gaudi", "x86"],
};

export interface RawNewsArticle {
  title: string;
  publisher: string;
  url?: string;
  publishedAt?: string;
  tickers?: string[];
  summary?: string;
}

/**
 * Checks if a news article is directly relevant to a target ticker or its verified upstream partners.
 */
export function isRelevantToTicker(
  article: RawNewsArticle,
  targetTicker?: string
): boolean {
  if (!targetTicker) return true;

  const upper = targetTicker.toUpperCase();
  const title = article.title;
  const titleLower = title.toLowerCase();
  const text = `${title} ${article.summary || ""}`.toLowerCase();

  // SEC filings for the ticker are always relevant
  if (article.publisher === "SEC EDGAR" || /form 8-k/i.test(title)) {
    if (
      article.tickers &&
      article.tickers.length > 0 &&
      !article.tickers.some((t) => t.toUpperCase() === upper) &&
      !new RegExp(`\\b${upper.toLowerCase()}\\b`, "i").test(text)
    ) {
      return false;
    }
    return true;
  }

  const allowedPartners: Record<string, string[]> = {
    NVDA: ["TSM", "ASML", "NVDA", "AVGO", "MSFT"],
    MU: ["MU", "TSM", "WDC"],
    AAPL: ["AAPL", "TSM"],
    AMD: ["AMD", "TSM"],
  };
  const allowed = allowedPartners[upper] || [upper];

  // If the title contains another ticker in parentheses like (DHR), (AKAM), (NLST),
  // reject unless it is the target ticker or an approved upstream partner.
  const tickerMatch = title.match(/\(([A-Z]{1,5})\)/);
  if (tickerMatch) {
    const symbol = tickerMatch[1].toUpperCase();
    if (!allowed.includes(symbol)) {
      return false;
    }
  }

  // 1. Explicit ticker list from metadata (target ticker or approved partner)
  if (
    article.tickers &&
    article.tickers.some((t) => allowed.includes(t.toUpperCase()))
  ) {
    return true;
  }

  // 2. Check keyword aliases in title & summary
  const keywords = TICKER_KEYWORD_MAP[upper] || [upper.toLowerCase()];
  return keywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(text));
}

/**
 * Checks if a news article is algorithmic syndication junk or clickbait.
 * Pure deterministic string & regex check with 0 LLM cost.
 */
export function isClickbaitOrJunk(title: string, publisher: string): boolean {
  if (!title || !publisher) return true;

  const pubLower = publisher.toLowerCase().trim();

  // Check publisher blacklist
  if (
    JUNK_PUBLISHERS.has(publisher.trim()) ||
    pubLower.includes("seekingalpha") ||
    pubLower.includes("seeking alpha")
  ) {
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
 * Determines if a market headline meets the materiality threshold
 * to justify structured transmission extraction.
 */
export function isMaterialMarketEvent(
  params: MaterialityEvaluationParams
): boolean {
  // If it's pure clickbait, reject immediately unless backed by verified SEC filing
  if (
    !params.isSecFiling &&
    isClickbaitOrJunk(params.title, params.publisher)
  ) {
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

  if (
    params.priceMovePct !== undefined &&
    Math.abs(params.priceMovePct) >= 3.0
  ) {
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
    /buyback/i,
    /share repurchase/i,
    /settlement/i,
    /upgrade|downgrade/i,
    /price target/i,
    /record results|record profit/i,
    /pledges.*research|fab expansion/i,
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

export interface FilterCandidateNewsOptions {
  ticker?: string;
  requireMateriality?: boolean;
  priceMovePct?: number;
  abnormalReturnSigma?: number;
  isSecFiling?: boolean;
  isAnalystRevision?: boolean;
}

/**
 * Filters and deduplicates raw news candidates.
 * Strips out clickbait syndicators, filters by target ticker relevance,
 * deduplicates repetitive syndicated wires, and optionally enforces structural materiality.
 */
export function filterCandidateNews(
  articles: RawNewsArticle[],
  options?: FilterCandidateNewsOptions
): RawNewsArticle[] {
  // 1. Filter by ticker relevance if target ticker is specified
  const relevantArticles = options?.ticker
    ? articles.filter((article) => isRelevantToTicker(article, options.ticker))
    : articles;

  // 2. Remove clickbait and deduplicate
  const deduplicated = deduplicateArticles(relevantArticles);

  if (!options?.requireMateriality) {
    return deduplicated;
  }

  return deduplicated.filter((article) => {
    const isSec =
      options.isSecFiling ||
      article.publisher.toLowerCase().includes("sec") ||
      article.title.toLowerCase().includes("form 8-k");

    return isMaterialMarketEvent({
      title: article.title,
      publisher: article.publisher,
      priceMovePct: options.priceMovePct,
      abnormalReturnSigma: options.abnormalReturnSigma,
      isSecFiling: isSec,
      isAnalystRevision: options.isAnalystRevision,
    });
  });
}
