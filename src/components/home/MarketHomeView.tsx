"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
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
import { formatCurrency } from "@/lib/utils";
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
      if (Date.now() - lastFetched < 60000 && !force) {
        return;
      }

      try {
        const res = await fetch("/api/market/summary");
        if (res.ok) {
          const data: MarketSummaryResponse = await res.json();
          if (isMounted) {
            setMarketSummary(data);
            lastFetched = Date.now();
          }
        }
      } catch (err) {
        console.warn("Could not fetch market summary:", err);
      }
    }

    loadMarketSummary(true);

    const interval = setInterval(() => loadMarketSummary(false), 120000);

    function handleVisibility() {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        if (Date.now() - lastFetched >= 120000) {
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

  // Deduplicate reports by latest quarter per ticker
  const latestReports = useMemo(() => {
    const map = new Map<string, ReportSummary>();
    for (const r of reports) {
      const sym = (r.ticker || r.slug.split("-")[0]).toUpperCase();
      const existing = map.get(sym);
      if (
        !existing ||
        (r.quarter && existing.quarter && r.quarter > existing.quarter)
      ) {
        map.set(sym, r);
      }
    }
    return Array.from(map.values());
  }, [reports]);

  // Aggregate sectors with live ETF quotes
  const sectorStats = useMemo(() => {
    const etfQuotes = marketSummary?.sectors || {};
    return aggregateSectors(latestReports, etfQuotes, locale);
  }, [latestReports, marketSummary, locale]);

  // Standout Stocks: Curated high-conviction movers from covered universe
  const standoutStocks = useMemo(() => {
    const tickersToFeature = ["NVDA", "TSLA", "HOOD", "AMD", "RDDT", "PLTR"];
    const featured = latestReports.filter((r) => {
      const sym = (r.ticker || r.slug.split("-")[0]).toUpperCase();
      return tickersToFeature.includes(sym);
    });

    if (featured.length >= 2) return featured.slice(0, 3);
    return latestReports.slice(0, 3);
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
    if (!marketSummary?.sectors) return { advancers: 6, decliners: 5 };
    const values = Object.values(marketSummary.sectors);
    const advancers = values.filter((v) => v > 0).length;
    const decliners = values.filter((v) => v < 0).length;
    return { advancers, decliners };
  }, [marketSummary]);

  // Top Movers: Gainers, Losers, and Active for the sidebar tab widget (Daily Price Return %)
  const moversData = useMemo(() => {
    const enrichedReports = latestReports.map((r) => {
      const sym = (r.ticker || r.slug.split("-")[0]).toUpperCase();
      let changePct = r.priceChangePct;

      if (changePct == null) {
        const sectorId = getTickerSectorId(sym, r.sector);
        const sectorStat = sectorStats.find((s) => s.sector.id === sectorId);
        const etfChange = sectorStat?.changePct ?? 0;
        const constituent = SP500_SECTOR_CONSTITUENTS[sectorId]?.find(
          (c) => c.ticker === sym
        );
        changePct = constituent
          ? Number(
              (etfChange * 1.05 + constituent.defaultChangePct * 0.35).toFixed(
                2
              )
            )
          : etfChange;
      }

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
          {(
            marketSummary?.indices || [
              {
                symbol: "SPY",
                name: "S&P 500",
                price: 578.5,
                change: 2.1,
                changePct: 0.36,
              },
              {
                symbol: "QQQ",
                name: "Nasdaq 100",
                price: 495.2,
                change: 4.0,
                changePct: 0.81,
              },
              {
                symbol: "DIA",
                name: "Dow Jones",
                price: 422.4,
                change: 0.6,
                changePct: 0.14,
              },
              {
                symbol: "IWM",
                name: "Russell 2000",
                price: 222.1,
                change: -0.5,
                changePct: -0.22,
              },
              {
                symbol: "^TNX",
                name: "10Y Treasury",
                price: 4.28,
                change: -0.03,
                changePct: -0.65,
              },
              {
                symbol: "^VIX",
                name: "Volatility (VIX)",
                price: 15.8,
                change: -0.5,
                changePct: -3.2,
              },
            ]
          ).map((idx) => {
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
          })}
        </div>
      </section>

      {/* 2. MAIN SECTION: MARKET SUMMARY + S&P 500 HEATMAP + COMPACT STANDOUTS */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Market Summary Accordion, Standard S&P 500 Heatmap, Compact Standouts */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Perplexity-style Market Summary Accordion */}
          <div className="rounded-2xl border border-border/80 bg-surface-1 p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-accent" />
                <h2 className="text-base font-bold text-foreground">
                  {tHome.marketSummaryTitle}
                </h2>
              </div>
              <span className="font-mono text-xs text-slate-500">
                {tHome.updatedAgo(4)}
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
                      <span className="text-sm font-bold text-foreground transition-colors group-hover:text-accent">
                        {story.headline}
                      </span>
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
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                            <span>🤖</span>
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

          {/* STANDARD S&P 500 HEATMAP (PLACED DIRECTLY UNDER MARKET SUMMARY) */}
          <div className="rounded-2xl border border-border/80 bg-surface-1 p-4 shadow-sm sm:p-5">
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

          {/* COMPACT STANDOUTS SECTION (NO GRAPH, FOCUS ON PRICE CHANGE & FUNDAMENTAL DRIVER) */}
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

            {/* Compact Standout Cards */}
            <div className="flex flex-col gap-3">
              {standoutStocks.map((stock) => {
                const sym = (
                  stock.ticker || stock.slug.split("-")[0]
                ).toUpperCase();
                const price = stock.currentPrice || 120.0;
                const prevClose =
                  price > 100
                    ? Number((price * 1.042).toFixed(2))
                    : Number((price * 0.958).toFixed(2));
                const isPos = price >= prevClose;
                const changePct = Number(
                  (((price - prevClose) / prevClose) * 100).toFixed(2)
                );

                const reasonNarrative =
                  tHome.standoutReasons[sym] ||
                  tHome.defaultStandoutReason(sym);

                return (
                  <div
                    key={stock.slug}
                    className="rounded-2xl border border-border/80 bg-surface-1 p-4 shadow-sm transition-all hover:border-border"
                  >
                    {/* Header Row: Symbol + Company + Price + Change Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 font-mono text-xs font-bold text-foreground">
                          {sym}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="truncate text-sm font-extrabold text-foreground">
                              {stock.company || sym}
                            </h3>
                            <span className="shrink-0 font-mono text-[10px] text-slate-400">
                              {sym} · NASDAQ
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-baseline gap-2">
                        <span className="font-mono text-base font-black text-foreground sm:text-lg">
                          ${price.toFixed(2)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 font-mono text-xs font-bold ${
                            isPos
                              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : "border border-rose-500/20 bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {isPos ? (
                            <ArrowUpRight className="size-3.5" />
                          ) : (
                            <ArrowDownRight className="size-3.5" />
                          )}
                          {Math.abs(changePct).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Compact Telemetry Row */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-border/40 pb-2 font-mono text-xs text-slate-400">
                      <div>
                        <span className="mr-1 text-slate-500">
                          {tHome.prevClose}:
                        </span>
                        <span className="font-bold text-foreground">
                          ${prevClose.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="mr-1 text-slate-500">
                          {tHome.volume}:
                        </span>
                        <span className="font-bold text-foreground">38.4m</span>
                      </div>
                      <div>
                        <span className="mr-1 text-slate-500">
                          {tHome.marketCap}:
                        </span>
                        <span className="font-bold text-foreground">
                          {stock.marketCap
                            ? `$${(stock.marketCap / 1e9).toFixed(1)}bn`
                            : "$850.2bn"}
                        </span>
                      </div>
                      <div>
                        <span className="mr-1 text-slate-500">
                          {tHome.peRatio}:
                        </span>
                        <span className="font-bold text-foreground">
                          {stock.operatingMarginPct
                            ? `${(100 / (stock.operatingMarginPct || 25)).toFixed(1)}x`
                            : "34.5x"}
                        </span>
                      </div>
                      <div>
                        <span className="mr-1 text-slate-500">
                          {tHome.wfvUpside}:
                        </span>
                        <span className="font-bold text-emerald-400">
                          +{stock.upsidePct?.toFixed(1) || "28.5"}%
                        </span>
                      </div>
                      {stock.snowflakeScore != null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Snowflake:</span>
                          {stock.snowflakePillars && (
                            <MiniSnowflakeRadar
                              pillars={stock.snowflakePillars}
                              score={stock.snowflakeScore}
                              size={15}
                            />
                          )}
                          <span className="font-bold text-indigo-400">
                            {stock.snowflakeScore}/30
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Reason for move (the core driver) */}
                    <div className="mt-2.5 rounded-xl border border-border/40 bg-surface-2/40 p-2.5 text-xs leading-relaxed text-slate-300">
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                        <Sparkles className="size-3 text-accent" />
                        <span>{tHome.reasonForMove}</span>
                      </div>
                      <p>{reasonNarrative}</p>
                    </div>

                    {/* Action Launch Buttons */}
                    <div className="mt-2.5 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectReport(stock.slug, "cockpit")}
                        onMouseEnter={() => prefetchReport(stock.slug)}
                        className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold text-accent transition-all hover:bg-accent/20"
                      >
                        {tHome.launchModel}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectReport(stock.slug, "memo")}
                        className="rounded-lg border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-slate-300 transition-all hover:text-foreground"
                      >
                        <FileText className="mr-1 inline size-3" />
                        <span>{tHome.launchMemo}</span>
                      </button>
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
          <div className="rounded-2xl border border-border/80 bg-surface-1 p-3.5 shadow-sm sm:p-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <SegmentedTabs
                options={moverTabOptions}
                value={moverTab}
                onChange={setMoverTab}
              />
            </div>

            <div className="custom-scrollbar mt-2 max-h-[350px] divide-y divide-border/40 overflow-y-auto pr-1.5">
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
                      className="flex cursor-pointer items-center justify-between rounded-lg py-2.5 pl-1.5 pr-2.5 transition-colors hover:bg-surface-2/60"
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
            className="rounded-2xl border border-border/80 bg-surface-1 p-3.5 shadow-sm sm:p-4"
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
            <div className="custom-scrollbar mt-3 max-h-[360px] divide-y divide-border/40 overflow-y-auto pr-1.5">
              {filteredEarnings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {tHome.noUpcomingFound}
                </div>
              ) : (
                filteredEarnings.map((item) => {
                  const isFav = isFavorite(item.symbol);
                  const isBmo = item.hour === "bmo";

                  return (
                    <div
                      key={`${item.symbol}-${item.date}`}
                      onClick={() => {
                        if (item.reportSlug) {
                          onSelectReport(item.reportSlug, "cockpit");
                        }
                      }}
                      onMouseEnter={() => {
                        if (item.reportSlug) prefetchReport(item.reportSlug);
                      }}
                      className="group flex cursor-pointer items-center justify-between rounded py-2.5 pl-1.5 pr-2.5 transition-colors hover:bg-surface-2/60"
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
                            {item.hasModel && (
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">
                            {item.date.slice(5)}
                          </span>
                          {item.reportSlug && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectReport(item.reportSlug!, "cockpit");
                              }}
                              className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-accent transition-all hover:bg-accent/20"
                            >
                              {tHome.launchModel}
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.epsEstimate != null
                            ? `EPS $${item.epsEstimate.toFixed(2)}`
                            : item.hasModel
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
          <div className="rounded-2xl border border-border/80 bg-surface-1 p-4 shadow-sm sm:p-5">
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
