import type { ReportSummary } from "@/lib/repository/types";
import type { Locale } from "@/lib/i18n";

export interface SectorDefinition {
  id: string;
  etf: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  iconName: string;
  weightPct: number; // approximate S&P 500 weight
}

export const GICS_SECTORS: SectorDefinition[] = [
  {
    id: "technology",
    etf: "XLK",
    nameEn: "Information Technology",
    nameZh: "信息技术与软件",
    descriptionEn:
      "Semiconductors, cloud infrastructure, AI hardware & enterprise software",
    descriptionZh: "半导体、云计算、人工智能硬件与企业级软件",
    iconName: "Cpu",
    weightPct: 31.5,
  },
  {
    id: "communication",
    etf: "XLC",
    nameEn: "Communication Services",
    nameZh: "通信与互动媒体",
    descriptionEn:
      "Social platforms, streaming entertainment, search & telecom networks",
    descriptionZh: "社交平台、流媒体娱乐、搜索引擎与电信网络",
    iconName: "Globe",
    weightPct: 9.1,
  },
  {
    id: "consumer_discretionary",
    etf: "XLY",
    nameEn: "Consumer Discretionary",
    nameZh: "非必需消费品",
    descriptionEn:
      "E-commerce, electric vehicles, retail & discretionary consumer goods",
    descriptionZh: "电商平台、新能源汽车、非必需零售消费",
    iconName: "ShoppingBag",
    weightPct: 10.2,
  },
  {
    id: "financials",
    etf: "XLF",
    nameEn: "Financials",
    nameZh: "金融与金融科技",
    descriptionEn:
      "Investment banking, retail brokerages, payment networks & asset managers",
    descriptionZh: "投资银行、券商经纪、支付网络与财富资产管理",
    iconName: "Landmark",
    weightPct: 13.0,
  },
  {
    id: "healthcare",
    etf: "XLV",
    nameEn: "Health Care",
    nameZh: "医疗健康与生物制药",
    descriptionEn:
      "Pharmaceuticals, biotech, medical devices & health insurance",
    descriptionZh: "制药创新、生物科技、医疗设备与商业健康保险",
    iconName: "Activity",
    weightPct: 11.4,
  },
  {
    id: "industrials",
    etf: "XLI",
    nameEn: "Industrials & Defense",
    nameZh: "工业制造与商业航天",
    descriptionEn:
      "Aerospace & defense, commercial transport, robotics & heavy machinery",
    descriptionZh: "商业航天、国防军工、现代交通运输与智能自动化装备",
    iconName: "Boxes",
    weightPct: 8.4,
  },
  {
    id: "consumer_staples",
    etf: "XLP",
    nameEn: "Consumer Staples",
    nameZh: "主要日常消费品",
    descriptionEn:
      "Food, beverage, household goods & discount wholesale retail",
    descriptionZh: "食品饮料、家庭必需品与大型折扣量贩连锁",
    iconName: "Apple",
    weightPct: 5.8,
  },
  {
    id: "energy",
    etf: "XLE",
    nameEn: "Energy",
    nameZh: "传统与清洁能源",
    descriptionEn:
      "Oil & gas exploration, refining, LNG distribution & energy services",
    descriptionZh: "石油与天然气勘探、炼化提炼、液化天然气与能源服务",
    iconName: "Flame",
    weightPct: 3.7,
  },
  {
    id: "utilities",
    etf: "XLU",
    nameEn: "Utilities",
    nameZh: "公用事业与清洁电力",
    descriptionEn:
      "Regulated electric utilities, nuclear energy & renewable grid operators",
    descriptionZh: "核电与电网运营、清洁绿电与城市公用管网基础设施",
    iconName: "Zap",
    weightPct: 2.5,
  },
  {
    id: "real_estate",
    etf: "XLRE",
    nameEn: "Real Estate",
    nameZh: "房地产与数据中心REITs",
    descriptionEn:
      "AI data center REITs, logistics warehouses & commercial properties",
    descriptionZh: "人工智能算力数据中心REITs、现代物流仓储与商业物业",
    iconName: "Building2",
    weightPct: 2.1,
  },
  {
    id: "materials",
    etf: "XLB",
    nameEn: "Materials",
    nameZh: "基础材料与特种化学",
    descriptionEn:
      "Industrial gases, specialty chemicals, copper & semiconductor metals",
    descriptionZh: "工业特种气体、化学新材料、铜与半导体高纯金属",
    iconName: "Layers",
    weightPct: 2.3,
  },
];

