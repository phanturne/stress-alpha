"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Search,
  Shield,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Star,
  LayoutGrid,
  Table as TableIcon,
  TrendingUp,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Plus,
  Trash2,
  NotebookPen,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { Skeleton } from "./ui/Skeleton";
import { MiniSnowflakeRadar } from "./snowflake/MiniSnowflakeRadar";
import type { ReportSummary } from "@/lib/repository";
import {
  formatCurrency,
  formatPercent,
  normalizeTicker,
  compareReportsByRecency,
} from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";
import { useWatchlist } from "@/lib/watchlist";
import { useStockNotes } from "@/lib/notes";
import { useReportPrefetch } from "@/hooks/useReportPrefetch";
import { StockNotesModal } from "./StockNotesModal";
import { FilterDropdown } from "./ScreenerView";
import Link from "next/link";

export const WATCHLIST_PAGE_SIZE = 50;

export interface WatchlistViewProps {
  reports: ReportSummary[];
  onSelectReport: (slug: string, mode?: "cockpit" | "memo") => void;
  locale?: Locale;
  isLoading?: boolean;
}

type MoatFilter = "all" | "wide" | "narrow" | "none";
type DivergenceFilter =
  | "all"
  | "extreme_divergence"
  | "high_conviction_alpha"
  | "moderate_alpha"
  | "in_line";
type UpsideFilter =
  "all" | "undervalued" | "high-upside" | "deep-value" | "overvalued";
type SnowflakeFilter = "all" | "exceptional" | "investment-grade";

type SortField =
  | "upside"
  | "baseUpside"
  | "divergence"
  | "snowflake"
  | "price"
  | "ticker"
  | "opMargin"
  | "revGrowth";

type SortDirection = "asc" | "desc";

interface WatchlistTickerGroup {
  ticker: string;
  company: string;
  latestReport: ReportSummary;
  historicalReports: ReportSummary[];
  allReports: ReportSummary[];
}

