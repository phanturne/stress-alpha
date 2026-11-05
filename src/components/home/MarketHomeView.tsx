"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  SlidersHorizontal,
  Calendar,
  FileText,
  Star,
  ShieldCheck,
  Layers,
  Cpu,
  Globe,
  ShoppingBag,
  Landmark,
  Activity,
  Boxes,
  Flame,
  Zap,
  Building2,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  ExternalLink,
} from "lucide-react";
import type { ReportSummary } from "@/app/api/reports/route";
import type { MarketSummaryResponse } from "@/app/api/market/summary/route";
import type { UpcomingEarningsItem } from "@/app/api/earnings/calendar/route";
import {
  GICS_SECTORS,
  SP500_SECTOR_CONSTITUENTS,
  aggregateSectors,
  getTickerSectorId,
} from "@/lib/sectors";
import { formatCurrency, deduplicateReportsToLatest } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";
import { useWatchlist } from "@/lib/watchlist";
import { useReportPrefetch } from "@/hooks/useReportPrefetch";
import { MiniSnowflakeRadar } from "@/components/snowflake/MiniSnowflakeRadar";
import { SP500Treemap } from "@/components/home/SP500Treemap";
import {
  SegmentedTabs,
  type SegmentedTabOption,
} from "@/components/ui/SegmentedTabs";

interface MarketHomeViewProps {
  reports: ReportSummary[];
  onSelectReport: (slug: string, mode?: "cockpit" | "memo") => void;
  onOpenScreener: (options?: { filter?: string; sector?: string }) => void;
  locale?: Locale;
  isLoading?: boolean;
}

type EarningsTimeframe =
  "all" | "today" | "tomorrow" | "this_week" | "next_week";
type MoverTab = "gainers" | "losers" | "active" | "watchlist";

function renderSectorIcon(iconName: string, className = "size-4") {
  switch (iconName) {
    case "Cpu":
      return <Cpu className={className} />;
    case "Globe":
      return <Globe className={className} />;
    case "ShoppingBag":
      return <ShoppingBag className={className} />;
    case "Landmark":
      return <Landmark className={className} />;
    case "Activity":
      return <Activity className={className} />;
    case "Boxes":
      return <Boxes className={className} />;
    case "Flame":
      return <Flame className={className} />;
    case "Zap":
      return <Zap className={className} />;
    case "Building2":
      return <Building2 className={className} />;
    case "Layers":
    default:
      return <Layers className={className} />;
  }
}

// Mini SVG sparkline for index cards
function IndexSparkline({
  sparkline,
  isPositive,
}: {
  sparkline?: number[];
  isPositive: boolean;
}) {
  if (!sparkline || sparkline.length < 2) return null;

  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline);
  const range = max - min || 1;
  const width = 80;
  const height = 28;

  const points = sparkline
    .map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const strokeColor = isPositive ? "#10b981" : "#f43f5e";
  const fillPath = `M 0,${height} L ${points.split(" ")[0]} ${points} L ${width},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`grad-idx-${isPositive ? "up" : "down"}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d={fillPath}
        fill={`url(#grad-idx-${isPositive ? "up" : "down"})`}
      />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Color scale for standard S&P 500 Heatmap tiles
function getTileColorClasses(changePct: number): string {
  if (changePct <= -3.0) {
    return "bg-rose-950/80 border-rose-700/80 text-rose-200 hover:bg-rose-900/90";
  }
  if (changePct <= -1.5) {
    return "bg-rose-900/60 border-rose-600/60 text-rose-200 hover:bg-rose-900/80";
  }
  if (changePct < 0) {
    return "bg-rose-950/35 border-rose-800/40 text-rose-300 hover:bg-rose-900/50";
  }
  if (changePct >= 3.0) {
    return "bg-emerald-950/80 border-emerald-700/80 text-emerald-200 hover:bg-emerald-900/90";
  }
  if (changePct >= 1.5) {
    return "bg-emerald-900/60 border-emerald-600/60 text-emerald-200 hover:bg-emerald-900/80";
  }
  return "bg-emerald-950/35 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/50";
}