// Direct mapping of key market tickers to their GICS Sector ID
export const TICKER_SECTOR_MAP: Record<string, string> = {
  // Technology
  NVDA: "technology",
  AAPL: "technology",
  MSFT: "technology",
  AVGO: "technology",
  AMD: "technology",
  ORCL: "technology",
  NOW: "technology",
  CSCO: "technology",
  IBM: "technology",
  INTC: "technology",
  MRVL: "technology",
  MU: "technology",
  SMCI: "technology",
  SNDK: "technology",
  LITE: "technology",
  PLTR: "technology",
  CRM: "technology",
  ADBE: "technology",
  TXN: "technology",
  QCOM: "technology",
  AMAT: "technology",
  LRCX: "technology",
  PANW: "technology",
  CRWD: "technology",

  // Communication Services
  META: "communication",
  GOOGL: "communication",
  GOOG: "communication",
  NFLX: "communication",
  RDDT: "communication",
  DIS: "communication",
  TMUS: "communication",
  VZ: "communication",
  CMCSA: "communication",
  CHTR: "communication",

  // Consumer Discretionary
  AMZN: "consumer_discretionary",
  TSLA: "consumer_discretionary",
  HD: "consumer_discretionary",
  MCD: "consumer_discretionary",
  NKE: "consumer_discretionary",
  SBUX: "consumer_discretionary",
  BKNG: "consumer_discretionary",
  LOW: "consumer_discretionary",
  TJX: "consumer_discretionary",
  LULU: "consumer_discretionary",

  // Financials
  JPM: "financials",
  BAC: "financials",
  WFC: "financials",
  GS: "financials",
  MS: "financials",
  V: "financials",
  MA: "financials",
  HOOD: "financials",
  BLK: "financials",
  AXP: "financials",
  C: "financials",
  SPGI: "financials",
  PYPL: "financials",
  COIN: "financials",

  // Health Care
  LLY: "healthcare",
  UNH: "healthcare",
  JNJ: "healthcare",
  ABBV: "healthcare",
  MRK: "healthcare",
  PFE: "healthcare",
  TMO: "healthcare",
  ABT: "healthcare",
  ISRG: "healthcare",
  AMGN: "healthcare",

  // Industrials
  GE: "industrials",
  CAT: "industrials",
  UNP: "industrials",
  HON: "industrials",
  RTX: "industrials",
  BA: "industrials",
  RKLB: "industrials",
  ONDS: "industrials",
  LMT: "industrials",
  DE: "industrials",
  GD: "industrials",
  ETN: "industrials",

  // Consumer Staples
  PG: "consumer_staples",
  COST: "consumer_staples",
  WMT: "consumer_staples",
  KO: "consumer_staples",
  PEP: "consumer_staples",
  PM: "consumer_staples",
  MDLZ: "consumer_staples",
  CL: "consumer_staples",

  // Energy
  XOM: "energy",
  CVX: "energy",
  COP: "energy",
  SLB: "energy",
  EOG: "energy",
  MPC: "energy",
  PSX: "energy",

  // Utilities
  NEE: "utilities",
  SO: "utilities",
  DUK: "utilities",
  CEG: "utilities",
  SRE: "utilities",
  AEP: "utilities",
  VST: "utilities",

  // Real Estate
  PLD: "real_estate",
  AMT: "real_estate",
  EQIX: "real_estate",
  PSA: "real_estate",
  SPG: "real_estate",
  O: "real_estate",
  DLR: "real_estate",

  // Materials
  LIN: "materials",
  SHW: "materials",
  FCX: "materials",
  APD: "materials",
  NEM: "materials",
  ECL: "materials",
  DOW: "materials",
};

/**
 * Resolves a ticker's sector ID.
 */