export const WatchlistView: React.FC<WatchlistViewProps> = React.memo(
  function WatchlistView({
    reports,
    onSelectReport,
    locale = "en",
    isLoading = false,
  }) {
    const t = getTranslations(locale);
    const tw = t.watchlistPage;
    const ts = t.screener;
    const tNotes = t.stockNotes;
    const { prefetchReport } = useReportPrefetch();

    const {
      isFavorite,
      toggleFavorite,
      count: watchlistCount,
      isSyncing,
    } = useWatchlist();
    const { hasNote, getNote } = useStockNotes();
    const [activeNoteStock, setActiveNoteStock] = useState<{
      ticker: string;
      company?: string;
    } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [moatFilter, setMoatFilter] = useState<MoatFilter>("all");
    const [divergenceFilter, setDivergenceFilter] =
      useState<DivergenceFilter>("all");
    const [upsideFilter, setUpsideFilter] = useState<UpsideFilter>("all");
    const [snowflakeFilter, setSnowflakeFilter] =
      useState<SnowflakeFilter>("all");
    const [sortField, setSortField] = useState<SortField>("upside");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

    const hasActiveFilters = Boolean(
      searchQuery.trim() ||
      moatFilter !== "all" ||
      divergenceFilter !== "all" ||
      upsideFilter !== "all" ||
      snowflakeFilter !== "all"
    );

    const handleResetFilters = () => {
      setSearchQuery("");
      setMoatFilter("all");
      setDivergenceFilter("all");
      setUpsideFilter("all");
      setSnowflakeFilter("all");
    };

    // Restore saved viewMode preference on client mount to prevent SSR hydration mismatch
    useEffect(() => {
      try {
        const saved = localStorage.getItem("stress_alpha_watchlist_view_mode");
        if (saved === "cards" || saved === "table") {
          Promise.resolve().then(() => setViewMode(saved));
        }
      } catch {}
    }, []);

    const handleSetViewMode = (mode: "cards" | "table") => {
      setViewMode(mode);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("stress_alpha_watchlist_view_mode", mode);
        } catch {}
      }
    };

    // Group all favorited reports by ticker symbol
    const tickerGroups = useMemo<WatchlistTickerGroup[]>(() => {
      const favoritedReports = reports.filter((r) =>
        isFavorite(r.ticker || r.slug)
      );

      const groupMap = new Map<string, ReportSummary[]>();

      for (const report of favoritedReports) {
        const symbol = normalizeTicker(report.ticker || report.slug);
        if (!symbol) continue;
        const existing = groupMap.get(symbol);
        if (existing) {
          existing.push(report);
        } else {
          groupMap.set(symbol, [report]);
        }
      }

      const groups: WatchlistTickerGroup[] = [];

      groupMap.forEach((reps, symbol) => {
        // Sort reports by recency descending (latest first)
        const sorted = [...reps].sort(compareReportsByRecency);

        const latestReport = sorted[0];
        const historicalReports = sorted.slice(1);

        groups.push({
          ticker: symbol,
          company: latestReport.company || symbol,
          latestReport,
          historicalReports,
          allReports: sorted,
        });
      });

      return groups;
    }, [reports, isFavorite]);

    // Aggregate portfolio metrics across tracked tickers
    const portfolioStats = useMemo(() => {
      const count = tickerGroups.length;
      if (count === 0) {
        return {
          trackedCount: 0,
          avgUpside: 0,
          convictionLeader: null,
          wideMoatShare: 0,
          avgSnowflake: 0,
        };
      }

      let totalUpside = 0;
      let wideMoatCount = 0;
      let totalSnowflake = 0;
      let leader: ReportSummary | null = null;
      let maxUpside = -Infinity;

      for (const g of tickerGroups) {
        const r = g.latestReport;
        const upside = r.upsidePct ?? 0;
        totalUpside += upside;
        if (upside > maxUpside) {
          maxUpside = upside;
          leader = r;
        }
        if (r.moatRating?.toLowerCase() === "wide") {
          wideMoatCount++;
        }
        totalSnowflake += r.snowflakeScore ?? 0;
      }

      return {
        trackedCount: count,
        avgUpside: totalUpside / count,
        convictionLeader: leader,
        wideMoatShare: Math.round((wideMoatCount / count) * 100),
        avgSnowflake: (totalSnowflake / count).toFixed(1),
      };
    }, [tickerGroups]);

    // Dynamic counts for FilterDropdown options
    const moatCounts = useMemo(() => {
      const counts = { all: tickerGroups.length, wide: 0, narrow: 0, none: 0 };
      for (const g of tickerGroups) {
        const m = g.latestReport.moatRating?.toLowerCase();
        if (m === "wide") counts.wide++;
        else if (m === "narrow") counts.narrow++;
        else counts.none++;
      }
      return counts;
    }, [tickerGroups]);

    const divergenceCounts = useMemo(() => {
      const counts: Record<string, number> = { all: tickerGroups.length };
      for (const g of tickerGroups) {
        const d = g.latestReport.divergenceClassification;
        if (d) counts[d] = (counts[d] || 0) + 1;
      }
      return counts;
    }, [tickerGroups]);

    const upsideCounts = useMemo(() => {
      const counts = {
        all: tickerGroups.length,
        undervalued: 0,
        "high-upside": 0,
        "deep-value": 0,
        overvalued: 0,
      };
      for (const g of tickerGroups) {
        const up = g.latestReport.upsidePct ?? 0;
        if (up > 0) counts.undervalued++;
        if (up >= 20) counts["high-upside"]++;
        if (up >= 30) counts["deep-value"]++;
        if (up < 0) counts.overvalued++;
      }
      return counts;
    }, [tickerGroups]);

    const qualityCounts = useMemo(() => {
      const counts = {
        all: tickerGroups.length,
        exceptional: 0,
        "investment-grade": 0,
      };
      for (const g of tickerGroups) {
        const score = g.latestReport.snowflakeScore ?? 0;
        if (score >= 24) counts.exceptional++;
        if (score >= 18) counts["investment-grade"]++;
      }
      return counts;
    }, [tickerGroups]);

    // Filtered and sorted ticker groups
    const filteredGroups = useMemo(() => {
      let result = [...tickerGroups];

      // Search query filter (ticker, company, divergence tier)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter((g) => {
          const tMatch = g.ticker.toLowerCase().includes(q);
          const cMatch = g.company.toLowerCase().includes(q);
          const tierMatch =
            g.latestReport.divergenceClassification
              ?.toLowerCase()
              .includes(q) ?? false;
          return tMatch || cMatch || tierMatch;
        });
      }

      // Moat filter
      if (moatFilter !== "all") {
        result = result.filter((g) => {
          const m = g.latestReport.moatRating?.toLowerCase();
          if (moatFilter === "none") return !m || m === "none";
          return m === moatFilter;
        });
      }

      // Divergence Tier filter
      if (divergenceFilter !== "all") {
        result = result.filter(
          (g) => g.latestReport.divergenceClassification === divergenceFilter
        );
      }

      // Upside filter
      if (upsideFilter !== "all") {
        result = result.filter((g) => {
          const up = g.latestReport.upsidePct ?? 0;
          switch (upsideFilter) {
            case "undervalued":
              return up > 0;
            case "high-upside":
              return up >= 20;
            case "deep-value":
              return up >= 30;
            case "overvalued":
              return up < 0;
            default:
              return true;
          }
        });
      }

      // Snowflake Quality filter
      if (snowflakeFilter !== "all") {
        result = result.filter((g) => {
          const score = g.latestReport.snowflakeScore ?? 0;
          switch (snowflakeFilter) {
            case "exceptional":
              return score >= 24;
            case "investment-grade":
              return score >= 18;
            default:
              return true;
          }
        });
      }

      // Sort
      result.sort((a, b) => {
        const rA = a.latestReport;
        const rB = b.latestReport;
        let valA: number | string = 0;
        let valB: number | string = 0;

        switch (sortField) {
          case "upside":
            valA = rA.upsidePct ?? -999;
            valB = rB.upsidePct ?? -999;
            break;
          case "baseUpside":
            valA = rA.baseUpsidePct ?? -999;
            valB = rB.baseUpsidePct ?? -999;
            break;
          case "divergence":
            valA = rA.consensusSpreadPct ?? -999;
            valB = rB.consensusSpreadPct ?? -999;
            break;
          case "snowflake":
            valA = rA.snowflakeScore ?? 0;
            valB = rB.snowflakeScore ?? 0;
            break;
          case "price":
            valA = rA.currentPrice ?? 0;
            valB = rB.currentPrice ?? 0;
            break;
          case "ticker":
            valA = a.ticker;
            valB = b.ticker;
            break;
          case "opMargin":
            valA = rA.operatingMarginPct ?? -999;
            valB = rB.operatingMarginPct ?? -999;
            break;
          case "revGrowth":
            valA = rA.revenueGrowthPct ?? -999;
            valB = rB.revenueGrowthPct ?? -999;
            break;
        }

        if (typeof valA === "string" && typeof valB === "string") {
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        const numA = Number(valA);
        const numB = Number(valB);
        return sortDirection === "asc" ? numA - numB : numB - numA;
      });

      return result;
    }, [
      tickerGroups,
      searchQuery,
      moatFilter,
      divergenceFilter,
      upsideFilter,
      snowflakeFilter,
      sortField,
      sortDirection,
    ]);

    // Progressive rendering batch size (renders initial 50 rows in <15ms, auto-increments on scroll)
    const [visibleCount, setVisibleCount] = useState(WATCHLIST_PAGE_SIZE);
    const observerTargetRef = useRef<HTMLDivElement | null>(null);

    // Reset visible count when filters or sorting change
    const filterKey = `${searchQuery}|${moatFilter}|${divergenceFilter}|${upsideFilter}|${snowflakeFilter}|${sortField}|${sortDirection}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (prevFilterKey !== filterKey) {
      setPrevFilterKey(filterKey);
      setVisibleCount(WATCHLIST_PAGE_SIZE);
    }

    const displayedGroups = useMemo(() => {
      return filteredGroups.slice(0, visibleCount);
    }, [filteredGroups, visibleCount]);

    const handleLoadAll = useCallback(() => {
      setVisibleCount(filteredGroups.length);
    }, [filteredGroups.length]);

    useEffect(() => {
      const el = observerTargetRef.current;
      if (!el || visibleCount >= filteredGroups.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setVisibleCount((prev) =>
              Math.min(prev + WATCHLIST_PAGE_SIZE, filteredGroups.length)
            );
          }
        },
        { rootMargin: "400px" }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [visibleCount, filteredGroups.length]);

    // Suggested popular tickers for quick-add empty state
    const popularSuggestions = useMemo(() => {
      const unstarred = new Map<string, ReportSummary>();
      for (const r of reports) {
        const symbol = normalizeTicker(r.ticker || r.slug);
        if (symbol && !isFavorite(symbol) && !unstarred.has(symbol)) {
          unstarred.set(symbol, r);
        }
      }
      return Array.from(unstarred.values()).slice(0, 6);
    }, [reports, isFavorite]);

    const handleSort = (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
    };

    const getDivergenceBadge = (
      tier?:
        | "in_line"
        | "moderate_alpha"
        | "high_conviction_alpha"
        | "extreme_divergence",
      spreadPct?: number
    ) => {
      if (!tier) return null;
      const label = tw.divergenceTiers[tier] || tier;

      let badgeClass =
        "border-slate-300 dark:border-slate-500/30 bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300";
      if (tier === "extreme_divergence") {
        badgeClass =
          "border-fuchsia-300 dark:border-fuchsia-500/30 bg-fuchsia-50 dark:bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300";
      } else if (tier === "high_conviction_alpha") {
        badgeClass =
          "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
      } else if (tier === "moderate_alpha") {
        badgeClass =
          "border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300";
      }

      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ${badgeClass}`}
        >
          <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" />
          <span>{label}</span>
          {spreadPct !== undefined && (
            <span className="opacity-90">
              ({spreadPct >= 0 ? "+" : ""}
              {spreadPct.toFixed(1)}%)
            </span>
          )}
        </span>
      );
    };

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Star className="size-6 shrink-0 fill-amber-400 text-amber-400" />
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  {tw.title}
                </h1>
                {tickerGroups.length > 0 && (
                  <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-400">
                    {tickerGroups.length}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              {tw.subtitle}
            </p>
          </div>
        </div>

        {/* Top Portfolio Summary KPI Strip (when watchlist has items) */}
        {tickerGroups.length > 0 && (
          <div className="glass-panel grid grid-cols-2 divide-y divide-border/60 rounded-xl border border-border bg-surface-1/90 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
            {/* 1. Tracked Equities */}
            <div className="flex flex-col justify-between p-3.5 sm:p-4">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {tw.statsTracked}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black tabular-nums text-foreground sm:text-3xl">
                  {portfolioStats.trackedCount}
                </span>
                <span className="font-mono text-[11px] font-medium text-slate-400">
                  Equities
                </span>
              </div>
            </div>

            {/* 2. Avg Fair Value Upside */}
            <div className="flex flex-col justify-between p-3.5 sm:p-4">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {tw.statsAvgUpside}
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span
                  className={`font-mono text-2xl font-black tabular-nums sm:text-3xl ${
                    portfolioStats.avgUpside >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {portfolioStats.avgUpside >= 0 ? "+" : ""}
                  {portfolioStats.avgUpside.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* 3. Conviction Leader */}
            <div className="flex flex-col justify-between p-3.5 sm:p-4">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {tw.statsConvictionLeader}
              </span>
              <div className="mt-2 flex items-baseline gap-1.5 truncate">
                {portfolioStats.convictionLeader ? (
                  <>
                    <span className="font-mono text-2xl font-black text-foreground sm:text-3xl">
                      {portfolioStats.convictionLeader.ticker}
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      +
                      {(portfolioStats.convictionLeader.upsidePct ?? 0).toFixed(
                        1
                      )}
                      %
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-sm text-slate-400">—</span>
                )}
              </div>
            </div>

            {/* 4. Wide Moat Share */}
            <div className="flex flex-col justify-between p-3.5 sm:p-4">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {tw.statsWideMoat}
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-black tabular-nums text-foreground sm:text-3xl">
                  {portfolioStats.wideMoatShare}%
                </span>
              </div>
            </div>

            {/* 5. Avg Snowflake Health */}
            <div className="col-span-2 flex flex-col justify-between p-3.5 sm:col-span-1 sm:p-4">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {tw.statsAvgSnowflake}
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-black tabular-nums text-foreground sm:text-3xl">
                  {portfolioStats.avgSnowflake}
                </span>
                <span className="font-mono text-xs text-slate-400">/ 30</span>
              </div>
            </div>
          </div>
        )}

        {/* Watchlist Controls Cockpit Panel */}
        {tickerGroups.length > 0 && (
          <div className="glass-panel rounded-xl border border-border p-2 sm:p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-2.5">
              {/* Left: Search Bar */}
              <div className="flex min-w-[200px] max-w-xs flex-1 items-center gap-1.5 sm:max-w-sm sm:gap-2">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={tw.searchPlaceholder}
                    className="w-full rounded-lg border border-border bg-surface-0/80 py-1.5 pl-9 pr-8 text-xs text-foreground placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Center: The 4 Orthogonal Filter Dropdowns (Moat + Divergence + Valuation + Quality) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Moat Dropdown */}
                <FilterDropdown
                  label={tw.colMoat}
                  value={moatFilter}
                  defaultValue="all"
                  icon={<Shield className="size-3.5 text-purple-400" />}
                  activeColorClass="border-purple-500/50 bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30"
                  options={[
                    {
                      id: "all",
                      label: ts.allMoats,
                      count: moatCounts.all,
                      title: ts.allMoatsTooltip,
                    },
                    {
                      id: "wide",
                      label: ts.wideMoat,
                      count: moatCounts.wide,
                      icon: <Shield className="size-3 text-purple-400" />,
                      title: ts.wideMoatTooltip,
                    },
                    {
                      id: "narrow",
                      label: ts.narrowMoat,
                      count: moatCounts.narrow,
                      icon: <Shield className="size-3 text-sky-400" />,
                      title: ts.narrowMoatTooltip,
                    },
                    {
                      id: "none",
                      label: ts.moatNone,
                      count: moatCounts.none,
                      title: ts.moatNoneTooltip,
                    },
                  ]}
                  onChange={setMoatFilter}
                  align="left"
                />

                {/* Divergence Tier Dropdown */}
                <FilterDropdown
                  label={tw.colDivergence}
                  value={divergenceFilter}
                  defaultValue="all"
                  icon={<Sparkles className="size-3.5 text-amber-400" />}
                  activeColorClass="border-amber-500/50 bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                  options={[
                    {
                      id: "all",
                      label: ts.filterAll,
                      count: divergenceCounts.all,
                    },
                    {
                      id: "extreme_divergence",
                      label: tw.divergenceTiers.extreme_divergence,
                      count: divergenceCounts.extreme_divergence || 0,
                      icon: <Sparkles className="size-3 text-rose-400" />,
                    },
                    {
                      id: "high_conviction_alpha",
                      label: tw.divergenceTiers.high_conviction_alpha,
                      count: divergenceCounts.high_conviction_alpha || 0,
                      icon: <Sparkles className="size-3 text-amber-400" />,
                    },
                    {
                      id: "moderate_alpha",
                      label: tw.divergenceTiers.moderate_alpha,
                      count: divergenceCounts.moderate_alpha || 0,
                      icon: <Sparkles className="size-3 text-sky-400" />,
                    },
                    {
                      id: "in_line",
                      label: tw.divergenceTiers.in_line,
                      count: divergenceCounts.in_line || 0,
                    },
                  ]}
                  onChange={setDivergenceFilter}
                  align="left"
                />

                {/* Valuation / Upside Dropdown */}
                <FilterDropdown
                  label={ts.filterUpside}
                  value={upsideFilter}
                  defaultValue="all"
                  icon={<TrendingUp className="size-3.5 text-emerald-400" />}
                  activeColorClass="border-emerald-500/50 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                  options={[
                    {
                      id: "all",
                      label: ts.filterAll,
                      count: upsideCounts.all,
                      title: ts.filterAllTooltip,
                    },
                    {
                      id: "undervalued",
                      label: ts.filterUndervalued,
                      shortLabel: ">0%",
                      count: upsideCounts.undervalued,
                      icon: <TrendingUp className="size-3 text-green-400" />,
                      title: ts.filterUndervaluedTooltip,
                    },
                    {
                      id: "high-upside",
                      label: ts.filterHighUpside,
                      shortLabel: ">20%",
                      count: upsideCounts["high-upside"],
                      icon: <TrendingUp className="size-3 text-emerald-400" />,
                      title: ts.filterHighUpsideTooltip,
                    },
                    {
                      id: "deep-value",
                      label: ts.filterDeepValue,
                      shortLabel: ">30%",
                      count: upsideCounts["deep-value"],
                      icon: <Sparkles className="size-3 text-amber-400" />,
                      title: ts.filterDeepValueTooltip,
                    },
                    {
                      id: "overvalued",
                      label: ts.filterOvervalued,
                      shortLabel: "<0%",
                      count: upsideCounts.overvalued,
                      icon: (
                        <TrendingUp className="size-3 rotate-180 text-rose-400" />
                      ),
                      title: ts.filterOvervaluedTooltip,
                    },
                  ]}
                  onChange={setUpsideFilter}
                  align="right"
                />

                {/* Quality / Snowflake Dropdown */}
                <FilterDropdown
                  label={ts.filterQuality}
                  value={snowflakeFilter}
                  defaultValue="all"
                  icon={<CheckCircle2 className="size-3.5 text-cyan-400" />}
                  activeColorClass="border-cyan-500/50 bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                  options={[
                    {
                      id: "all",
                      label: ts.allQuality,
                      count: qualityCounts.all,
                    },
                    {
                      id: "exceptional",
                      label: ts.snowflakeExceptional,
                      shortLabel: "24+",
                      count: qualityCounts.exceptional,
                      icon: <Sparkles className="size-3 text-cyan-400" />,
                      title: ts.snowflakeExceptionalTooltip,
                    },
                    {
                      id: "investment-grade",
                      label: ts.snowflakeInvestGrade,
                      shortLabel: "18+",
                      count: qualityCounts["investment-grade"],
                      icon: <CheckCircle2 className="size-3 text-sky-400" />,
                      title: ts.snowflakeInvestGradeTooltip,
                    },
                  ]}
                  onChange={setSnowflakeFilter}
                  align="right"
                />
              </div>

              {/* Right: View Mode Toggle + Results Count + Reset */}
              <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
                <div className="flex items-center rounded-lg border border-border bg-surface-0/60 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("cards")}
                    className={`flex items-center gap-1.5 rounded px-2 py-1 font-semibold transition-colors ${
                      viewMode === "cards"
                        ? "bg-accent/20 font-bold text-accent"
                        : "text-slate-400 hover:text-foreground"
                    }`}
                    title={tw.viewCards}
                  >
                    <LayoutGrid className="size-3.5" />
                    <span className="hidden lg:inline">{tw.viewCards}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("table")}
                    className={`flex items-center gap-1.5 rounded px-2 py-1 font-semibold transition-colors ${
                      viewMode === "table"
                        ? "bg-accent/20 font-bold text-accent"
                        : "text-slate-400 hover:text-foreground"
                    }`}
                    title={tw.viewTable}
                  >
                    <TableIcon className="size-3.5" />
                    <span className="hidden lg:inline">{tw.viewTable}</span>
                  </button>
                </div>

                <div className="hidden h-4 w-px bg-border/60 sm:block" />

                <div className="flex items-center gap-2">
                  <span className="cursor-help whitespace-nowrap font-mono text-xs tabular-nums text-slate-400 hover:text-slate-200">
                    {filteredGroups.length} of {tickerGroups.length}
                  </span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/15 px-2 py-1 font-mono text-xs font-semibold text-accent transition-all hover:border-accent/50 hover:bg-accent/25"
                      title={ts.resetFiltersTooltip}
                    >
                      <RotateCcw className="size-3" />
                      <span>{ts.resetFilters}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {(isLoading || (isSyncing && tickerGroups.length === 0)) && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-panel shadow-xs space-y-4 rounded-2xl border border-border bg-surface-1/90 p-5"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State Experience (0 items in watchlist) */}
        {!isLoading && !isSyncing && tickerGroups.length === 0 && (
          <div className="glass-panel shadow-xs mx-auto my-8 max-w-2xl rounded-2xl border border-border bg-surface-1/90 p-8 text-center sm:p-12">
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <Star className="size-8 text-amber-400" />
              <h2 className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {tw.emptyTitle}
              </h2>
              <p className="text-pretty text-sm leading-relaxed text-slate-400">
                {tw.emptyDesc}
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <Link
                href="/screener"
                className="shadow-xs inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-950 transition-all hover:bg-accent-hover active:scale-[0.98]"
              >
                <BarChart3 className="size-4" />
                <span>{tw.exploreScreenerBtn}</span>
              </Link>
            </div>

            {/* Quick-add popular recommendations */}
            {popularSuggestions.length > 0 && (
              <div className="mt-4 w-full border-t border-border pt-6">
                <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {tw.quickAddSuggestions}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {popularSuggestions.map((report) => {
                    const symbol = report.ticker || report.slug.split("-")[0];
                    return (
                      <button
                        key={report.slug}
                        type="button"
                        onClick={() => toggleFavorite(symbol)}
                        className="group flex items-center gap-2 rounded-xl border border-border bg-surface-1/90 px-3 py-2 text-xs transition-all hover:border-amber-500/40 hover:bg-surface-2 hover:text-foreground"
                      >
                        <Plus className="size-3.5 text-amber-400 transition-transform group-hover:scale-125" />
                        <span className="font-mono font-bold text-foreground">
                          {symbol}
                        </span>
                        {report.company && (
                          <span className="max-w-[120px] truncate text-[11px] text-slate-400">
                            {report.company}
                          </span>
                        )}
                        {report.upsidePct !== undefined && (
                          <span
                            className={`font-mono text-[11px] font-bold ${
                              report.upsidePct >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {report.upsidePct >= 0 ? "+" : ""}
                            {report.upsidePct.toFixed(0)}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No results for current filter */}
        {!isLoading &&
          tickerGroups.length > 0 &&
          filteredGroups.length === 0 && (
            <div className="glass-panel shadow-xs my-8 rounded-2xl border border-border bg-surface-1/90 p-8 text-center text-slate-400">
              <p className="text-sm">{tw.noFilterMatches}</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setMoatFilter("all");
                  setDivergenceFilter("all");
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-surface-2"
              >
                {t.screener.resetFilters}
              </button>
            </div>
          )}

        {/* CARDS VIEW MODE */}
        {!isLoading && viewMode === "cards" && filteredGroups.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {displayedGroups.map((group) => {
                const report = group.latestReport;
                const price = report.currentPrice ?? 0;
                const wfv = report.weightedFairValue ?? 0;
                const baseFv = report.baseFairValue ?? 0;
                const bull = report.bullFairValue ?? null;
                const bear = report.bearFairValue ?? null;
                const upside = report.upsidePct ?? 0;
                const baseUpside = report.baseUpsidePct ?? 0;
                const isPositive = upside >= 0;

                const hasRange =
                  price > 0 && bull !== null && bear !== null && bull > bear;
                const rangeSpan = hasRange ? Math.max(bull - bear, 1) : 1;
                const pricePos = hasRange
                  ? Math.min(
                      100,
                      Math.max(0, ((price - bear) / rangeSpan) * 100)
                    )
                  : 0;
                const basePos = hasRange
                  ? Math.min(
                      100,
                      Math.max(0, ((baseFv - bear) / rangeSpan) * 100)
                    )
                  : 0;
                const wfvPos = hasRange
                  ? Math.min(100, Math.max(0, ((wfv - bear) / rangeSpan) * 100))
                  : 0;

                return (
                  <div
                    key={group.ticker}
                    onMouseEnter={() => prefetchReport(report.slug)}
                    className="glass-panel shadow-xs cv-grid-card group relative flex flex-col justify-between rounded-2xl border border-border bg-surface-1/90 p-5 transition-[border-color,background-color] duration-150 hover:border-amber-500/40 hover:bg-surface-2/60"
                  >
                    <div>
                      {/* Card Header: Ticker, Company, Moat, Divergence Badge, Star */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(group.ticker);
                            }}
                            className="-mt-0.5 shrink-0 p-1 text-amber-400 transition-transform hover:scale-110"
                            title={tw.removeFromWatchlist}
                            aria-label={tw.removeFromWatchlist}
                          >
                            <Star className="size-5 fill-amber-400 text-amber-400" />
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-lg font-black tracking-tight text-foreground group-hover:text-accent">
                                {group.ticker}
                              </span>
                              {report.quarter && (
                                <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-300">
                                  {report.quarter}
                                </span>
                              )}
                              {hasNote(group.ticker) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveNoteStock({
                                      ticker: group.ticker,
                                      company: group.company,
                                    });
                                  }}
                                  className="flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent transition-colors hover:bg-accent/25"
                                  title={tNotes.clickToEdit}
                                >
                                  <NotebookPen className="size-3" />
                                  <span className="hidden sm:inline">
                                    {tNotes.hasNoteBadge}
                                  </span>
                                </button>
                              )}
                            </div>
                            <p className="truncate text-xs text-slate-400">
                              {group.company}
                            </p>
                          </div>
                        </div>

                        {/* Right Badges: Moat Badge */}
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          {report.moatRating && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                report.moatRating.toLowerCase() === "wide"
                                  ? "border border-purple-500/30 bg-purple-500/10 text-purple-300"
                                  : "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                              }`}
                            >
                              <Shield className="size-2.5" />
                              <span>{report.moatRating} Moat</span>
                              {report.moatTrend && (
                                <span
                                  className="font-mono text-[11px]"
                                  title={`${report.moatTrend} Moat Trend`}
                                >
                                  {report.moatTrend === "Widening"
                                    ? "↗"
                                    : report.moatTrend === "Narrowing"
                                      ? "↘"
                                      : "→"}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Consensus Divergence Tier Ribbon */}
                      {report.divergenceClassification && (
                        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
                          <span className="text-[11px] font-medium text-slate-400">
                            {tw.consensusDivergence}
                          </span>
                          {getDivergenceBadge(
                            report.divergenceClassification,
                            report.consensusSpreadPct
                          )}
                        </div>
                      )}

                      {/* 4-Regime Pricing Telemetry Grid */}
                      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-surface-0/60 p-3">
                        <div>
                          <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {tw.colPrice}
                          </div>
                          <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-foreground">
                            {price > 0 ? formatCurrency(price) : "—"}
                          </div>
                        </div>

                        <div>
                          <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {tw.colBaseFv}
                          </div>
                          <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                            {baseFv > 0 ? formatCurrency(baseFv) : "—"}
                          </div>
                          {baseFv > 0 && (
                            <div
                              className={`font-mono text-[11px] font-bold ${
                                baseUpside >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {baseUpside >= 0 ? "+" : ""}
                              {baseUpside.toFixed(1)}%
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
                            {tw.colWfv}
                          </div>
                          <div className="mt-0.5 font-mono text-sm font-black tabular-nums text-accent">
                            {wfv > 0 ? formatCurrency(wfv) : "—"}
                          </div>
                          {wfv > 0 && (
                            <div
                              className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-bold ${
                                isPositive
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="size-2.5" />
                              ) : (
                                <ArrowDownRight className="size-2.5" />
                              )}
                              {isPositive ? "+" : ""}
                              {upside.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 4-Regime Valuation Bounds Spectrum Bar */}
                      {hasRange && (
                        <div className="mt-3 space-y-1.5 rounded-lg border border-border/40 bg-surface-0/40 p-2.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {tw.regimeSpectrum}
                            </span>
                            {report.analystTarget &&
                              report.analystTarget > 0 && (
                                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                  Consensus:{" "}
                                  <strong className="text-foreground">
                                    ${Math.round(report.analystTarget)}
                                  </strong>
                                </span>
                              )}
                          </div>
                          <div className="relative h-2 w-full rounded-full bg-surface-3">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/30 via-slate-500/20 to-emerald-500/30" />
                            {/* Base marker */}
                            <div
                              style={{ left: `${basePos}%` }}
                              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300 bg-sky-400 shadow-sm"
                              title={`Base: ${formatCurrency(baseFv)}`}
                            />
                            {/* WFV marker */}
                            <div
                              style={{ left: `${wfvPos}%` }}
                              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-emerald-300 bg-emerald-400 shadow-sm"
                              title={`WFV: ${formatCurrency(wfv)}`}
                            />
                            {/* Current price marker */}
                            <div
                              style={{ left: `${pricePos}%` }}
                              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-accent shadow ring-2 ring-accent/30"
                              title={`Price: ${formatCurrency(price)}`}
                            />
                          </div>
                          <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                            <span>Bear ${Math.round(bear!)}</span>
                            <span className="flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400">
                              <span className="size-1.5 rounded-full bg-sky-400" />
                              Base ${Math.round(baseFv)}
                            </span>
                            <span>Bull ${Math.round(bull!)}</span>
                          </div>
                        </div>
                      )}

                      {/* Fundamentals & Snowflake Radar Row */}
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-surface-0/60 p-3">
                        <div className="flex items-center gap-3">
                          <MiniSnowflakeRadar
                            score={report.snowflakeScore}
                            tier={report.snowflakeTier}
                            pillars={report.snowflakePillars}
                            size={38}
                          />
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-mono text-sm font-black text-foreground">
                                {report.snowflakeScore ?? 0}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                / 30
                              </span>
                            </div>
                            <span
                              className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                                (report.snowflakeScore ?? 0) >= 24
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : (report.snowflakeScore ?? 0) >= 18
                                    ? "text-sky-600 dark:text-cyan-400"
                                    : (report.snowflakeScore ?? 0) >= 12
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {report.snowflakeTier ?? "balanced"}
                            </span>
                          </div>
                        </div>

                        {/* Revenue Growth & Operating Margin */}
                        <div className="flex flex-col items-end gap-1 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 dark:text-slate-400">
                              Rev:
                            </span>
                            <span
                              className={`font-bold ${
                                (report.revenueGrowthPct ?? 0) >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {report.revenueGrowthPct !== undefined
                                ? formatPercent(report.revenueGrowthPct)
                                : "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 dark:text-slate-400">
                              Margin:
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {report.operatingMarginPct !== undefined
                                ? `${report.operatingMarginPct.toFixed(1)}%`
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Historical Quarters Pills (if multi-quarter exists) */}
                      {group.allReports.length > 1 && (
                        <div className="mt-3 space-y-1">
                          <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                            {tw.quarterlyHistory} ({group.allReports.length})
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {group.allReports.map((qRep, idx) => {
                              const isLatest = idx === 0;
                              return (
                                <button
                                  key={qRep.slug}
                                  type="button"
                                  onClick={() =>
                                    onSelectReport(qRep.slug, "cockpit")
                                  }
                                  onMouseEnter={() => prefetchReport(qRep.slug)}
                                  className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold transition-all ${
                                    isLatest
                                      ? "bg-accent/20 text-accent ring-1 ring-accent/30 hover:bg-accent/30"
                                      : "bg-surface-3 text-slate-400 hover:bg-surface-2 hover:text-foreground"
                                  }`}
                                  title={`Open ${qRep.quarter || qRep.slug}`}
                                >
                                  {qRep.quarter ||
                                    qRep.slug.split("-")[1] ||
                                    "Q"}
                                  {isLatest && " •"}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Action Buttons */}
                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(group.ticker)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-rose-400"
                        title={tw.removeFromWatchlist}
                      >
                        <Trash2 className="size-3" />
                        <span>{tw.removeFromWatchlist}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Stock Note Button with Hover Snippet */}
                        <div className="group/notebtn relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveNoteStock({
                                ticker: group.ticker,
                                company: group.company,
                              });
                            }}
                            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                              hasNote(group.ticker)
                                ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
                                : "border-border bg-surface-2/80 text-slate-300 hover:bg-surface-3 hover:text-foreground"
                            }`}
                            title={
                              hasNote(group.ticker)
                                ? tNotes.clickToEdit
                                : tNotes.addNote
                            }
                          >
                            <NotebookPen
                              className={`size-3 ${
                                hasNote(group.ticker)
                                  ? "text-accent"
                                  : "text-slate-400"
                              }`}
                            />
                            <span>{tNotes.shortNotes}</span>
                          </button>

                          {/* Hover floating preview snippet */}
                          <div className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden w-64 flex-col rounded-lg border border-border/80 bg-surface-1 p-2.5 shadow-xl backdrop-blur-md group-hover/notebtn:flex">
                            <div className="flex items-center justify-between border-b border-border/40 pb-1 text-[10px] font-semibold text-slate-400">
                              <span>
                                {group.ticker} {tNotes.shortNotes}
                              </span>
                              <span className="font-normal text-accent">
                                {tNotes.clickToEdit}
                              </span>
                            </div>
                            <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-300">
                              {getNote(group.ticker)?.content
                                ? getNote(group.ticker)!.content.replace(
                                    /^#+\s*/gm,
                                    ""
                                  )
                                : tNotes.noNoteYet}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectReport(report.slug, "memo")}
                          className="flex items-center gap-1 rounded-lg border border-border bg-surface-2/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-surface-3 hover:text-foreground"
                        >
                          <FileText className="size-3 text-slate-400" />
                          <span>{tw.openMemo}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectReport(report.slug, "cockpit")}
                          className="flex items-center gap-1 rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-bold text-accent ring-1 ring-accent/30 transition-all hover:bg-accent/25 hover:text-foreground"
                        >
                          <SlidersHorizontal className="size-3" />
                          <span>{tw.openCockpit}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleCount < filteredGroups.length && (
              <div
                ref={observerTargetRef}
                className="flex items-center justify-center gap-3 py-4"
              >
                <span className="font-mono text-xs tabular-nums text-slate-400">
                  {tw.resultsCount(
                    displayedGroups.length,
                    filteredGroups.length
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleLoadAll}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-1 font-mono text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-surface-3"
                >
                  {tw.loadAll(filteredGroups.length)}
                </button>
              </div>
            )}
          </>
        )}

        {/* MATRIX TABLE VIEW MODE */}
        {!isLoading && viewMode === "table" && filteredGroups.length > 0 && (
          <div className="glass-panel shadow-xs overflow-hidden rounded-2xl border border-border bg-surface-1/90">
            <div className="custom-scrollbar max-h-[calc(100vh-14.5rem)] min-h-[460px] overflow-auto">
              <table className="w-full border-separate border-spacing-0 text-left font-mono text-xs">
                <thead className="shadow-xs sticky top-0 z-20">
                  <tr className="border-b border-border bg-surface-2 text-[11px] font-semibold text-slate-400">
                    <th
                      className="sticky left-0 top-0 z-30 border-b border-r border-border/40 bg-surface-2 py-3 pl-4 pr-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.25)]"
                      title={t.screener.colTickerTooltip}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort("ticker")}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <span>Ticker</span>
                        <ArrowUpDown className="size-3 text-slate-400" />
                      </button>
                    </th>
                    <th
                      className="sticky top-0 z-20 border-b border-border bg-surface-2 px-2 py-3"
                      title={t.screener.colMoatTooltip}
                    >
                      {tw.colMoat}
                    </th>
                    <th
                      className="sticky top-0 z-20 border-b border-border bg-surface-2 px-2 py-3"
                      title={t.screener.colPriceTooltip}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort("price")}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <span>{tw.colPrice}</span>
                        <ArrowUpDown className="size-3 text-slate-400" />
                      </button>
                    </th>
                    <th
                      className="sticky top-0 z-20 border-b border-border bg-surface-2 px-2 py-3"
                      title={t.screener.colBaseFairValueTooltip}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort("baseUpside")}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <span>{tw.colBaseFv}</span>
                        <ArrowUpDown className="size-3 text-slate-400" />
                      </button>
                    </th>
                    <th
                      className="sticky top-0 z-20 border-b border-border bg-surface-2 px-2 py-3"
                      title={t.screener.colWeightedFairValueTooltip}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort("upside")}
                        className="flex items-center gap-1 text-accent hover:text-foreground"
                      >
                        <span>{tw.colWfv}</span>
                        <ArrowUpDown className="size-3 text-accent" />
                      </button>
                    </th>
                    <th
                      className="sticky top-0 z-20 border-b border-border bg-surface-2 px-2 py-3"
                      title={t.screener.colAnalystTargetTooltip}
                    >
                      {tw.colConsensus}
                    </th>
                    <th
                      className="sticky top-0 z-20 border-b border-border bg-surface-2 px-2 py-3"
                      title={t.screener.colConsensusSpread}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort("divergence")}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <span>{tw.colDivergence}</span>
                        <ArrowUpDown className="size-3 text-slate-400" />
                      </button>
                    </th>
                    <th
                      className="sticky top-0 z-20 border-b border-border bg-surface-2 px-2 py-3"
                      title={t.screener.colOperatingMarginTooltip}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort("opMargin")}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <span>{tw.colGrowthMargin}</span>
                        <ArrowUpDown className="size-3 text-slate-400" />
                      </button>
                    </th>
                    <th
                      className="sticky top-0 z-20 border-b border-border bg-surface-2 px-2 py-3"
                      title={t.screener.colSnowflakeTooltip}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort("snowflake")}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <span>{tw.colSnowflake}</span>
                        <ArrowUpDown className="size-3 text-slate-400" />
                      </button>
                    </th>
                    <th className="sticky top-0 z-20 border-b border-border bg-surface-2 px-2 py-3">
                      {tw.quarterlyHistory}
                    </th>
                    <th className="sticky top-0 z-20 border-b border-border bg-surface-2 py-3 pl-2 pr-4 text-right">
                      {tw.colActions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedGroups.map((group) => {
                    const report = group.latestReport;
                    const price = report.currentPrice ?? 0;
                    const wfv = report.weightedFairValue ?? 0;
                    const baseFv = report.baseFairValue ?? 0;
                    const upside = report.upsidePct ?? 0;
                    const baseUpside = report.baseUpsidePct ?? 0;
                    const isPositive = upside >= 0;

                    return (
                      <tr
                        key={group.ticker}
                        onMouseEnter={() => prefetchReport(report.slug)}
                        className="cv-table-row group transition-colors hover:bg-surface-2/60"
                      >
                        {/* Ticker & Company */}
                        <td className="sticky left-0 z-10 border-b border-r border-border/40 bg-surface-1 py-3 pl-4 pr-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.25)] group-hover:bg-surface-2/90">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleFavorite(group.ticker)}
                              className="text-amber-400 hover:scale-110"
                              title={tw.removeFromWatchlist}
                            >
                              <Star className="size-4 fill-amber-400 text-amber-400" />
                            </button>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-foreground group-hover:text-accent">
                                <span>{group.ticker}</span>
                                <div className="group/tablenote relative inline-flex items-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveNoteStock({
                                        ticker: group.ticker,
                                        company: group.company,
                                      });
                                    }}
                                    className={`rounded p-0.5 transition-colors ${
                                      hasNote(group.ticker)
                                        ? "text-accent hover:bg-accent/15"
                                        : "text-slate-500 opacity-0 hover:bg-surface-3 hover:text-slate-300 group-hover:opacity-100"
                                    }`}
                                    title={
                                      hasNote(group.ticker)
                                        ? tNotes.clickToEdit
                                        : tNotes.addNote
                                    }
                                  >
                                    <NotebookPen className="size-3.5 shrink-0" />
                                  </button>
                                  {/* Hover floating preview snippet */}
                                  <div className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 hidden w-64 flex-col rounded-lg border border-border/80 bg-surface-1 p-2.5 shadow-xl backdrop-blur-md group-hover/tablenote:flex">
                                    <div className="flex items-center justify-between border-b border-border/40 pb-1 text-[10px] font-semibold text-slate-400">
                                      <span>
                                        {group.ticker} {tNotes.shortNotes}
                                      </span>
                                      <span className="font-normal text-accent">
                                        {tNotes.clickToEdit}
                                      </span>
                                    </div>
                                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-300">
                                      {getNote(group.ticker)?.content
                                        ? getNote(
                                            group.ticker
                                          )!.content.replace(/^#+\s*/gm, "")
                                        : tNotes.noNoteYet}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="max-w-[120px] truncate text-[11px] text-slate-400">
                                {group.company}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Moat */}
                        <td className="border-b border-border/40 px-2 py-3">
                          {report.moatRating ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                report.moatRating.toLowerCase() === "wide"
                                  ? "border border-purple-500/30 bg-purple-500/10 text-purple-300"
                                  : "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                              }`}
                            >
                              {report.moatRating}
                              {report.moatTrend && (
                                <span
                                  className="font-mono text-[11px]"
                                  title={`${report.moatTrend} Moat Trend`}
                                >
                                  {report.moatTrend === "Widening"
                                    ? "↗"
                                    : report.moatTrend === "Narrowing"
                                      ? "↘"
                                      : "→"}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Current Price */}
                        <td className="border-b border-border/40 px-2 py-3 font-semibold tabular-nums text-foreground">
                          {price > 0 ? formatCurrency(price) : "—"}
                        </td>

                        {/* Base Fair Value */}
                        <td className="border-b border-border/40 px-2 py-3 tabular-nums">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">
                            {baseFv > 0 ? formatCurrency(baseFv) : "—"}
                          </div>
                          {baseFv > 0 && (
                            <div
                              className={`text-[11px] font-bold ${
                                baseUpside >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {baseUpside >= 0 ? "+" : ""}
                              {baseUpside.toFixed(1)}%
                            </div>
                          )}
                        </td>

                        {/* Weighted Fair Value */}
                        <td className="border-b border-border/40 px-2 py-3 tabular-nums">
                          <div className="font-bold text-accent">
                            {wfv > 0 ? formatCurrency(wfv) : "—"}
                          </div>
                          {wfv > 0 && (
                            <div
                              className={`text-[11px] font-bold ${
                                isPositive
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {upside.toFixed(1)}%
                            </div>
                          )}
                        </td>

                        {/* Consensus Target */}
                        <td className="border-b border-border/40 px-2 py-3 tabular-nums">
                          {report.analystTarget && report.analystTarget > 0 ? (
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                ${Math.round(report.analystTarget)}
                              </span>
                              {report.analystRating && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {report.analystRating}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Consensus Divergence Spread & Tier */}
                        <td className="border-b border-border/40 px-2 py-3">
                          {getDivergenceBadge(
                            report.divergenceClassification,
                            report.consensusSpreadPct
                          )}
                        </td>

                        {/* Growth & Op Margin */}
                        <td className="border-b border-border/40 px-2 py-3 text-[11px] tabular-nums">
                          <div className="text-slate-600 dark:text-slate-300">
                            Rev:{" "}
                            <span
                              className={`font-semibold ${
                                (report.revenueGrowthPct ?? 0) >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {report.revenueGrowthPct !== undefined
                                ? formatPercent(report.revenueGrowthPct)
                                : "—"}
                            </span>
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            OpM:{" "}
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {report.operatingMarginPct !== undefined
                                ? `${report.operatingMarginPct.toFixed(1)}%`
                                : "—"}
                            </span>
                          </div>
                        </td>

                        {/* Snowflake Score & Mini Radar */}
                        <td className="border-b border-border/40 px-2 py-3">
                          <div className="flex items-center gap-2">
                            <MiniSnowflakeRadar
                              score={report.snowflakeScore}
                              tier={report.snowflakeTier}
                              pillars={report.snowflakePillars}
                              size={24}
                            />
                            <span className="font-bold text-foreground">
                              {report.snowflakeScore ?? 0}
                            </span>
                          </div>
                        </td>

                        {/* Historical Quarters */}
                        <td className="border-b border-border/40 px-2 py-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {group.allReports.slice(0, 3).map((qRep, idx) => (
                              <button
                                key={qRep.slug}
                                type="button"
                                onClick={() =>
                                  onSelectReport(qRep.slug, "cockpit")
                                }
                                className={`rounded px-1.5 py-0.5 text-[11px] font-semibold transition-all ${
                                  idx === 0
                                    ? "bg-accent/20 text-accent ring-1 ring-accent/30"
                                    : "bg-surface-3 text-slate-400 hover:text-foreground"
                                }`}
                              >
                                {qRep.quarter || "Q"}
                              </button>
                            ))}
                            {group.allReports.length > 3 && (
                              <span className="text-[11px] text-slate-400">
                                +{group.allReports.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="border-b border-border/40 py-3 pl-2 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveNoteStock({
                                  ticker: group.ticker,
                                  company: group.company,
                                })
                              }
                              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
                                hasNote(group.ticker)
                                  ? "bg-accent/15 text-accent ring-1 ring-accent/30 hover:bg-accent/25"
                                  : "text-slate-400 hover:bg-surface-3 hover:text-foreground"
                              }`}
                              title={
                                hasNote(group.ticker)
                                  ? tNotes.clickToEdit
                                  : tNotes.addNote
                              }
                            >
                              <NotebookPen className="size-3" />
                              <span>{tNotes.shortNotes}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onSelectReport(report.slug, "memo")
                              }
                              className="rounded px-2 py-1 text-[11px] font-semibold text-slate-400 transition-colors hover:bg-surface-3 hover:text-foreground"
                            >
                              {tw.openMemo}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onSelectReport(report.slug, "cockpit")
                              }
                              className="rounded bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent ring-1 ring-accent/30 hover:bg-accent/25 hover:text-foreground"
                            >
                              {tw.openCockpit}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleCount < filteredGroups.length && (
                    <tr>
                      <td
                        colSpan={11}
                        className="border-b border-border/40 bg-surface-1/90 py-4 text-center text-xs text-slate-400"
                      >
                        <div
                          ref={observerTargetRef}
                          className="flex items-center justify-center gap-3"
                        >
                          <span className="font-mono text-xs tabular-nums text-slate-400">
                            {tw.resultsCount(
                              displayedGroups.length,
                              filteredGroups.length
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={handleLoadAll}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-1 font-mono text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-surface-3"
                          >
                            {tw.loadAll(filteredGroups.length)}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stock Notes Dedicated Modal */}
        <StockNotesModal
          isOpen={Boolean(activeNoteStock)}
          onClose={() => setActiveNoteStock(null)}
          ticker={activeNoteStock?.ticker || ""}
          company={activeNoteStock?.company}
          locale={locale}
        />
      </div>
    );
  }
);
