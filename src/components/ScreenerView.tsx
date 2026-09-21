"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  TrendingUp,
  Shield,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  RotateCcw,
  Star,
} from "lucide-react";
import { Skeleton } from "./ui/Skeleton";
import { MiniSnowflakeRadar } from "./snowflake/MiniSnowflakeRadar";
import type { ReportSummary } from "@/app/api/reports/route";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";
import { useWatchlist } from "@/lib/watchlist";

interface ScreenerViewProps {
  reports: ReportSummary[];
  onSelectReport: (slug: string, mode?: "cockpit" | "memo") => void;
  locale?: Locale;
  isLoading?: boolean;
}

type MoatFilter = "all" | "wide" | "narrow";
type UpsideFilter = "all" | "undervalued" | "high-upside";
type SortField =
  | "upside"
  | "baseUpside"
  | "analystTarget"
  | "price"
  | "opMargin"
  | "revGrowth"
  | "ticker"
  | "snowflake"
  | "moat";
type SortDirection = "asc" | "desc";

const SKELETON_ROWS = [
  {
    tickerW: "w-14",
    nameW: "w-32",
    moatW: "w-16",
    snowflakeW: "w-12",
    targetW: "w-14",
    baseW: "w-14",
    wfvW: "w-16",
    marginW: "w-12",
    growthW: "w-12",
  },
  {
    tickerW: "w-12",
    nameW: "w-40",
    moatW: "w-14",
    snowflakeW: "w-12",
    targetW: "w-16",
    baseW: "w-16",
    wfvW: "w-14",
    marginW: "w-10",
    growthW: "w-14",
  },
  {
    tickerW: "w-16",
    nameW: "w-28",
    moatW: "w-16",
    snowflakeW: "w-12",
    targetW: "w-12",
    baseW: "w-14",
    wfvW: "w-16",
    marginW: "w-14",
    growthW: "w-12",
  },
  {
    tickerW: "w-14",
    nameW: "w-36",
    moatW: "w-14",
    snowflakeW: "w-12",
    targetW: "w-14",
    baseW: "w-12",
    wfvW: "w-14",
    marginW: "w-12",
    growthW: "w-10",
  },
  {
    tickerW: "w-12",
    nameW: "w-24",
    moatW: "w-16",
    snowflakeW: "w-12",
    targetW: "w-16",
    baseW: "w-16",
    wfvW: "w-16",
    marginW: "w-10",
    growthW: "w-14",
  },
  {
    tickerW: "w-16",
    nameW: "w-32",
    moatW: "w-16",
    snowflakeW: "w-12",
    targetW: "w-14",
    baseW: "w-14",
    wfvW: "w-14",
    marginW: "w-12",
    growthW: "w-12",
  },
  {
    tickerW: "w-14",
    nameW: "w-36",
    moatW: "w-14",
    snowflakeW: "w-12",
    targetW: "w-12",
    baseW: "w-12",
    wfvW: "w-16",
    marginW: "w-14",
    growthW: "w-10",
  },
  {
    tickerW: "w-12",
    nameW: "w-28",
    moatW: "w-16",
    snowflakeW: "w-12",
    targetW: "w-16",
    baseW: "w-14",
    wfvW: "w-14",
    marginW: "w-10",
    growthW: "w-12",
  },
];