export function getTickerSectorId(
  ticker: string,
  fallbackSector?: string
): string {
  const symbol = ticker.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (TICKER_SECTOR_MAP[symbol]) {
    return TICKER_SECTOR_MAP[symbol];
  }

  if (fallbackSector) {
    const lower = fallbackSector.toLowerCase();
    if (
      lower.includes("tech") ||
      lower.includes("semiconductor") ||
      lower.includes("software")
    ) {
      return "technology";
    }
    if (
      lower.includes("comm") ||
      lower.includes("media") ||
      lower.includes("telecom")
    ) {
      return "communication";
    }
    if (
      lower.includes("discretionary") ||
      lower.includes("auto") ||
      lower.includes("retail")
    ) {
      return "consumer_discretionary";
    }
    if (
      lower.includes("finan") ||
      lower.includes("bank") ||
      lower.includes("broker")
    ) {
      return "financials";
    }
    if (
      lower.includes("health") ||
      lower.includes("pharma") ||
      lower.includes("biotech")
    ) {
      return "healthcare";
    }
    if (
      lower.includes("industr") ||
      lower.includes("defense") ||
      lower.includes("aero")
    ) {
      return "industrials";
    }
    if (
      lower.includes("staple") ||
      lower.includes("food") ||
      lower.includes("beverage")
    ) {
      return "consumer_staples";
    }
    if (
      lower.includes("energy") ||
      lower.includes("oil") ||
      lower.includes("gas")
    ) {
      return "energy";
    }
    if (
      lower.includes("utilit") ||
      lower.includes("power") ||
      lower.includes("electric")
    ) {
      return "utilities";
    }
    if (lower.includes("estate") || lower.includes("reit")) {
      return "real_estate";
    }
    if (
      lower.includes("material") ||
      lower.includes("chemical") ||
      lower.includes("metal")
    ) {
      return "materials";
    }
  }

  return "technology"; // Default fallback
}

export function getSectorName(sectorId: string, locale: Locale): string {
  const def = GICS_SECTORS.find((s) => s.id === sectorId);
  if (!def) return sectorId;
  return locale === "zh" ? def.nameZh : def.nameEn;
}

export interface SectorAggregatedStats {
  sector: SectorDefinition;
  sectorName: string;
  changePct: number; // Market ETF daily change %
  avgUpsidePct?: number; // Average StressAlpha WFV upside %
  avgSnowflakeScore?: number; // Average Snowflake radar score (0-30)
  coveredCount: number;
  reports: ReportSummary[];
}

/**
 * Aggregates reports and ETF quote changes by GICS sector.
 */
export function aggregateSectors(
  reports: ReportSummary[],
  etfQuotes: Record<string, number>, // e.g. { XLK: -1.2, XLC: 0.5 }
  locale: Locale = "en"
): SectorAggregatedStats[] {
  // Deduplicate reports to latest quarter per ticker
  const latestReportsByTicker = new Map<string, ReportSummary>();
  for (const report of reports) {
    const symbol = report.ticker || report.slug.split("-")[0];
    const existing = latestReportsByTicker.get(symbol);
    if (
      !existing ||
      (report.quarter && existing.quarter && report.quarter > existing.quarter)
    ) {
      latestReportsByTicker.set(symbol, report);
    }
  }

  const reportsList = Array.from(latestReportsByTicker.values());

  return GICS_SECTORS.map((def) => {
    const sectorReports = reportsList.filter((r) => {
      const symbol = r.ticker || r.slug.split("-")[0];
      return getTickerSectorId(symbol, r.sector) === def.id;
    });

    // Compute average upside
    const validUpsides = sectorReports
      .map((r) => r.upsidePct)
      .filter((u): u is number => typeof u === "number" && !isNaN(u));
    const avgUpsidePct =
      validUpsides.length > 0
        ? Number(
            (
              validUpsides.reduce((a, b) => a + b, 0) / validUpsides.length
            ).toFixed(1)
          )
        : undefined;

    // Compute average snowflake
    const validSnowflakes = sectorReports
      .map((r) => r.snowflakeScore)
      .filter((s): s is number => typeof s === "number" && !isNaN(s));
    const avgSnowflakeScore =
      validSnowflakes.length > 0
        ? Number(
            (
              validSnowflakes.reduce((a, b) => a + b, 0) /
              validSnowflakes.length
            ).toFixed(1)
          )
        : undefined;

    const changePct = etfQuotes[def.etf] ?? 0;

    return {
      sector: def,
      sectorName: locale === "zh" ? def.nameZh : def.nameEn,
      changePct,
      avgUpsidePct,
      avgSnowflakeScore,
      coveredCount: sectorReports.length,
      reports: sectorReports,
    };
  });
}

