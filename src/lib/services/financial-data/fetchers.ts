import path from "node:path";
import * as dotenv from "dotenv";
import YahooFinance from "yahoo-finance2";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import {
  type AnalystEstimates,
  type Reactions,
  type ReactionEvent,
  type Source,
  AnalystEstimatesSchema,
  ReactionsSchema,
} from "@/lib/schemas";
import { resilientFetch } from "../http-client";
import {
  RATING_ZH_MAP,
  ACTION_ZH_MAP,
  type QuarterlyFinancialStatement,
  type BalanceSheetSummary,
  type CashFlowSummary,
  type FinancialProfile,
  type PeerBenchmarkMetrics,
  type SecFilingItem,
} from "./types";
import { computeTechnicalLevels, type DailyBar } from "@/lib/technical";
import { safeNum, round2, round3 } from "./utils";

const yf = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
  validation: { logErrors: false },
});

// --- External API Clients ---

const SEC_EDGAR_HEADERS = {
  "User-Agent": "StressAlphaResearch/1.0 (contact@stressalpha.app)",
  Accept: "application/json",
};

let secCikMapCache: Map<string, string> | null = null;

async function resolveSecCik(ticker: string): Promise<string | null> {
  const norm = ticker.toUpperCase().trim();
  if (!secCikMapCache) {
    try {
      const res = await resilientFetch(
        "https://www.sec.gov/files/company_tickers.json",
        { headers: SEC_EDGAR_HEADERS },
        { timeoutMs: 15_000 }
      );
      if (res.ok) {
        const data = await res.json();
        const map = new Map<string, string>();
        for (const key of Object.keys(data || {})) {
          const entry = data[key];
          if (entry?.ticker && entry?.cik_str != null) {
            const sym = String(entry.ticker).toUpperCase().trim();
            const cik = String(entry.cik_str).padStart(10, "0");
            map.set(sym, cik);
            map.set(sym.replace(/-/g, "."), cik);
            map.set(sym.replace(/\./g, "-"), cik);
          }
        }
        secCikMapCache = map;
      }
    } catch (err) {
      console.warn("⚠️ Warning loading SEC CIK directory:", err);
    }
  }
  return secCikMapCache?.get(norm) ?? null;
}

/**
 * Fetch SEC filings (10-Q, 10-K, 8-K, 20-F, 6-K) directly from Official SEC EDGAR Submissions API
 */