export const ScreenerView: React.FC<ScreenerViewProps> = ({
  reports,
  onSelectReport,
  locale = "en",
  isLoading = false,
}) => {
  const t = getTranslations(locale);
  const ts = t.screener;

  const { isFavorite, toggleFavorite, count: watchlistCount } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlistOnly, setWatchlistOnly] = useState<boolean>(false);
  const [moatFilter, setMoatFilter] = useState<MoatFilter>("all");
  const [upsideFilter, setUpsideFilter] = useState<UpsideFilter>("all");
  const [sortField, setSortField] = useState<SortField>("upside");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Summary statistics (dynamically scoped to watchlist when watchlistOnly is active)
  const stats = useMemo(() => {
    const baseList = watchlistOnly
      ? reports.filter((r) => isFavorite(r.ticker || r.slug))
      : reports;

    if (baseList.length === 0) {
      return {
        count: 0,
        avgUpside: 0,
        topPick: null as ReportSummary | null,
        wideMoatCount: 0,
      };
    }

    const validUpsides = baseList
      .map((r) => r.upsidePct)
      .filter((u): u is number => typeof u === "number" && !isNaN(u));
    const avgUpside =
      validUpsides.length > 0
        ? validUpsides.reduce((a, b) => a + b, 0) / validUpsides.length
        : 0;

    let topPick: ReportSummary | null = null;
    let maxUpside = -Infinity;
    let wideMoatCount = 0;

    for (const r of baseList) {
      if (typeof r.upsidePct === "number" && r.upsidePct > maxUpside) {
        maxUpside = r.upsidePct;
        topPick = r;
      }
      if (r.moatRating?.toLowerCase() === "wide") {
        wideMoatCount += 1;
      }
    }

    return {
      count: baseList.length,
      avgUpside,
      topPick,
      wideMoatCount,
    };
  }, [reports, watchlistOnly, isFavorite]);

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        // Watchlist filter
        if (watchlistOnly) {
          const symbol = r.ticker || r.slug;
          if (!isFavorite(symbol)) return false;
        }

        // Text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTicker = r.ticker?.toLowerCase().includes(q);
          const matchCompany = r.company?.toLowerCase().includes(q);
          const matchSlug = r.slug?.toLowerCase().includes(q);
          if (!matchTicker && !matchCompany && !matchSlug) return false;
        }

        // Moat filter
        if (moatFilter !== "all") {
          const moat = r.moatRating?.toLowerCase() ?? "";
          if (moatFilter === "wide" && moat !== "wide") return false;
          if (moatFilter === "narrow" && moat !== "narrow") return false;
        }

        // Upside filter
        if (upsideFilter === "undervalued") {
          if ((r.upsidePct ?? 0) <= 0) return false;
        } else if (upsideFilter === "high-upside") {
          if ((r.upsidePct ?? 0) < 20) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;

        switch (sortField) {
          case "upside":
            valA = a.upsidePct ?? -999;
            valB = b.upsidePct ?? -999;
            break;
          case "baseUpside":
            valA = a.baseUpsidePct ?? -999;
            valB = b.baseUpsidePct ?? -999;
            break;
          case "price":
            valA = a.currentPrice ?? 0;
            valB = b.currentPrice ?? 0;
            break;
          case "analystTarget":
            valA = a.analystTarget ?? -999;
            valB = b.analystTarget ?? -999;
            break;
          case "opMargin":
            valA = a.operatingMarginPct ?? -999;
            valB = b.operatingMarginPct ?? -999;
            break;
          case "revGrowth":
            valA = a.revenueGrowthPct ?? -999;
            valB = b.revenueGrowthPct ?? -999;
            break;
          case "ticker":
            valA = a.ticker || a.slug;
            valB = b.ticker || b.slug;
            break;
          case "snowflake":
            valA = a.snowflakeScore ?? -1;
            valB = b.snowflakeScore ?? -1;
            break;
          case "moat": {
            const moatRank = (r?: string) => {
              const m = r?.toLowerCase();
              if (m === "wide") return 2;
              if (m === "narrow") return 1;
              return 0;
            };
            valA = moatRank(a.moatRating);
            valB = moatRank(b.moatRating);
            break;
          }
        }

        if (typeof valA === "string" && typeof valB === "string") {
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return sortDirection === "asc"
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [
    reports,
    searchQuery,
    watchlistOnly,
    isFavorite,
    moatFilter,
    upsideFilter,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "ticker" ? "asc" : "desc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ArrowUp className="size-3 shrink-0 text-accent" />
      ) : (
        <ArrowDown className="size-3 shrink-0 text-accent" />
      );
    }
    return (
      <ArrowUpDown className="size-3 shrink-0 text-slate-500 opacity-30 transition-opacity group-hover/th:opacity-100" />
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1520px] space-y-6 px-3 py-4 sm:p-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-5 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-accent/20 text-accent">
              <BarChart3 className="size-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {ts.title}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            {ts.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <Skeleton className="h-6 w-24 rounded-md" />
          ) : (
            <span className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-xs font-semibold text-accent">
              {stats.count} {ts.statsCoverage}
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Coverage Count */}
        <div className="glass-panel rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-wide sm:text-xs">
              {ts.statsCoverage}
            </span>
            <CheckCircle2 className="size-4 text-accent" />
          </div>
          {isLoading ? (
            <>
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-2 h-3.5 w-24" />
            </>
          ) : (
            <>
              <div className="mt-2 font-mono text-2xl font-black text-white sm:text-3xl">
                {stats.count}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {`${stats.wideMoatCount} ${ts.wideMoat}`}
              </p>
            </>
          )}
        </div>

        {/* Avg Upside */}
        <div className="glass-panel rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-wide sm:text-xs">
              {ts.statsAvgUpside}
            </span>
            <TrendingUp className="size-4 text-green-400" />
          </div>
          {isLoading ? (
            <>
              <Skeleton className="mt-3 h-8 w-24" />
              <Skeleton className="mt-2 h-3.5 w-32" />
            </>
          ) : (
            <>
              <div
                className={`mt-2 font-mono text-2xl font-black sm:text-3xl ${
                  stats.avgUpside >= 0 ? "text-green-400" : "text-rose-400"
                }`}
              >
                {stats.avgUpside >= 0 ? "+" : ""}
                {stats.avgUpside.toFixed(1)}%
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {ts.statsAvgUpsideSub}
              </p>
            </>
          )}
        </div>

        {/* Highest Upside Pick */}
        <div
          className={`glass-panel rounded-xl p-3.5 sm:p-4 ${
            stats.topPick && !isLoading
              ? "cursor-pointer transition-all hover:border-accent/40 hover:bg-surface-2/40"
              : ""
          }`}
          onClick={() =>
            !isLoading &&
            stats.topPick &&
            onSelectReport(stats.topPick.slug, "cockpit")
          }
          title={
            stats.topPick && !isLoading
              ? ts.openCockpitTooltip(
                  stats.topPick.ticker || stats.topPick.slug
                )
              : undefined
          }
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-wide sm:text-xs">
              {ts.statsTopPick}
            </span>
            <Sparkles className="size-4 text-amber-400" />
          </div>
          {isLoading ? (
            <>
              <Skeleton className="mt-3 h-8 w-28" />
              <Skeleton className="mt-2 h-3.5 w-24" />
            </>
          ) : (
            <>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-white sm:text-3xl">
                  {stats.topPick?.ticker || "—"}
                </span>
                {stats.topPick?.upsidePct !== undefined && (
                  <span
                    className={`font-mono text-sm font-bold ${
                      stats.topPick.upsidePct >= 0
                        ? "text-green-400"
                        : "text-rose-400"
                    }`}
                  >
                    {stats.topPick.upsidePct >= 0 ? "+" : ""}
                    {stats.topPick.upsidePct.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-[11px] text-slate-400">
                {stats.topPick?.company || "—"}
              </p>
            </>
          )}
        </div>

        {/* Wide Moat Share */}
        <div className="glass-panel rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-wide sm:text-xs">
              {ts.statsWideMoat}
            </span>
            <Shield className="size-4 text-purple-400" />
          </div>
          {isLoading ? (
            <>
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-2 h-3.5 w-28" />
            </>
          ) : (
            <>
              <div className="mt-2 font-mono text-2xl font-black text-white sm:text-3xl">
                {stats.count > 0
                  ? `${Math.round((stats.wideMoatCount / stats.count) * 100)}%`
                  : "0%"}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {ts.statsWideMoatSub(stats.wideMoatCount, stats.count)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-panel flex flex-col gap-3 rounded-xl p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
        {/* Search input */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ts.searchPlaceholder}
            className="w-full rounded-lg border border-white/[0.08] bg-surface-0/80 py-2 pl-9 pr-8 text-xs text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & Result Counter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Watchlist Filter Pill */}
          <button
            type="button"
            onClick={() => setWatchlistOnly(!watchlistOnly)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
              watchlistOnly
                ? "border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-sm ring-1 ring-amber-500/30"
                : "border-white/[0.08] bg-surface-0/60 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
            title={ts.filterWatchlist}
          >
            <Star
              className={`size-3.5 ${
                watchlistOnly
                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                  : "text-slate-400"
              }`}
            />
            <span>{ts.filterWatchlist}</span>
            {watchlistCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                  watchlistOnly
                    ? "bg-amber-400 font-bold text-slate-950"
                    : "bg-surface-3 text-slate-400"
                }`}
              >
                {watchlistCount}
              </span>
            )}
          </button>

          {/* Moat Filter */}
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-0/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMoatFilter("all")}
              className={`rounded px-2.5 py-1 transition-colors ${
                moatFilter === "all"
                  ? "bg-accent/20 font-semibold text-accent"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {ts.allMoats}
            </button>
            <button
              type="button"
              onClick={() => setMoatFilter("wide")}
              className={`rounded px-2.5 py-1 transition-colors ${
                moatFilter === "wide"
                  ? "bg-purple-500/20 font-semibold text-purple-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {ts.wideMoat}
            </button>
            <button
              type="button"
              onClick={() => setMoatFilter("narrow")}
              className={`rounded px-2.5 py-1 transition-colors ${
                moatFilter === "narrow"
                  ? "bg-sky-500/20 font-semibold text-sky-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {ts.narrowMoat}
            </button>
          </div>

          {/* Upside Filter */}
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-0/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => setUpsideFilter("all")}
              className={`rounded px-2.5 py-1 transition-colors ${
                upsideFilter === "all"
                  ? "bg-accent/20 font-semibold text-accent"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {ts.filterAll}
            </button>
            <button
              type="button"
              onClick={() => setUpsideFilter("undervalued")}
              className={`rounded px-2.5 py-1 transition-colors ${
                upsideFilter === "undervalued"
                  ? "bg-green-500/20 font-semibold text-green-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {ts.filterUndervalued}
            </button>
            <button
              type="button"
              onClick={() => setUpsideFilter("high-upside")}
              className={`rounded px-2.5 py-1 transition-colors ${
                upsideFilter === "high-upside"
                  ? "bg-amber-500/20 font-semibold text-amber-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {ts.filterHighUpside}
            </button>
          </div>

          {/* Results count and active reset */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-500">
              {ts.resultsCount(filteredReports.length, reports.length)}
            </span>
            {(searchQuery ||
              moatFilter !== "all" ||
              upsideFilter !== "all" ||
              watchlistOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setMoatFilter("all");
                  setUpsideFilter("all");
                  setWatchlistOnly(false);
                }}
                className="inline-flex items-center gap-1 rounded bg-surface-2 px-2 py-1 font-mono text-[11px] text-accent transition-colors hover:bg-surface-3"
                title={ts.resetFilters}
              >
                <RotateCcw className="size-2.5" />
                <span>{ts.resetFilters}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Screener Table */}
      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {/* Watchlist Star */}
                <th
                  className="w-10 whitespace-nowrap py-3 pl-3 pr-1 text-center"
                  title={ts.colFavorite}
                >
                  <Star className="mx-auto size-3.5 text-slate-400" />
                </th>

                {/* Ticker & Company */}
                <th
                  onClick={() => handleSort("ticker")}
                  className="group/th cursor-pointer whitespace-nowrap py-3 pl-2 pr-3 transition-colors hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{ts.colTicker}</span>
                    {renderSortIcon("ticker")}
                  </div>
                </th>

                {/* Moat */}
                <th
                  onClick={() => handleSort("moat")}
                  className="group/th cursor-pointer whitespace-nowrap px-2.5 py-3 transition-colors hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{ts.colMoat}</span>
                    {renderSortIcon("moat")}
                  </div>
                </th>

                {/* Snowflake 30-Point Audit Radar */}
                <th
                  onClick={() => handleSort("snowflake")}
                  className="group/th cursor-pointer whitespace-nowrap px-2.5 py-3 transition-colors hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{ts.colSnowflake}</span>
                    {renderSortIcon("snowflake")}
                  </div>
                </th>

                {/* Price */}
                <th
                  onClick={() => handleSort("price")}
                  className="group/th cursor-pointer whitespace-nowrap px-2.5 py-3 text-right transition-colors hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colPrice}</span>
                    {renderSortIcon("price")}
                  </div>
                </th>

                {/* Analyst Consensus Target */}
                <th
                  onClick={() => handleSort("analystTarget")}
                  className="group/th cursor-pointer whitespace-nowrap px-2.5 py-3 text-right transition-colors hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colAnalystTarget}</span>
                    {renderSortIcon("analystTarget")}
                  </div>
                </th>

                {/* Base Fair Value */}
                <th
                  onClick={() => handleSort("baseUpside")}
                  className="group/th cursor-pointer whitespace-nowrap px-2.5 py-3 text-right transition-colors hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colBaseFairValue}</span>
                    {renderSortIcon("baseUpside")}
                  </div>
                </th>

                {/* Weighted Fair Value & Upside */}
                <th
                  onClick={() => handleSort("upside")}
                  className="group/th cursor-pointer whitespace-nowrap p-3 text-right transition-colors hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colWeightedFairValue}</span>
                    {renderSortIcon("upside")}
                  </div>
                </th>

                {/* Valuation Spectrum / Stress Range */}
                <th
                  className="hidden min-w-[170px] max-w-[210px] whitespace-nowrap p-3 lg:table-cell"
                  title={ts.rangeTooltip}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{ts.colValuationRange}</span>
                    <span className="hidden font-mono text-[9px] font-normal lowercase tracking-normal text-slate-500 xl:inline">
                      {ts.rangeBearBullHint}
                    </span>
                  </div>
                </th>

                {/* Operating Margin */}
                <th
                  onClick={() => handleSort("opMargin")}
                  className="group/th hidden cursor-pointer whitespace-nowrap px-2.5 py-3 text-right transition-colors hover:text-white xl:table-cell"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colOperatingMargin}</span>
                    {renderSortIcon("opMargin")}
                  </div>
                </th>

                {/* Revenue Growth */}
                <th
                  onClick={() => handleSort("revGrowth")}
                  className="group/th hidden cursor-pointer whitespace-nowrap py-3 pl-2.5 pr-4 text-right transition-colors hover:text-white xl:table-cell"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colRevenueGrowth}</span>
                    {renderSortIcon("revGrowth")}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05]">
              {isLoading ? (
                <>
                  {SKELETON_ROWS.map((row, idx) => (
                    <tr
                      key={`skeleton-${idx}`}
                      className="border-b border-white/[0.03]"
                    >
                      {/* Watchlist Star Skeleton */}
                      <td className="w-10 py-2.5 pl-3 pr-1 text-center">
                        <Skeleton className="mx-auto size-4 rounded" />
                      </td>

                      {/* Ticker & Company */}
                      <td className="py-2.5 pl-2 pr-3">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="size-7 shrink-0 rounded-lg" />
                          <div className="space-y-1.5">
                            <Skeleton className={`h-3.5 ${row.tickerW}`} />
                            <Skeleton className={`h-2.5 ${row.nameW}`} />
                          </div>
                        </div>
                      </td>

                      {/* Moat */}
                      <td className="whitespace-nowrap p-2.5">
                        <Skeleton className={`h-5 ${row.moatW} rounded-full`} />
                      </td>

                      {/* Snowflake */}
                      <td className="whitespace-nowrap p-2.5">
                        <div className="flex items-center gap-2">
                          <Skeleton className="size-7 shrink-0 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-8" />
                            <Skeleton className="h-2 w-10" />
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="whitespace-nowrap p-2.5 text-right">
                        <Skeleton className="ml-auto h-4 w-14" />
                      </td>

                      {/* Analyst Target */}
                      <td className="whitespace-nowrap p-2.5 text-right">
                        <Skeleton className={`ml-auto h-4 ${row.targetW}`} />
                      </td>

                      {/* Base Fair Value */}
                      <td className="whitespace-nowrap p-2.5 text-right">
                        <Skeleton className={`ml-auto h-4 ${row.baseW}`} />
                      </td>

                      {/* Weighted Fair Value & Upside */}
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <div className="ml-auto space-y-1">
                          <Skeleton className={`ml-auto h-4 ${row.wfvW}`} />
                          <Skeleton className="ml-auto h-3 w-12 rounded-full" />
                        </div>
                      </td>

                      {/* Valuation Spectrum / Stress Range */}
                      <td className="hidden min-w-[170px] max-w-[210px] px-3 py-2.5 lg:table-cell">
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <Skeleton className="h-2 w-8" />
                            <Skeleton className="h-2 w-8" />
                          </div>
                          <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                      </td>

                      {/* Operating Margin */}
                      <td className="hidden whitespace-nowrap p-2.5 text-right xl:table-cell">
                        <Skeleton className={`ml-auto h-4 ${row.marginW}`} />
                      </td>

                      {/* Revenue Growth */}
                      <td className="hidden whitespace-nowrap py-2.5 pl-2.5 pr-4 text-right xl:table-cell">
                        <Skeleton className={`ml-auto h-4 ${row.growthW}`} />
                      </td>
                    </tr>
                  ))}
                </>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-16 text-center text-slate-400"
                  >
                    {watchlistOnly ? (
                      <div className="flex flex-col items-center">
                        <div className="flex size-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-glow">
                          <Star className="size-6 fill-amber-400" />
                        </div>
                        <h3 className="mt-3 text-base font-bold text-white">
                          {ts.watchlistEmptyTitle}
                        </h3>
                        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
                          {ts.watchlistEmptyDesc}
                        </p>
                        <button
                          type="button"
                          onClick={() => setWatchlistOnly(false)}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/15 px-3.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/25"
                        >
                          {ts.viewAllReports}
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium">{ts.noResults}</p>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setMoatFilter("all");
                            setUpsideFilter("all");
                            setWatchlistOnly(false);
                          }}
                          className="mt-3 rounded-lg border border-white/[0.08] bg-surface-1 px-3 py-1.5 text-xs text-accent hover:bg-surface-2"
                        >
                          {ts.resetFilters}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const upside = report.upsidePct ?? 0;
                  const isPositive = upside >= 0;
                  const price = report.currentPrice ?? 0;
                  const wfv = report.weightedFairValue ?? 0;
                  const baseFv = report.baseFairValue ?? 0;
                  const baseUpside = report.baseUpsidePct ?? 0;
                  const bear = report.bearFairValue ?? price * 0.7;
                  const bull = report.bullFairValue ?? price * 1.4;

                  // Compute normalized price position between Bear and Bull (0% to 100%)
                  const rangeSpan = Math.max(bull - bear, 1);
                  const pricePos = Math.min(
                    100,
                    Math.max(0, ((price - bear) / rangeSpan) * 100)
                  );
                  const basePos = Math.min(
                    100,
                    Math.max(0, ((baseFv - bear) / rangeSpan) * 100)
                  );

                  return (
                    <tr
                      key={report.slug}
                      className="group cursor-pointer transition-colors hover:bg-surface-2/70"
                      onClick={() => onSelectReport(report.slug, "cockpit")}
                    >
                      {/* Watchlist Star Toggle */}
                      <td
                        className="w-10 py-2.5 pl-3 pr-1 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(report.ticker || report.slug);
                          }}
                          className="group/star inline-flex items-center justify-center rounded p-1 transition-transform hover:scale-125 active:scale-95"
                          title={
                            isFavorite(report.ticker || report.slug)
                              ? t.header.removeFromWatchlist
                              : t.header.addToWatchlist
                          }
                          aria-label={
                            isFavorite(report.ticker || report.slug)
                              ? t.header.removeFromWatchlist
                              : t.header.addToWatchlist
                          }
                        >
                          <Star
                            className={`size-4 transition-colors ${
                              isFavorite(report.ticker || report.slug)
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                : "text-slate-600 hover:text-amber-400"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Ticker & Company */}
                      <td className="py-2.5 pl-2 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-surface-1 font-mono text-[11px] font-black tracking-tight text-white shadow-sm group-hover:border-accent/50 group-hover:text-accent">
                            {report.ticker || report.slug.split("-")[0]}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white group-hover:text-accent">
                                {report.ticker || report.slug}
                              </span>
                              {report.quarter && (
                                <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[9px] font-medium text-slate-400">
                                  {report.quarter}
                                </span>
                              )}
                            </div>
                            <p className="max-w-[140px] truncate text-[11px] text-slate-400 sm:max-w-[180px] xl:max-w-[220px]">
                              {report.company || report.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Economic Moat */}
                      <td className="whitespace-nowrap p-2.5">
                        {report.moatRating ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-[11px] ${
                                report.moatRating.toLowerCase() === "wide"
                                  ? "border border-purple-500/30 bg-purple-500/10 text-purple-300"
                                  : "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                              }`}
                            >
                              <Shield className="size-2.5" />
                              {report.moatRating}
                            </span>
                            {report.moatTrend && (
                              <span
                                className={`hidden font-mono text-[10px] font-bold sm:inline ${
                                  report.moatTrend === "Widening"
                                    ? "text-emerald-400"
                                    : report.moatTrend === "Narrowing"
                                      ? "text-rose-400"
                                      : "text-slate-500"
                                }`}
                                title={`${report.moatTrend} Moat Trend`}
                              >
                                {report.moatTrend === "Widening"
                                  ? "↗"
                                  : report.moatTrend === "Narrowing"
                                    ? "↘"
                                    : "→"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>

                      {/* Snowflake Fundamental Radar & Score */}
                      <td className="whitespace-nowrap p-2.5">
                        {report.snowflakeScore !== undefined ? (
                          <div
                            className="flex items-center gap-2"
                            title={
                              report.snowflakePillars
                                ? `${report.snowflakeScore}/30 5-Pillar Snowflake Audit\n• Valuation: ${report.snowflakePillars.valuation}/6\n• Future Growth: ${report.snowflakePillars.future}/6\n• Earnings Quality: ${report.snowflakePillars.earnings}/6\n• Economic Moat: ${report.snowflakePillars.moat}/6\n• Resilience Floor: ${report.snowflakePillars.resilience}/6`
                                : `${report.snowflakeScore}/30 Snowflake Radar`
                            }
                          >
                            <MiniSnowflakeRadar
                              score={report.snowflakeScore}
                              tier={report.snowflakeTier}
                              pillars={report.snowflakePillars}
                              size={28}
                            />
                            <div className="flex flex-col">
                              <div className="flex items-baseline gap-0.5">
                                <span className="font-mono text-xs font-bold text-white">
                                  {report.snowflakeScore}
                                </span>
                                <span className="font-mono text-[9px] text-slate-500">
                                  /30
                                </span>
                              </div>
                              <span
                                className={`font-mono text-[9px] font-semibold uppercase tracking-wider ${
                                  report.snowflakeScore >= 24
                                    ? "text-emerald-400"
                                    : report.snowflakeScore >= 18
                                      ? "text-cyan-400"
                                      : report.snowflakeScore >= 12
                                        ? "text-amber-400"
                                        : "text-rose-400"
                                }`}
                              >
                                {report.snowflakeTier ?? "balanced"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>

                      {/* Current Stock Price */}
                      <td className="whitespace-nowrap p-2.5 text-right font-mono text-xs font-semibold tabular-nums text-white sm:text-sm">
                        {price > 0 ? formatCurrency(price) : "—"}
                      </td>

                      {/* Analyst Consensus Target */}
                      <td className="whitespace-nowrap p-2.5 text-right font-mono">
                        {report.analystTarget && report.analystTarget > 0 ? (
                          <div
                            title={
                              report.analystCount
                                ? `${report.analystCount} ${ts.analystsLabel}${
                                    report.analystRating
                                      ? ` · ${report.analystRating}`
                                      : ""
                                  }`
                                : undefined
                            }
                          >
                            <div className="font-mono text-xs font-medium tabular-nums text-slate-200 sm:text-sm">
                              {formatCurrency(report.analystTarget)}
                            </div>
                            <div className="flex items-center justify-end gap-1 font-mono text-[10px] tabular-nums sm:text-[11px]">
                              {report.analystUpsidePct !== undefined && (
                                <span
                                  className={
                                    report.analystUpsidePct >= 0
                                      ? "font-medium text-emerald-400"
                                      : "font-medium text-rose-400"
                                  }
                                >
                                  {report.analystUpsidePct >= 0 ? "+" : ""}
                                  {report.analystUpsidePct.toFixed(1)}%
                                </span>
                              )}
                              {report.analystRating && (
                                <span className="hidden text-[9px] text-slate-500 sm:inline">
                                  • {report.analystRating}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Base Fair Value & Upside */}
                      <td className="whitespace-nowrap p-2.5 text-right font-mono">
                        {baseFv > 0 ? (
                          <div>
                            <div className="font-mono text-xs font-medium tabular-nums text-slate-200 sm:text-sm">
                              {formatCurrency(baseFv)}
                            </div>
                            <div
                              className={`font-mono text-[10px] font-medium tabular-nums sm:text-[11px] ${
                                baseUpside >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {baseUpside >= 0 ? "+" : ""}
                              {baseUpside.toFixed(1)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Weighted Fair Value & Upside */}
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono">
                        {wfv > 0 ? (
                          <div>
                            <div className="font-mono text-xs font-bold tabular-nums text-white sm:text-sm">
                              {formatCurrency(wfv)}
                            </div>
                            <span
                              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums sm:text-[11px] ${
                                isPositive
                                  ? "border border-green-500/30 bg-green-500/10 text-green-400"
                                  : "border border-rose-500/30 bg-rose-500/10 text-rose-400"
                              }`}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="size-2.5" />
                              ) : (
                                <ArrowDownRight className="size-2.5" />
                              )}
                              {isPositive ? "+" : ""}
                              {upside.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Stress Range Bar */}
                      <td
                        className="hidden min-w-[170px] max-w-[210px] px-3 py-2.5 lg:table-cell"
                        title={`${report.ticker || report.company} ${ts.colValuationRange}:\n• ${ts.bearLabel}: ${formatCurrency(bear)}\n• ${ts.currentPriceLabel}: ${formatCurrency(price)}\n• ${ts.baseLabel}: ${formatCurrency(baseFv)}\n• ${ts.bullLabel}: ${formatCurrency(bull)}`}
                      >
                        {price > 0 && bull > bear ? (
                          <div className="space-y-1">
                            <div className="relative h-1.5 w-full rounded-full bg-surface-3">
                              {/* Range track from Bear to Bull */}
                              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/30 via-slate-500/20 to-emerald-500/30" />

                              {/* Base FV Marker */}
                              <div
                                style={{ left: `${basePos}%` }}
                                className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300 bg-sky-400 shadow-sm"
                                title={`${ts.colBaseFairValue}: ${formatCurrency(baseFv)}`}
                              />

                              {/* Current Price Marker */}
                              <div
                                style={{ left: `${pricePos}%` }}
                                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-accent shadow ring-2 ring-accent/30"
                                title={`${ts.currentPriceLabel}: ${formatCurrency(price)}`}
                              />
                            </div>
                            <div className="flex items-center justify-between font-mono text-[10px] tabular-nums text-slate-500">
                              <span
                                title={`${ts.bearLabel}: ${formatCurrency(bear)}`}
                              >
                                ${Math.round(bear)}
                              </span>
                              <span
                                className="flex items-center gap-1 font-mono text-[9px] text-slate-400"
                                title={`${ts.colBaseFairValue}: ${formatCurrency(baseFv)}`}
                              >
                                <span className="size-1.5 rounded-full bg-sky-400" />
                                ${Math.round(baseFv)}
                              </span>
                              <span
                                title={`${ts.bullLabel}: ${formatCurrency(bull)}`}
                              >
                                ${Math.round(bull)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Operating Margin */}
                      <td className="hidden whitespace-nowrap p-2.5 text-right font-mono text-xs tabular-nums text-slate-300 sm:text-sm xl:table-cell">
                        {report.operatingMarginPct !== undefined ? (
                          <span>{report.operatingMarginPct.toFixed(1)}%</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Revenue Growth */}
                      <td className="hidden whitespace-nowrap py-2.5 pl-2.5 pr-4 text-right font-mono text-xs tabular-nums sm:text-sm xl:table-cell">
                        {report.revenueGrowthPct !== undefined ? (
                          <span
                            className={
                              report.revenueGrowthPct >= 0
                                ? "text-slate-200"
                                : "text-rose-400"
                            }
                          >
                            {report.revenueGrowthPct >= 0 ? "+" : ""}
                            {report.revenueGrowthPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