export interface HeatmapConstituent {
  ticker: string;
  name: string;
  weight: number; // 1 to 5 relative weight in sector block
  defaultChangePct: number;
}

export const SP500_SECTOR_CONSTITUENTS: Record<string, HeatmapConstituent[]> = {
  technology: [
    { ticker: "AAPL", name: "Apple Inc.", weight: 5, defaultChangePct: -1.23 },
    {
      ticker: "NVDA",
      name: "NVIDIA Corp.",
      weight: 5,
      defaultChangePct: -4.22,
    },
    {
      ticker: "MSFT",
      name: "Microsoft Corp.",
      weight: 5,
      defaultChangePct: -1.55,
    },
    {
      ticker: "AVGO",
      name: "Broadcom Inc.",
      weight: 3,
      defaultChangePct: -5.48,
    },
    { ticker: "MU", name: "Micron Tech", weight: 2, defaultChangePct: -5.3 },
    {
      ticker: "AMD",
      name: "Advanced Micro",
      weight: 2,
      defaultChangePct: -10.88,
    },
    {
      ticker: "INTC",
      name: "Intel Corp.",
      weight: 2,
      defaultChangePct: -28.58,
    },
    {
      ticker: "QCOM",
      name: "Qualcomm Inc.",
      weight: 2,
      defaultChangePct: -2.4,
    },
    {
      ticker: "AMAT",
      name: "Applied Materials",
      weight: 2,
      defaultChangePct: -7.49,
    },
    {
      ticker: "LRCX",
      name: "Lam Research",
      weight: 2,
      defaultChangePct: -6.01,
    },
    { ticker: "CRM", name: "Salesforce", weight: 2, defaultChangePct: -0.75 },
    {
      ticker: "CSCO",
      name: "Cisco Systems",
      weight: 2,
      defaultChangePct: -3.76,
    },
    { ticker: "NOW", name: "ServiceNow", weight: 1, defaultChangePct: -1.1 },
    { ticker: "PLTR", name: "Palantir Tech", weight: 1, defaultChangePct: 3.4 },
    {
      ticker: "PANW",
      name: "Palo Alto Networks",
      weight: 1,
      defaultChangePct: -0.8,
    },
  ],
  communication: [
    {
      ticker: "GOOGL",
      name: "Alphabet Cl A",
      weight: 5,
      defaultChangePct: -1.4,
    },
    {
      ticker: "META",
      name: "Meta Platforms",
      weight: 5,
      defaultChangePct: -1.53,
    },
    { ticker: "NFLX", name: "Netflix Inc.", weight: 3, defaultChangePct: 1.15 },
    { ticker: "DIS", name: "Walt Disney", weight: 2, defaultChangePct: -0.45 },
    { ticker: "TMUS", name: "T-Mobile US", weight: 2, defaultChangePct: 0.32 },
    { ticker: "VZ", name: "Verizon Comm", weight: 1, defaultChangePct: -0.2 },
    {
      ticker: "CMCSA",
      name: "Comcast Corp",
      weight: 1,
      defaultChangePct: -0.6,
    },
  ],
  consumer_discretionary: [
    { ticker: "AMZN", name: "Amazon.com", weight: 5, defaultChangePct: -1.41 },
    { ticker: "TSLA", name: "Tesla Inc.", weight: 5, defaultChangePct: -0.87 },
    { ticker: "HD", name: "Home Depot", weight: 3, defaultChangePct: 0.42 },
    { ticker: "MCD", name: "McDonald's", weight: 2, defaultChangePct: 0.15 },
    {
      ticker: "BKNG",
      name: "Booking Holdings",
      weight: 2,
      defaultChangePct: -1.1,
    },
    { ticker: "NKE", name: "Nike Inc.", weight: 1, defaultChangePct: -2.05 },
    { ticker: "TJX", name: "TJX Companies", weight: 1, defaultChangePct: 0.65 },
  ],
  financials: [
    {
      ticker: "BRK-B",
      name: "Berkshire Hathaway",
      weight: 5,
      defaultChangePct: 0.1,
    },
    {
      ticker: "JPM",
      name: "JPMorgan Chase",
      weight: 5,
      defaultChangePct: -1.9,
    },
    { ticker: "V", name: "Visa Inc.", weight: 3, defaultChangePct: 0.74 },
    {
      ticker: "MA",
      name: "Mastercard Inc.",
      weight: 3,
      defaultChangePct: 0.36,
    },
    {
      ticker: "BAC",
      name: "Bank of America",
      weight: 2,
      defaultChangePct: -1.45,
    },
    { ticker: "WFC", name: "Wells Fargo", weight: 2, defaultChangePct: -0.9 },
    { ticker: "MS", name: "Morgan Stanley", weight: 1, defaultChangePct: -0.7 },
    { ticker: "GS", name: "Goldman Sachs", weight: 1, defaultChangePct: -0.4 },
  ],
  healthcare: [
    { ticker: "LLY", name: "Eli Lilly", weight: 5, defaultChangePct: 3.19 },
    { ticker: "UNH", name: "UnitedHealth", weight: 4, defaultChangePct: 0.85 },
    {
      ticker: "JNJ",
      name: "Johnson & Johnson",
      weight: 3,
      defaultChangePct: -0.73,
    },
    { ticker: "ABBV", name: "AbbVie Inc.", weight: 3, defaultChangePct: 1.41 },
    { ticker: "MRK", name: "Merck & Co.", weight: 2, defaultChangePct: -0.3 },
    { ticker: "TMO", name: "Thermo Fisher", weight: 2, defaultChangePct: 0.2 },
    { ticker: "ABT", name: "Abbott Labs", weight: 1, defaultChangePct: 0.55 },
  ],
  consumer_staples: [
    { ticker: "WMT", name: "Walmart Inc.", weight: 5, defaultChangePct: 1.86 },
    {
      ticker: "COST",
      name: "Costco Wholesale",
      weight: 4,
      defaultChangePct: 0.95,
    },
    {
      ticker: "PG",
      name: "Procter & Gamble",
      weight: 4,
      defaultChangePct: 0.61,
    },
    { ticker: "KO", name: "Coca-Cola", weight: 2, defaultChangePct: 1.36 },
    { ticker: "PEP", name: "PepsiCo", weight: 2, defaultChangePct: 0.4 },
    { ticker: "PM", name: "Philip Morris", weight: 1, defaultChangePct: 0.14 },
  ],
  industrials: [
    { ticker: "GE", name: "GE Aerospace", weight: 4, defaultChangePct: -1.2 },
    { ticker: "CAT", name: "Caterpillar", weight: 4, defaultChangePct: -1.8 },
    { ticker: "RTX", name: "RTX Corp.", weight: 3, defaultChangePct: -0.9 },
    { ticker: "UNP", name: "Union Pacific", weight: 2, defaultChangePct: -0.4 },
    { ticker: "BA", name: "Boeing Co.", weight: 2, defaultChangePct: -3.1 },
    { ticker: "HON", name: "Honeywell", weight: 2, defaultChangePct: -0.85 },
  ],
  energy: [
    { ticker: "XOM", name: "Exxon Mobil", weight: 5, defaultChangePct: 2.16 },
    { ticker: "CVX", name: "Chevron Corp.", weight: 4, defaultChangePct: 1.75 },
    { ticker: "COP", name: "ConocoPhillips", weight: 2, defaultChangePct: 1.4 },
    { ticker: "SLB", name: "SLB", weight: 2, defaultChangePct: 0.9 },
  ],
  utilities: [
    {
      ticker: "NEE",
      name: "NextEra Energy",
      weight: 4,
      defaultChangePct: 0.67,
    },
    { ticker: "SO", name: "Southern Co.", weight: 2, defaultChangePct: 0.45 },
    { ticker: "CEG", name: "Constellation", weight: 2, defaultChangePct: 1.8 },
  ],
  real_estate: [
    { ticker: "PLD", name: "Prologis Inc.", weight: 4, defaultChangePct: 0.26 },
    { ticker: "EQIX", name: "Equinix Inc.", weight: 3, defaultChangePct: 0.8 },
    {
      ticker: "AMT",
      name: "American Tower",
      weight: 2,
      defaultChangePct: -0.3,
    },
  ],
  materials: [
    { ticker: "LIN", name: "Linde plc", weight: 5, defaultChangePct: 0.4 },
    {
      ticker: "SHW",
      name: "Sherwin-Williams",
      weight: 3,
      defaultChangePct: -0.6,
    },
    {
      ticker: "FCX",
      name: "Freeport-McMoRan",
      weight: 2,
      defaultChangePct: 1.1,
    },
  ],
};
