import type {
  Facts,
  AnalystEstimates,
  Reactions,
  FinancialModelBaseline,
  Scenarios,
  Catalysts,
  MoatCompetitors,
  EarningsSentiment,
  FilingExtracts,
  TechnicalLevelsPayload,
} from "@/lib/schemas";

export type {
  Facts,
  AnalystEstimates,
  Reactions,
  FinancialModelBaseline,
  Scenarios,
  Catalysts,
  MoatCompetitors,
  EarningsSentiment,
  FilingExtracts,
  TechnicalLevelsPayload,
};

// --- Rating & Action Localization Mappings ---
export const RATING_ZH_MAP: Record<string, string> = {
  "strong buy": "强烈推荐买入 (Strong Buy)",
  buy: "买入 (Buy)",
  outperform: "跑赢大盘 (Outperform)",
  overweight: "超配 (Overweight)",
  positive: "积极 (Positive)",
  hold: "持有 (Hold)",
  neutral: "中性 (Neutral)",
  "equal-weight": "平配 (Equal-Weight)",
  "market perform": "同步大盘 (Market Perform)",
  underperform: "跑输大盘 (Underperform)",
  underweight: "低配 (Underweight)",
  sell: "卖出 (Sell)",
};

export const ACTION_ZH_MAP: Record<string, string> = {
  raises: "上调 (Raised)",
  raised: "上调 (Raised)",
  lowers: "下调 (Lowered)",
  lowered: "下调 (Lowered)",
  maintains: "重申 (Maintained)",
  maintained: "重申 (Maintained)",
  reiterates: "重申 (Reiterated)",
  reiterated: "重申 (Reiterated)",
  announces: "首次覆盖 (Initiated)",
  initiates: "首次覆盖 (Initiated)",
  initiated: "首次覆盖 (Initiated)",
  upgrades: "调高 (Upgraded)",
  upgraded: "调高 (Upgraded)",
  downgrades: "调低 (Downgraded)",
  downgraded: "调低 (Downgraded)",
};

// --- Type Definitions ---
export interface QuarterlyFinancialStatement {
  date: string;
  fiscalPeriod?: string;
  fiscalYear?: string;
  revenueBillions: number;
  grossProfitBillions?: number;
  operatingIncomeBillions: number;
  netIncomeBillions: number;
  dilutedEps?: number;
  basicEps?: number;
  dilutedAverageSharesBillions?: number;
}

export interface BalanceSheetSummary {
  date?: string;
  cashAndCashEquivalentsBillions: number;
  shortTermInvestmentsBillions: number;
  totalCashBillions: number;
  shortTermDebtBillions: number;
  longTermDebtBillions: number;
  totalDebtBillions: number;
  totalAssetsBillions: number;
  totalLiabilitiesBillions: number;
  totalEquityBillions: number;
}

export interface CashFlowSummary {
  date?: string;
  operatingCashFlowBillions: number;
  capitalExpenditureBillions: number;
  freeCashFlowBillions: number;
}

export interface FinancialProfile {
  ticker: string;
  companyName: string;
  currentPrice: number;
  previousClose?: number;
  marketCapBillions: number;
  trailingPE?: number;
  forwardPE?: number;
  trailingEps?: number;
  forwardEpsConsensus?: number;
  sharesOutstandingBillions: number;
  currency: string;
  quarterlyStatements: QuarterlyFinancialStatement[];
  balanceSheet: BalanceSheetSummary;
  cashFlow: CashFlowSummary;
  dataSource: string;
  technicalLevels?: TechnicalLevelsPayload;
}

export interface SecFilingItem {
  form: string;
  filedDate: string;
  acceptedDate?: string;
  reportUrl: string;
  filingUrl?: string;
  accessNumber?: string;
}

export interface PipelineDataBundle {
  ticker: string;
  asOfDate: string;
  profile: FinancialProfile;
  analystEstimatesEn: AnalystEstimates;
  analystEstimatesZh: AnalystEstimates;
  reactions: Reactions;
  filings: SecFilingItem[];
  factsDraft: Facts;
  factsZh: Facts;
  baseline: FinancialModelBaseline;
  scenariosEn: Scenarios;
  scenariosZh: Scenarios;
  moatEn: MoatCompetitors;
  moatZh: MoatCompetitors;
  catalystsEn: Catalysts;
  catalystsZh: Catalysts;
  sentiment: EarningsSentiment;
  filingEn: FilingExtracts;
  filingZh: FilingExtracts;
  technicalLevels?: TechnicalLevelsPayload;
}

export interface PipelineBundleOptions {
  benchmarkPrice?: number;
  quarterStr?: string;
  apiKey?: string;
  massiveApiKey?: string;
}