export function MarketHomeView({
  reports,
  onSelectReport,
  onOpenScreener,
  locale = "en",
  isLoading = false,
}: MarketHomeViewProps) {
  const t = getTranslations(locale);
  const tHome = t.marketHome;
  const { toggleFavorite, isFavorite } = useWatchlist();
  const { prefetchReport } = useReportPrefetch();

  // State
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<
    string | null
  >(null);
  const [earningsFilter, setEarningsFilter] =
    useState<EarningsTimeframe>("all");
  const [expandedStoryId, setExpandedStoryId] = useState<string>("story-1");
  const [moverTab, setMoverTab] = useState<MoverTab>("gainers");

  // Market Summary Data & Upcoming Earnings Data
  const [marketSummary, setMarketSummary] =
    useState<MarketSummaryResponse | null>(null);
  const [summaryMinutesAgo, setSummaryMinutesAgo] = useState(1);
  const [upcomingEarnings, setUpcomingEarnings] = useState<
    UpcomingEarningsItem[]
  >([]);

  // Fetch Market Summary API with visibility awareness and conservative polling
  useEffect(() => {
    let isMounted = true;
    let lastFetched = 0;

    async function loadMarketSummary(force = false) {
      if (
        !force &&
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      if (Date.now() - lastFetched < 900000 && !force) {
        return;
      }

      try {
        const res = await fetch("/api/market/summary");
        if (res.ok) {
          const data: MarketSummaryResponse = await res.json();
          if (isMounted) {
            setMarketSummary(data);
            const refTime = data.pipelineUpdatedAt || data.updatedAt;
            if (refTime) {
              const diffMs = Date.now() - new Date(refTime).getTime();
              setSummaryMinutesAgo(
                isNaN(diffMs) || diffMs < 0
                  ? 1
                  : Math.max(1, Math.floor(diffMs / 60000))
              );
            }
            lastFetched = Date.now();
          }
        }
      } catch (err) {
        console.warn("Could not fetch market summary:", err);
      }
    }

    loadMarketSummary(true);

    const interval = setInterval(() => loadMarketSummary(false), 900000);

    function handleVisibility() {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        if (Date.now() - lastFetched >= 900000) {
          loadMarketSummary(true);
        }
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, []);

  // Fetch Upcoming Earnings API
  useEffect(() => {
    let isMounted = true;
    async function loadEarnings() {
      try {
        const res = await fetch("/api/earnings/calendar");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.earnings) {
            setUpcomingEarnings(data.earnings);
          }
        }
      } catch (err) {
        console.warn("Could not fetch upcoming earnings:", err);
      }
    }
    loadEarnings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Market Summary Stories: Synchronous, fully-localized macro docket (zero layout shift/flicker)
  const displayStories = tHome.summaryStories;

  // Deduplicate reports by latest quarter per ticker using recency scoring
  const latestReports = useMemo(() => {
    return deduplicateReportsToLatest(reports);
  }, [reports]);

  // Lookup map to guarantee navigation from calendar or widgets always routes to latest report
  const latestSlugByTicker = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of latestReports) {
      const sym = (r.ticker || r.slug.split("-")[0]).toUpperCase();
      map.set(sym, r.slug);
    }
    return map;
  }, [latestReports]);

  // Aggregate sectors with live ETF quotes
  const sectorStats = useMemo(() => {
    const etfQuotes = marketSummary?.sectors || {};
    return aggregateSectors(latestReports, etfQuotes, locale);
  }, [latestReports, marketSummary, locale]);

  // Standout Stocks: Top 5 high-conviction variant perception outliers from covered universe
  const standoutStocks = useMemo(() => {
    if (!latestReports || latestReports.length === 0) return [];

    // Deterministic ranking by fundamental variant perception:
    // Only select reports with valid valuation data (positive WFV and price)
    const validReports = latestReports.filter(
      (r) =>
        r.weightedFairValue != null &&
        r.currentPrice != null &&
        r.currentPrice > 0
    );

    const scored = validReports.map((r) => {
      const upside = r.upsidePct ?? 0;
      const consensusSpread = Math.abs(r.consensusSpreadPct ?? 0);
      const absPriceChange = Math.abs(r.priceChangePct ?? 0);

      // Priority score: high upside to deterministic WFV + wide consensus alpha
      const score = upside * 1.5 + consensusSpread * 1.0 + absPriceChange * 0.5;
      return { report: r, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map((item) => item.report);
  }, [latestReports]);

  // Filtered upcoming earnings by timeframe and selected sector (anchored to US Market date)
  const [currentTimestamp] = useState(() => Date.now());
  const filteredEarnings = useMemo(() => {
    const getMarketDate = (offsetDays = 0) => {
      const d = new Date(currentTimestamp + offsetDays * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    };

    const today = getMarketDate(0);
    const tomorrowDate = getMarketDate(1);
    const nextWeekDate = getMarketDate(7);

    return upcomingEarnings.filter((item) => {
      if (
        selectedSectorFilter &&
        item.sectorId &&
        item.sectorId !== selectedSectorFilter
      ) {
        return false;
      }
      if (earningsFilter === "today") return item.date === today;
      if (earningsFilter === "tomorrow") return item.date === tomorrowDate;
      if (earningsFilter === "this_week")
        return item.date >= today && item.date <= nextWeekDate;
      if (earningsFilter === "next_week") return item.date > nextWeekDate;
      return true;
    });
  }, [
    upcomingEarnings,
    earningsFilter,
    selectedSectorFilter,
    currentTimestamp,
  ]);

  // Modular segmented tab configurations (eliminates border highlight flicker)
  const moverTabOptions: SegmentedTabOption<MoverTab>[] = [
    {
      id: "gainers",
      label: tHome.tabGainers,
      activeClassName: "text-emerald-400",
    },
    {
      id: "losers",
      label: tHome.tabLosers,
      activeClassName: "text-rose-400",
    },
    {
      id: "active",
      label: tHome.tabActive,
      activeClassName: "text-cyan-400",
    },
    {
      id: "watchlist",
      label: (
        <span className="inline-flex items-center gap-1">
          <Star
            className={`size-3 ${
              moverTab === "watchlist" ? "fill-amber-400 text-amber-400" : ""
            }`}
          />
          <span>{tHome.tabWatchlist}</span>
        </span>
      ),
      activeClassName: "text-amber-400",
    },
  ];

  const earningsFilterOptions: SegmentedTabOption<EarningsTimeframe>[] = [
    { id: "all", label: tHome.filterAll },
    { id: "today", label: tHome.filterToday },
    { id: "this_week", label: tHome.filterThisWeek },
    { id: "next_week", label: tHome.filterNextWeek },
  ];

  // Market Breadth: Count advancing vs declining sector ETFs
  const marketBreadth = useMemo(() => {
    if (!marketSummary?.sectors) return { advancers: 0, decliners: 0 };
    const values = Object.values(marketSummary.sectors);
    const advancers = values.filter((v) => v > 0).length;
    const decliners = values.filter((v) => v < 0).length;
    return { advancers, decliners };
  }, [marketSummary]);

  // Top Movers: Gainers, Losers, and Active for the sidebar tab widget (Daily Price Return %)
  const moversData = useMemo(() => {
    const enrichedReports = latestReports.map((r) => {
      const changePct = r.priceChangePct ?? 0;
      return {
        ...r,
        changePct,
      };
    });

    const gainers = [...enrichedReports]
      .sort((a, b) => b.changePct - a.changePct)
      .slice(0, 5);

    const losers = [...enrichedReports]
      .sort((a, b) => a.changePct - b.changePct)
      .slice(0, 5);

    const active = [...enrichedReports]
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, 5);

    const watchlist = [...enrichedReports].filter((item) => {
      const sym = (item.ticker || item.slug.split("-")[0]).toUpperCase();
      return isFavorite(sym);
    });

    return { gainers, losers, active, watchlist };
  }, [latestReports, sectorStats, isFavorite]);

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* 1. MAJOR MARKET INDICES TAPE (TOP ASSETS - STARTS DIRECTLY AT TOP) */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-accent" />
            <h2 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
              {tHome.marketPulseTitle}
            </h2>
          </div>
          <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-slate-400">
            {tHome.advancersDecliners(
              marketBreadth.advancers,
              marketBreadth.decliners
            )}
          </span>
        </div>

        {/* 6 Macro Index Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {marketSummary?.indices
            ? marketSummary.indices.map((idx) => {
                const isPos = idx.changePct >= 0;
                const isVix = idx.symbol === "^VIX";
                const isFavorable = isVix ? !isPos : isPos;

                return (
                  <div
                    key={idx.symbol}
                    className="shadow-xs group relative flex flex-col justify-between rounded-xl border border-border/80 bg-surface-1 p-3 transition-all hover:border-border hover:bg-surface-2/60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-bold text-foreground">
                          {idx.name}
                        </span>
                        <span className="font-mono text-[10px] uppercase text-slate-500">
                          {idx.symbol}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          isFavorable
                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border border-rose-500/20 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {isPos ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownRight className="size-3" />
                        )}
                        {Math.abs(idx.changePct).toFixed(2)}%
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between gap-1">
                      <span className="font-mono text-sm font-extrabold text-foreground sm:text-base">
                        {idx.symbol === "^TNX"
                          ? `${idx.price.toFixed(3)}%`
                          : idx.symbol === "^VIX"
                            ? idx.price.toFixed(2)
                            : formatCurrency(idx.price)}
                      </span>
                      <div className="hidden shrink-0 sm:block">
                        <IndexSparkline
                          sparkline={idx.sparkline}
                          isPositive={isFavorable}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            : [
                { symbol: "SPY", name: "S&P 500" },
                { symbol: "QQQ", name: "Nasdaq 100" },
                { symbol: "DIA", name: "Dow Jones" },
                { symbol: "IWM", name: "Russell 2000" },
                { symbol: "^TNX", name: "10Y Treasury" },
                { symbol: "^VIX", name: "Volatility (VIX)" },
              ].map((idx) => (
                <div
                  key={idx.symbol}
                  className="shadow-xs group relative flex flex-col justify-between rounded-xl border border-border/80 bg-surface-1 p-3 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="block truncate text-xs font-bold text-foreground">
                        {idx.name}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-slate-500">
                        {idx.symbol}
                      </span>
                    </div>
                    <div className="h-4 w-10 animate-pulse rounded bg-surface-2" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-1">
                    <div className="h-4 w-16 animate-pulse rounded bg-surface-3" />
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* 2. MAIN SECTION: MARKET SUMMARY + S&P 500 HEATMAP + COMPACT STANDOUTS */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): S&P 500 Heatmap First, Market Summary Brief, Quantitative Standouts */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* 1. STANDARD S&P 500 HEATMAP (ELEVATED TO TOP PRIORITY) */}
          <div className="shadow-xs rounded-xl border border-border/80 bg-surface-1 p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-accent" />
                  <h2 className="text-base font-bold text-foreground">
                    {tHome.sp500HeatmapTitle}
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {tHome.sp500HeatmapSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenScreener()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:border-accent/40 hover:text-foreground"
              >
                <span>{tHome.heatmapExpand}</span>
              </button>
            </div>

            {/* Standard S&P 500 Squarified Treemap (100% gapless golden-ratio partition) */}
            <div className="mt-4">
              <SP500Treemap
                sectorStats={sectorStats}
                latestReports={latestReports}
                onSelectReport={onSelectReport}
                onPrefetchReport={prefetchReport}
                locale={locale}
              />
            </div>

            {/* Heatmap Legend & Microstructure Status */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px]">-3%</span>
                <div className="flex items-center gap-1">
                  <span className="rounded-xs size-3 bg-rose-600/90" />
                  <span className="rounded-xs size-3 bg-rose-500/70" />
                  <span className="rounded-xs size-3 bg-rose-500/40" />
                  <span className="rounded-xs size-3 bg-emerald-500/40" />
                  <span className="rounded-xs size-3 bg-emerald-500/70" />
                  <span className="rounded-xs size-3 bg-emerald-600/90" />
                </div>
                <span className="font-mono text-[11px]">+3%</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="inline-block size-2 animate-pulse rounded-full bg-accent" />
                <span>{tHome.liveMicrostructure}</span>
              </div>
            </div>
          </div>

          {/* 2. MARKET SUMMARY ACCORDION (INTELLIGENCE BRIEF DIRECTLY BELOW HEATMAP) */}
          <div className="shadow-xs rounded-xl border border-border/80 bg-surface-1 p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-accent" />
                <h2 className="text-base font-bold text-foreground">
                  {tHome.marketSummaryTitle}
                </h2>
              </div>
              <span className="font-mono text-xs text-slate-500">
                {tHome.updatedAgo(summaryMinutesAgo)}
              </span>
            </div>

            <div className="mt-3 divide-y divide-border/40">
              {displayStories.map((story) => {
                const isExpanded = expandedStoryId === story.id;

                return (
                  <div key={story.id} className="py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedStoryId((prev) =>
                          prev === story.id ? "" : story.id
                        )
                      }
                      className="group flex w-full items-start justify-between gap-3 text-left"
                    >
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        {story.tag && (
                          <span className="inline-flex shrink-0 items-center rounded border border-border/70 bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent">
                            {story.tag}
                          </span>
                        )}
                        <span className="text-sm font-bold text-foreground transition-colors group-hover:text-accent">
                          {story.headline}
                        </span>
                      </div>
                      <span className="mt-0.5 shrink-0 text-slate-400 group-hover:text-foreground">
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 flex flex-col gap-2.5 text-xs leading-relaxed text-slate-300 duration-150 animate-in fade-in">
                        <p>{story.summary}</p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="inline-flex items-center rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                            <span>{tHome.sourcesCount(story.sources)}</span>
                          </span>
                          {story.tickers.map((sym) => {
                            const rep = latestReports.find(
                              (r) => r.ticker === sym
                            );
                            return (
                              <button
                                key={sym}
                                type="button"
                                onClick={() => {
                                  if (rep) onSelectReport(rep.slug, "cockpit");
                                }}
                                onMouseEnter={() => {
                                  if (rep) prefetchReport(rep.slug);
                                }}
                                className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground hover:border-accent hover:text-accent"
                              >
                                ${sym}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. QUANTITATIVE VARIANT PERCEPTION STANDOUTS */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {tHome.standoutsTitle}
                </h2>
                <p className="text-xs text-slate-400">
                  {tHome.standoutsSubtitle}
                </p>
              </div>
            </div>

            {/* Quantitative Standout Cards (Compact High-Density Grid) */}
            <div className="flex flex-col gap-2.5">
              {standoutStocks.map((stock) => {
                const sym = (
                  stock.ticker || stock.slug.split("-")[0]
                ).toUpperCase();
                const price = stock.currentPrice!;
                const prevClose = stock.previousClose ?? null;
                const isPos =
                  prevClose != null
                    ? price >= prevClose
                    : (stock.priceChangePct ?? 0) >= 0;
                const changePct =
                  stock.priceChangePct ??
                  (prevClose != null && prevClose > 0
                    ? Number(
                        (((price - prevClose) / prevClose) * 100).toFixed(2)
                      )
                    : 0);

                const wfv = stock.weightedFairValue ?? null;
                const consensusTarget = stock.analystTarget ?? null;
                const panicFloor = stock.bearFairValue ?? null;

                const downsidePct =
                  panicFloor != null && price > 0
                    ? Math.abs(((panicFloor - price) / price) * 100)
                    : null;
                const upsidePct =
                  wfv != null && price > 0
                    ? Math.max(0, ((wfv - price) / price) * 100)
                    : null;
                const asymmetryRatio =
                  downsidePct != null && downsidePct > 0 && upsidePct != null
                    ? upsidePct / downsidePct
                    : null;

                const panicDiscountPct =
                  panicFloor != null && price > 0
                    ? (((panicFloor - price) / price) * 100).toFixed(1)
                    : null;
                const consensusSpread =
                  consensusTarget != null && price > 0
                    ? (((consensusTarget - price) / price) * 100).toFixed(1)
                    : null;
                const wfvSpread =
                  wfv != null && price > 0
                    ? (((wfv - price) / price) * 100).toFixed(1)
                    : null;

                const validPrices = [
                  price,
                  panicFloor,
                  consensusTarget,
                  wfv,
                ].filter((v): v is number => v != null && v > 0);
                const minScale =
                  validPrices.length > 0
                    ? Math.min(...validPrices) * 0.94
                    : price * 0.94;
                const maxScale =
                  validPrices.length > 0
                    ? Math.max(...validPrices) * 1.06
                    : price * 1.06;
                const scaleSpan = maxScale - minScale || 1;

                const toBarPct = (v: number | null) => {
                  if (v == null) return null;
                  const p = ((v - minScale) / scaleSpan) * 100;
                  return Math.max(4, Math.min(96, p));
                };

                const panicPct = toBarPct(panicFloor);
                const pricePct = toBarPct(price);
                const consensusPct = toBarPct(consensusTarget);
                const wfvPct = toBarPct(wfv);

                const reasonNarrative = tHome.standoutReasons[sym] || null;

                return (
                  <div
                    key={stock.slug}
                    className="shadow-xs group rounded-xl border border-border/80 bg-surface-1 p-3 transition-all hover:border-border hover:bg-surface-2/30 sm:p-3.5"
                  >
                    {/* Header Row: Symbol + Company + Price + Change Badge + Launch Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded border border-border bg-surface-2 font-mono text-xs font-bold text-foreground">
                          {sym}
                        </span>
                        <div className="flex min-w-0 items-baseline gap-1.5">
                          <h3 className="truncate text-xs font-extrabold text-foreground sm:text-sm">
                            {stock.company || sym}
                          </h3>
                          <span className="hidden font-mono text-[10px] text-slate-400 sm:inline">
                            {sym} · NASDAQ
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex items-baseline gap-1.5 font-mono">
                          <span className="text-sm font-extrabold tabular-nums text-foreground sm:text-base">
                            ${price.toFixed(2)}
                          </span>
                          <span
                            className={`py-0.2 inline-flex items-center gap-0.5 rounded px-1.5 font-mono text-[10px] font-bold tabular-nums ${
                              isPos
                                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : "border border-rose-500/20 bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {isPos ? (
                              <ArrowUpRight className="size-3" />
                            ) : (
                              <ArrowDownRight className="size-3" />
                            )}
                            {Math.abs(changePct).toFixed(2)}%
                          </span>
                        </div>

                        {/* Action Launch Buttons (Integrated in Top Row) */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onSelectReport(stock.slug, "cockpit")
                            }
                            onMouseEnter={() => prefetchReport(stock.slug)}
                            className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20"
                          >
                            <SlidersHorizontal className="size-3" />
                            <span>{tHome.launchModel}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectReport(stock.slug, "memo")}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium text-slate-300 transition-all hover:text-foreground"
                          >
                            <FileText className="size-3" />
                            <span>{tHome.launchMemo}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Compact Telemetry Row */}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border/40 pt-1.5 font-mono text-[11px] text-slate-400">
                      <div>
                        <span className="mr-1 text-slate-500">
                          {tHome.prevClose}:
                        </span>
                        <span className="font-bold tabular-nums text-foreground">
                          {prevClose != null ? `$${prevClose.toFixed(2)}` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="mr-1 text-slate-500">
                          {tHome.fcfYield}:
                        </span>
                        <span className="font-bold tabular-nums text-foreground">
                          {stock.fcfYieldPct != null
                            ? `${stock.fcfYieldPct.toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="mr-1 text-slate-500">
                          {tHome.marketCap}:
                        </span>
                        <span className="font-bold tabular-nums text-foreground">
                          {stock.marketCap
                            ? `$${(stock.marketCap / 1e9).toFixed(1)}bn`
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="mr-1 text-slate-500">
                          {tHome.peRatio}:
                        </span>
                        <span className="font-bold tabular-nums text-foreground">
                          —
                        </span>
                      </div>
                      <div>
                        <span className="mr-1 text-slate-500">
                          {tHome.operatingMargin}:
                        </span>
                        <span className="font-bold tabular-nums text-foreground">
                          {stock.operatingMarginPct != null
                            ? `${stock.operatingMarginPct.toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="mr-1 text-slate-500">
                          {tHome.wfvUpside}:
                        </span>
                        <span
                          className={`font-bold tabular-nums ${
                            stock.upsidePct != null && stock.upsidePct >= 0
                              ? "text-emerald-400"
                              : stock.upsidePct != null
                                ? "text-rose-400"
                                : "text-slate-400"
                          }`}
                        >
                          {stock.upsidePct != null
                            ? `${stock.upsidePct >= 0 ? "+" : ""}${stock.upsidePct.toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>
                      {stock.snowflakeScore != null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Snowflake:</span>
                          {stock.snowflakePillars && (
                            <MiniSnowflakeRadar
                              pillars={stock.snowflakePillars}
                              score={stock.snowflakeScore}
                              size={14}
                            />
                          )}
                          <span className="font-bold tabular-nums text-indigo-400">
                            {stock.snowflakeScore}/30
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Split: Valuation Spectrum & Catalyst Note (if available) */}
                    <div className="mt-2 grid grid-cols-1 gap-2.5 border-t border-border/40 pt-2 md:grid-cols-12 md:items-center">
                      {/* 4-Regime Valuation Spectrum Bar (spans full width if no narrative) */}
                      <div
                        className={`rounded-lg border border-border/60 bg-surface-2/40 px-2.5 py-1.5 ${reasonNarrative ? "md:col-span-7" : "md:col-span-12"}`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-slate-300">
                            {tHome.valuationSpectrum}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="py-0.2 inline-flex items-center rounded border border-indigo-500/30 bg-indigo-500/10 px-1.5 font-mono text-[9px] font-bold text-indigo-400">
                              {tHome.asymmetryBadge(
                                asymmetryRatio != null
                                  ? asymmetryRatio.toFixed(1)
                                  : "—"
                              )}
                            </span>
                            {stock.consensusSpreadPct != null ? (
                              <span className="font-mono text-[10px] font-bold tabular-nums text-emerald-400">
                                {stock.consensusSpreadPct > 0 ? "+" : ""}
                                {stock.consensusSpreadPct.toFixed(1)}% vs Cons
                              </span>
                            ) : consensusTarget != null &&
                              consensusTarget > 0 &&
                              wfv != null ? (
                              <span className="font-mono text-[10px] font-bold tabular-nums text-emerald-400">
                                {((wfv - consensusTarget) / consensusTarget) *
                                  100 >
                                0
                                  ? "+"
                                  : ""}
                                {(
                                  ((wfv - consensusTarget) / consensusTarget) *
                                  100
                                ).toFixed(1)}
                                % vs Cons
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Meter Bar Track */}
                        <div className="relative my-2 h-1.5 w-full rounded-full bg-surface-3 ring-1 ring-border/60">
                          <div
                            className="absolute inset-0 rounded-full opacity-60"
                            style={{
                              background:
                                "linear-gradient(90deg, rgba(244, 63, 94, 0.5) 0%, rgba(100, 116, 139, 0.25) 30%, rgba(245, 158, 11, 0.35) 65%, rgba(16, 185, 129, 0.5) 100%)",
                            }}
                          />
                          {/* Panic Marker */}
                          {panicPct != null && panicFloor != null && (
                            <div
                              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-help"
                              style={{ left: `${panicPct}%` }}
                              title={`${tHome.panicFloor}: $${panicFloor.toFixed(1)}${panicDiscountPct ? ` (${panicDiscountPct}%)` : ""}`}
                            >
                              <div className="size-1.5 rounded-full border border-rose-500 bg-rose-600" />
                            </div>
                          )}
                          {/* Current Price Pin */}
                          {pricePct != null && (
                            <div
                              className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 cursor-help"
                              style={{ left: `${pricePct}%` }}
                              title={`${tHome.current}: $${price.toFixed(1)}`}
                            >
                              <div className="size-3 rounded-full border-2 border-white bg-slate-950 shadow-md ring-2 ring-slate-900/60 dark:border-slate-100" />
                            </div>
                          )}
                          {/* Consensus Target Marker */}
                          {consensusPct != null && consensusTarget != null && (
                            <div
                              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-help"
                              style={{ left: `${consensusPct}%` }}
                              title={`${tHome.consensus}: $${consensusTarget.toFixed(1)}${consensusSpread ? ` (${Number(consensusSpread) >= 0 ? "+" : ""}${consensusSpread}%)` : ""}`}
                            >
                              <div className="size-1.5 rounded-full border border-amber-400 bg-amber-500" />
                            </div>
                          )}
                          {/* WFV Target Marker */}
                          {wfvPct != null && wfv != null && (
                            <div
                              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-help"
                              style={{ left: `${wfvPct}%` }}
                              title={`${tHome.wfv}: $${wfv.toFixed(1)}${wfvSpread ? ` (${Number(wfvSpread) >= 0 ? "+" : ""}${wfvSpread}%)` : ""}`}
                            >
                              <div className="size-2 rounded-full border border-emerald-400 bg-emerald-500" />
                            </div>
                          )}
                        </div>

                        {/* 4-Regime Labels Underneath Track */}
                        <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] text-slate-400">
                          <div className="flex flex-col items-start truncate">
                            <span className="truncate text-[8px] uppercase tracking-wider text-rose-400/90">
                              {tHome.panicFloor}
                            </span>
                            <span className="font-bold tabular-nums text-rose-300">
                              {panicFloor != null
                                ? `$${panicFloor.toFixed(0)}`
                                : "—"}
                            </span>
                          </div>
                          <div className="flex flex-col items-center truncate">
                            <span className="truncate text-[8px] uppercase tracking-wider text-slate-300">
                              {tHome.current}
                            </span>
                            <span className="font-bold tabular-nums text-foreground">
                              ${price.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex flex-col items-center truncate">
                            <span className="truncate text-[8px] uppercase tracking-wider text-amber-400/90">
                              {tHome.consensus}
                            </span>
                            <span className="font-bold tabular-nums text-amber-300">
                              {consensusTarget != null
                                ? `$${consensusTarget.toFixed(0)}`
                                : "—"}
                            </span>
                          </div>
                          <div className="flex flex-col items-end truncate">
                            <span className="truncate text-[8px] uppercase tracking-wider text-emerald-400/90">
                              {tHome.wfv}
                            </span>
                            <span className="font-bold tabular-nums text-emerald-400">
                              {wfv != null ? `$${wfv.toFixed(0)}` : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Catalyst Note on Right (rendered ONLY when a real curated narrative exists) */}
                      {reasonNarrative && (
                        <div className="flex h-full flex-col justify-center rounded-lg border border-border/50 bg-surface-2/30 px-2.5 py-2 text-xs text-slate-300 md:col-span-5">
                          <div className="mb-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-accent">
                            <Target className="size-2.5 text-accent" />
                            <span>{tHome.reasonForMove}</span>
                          </div>
                          <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-300/90 hover:line-clamp-none">
                            {reasonNarrative}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar (4 cols): Movers & Watchlist, Upcoming Earnings & Equity Sectors */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Top Movers & Watchlist Widget */}
          <div className="shadow-xs rounded-xl border border-border/80 bg-surface-1 p-3.5 sm:p-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <SegmentedTabs
                options={moverTabOptions}
                value={moverTab}
                onChange={setMoverTab}
              />
            </div>

            <div className="custom-scrollbar mt-2 max-h-[350px] divide-y divide-border/40 overflow-y-auto pr-3">
              {moverTab === "watchlist" && moversData.watchlist.length === 0 ? (
                <div className="px-2 py-5 text-center text-xs text-slate-400">
                  <Star className="mx-auto mb-1.5 size-4 text-slate-600" />
                  <p>{tHome.emptyWatchlist}</p>
                </div>
              ) : (
                (moverTab === "gainers"
                  ? moversData.gainers
                  : moverTab === "losers"
                    ? moversData.losers
                    : moverTab === "active"
                      ? moversData.active
                      : moversData.watchlist
                ).map((item) => {
                  const sym = item.ticker || item.slug.split("-")[0];
                  const changePct = item.changePct ?? 0;
                  const isPos = changePct >= 0;

                  return (
                    <div
                      key={item.slug}
                      onClick={() => onSelectReport(item.slug, "cockpit")}
                      onMouseEnter={() => prefetchReport(item.slug)}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2/60"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded border border-border bg-surface-2 font-mono text-xs font-bold text-foreground">
                          {sym}
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold text-foreground">
                            {sym}
                          </span>
                          <span className="block max-w-[120px] truncate text-[10px] text-slate-400">
                            {item.company}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span
                          className={`block text-xs font-extrabold ${
                            isPos ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isPos ? "+" : ""}
                          {changePct.toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ${item.currentPrice?.toFixed(2) || "—"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Earnings Calendar (Compact in Right Panel) */}
          <div
            id="upcoming-earnings-section"
            className="shadow-xs rounded-xl border border-border/80 bg-surface-1 p-3.5 sm:p-4"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-accent" />
                <h3 className="text-sm font-bold text-foreground">
                  {tHome.upcomingEarningsTitle}
                </h3>
              </div>
              <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                {filteredEarnings.length}
              </span>
            </div>

            {/* Timeframe Filter Pills */}
            <SegmentedTabs
              fullWidth
              options={earningsFilterOptions}
              value={earningsFilter}
              onChange={setEarningsFilter}
              className="mt-3"
            />

            {/* Scrollable list */}
            <div className="custom-scrollbar mt-3 max-h-[360px] divide-y divide-border/40 overflow-y-auto pr-3">
              {filteredEarnings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {tHome.noUpcomingFound}
                </div>
              ) : (
                filteredEarnings.map((item) => {
                  const isFav = isFavorite(item.symbol);
                  const isBmo = item.hour === "bmo";
                  const resolvedSlug =
                    latestSlugByTicker.get(item.symbol.toUpperCase()) ||
                    item.reportSlug;
                  const hasModel = Boolean(resolvedSlug);

                  return (
                    <div
                      key={`${item.symbol}-${item.date}`}
                      onClick={() => {
                        if (resolvedSlug) {
                          onSelectReport(resolvedSlug, "cockpit");
                        }
                      }}
                      onMouseEnter={() => {
                        if (resolvedSlug) prefetchReport(resolvedSlug);
                      }}
                      className="group flex cursor-pointer items-center justify-between rounded px-2 py-2.5 transition-colors hover:bg-surface-2/60"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.symbol);
                          }}
                          className="p-0.5 text-slate-500 transition-colors hover:text-amber-400"
                          title="Toggle Watchlist"
                        >
                          <Star
                            className={`size-3.5 ${
                              isFav ? "fill-amber-400 text-amber-400" : ""
                            }`}
                          />
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {item.symbol}
                            </span>
                            <span
                              className={`py-0.2 inline-flex items-center gap-0.5 rounded px-1.5 font-mono text-[9px] font-bold ${
                                isBmo
                                  ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                                  : "border border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
                              }`}
                            >
                              {isBmo ? "BMO" : "AMC"}
                            </span>
                            {hasModel && (
                              <span
                                className="size-1.5 rounded-full bg-emerald-400"
                                title="Interactive Model Ready"
                              />
                            )}
                          </div>
                          <span className="block max-w-[130px] truncate text-[10px] text-slate-400">
                            {item.company}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 text-right font-mono">
                        <span className="text-xs font-semibold text-foreground">
                          {item.date.slice(5)}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {item.epsEstimate != null
                            ? `EPS $${item.epsEstimate.toFixed(2)}`
                            : hasModel
                              ? "Audited"
                              : "Upcoming"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Scroll footer hint */}
            <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2 font-mono text-[10px] text-slate-400">
              <span>{filteredEarnings.length} scheduled</span>
              <span>{tHome.scrollHint}</span>
            </div>
          </div>

          {/* Equity Sectors Performance List (like Perplexity Finance) */}
          <div className="shadow-xs rounded-xl border border-border/80 bg-surface-1 p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-bold text-foreground">
                {tHome.equitySectorsTitle}
              </h3>
              <span className="font-mono text-[11px] text-slate-400">ETFs</span>
            </div>

            <div className="mt-3 flex flex-col divide-y divide-border/40">
              {sectorStats.map((item) => {
                const isPos = item.changePct >= 0;
                return (
                  <div
                    key={item.sector.id}
                    onClick={() =>
                      setSelectedSectorFilter((prev) =>
                        prev === item.sector.id ? null : item.sector.id
                      )
                    }
                    className="flex cursor-pointer items-center justify-between rounded px-1 py-2 text-xs transition-colors hover:bg-surface-2/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        {renderSectorIcon(item.sector.iconName, "size-3.5")}
                      </span>
                      <span className="font-medium text-foreground">
                        {item.sectorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[11px] text-slate-400">
                        {item.sector.etf}
                      </span>
                      <span
                        className={`font-bold ${
                          isPos ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPos ? "↗" : "↘"}{" "}
                        {Math.abs(item.changePct).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