export async function fetchSecEdgarFilings(
  ticker: string
): Promise<SecFilingItem[]> {
  try {
    const cik = await resolveSecCik(ticker);
    if (!cik) return [];

    const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
    const res = await resilientFetch(
      url,
      { headers: SEC_EDGAR_HEADERS },
      { timeoutMs: 15_000 }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const recent = data?.filings?.recent;
    if (!recent || !Array.isArray(recent.form)) return [];

    const items: SecFilingItem[] = [];
    const cikNumeric = String(Number(cik));
    const allowedForms = new Set(["10-Q", "10-K", "8-K", "20-F", "6-K"]);
    let hasTenQ = false;
    let hasTenK = false;

    for (let i = 0; i < recent.form.length; i++) {
      const form = String(recent.form[i] || "");
      if (!allowedForms.has(form)) continue;

      const isTenQ = form === "10-Q";
      const isTenK = form === "10-K" || form === "20-F";
      if (items.length >= 12) {
        if ((isTenQ && !hasTenQ) || (isTenK && !hasTenK)) {
          // Always ensure at least the latest 10-Q and latest 10-K are included
        } else {
          if (hasTenQ && hasTenK) break;
          continue;
        }
      }

      const accessNumber = String(recent.accessionNumber?.[i] || "");
      const accNoHyphens = accessNumber.replace(/-/g, "");
      const primaryDoc = String(recent.primaryDocument?.[i] || "");
      const filedDate = String(recent.filingDate?.[i] || "");
      const acceptedDate = recent.acceptanceDateTime?.[i]
        ? String(recent.acceptanceDateTime[i])
        : undefined;
      const rawItems = recent.items?.[i];
      const filingItems = Array.isArray(rawItems)
        ? rawItems.map(String)
        : typeof rawItems === "string" && rawItems.trim()
          ? rawItems.split(",").map((s) => s.trim())
          : undefined;

      const baseArchiveUrl = `https://www.sec.gov/Archives/edgar/data/${cikNumeric}/${accNoHyphens}`;
      const reportUrl = primaryDoc ? `${baseArchiveUrl}/${primaryDoc}` : "";
      const filingUrl = accessNumber
        ? `${baseArchiveUrl}/${accessNumber}-index.htm`
        : reportUrl;

      if (isTenQ) hasTenQ = true;
      if (isTenK) hasTenK = true;

      items.push({
        form,
        filedDate,
        acceptedDate,
        reportUrl,
        filingUrl,
        accessNumber,
        items: filingItems,
      });
    }

    return items;
  } catch (err) {
    console.warn("⚠️ Warning fetching SEC EDGAR filings:", err);
    return [];
  }
}

/**
 * Fetch SEC filings (10-Q, 10-K, 8-K) — delegates directly to Official SEC EDGAR API
 */
export async function fetchFinnhubFilings(
  ticker: string,
  _apiKey?: string
): Promise<SecFilingItem[]> {
  return fetchSecEdgarFilings(ticker);
}

// --- Fundamental Profile Ingestion (Yahoo Finance) ---

export async function fetchFundamentalProfile(
  tickerSymbol: string,
  _options?: {
    apiKey?: string;
    massiveApiKey?: string;
    skipYahooFallback?: boolean;
    enableYahooFallback?: boolean;
  }
): Promise<FinancialProfile> {
  const ticker = tickerSymbol.toUpperCase();

  let yfQuote: any = {};
  let yfSummary: any = {};
  let yfTimeSeries: any[] = [];
  let historicalBars: DailyBar[] = [];
  let recommendedPeerTickers: string[] = [];

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  try {
    const [quote, summary, chartRes, ftsRes, recRes] = await Promise.all([
      yf.quote(ticker).catch((err: any) => err?.result ?? {}),
      yf
        .quoteSummary(ticker, {
          modules: [
            "financialData",
            "defaultKeyStatistics",
            "summaryDetail",
            "price",
            "earnings",
            "assetProfile",
          ],
        })
        .catch((err: any) => err?.result ?? {}),
      yf
        .chart(ticker, { period1: oneYearAgo, interval: "1d" })
        .catch((err: any) => {
          console.warn(
            `⚠️ Warning fetching 1y chart for ${ticker}:`,
            err?.message || err
          );
          return null;
        }),
      yf
        .fundamentalsTimeSeries(ticker, {
          period1: twoYearsAgo,
          type: "quarterly",
          module: "all",
        })
        .catch((err: any) => err?.result ?? []),
      yf
        .recommendationsBySymbol(ticker)
        .catch((err: any) => err?.result ?? null),
    ]);
    yfQuote = quote || {};
    yfSummary = summary || {};
    yfTimeSeries = Array.isArray(ftsRes) ? ftsRes : [];
    const recList = Array.isArray(recRes) ? recRes[0] : recRes;
    if (Array.isArray(recList?.recommendedSymbols)) {
      recommendedPeerTickers = recList.recommendedSymbols
        .map((r: any) =>
          String(r?.symbol || "")
            .toUpperCase()
            .trim()
        )
        .filter((s: string) => Boolean(s && s !== ticker && !s.includes(".")))
        .slice(0, 5);
    }
    if (chartRes && Array.isArray(chartRes.quotes)) {
      historicalBars = chartRes.quotes.map((q: any) => ({
        date:
          q.date instanceof Date
            ? q.date.toISOString().split("T")[0]
            : String(q.date || ""),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume,
      }));
    }
  } catch (err) {
    console.warn("⚠️ Warning fetching Yahoo Finance profile:", err);
  }

  const currentPrice =
    yfQuote.regularMarketPrice ??
    yfSummary.financialData?.currentPrice ??
    yfSummary.price?.regularMarketPrice ??
    0;
  const previousClose =
    yfQuote.regularMarketPreviousClose ??
    yfSummary.summaryDetail?.previousClose;
  const marketCap = yfQuote.marketCap
    ? round2(yfQuote.marketCap / 1e9)
    : yfSummary.price?.marketCap
      ? round2(yfSummary.price.marketCap / 1e9)
      : 0;
  const sharesOutstanding = yfQuote.sharesOutstanding
    ? round3(yfQuote.sharesOutstanding / 1e9)
    : yfSummary.defaultKeyStatistics?.sharesOutstanding
      ? round3(yfSummary.defaultKeyStatistics.sharesOutstanding / 1e9)
      : 0;

  const companyName =
    yfQuote.longName ??
    yfQuote.shortName ??
    yfSummary.price?.longName ??
    `${ticker} Corporation`;

  const trailingPE =
    yfQuote.trailingPE ?? yfSummary.summaryDetail?.trailingPE ?? undefined;
  const forwardPE =
    yfQuote.forwardPE ?? yfSummary.summaryDetail?.forwardPE ?? undefined;
  const trailingEps =
    yfQuote.epsTrailingTwelveMonths ??
    yfSummary.defaultKeyStatistics?.trailingEps;
  const forwardEps =
    yfQuote.epsForward ?? yfSummary.defaultKeyStatistics?.forwardEps;

  const yfFin = yfSummary.financialData || {};
  const totalCashFallback = round2(safeNum(yfFin.totalCash) / 1e9);
  const totalDebtFallback = round2(safeNum(yfFin.totalDebt) / 1e9);
  const ocfFallback = round2(safeNum(yfFin.operatingCashflow) / 1e9);
  const fcfFallback = round2(safeNum(yfFin.freeCashflow) / 1e9);

  // Sort fundamentalsTimeSeries newest first
  const sortedFts = [...yfTimeSeries]
    .filter((r) => r && (r.totalRevenue != null || r.operatingRevenue != null))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestFts = sortedFts[0];

  const cashVal =
    latestFts?.cashAndCashEquivalents != null
      ? round2(safeNum(latestFts.cashAndCashEquivalents) / 1e9)
      : totalCashFallback;
  const stInvVal =
    latestFts?.otherShortTermInvestments != null
      ? round2(safeNum(latestFts.otherShortTermInvestments) / 1e9)
      : 0;
  const totalCashVal =
    latestFts?.cashCashEquivalentsAndShortTermInvestments != null
      ? round2(
          safeNum(latestFts.cashCashEquivalentsAndShortTermInvestments) / 1e9
        )
      : round2(cashVal + stInvVal) || totalCashFallback;
  const stDebtVal =
    latestFts?.currentDebt != null
      ? round2(safeNum(latestFts.currentDebt) / 1e9)
      : 0;
  const ltDebtVal =
    latestFts?.longTermDebt != null
      ? round2(safeNum(latestFts.longTermDebt) / 1e9)
      : totalDebtFallback;
  const totalDebtVal =
    latestFts?.totalDebt != null
      ? round2(safeNum(latestFts.totalDebt) / 1e9)
      : round2(stDebtVal + ltDebtVal) || totalDebtFallback;
  const totalAssetsVal =
    latestFts?.totalAssets != null
      ? round2(safeNum(latestFts.totalAssets) / 1e9)
      : totalCashVal;
  const totalLiabVal =
    latestFts?.totalLiabilitiesNetMinorityInterest != null
      ? round2(safeNum(latestFts.totalLiabilitiesNetMinorityInterest) / 1e9)
      : totalDebtVal;
  const totalEquityVal =
    latestFts?.stockholdersEquity != null ||
    latestFts?.commonStockEquity != null
      ? round2(
          safeNum(latestFts.stockholdersEquity ?? latestFts.commonStockEquity) /
            1e9
        )
      : round2(Math.max(totalAssetsVal - totalLiabVal, 0));

  const balanceSheet: BalanceSheetSummary = {
    date: latestFts?.date
      ? new Date(latestFts.date).toISOString().split("T")[0]
      : undefined,
    cashAndCashEquivalentsBillions: cashVal,
    shortTermInvestmentsBillions: stInvVal,
    totalCashBillions: totalCashVal,
    shortTermDebtBillions: stDebtVal,
    longTermDebtBillions: ltDebtVal,
    totalDebtBillions: totalDebtVal,
    totalAssetsBillions: totalAssetsVal,
    totalLiabilitiesBillions: totalLiabVal,
    totalEquityBillions: totalEquityVal,
  };

  const ocfVal =
    latestFts?.operatingCashFlow != null
      ? round2(safeNum(latestFts.operatingCashFlow) / 1e9)
      : ocfFallback;
  const capexVal =
    latestFts?.capitalExpenditure != null
      ? round2(Math.abs(safeNum(latestFts.capitalExpenditure)) / 1e9)
      : round2(ocfFallback - fcfFallback);
  const fcfVal =
    latestFts?.freeCashFlow != null
      ? round2(safeNum(latestFts.freeCashFlow) / 1e9)
      : fcfFallback;

  const cashFlow: CashFlowSummary = {
    date: balanceSheet.date,
    operatingCashFlowBillions: ocfVal,
    capitalExpenditureBillions: capexVal,
    freeCashFlowBillions: fcfVal,
  };

  const earningsChartQ = yfSummary.earnings?.earningsChart?.quarterly || [];
  const reportedDateByPeriodEnd = new Map<
    string,
    { reportedDate?: string; fiscalQuarter?: string }
  >();
  for (const eq of earningsChartQ) {
    if (eq?.periodEndDate) {
      const peStr = new Date(eq.periodEndDate).toISOString().split("T")[0];
      const repStr = eq.reportedDate
        ? new Date(eq.reportedDate).toISOString().split("T")[0]
        : peStr;
      reportedDateByPeriodEnd.set(peStr.slice(0, 7), {
        reportedDate: repStr,
        fiscalQuarter: eq.fiscalQuarter || eq.date,
      });
    }
  }

  let statements: QuarterlyFinancialStatement[] = [];
  if (sortedFts.length > 0) {
    statements = sortedFts.map((r: any) => {
      const periodEndStr = r.date
        ? new Date(r.date).toISOString().split("T")[0]
        : "";
      const matchedMeta = reportedDateByPeriodEnd.get(periodEndStr.slice(0, 7));
      const rawPeriod = String(matchedMeta?.fiscalQuarter || "");
      let fiscalPeriod: string | undefined;
      let fiscalYear: string | undefined;
      const qMatch =
        rawPeriod.match(/([1-4])Q\s*(\d{4})/i) ||
        rawPeriod.match(/Q([1-4])\s*(\d{4})/i);
      if (qMatch) {
        fiscalPeriod = `Q${qMatch[1]}`;
        fiscalYear = qMatch[2];
      } else if (periodEndStr) {
        const d = new Date(periodEndStr);
        const m = d.getUTCMonth() + 1;
        fiscalPeriod = `Q${Math.ceil(m / 3)}`;
        fiscalYear = String(d.getUTCFullYear());
      }

      const rev = round2(safeNum(r.totalRevenue ?? r.operatingRevenue) / 1e9);
      const gross =
        r.grossProfit != null
          ? round2(safeNum(r.grossProfit) / 1e9)
          : undefined;
      const opInc = round2(
        safeNum(r.operatingIncome ?? r.totalOperatingIncomeAsReported) / 1e9
      );
      const net = round2(safeNum(r.netIncome) / 1e9);
      const dilutedShares =
        r.dilutedAverageShares != null
          ? round3(safeNum(r.dilutedAverageShares) / 1e9)
          : undefined;
      const dilutedEps =
        r.dilutedEPS != null
          ? round2(safeNum(r.dilutedEPS))
          : dilutedShares && dilutedShares > 0
            ? round2(net / dilutedShares)
            : undefined;
      const basicEps =
        r.basicEPS != null ? round2(safeNum(r.basicEPS)) : undefined;

      return {
        date: matchedMeta?.reportedDate || periodEndStr,
        fiscalPeriod,
        fiscalYear,
        revenueBillions: rev,
        grossProfitBillions: gross,
        operatingIncomeBillions: opInc,
        netIncomeBillions: net,
        dilutedEps,
        basicEps,
        dilutedAverageSharesBillions: dilutedShares,
      };
    });
  }

  let technicalLevels = undefined;
  if (currentPrice > 0) {
    try {
      technicalLevels = computeTechnicalLevels(
        {
          regularMarketPrice: currentPrice,
          regularMarketPreviousClose: previousClose,
          regularMarketDayHigh: yfQuote.regularMarketDayHigh,
          regularMarketDayLow: yfQuote.regularMarketDayLow,
          fiftyDayAverage: yfQuote.fiftyDayAverage,
          twoHundredDayAverage: yfQuote.twoHundredDayAverage,
          fiftyTwoWeekHigh: yfQuote.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: yfQuote.fiftyTwoWeekLow,
        },
        currentPrice,
        { historicalBars }
      );
    } catch (techErr) {
      console.warn(
        "⚠️ Warning computing technical levels for profile:",
        techErr
      );
    }
  }

  const assetProfile = yfSummary.assetProfile || {};

  return {
    ticker,
    companyName,
    sector: assetProfile.sector || undefined,
    industry: assetProfile.industry || undefined,
    businessSummary: assetProfile.longBusinessSummary
      ? String(assetProfile.longBusinessSummary).slice(0, 1200)
      : undefined,
    currentPrice: round2(currentPrice),
    previousClose: previousClose != null ? round2(previousClose) : undefined,
    marketCapBillions: round2(marketCap),
    trailingPE: trailingPE != null ? round2(trailingPE) : undefined,
    forwardPE: forwardPE != null ? round2(forwardPE) : undefined,
    trailingEps: trailingEps != null ? round2(trailingEps) : undefined,
    forwardEpsConsensus: forwardEps != null ? round2(forwardEps) : undefined,
    sharesOutstandingBillions: round3(sharesOutstanding),
    currency: yfQuote.currency || "USD",
    quarterlyStatements: statements,
    balanceSheet,
    cashFlow,
    technicalLevels,
    recommendedPeerTickers,
    dataSource: "Yahoo Finance & SEC EDGAR",
  };
}

/**
 * Deterministically fetches live financial metrics (marketCap, TTM revenue, YoY growth,
 * gross/operating margins, forward P/E) for peer tickers via Yahoo Finance so peer
 * benchmarking never relies on LLM-hallucinated financial numbers.
 */
export async function fetchPeerBenchmarks(
  peerTickers: string[],
  excludeTicker?: string
): Promise<PeerBenchmarkMetrics[]> {
  const targetNorm = excludeTicker?.toUpperCase().trim();
  const uniquePeers = Array.from(
    new Set(
      peerTickers
        .map((t) =>
          String(t || "")
            .toUpperCase()
            .trim()
        )
        .filter((t) =>
          Boolean(t && t !== targetNorm && /^[A-Z\-]{1,6}$/.test(t))
        )
    )
  ).slice(0, 5);

  if (uniquePeers.length === 0) return [];

  const results = await Promise.all(
    uniquePeers.map(async (sym): Promise<PeerBenchmarkMetrics | null> => {
      try {
        const [quote, summary] = await Promise.all([
          yf.quote(sym).catch((err: any) => err?.result ?? {}),
          yf
            .quoteSummary(sym, {
              modules: ["financialData", "summaryDetail", "price"],
            })
            .catch((err: any) => err?.result ?? {}),
        ]);

        const fin = summary?.financialData || {};
        const priceMod = summary?.price || {};
        const sumDet = summary?.summaryDetail || {};

        const mktCapRaw = quote?.marketCap ?? priceMod?.marketCap ?? 0;
        const revRaw = fin?.totalRevenue ?? 0;
        if (!mktCapRaw && !revRaw) return null;

        const name =
          quote?.longName ||
          quote?.shortName ||
          priceMod?.longName ||
          priceMod?.shortName ||
          sym;
        const marketCapBillions = round2(safeNum(mktCapRaw) / 1e9);
        const revenueBillions = round2(safeNum(revRaw) / 1e9);
        const revenueGrowthPct =
          fin?.revenueGrowth != null
            ? round2(safeNum(fin.revenueGrowth) * 100)
            : undefined;
        const grossMarginPct =
          fin?.grossMargins != null
            ? round2(safeNum(fin.grossMargins) * 100)
            : 0;
        const operatingMarginPct =
          fin?.operatingMargins != null
            ? round2(safeNum(fin.operatingMargins) * 100)
            : 0;
        const fwdPeRaw = quote?.forwardPE ?? sumDet?.forwardPE;
        const forwardPe =
          fwdPeRaw != null && safeNum(fwdPeRaw) > 0 && safeNum(fwdPeRaw) < 250
            ? round2(safeNum(fwdPeRaw))
            : undefined;

        return {
          ticker: sym,
          name,
          marketCapBillions,
          revenueBillions,
          revenueGrowthPct,
          grossMarginPct,
          operatingMarginPct,
          forwardPe,
        };
      } catch {
        return null;
      }
    })
  );

  return results.filter((r): r is PeerBenchmarkMetrics => r !== null);
}

// --- Analyst Estimates Ingestion (Yahoo Finance) ---

export async function fetchAnalystEstimates(
  tickerSymbol: string,
  options?: {
    limit?: number;
    benchmarkPrice?: number;
    apiKey?: string;
    skipYahooFallback?: boolean;
    enableYahooFallback?: boolean;
  }
): Promise<{ estimatesEn: AnalystEstimates; estimatesZh: AnalystEstimates }> {
  const ticker = tickerSymbol.toUpperCase();
  const limit = options?.limit ?? 30;

  let bullishCount = 0;
  let neutralCount = 0;
  let bearishCount = 0;

  let yfSummary: any = {};
  let yfQuote: any = {};

  try {
    const [summary, quote] = await Promise.all([
      yf
        .quoteSummary(ticker, {
          modules: [
            "financialData",
            "recommendationTrend",
            "upgradeDowngradeHistory",
            "summaryDetail",
          ],
        })
        .catch((err: any) => err?.result ?? {}),
      yf.quote(ticker).catch((err: any) => err?.result ?? {}),
    ]);
    yfSummary = summary || {};
    yfQuote = quote || {};
  } catch (err) {
    console.warn("⚠️ Warning fetching Yahoo Finance estimates:", err);
  }

  const recTrend = yfSummary.recommendationTrend?.trend;
  if (Array.isArray(recTrend) && recTrend.length > 0) {
    const top = recTrend[0];
    bullishCount = safeNum(top.strongBuy) + safeNum(top.buy);
    neutralCount = safeNum(top.hold);
    bearishCount = safeNum(top.sell) + safeNum(top.strongSell);
  }

  const finData = yfSummary.financialData || {};
  const currentPrice = round2(
    options?.benchmarkPrice ||
      finData.currentPrice ||
      yfQuote.regularMarketPrice ||
      100
  );

  const low = finData.targetLowPrice
    ? round2(finData.targetLowPrice)
    : currentPrice;
  const avg = finData.targetMeanPrice
    ? round2(finData.targetMeanPrice)
    : currentPrice;
  const median = finData.targetMedianPrice
    ? round2(finData.targetMedianPrice)
    : avg;
  const high = finData.targetHighPrice ? round2(finData.targetHighPrice) : avg;
  const currency = finData.financialCurrency || yfQuote.currency || "USD";

  const totalAnalysts = bullishCount + neutralCount + bearishCount;
  const bullishPct =
    totalAnalysts > 0 ? round2((bullishCount / totalAnalysts) * 100) : 0;
  const neutralPct =
    totalAnalysts > 0 ? round2((neutralCount / totalAnalysts) * 100) : 0;
  const bearishPct =
    totalAnalysts > 0 ? round2((bearishCount / totalAnalysts) * 100) : 0;

  const consensusRaw =
    yfQuote.recommendationKey ||
    (totalAnalysts === 0
      ? "Neutral"
      : bullishPct >= 70
        ? "Strong Buy"
        : bullishPct >= 50
          ? "Buy"
          : bearishPct >= 40
            ? "Underperform"
            : "Hold");

  const consensusClean = consensusRaw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const consensusEn = {
    consensus: consensusClean,
    totalAnalysts,
    bullishCount,
    bullishPct,
    neutralCount,
    neutralPct,
    bearishCount,
    bearishPct,
  };

  const consensusZhLabel =
    RATING_ZH_MAP[consensusClean.toLowerCase()] || consensusClean;
  const consensusZh = {
    ...consensusEn,
    consensus: consensusZhLabel,
  };

  // 3. Extract Individual Upgrades/Downgrades (filter out stale >24m entries when recent notes exist)
  const rawHistory = yfSummary.upgradeDowngradeHistory?.history || [];
  const estimatesEn: AnalystEstimates["estimates"] = [];
  const estimatesZh: AnalystEstimates["estimates"] = [];
  const seenFirms = new Set<string>();
  const twoYearsAgoIso = new Date(Date.now() - 730 * 86400000)
    .toISOString()
    .split("T")[0];

  for (const row of rawHistory) {
    const firm = row.firm;
    if (!firm || seenFirms.has(firm.toLowerCase())) continue;

    const rawEpoch = row.epochGradeDate;
    const gradeDate = rawEpoch
      ? new Date(
          typeof rawEpoch === "number" && rawEpoch < 1e11
            ? rawEpoch * 1000
            : rawEpoch
        )
          .toISOString()
          .split("T")[0]
      : new Date().toISOString().split("T")[0];

    const explicitTarget =
      safeNum(row.currentPriceTarget) || safeNum(row.targetPrice);
    // Skip stale entries (>2 years old or lacking explicit price target once we already have >=5 fresh notes)
    if (
      estimatesEn.length >= 5 &&
      (gradeDate < twoYearsAgoIso || explicitTarget <= 0)
    ) {
      continue;
    }

    seenFirms.add(firm.toLowerCase());

    const toGrade = row.toGrade || "Buy";
    const fromGrade = row.fromGrade;
    const actionRaw =
      `${row.action || ""} ${row.priceTargetAction || ""}`.trim();

    let actionClean = "Reiterated";
    if (actionRaw.toLowerCase().includes("up")) actionClean = "Upgraded";
    else if (actionRaw.toLowerCase().includes("down"))
      actionClean = "Downgraded";
    else if (actionRaw.toLowerCase().includes("init"))
      actionClean = "Initiated";
    else if (actionRaw.toLowerCase().includes("raise")) actionClean = "Raised";
    else if (actionRaw.toLowerCase().includes("lower")) actionClean = "Lowered";

    const targetPrice = round2(
      explicitTarget || (actionClean === "Downgraded" ? low : avg)
    );
    const priorTarget = row.priorPriceTarget
      ? round2(safeNum(row.priorPriceTarget))
      : undefined;

    const upsidePct = round2(
      ((targetPrice - currentPrice) / currentPrice) * 100
    );

    const noteEn = fromGrade
      ? `${actionClean} from ${fromGrade}`
      : `${actionClean} at ${toGrade}`;
    const actionZh = ACTION_ZH_MAP[actionClean.toLowerCase()] || actionClean;
    const noteZh = fromGrade
      ? `从 ${fromGrade} ${actionZh}`
      : `${actionZh}，维持评级`;

    estimatesEn.push({
      firm,
      analyst: null,
      rating: toGrade,
      priceTarget: targetPrice,
      priorPriceTarget: priorTarget,
      upsidePct,
      date: gradeDate,
      action: actionClean,
      notes: noteEn,
    });

    estimatesZh.push({
      firm,
      analyst: null,
      rating: RATING_ZH_MAP[toGrade.toLowerCase()] || toGrade,
      priceTarget: targetPrice,
      priorPriceTarget: priorTarget,
      upsidePct,
      date: gradeDate,
      action: actionZh,
      notes: noteZh,
    });

    if (estimatesEn.length >= limit) break;
  }

  // 4. Synthesize Narratives
  const avgUpside = round2(((avg - currentPrice) / currentPrice) * 100);
  const synthesisEn = `According to Wall Street sell-side consensus, ${totalAnalysts} brokerages cover ${ticker} with an aggregate rating of ${consensusClean} (${bullishPct}% bullish). The 52-week price target spans from a conservative low of $${low.toFixed(
    2
  )} to a street-high of $${high.toFixed(
    2
  )}, yielding a consensus average target of $${avg.toFixed(2)} (${
    avgUpside >= 0 ? "+" : ""
  }${avgUpside}% upside vs. the current spot price of $${currentPrice.toFixed(
    2
  )}). Sell-side revisions reflect dynamic pricing power and quarterly operational cadence.`;

  const synthesisZh = `根据华尔街卖方共识数据，共有 ${totalAnalysts} 家研究机构覆盖 ${ticker}，综合评级为『${consensusZhLabel}』（看多比例 ${bullishPct}%）。52周目标价区间介于最低 $${low.toFixed(
    2
  )} 与最高 $${high.toFixed(2)} 之间，市场共识均价为 $${avg.toFixed(2)}（较当前现价 $${currentPrice.toFixed(
    2
  )} 预期空间 ${
    avgUpside >= 0 ? "+" : ""
  }${avgUpside}%）。各大投行在近期财报发布后更新了盈利模型，反映出对行业景气度及资本开支节奏的动态调整。`;

  const sources: Source[] = [
    {
      title: `Yahoo Finance ${ticker} Analyst Research & Price Targets`,
      publisher: "Yahoo Finance API / Sell-Side Consensus",
      url: `https://finance.yahoo.com/quote/${ticker}/analysis`,
      date: new Date().toISOString().split("T")[0],
    },
  ];

  const priceTargets = {
    currentPrice,
    low,
    average: avg,
    median,
    high,
    currency,
  };

  const asOfDate = new Date().toISOString().split("T")[0];

  const bundleEn = AnalystEstimatesSchema.parse({
    ticker,
    asOfDate,
    consensus: consensusEn,
    priceTargets,
    synthesisNarrative: synthesisEn,
    estimates: estimatesEn,
    sources,
  });

  const bundleZh = AnalystEstimatesSchema.parse({
    ticker,
    asOfDate,
    consensus: consensusZh,
    priceTargets,
    synthesisNarrative: synthesisZh,
    estimates: estimatesZh,
    sources,
  });

  return { estimatesEn: bundleEn, estimatesZh: bundleZh };
}

// --- Historical Reactions Ingestion (Yahoo Finance) ---

export async function fetchHistoricalReactions(
  ticker: string,
  statements: QuarterlyFinancialStatement[]
): Promise<Reactions> {
  const events: ReactionEvent[] = [];

  // Try fetching reactions for prior quarterly statement dates via Yahoo Finance daily bars
  const candidates = statements.slice(0, 4);

  for (const stmt of candidates) {
    if (!stmt.date) continue;
    try {
      const stmtDate = new Date(stmt.date);
      if (Number.isNaN(stmtDate.getTime())) continue;
      const fromDate = new Date(stmtDate.getTime() - 5 * 86400000);
      const toDate = new Date(stmtDate.getTime() + 5 * 86400000);

      const chartRes = await yf
        .chart(ticker, { period1: fromDate, period2: toDate, interval: "1d" })
        .catch(() => null);
      const bars = Array.isArray(chartRes?.quotes)
        ? chartRes.quotes
            .filter((q: any) => q.date && typeof q.close === "number")
            .map((q: any) => ({
              date: new Date(q.date).toISOString().split("T")[0],
              close: q.close as number,
            }))
        : [];

      if (bars.length >= 2) {
        const targetIdx = bars.findIndex((b) => b.date >= stmt.date);
        if (targetIdx > 0) {
          const postBar = bars[targetIdx];
          const preBar = bars[targetIdx - 1];
          const movePct = round2(
            ((postBar.close - preBar.close) / preBar.close) * 100
          );

          events.push({
            date: postBar.date,
            event: `${stmt.fiscalPeriod || "Quarterly"} ${
              stmt.fiscalYear || ""
            } Financial Release (${stmt.revenueBillions}B Rev, ${movePct >= 0 ? "+" : ""}${movePct}%)`.trim(),
            priceMovePct: movePct,
            context: `Reported revenue of $${stmt.revenueBillions}B and operating income of $${stmt.operatingIncomeBillions}B. Shares reacted with a ${
              movePct >= 0 ? "+" : ""
            }${movePct}% day-1 move.`,
            source: {
              title: `${ticker} Quarterly Earnings Release`,
              date: stmt.date,
            },
          });
        }
      }
    } catch (err) {
      console.warn("⚠️ Warning computing historical reaction:", err);
    }
  }

  const framing =
    events.length > 0
      ? `${ticker} exhibits directional sensitivity around quarterly reports tied directly to operating margin defense and top-line guidance delivery.`
      : `${ticker} post-earnings reactions are driven by forward revenue guidance beats and cloud/hardware margin stability.`;

  return ReactionsSchema.parse({
    ticker: ticker.toUpperCase(),
    events,
    conditionalFraming: framing,
  });
}
