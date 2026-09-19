"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  TrendingUp,
  Shield,
  ShieldAlert,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Percent,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "./ui/Skeleton";
import { MiniSnowflakeRadar } from "./snowflake/MiniSnowflakeRadar";
import type { ReportSummary } from "@/app/api/reports/route";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";

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
  | "snowflake";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [moatFilter, setMoatFilter] = useState<MoatFilter>("all");
  const [upsideFilter, setUpsideFilter] = useState<UpsideFilter>("all");
  const [sortField, setSortField] = useState<SortField>("upside");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Summary statistics
  const stats = useMemo(() => {
    if (reports.length === 0) {
      return {
        count: 0,
        avgUpside: 0,
        topPick: null as ReportSummary | null,
        wideMoatCount: 0,
      };
    }

    const validUpsides = reports
      .map((r) => r.upsidePct)
      .filter((u): u is number => typeof u === "number" && !isNaN(u));
    const avgUpside =
      validUpsides.length > 0
        ? validUpsides.reduce((a, b) => a + b, 0) / validUpsides.length
        : 0;

    let topPick: ReportSummary | null = null;
    let maxUpside = -Infinity;
    let wideMoatCount = 0;

    for (const r of reports) {
      if (typeof r.upsidePct === "number" && r.upsidePct > maxUpside) {
        maxUpside = r.upsidePct;
        topPick = r;
      }
      if (r.moatRating?.toLowerCase() === "wide") {
        wideMoatCount += 1;
      }
    }

    return {
      count: reports.length,
      avgUpside,
      topPick,
      wideMoatCount,
    };
  }, [reports]);

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
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
      setSortDirection("desc");
    }
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
                Weighted probability model
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
              ? locale === "zh"
                ? `点击进入 ${stats.topPick.ticker} 操盘驾驶舱`
                : `Open ${stats.topPick.ticker} Cockpit`
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
                {stats.topPick?.upsidePct && (
                  <span className="font-mono text-sm font-bold text-green-400">
                    +{stats.topPick.upsidePct.toFixed(1)}%
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
                {`${stats.wideMoatCount} of ${stats.count} wide moats`}
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
            className="w-full rounded-lg border border-white/[0.08] bg-surface-0/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
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

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </div>

      {/* Main Screener Table */}
      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {/* Ticker & Company */}
                <th
                  onClick={() => handleSort("ticker")}
                  className="cursor-pointer px-4 py-3.5 transition-colors hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{ts.colTicker}</span>
                    <ArrowUpDown
                      className={`size-3 ${
                        sortField === "ticker"
                          ? "text-accent"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                </th>

                {/* Moat */}
                <th className="px-3 py-3.5">{ts.colMoat}</th>

                {/* Snowflake 30-Point Audit Radar */}
                <th
                  onClick={() => handleSort("snowflake")}
                  className="cursor-pointer px-3 py-3.5 transition-colors hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{ts.colSnowflake}</span>
                    <ArrowUpDown
                      className={`size-3 ${
                        sortField === "snowflake"
                          ? "text-accent"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                </th>

                {/* Price */}
                <th
                  onClick={() => handleSort("price")}
                  className="cursor-pointer px-3 py-3.5 text-right transition-colors hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colPrice}</span>
                    <ArrowUpDown
                      className={`size-3 ${
                        sortField === "price" ? "text-accent" : "text-slate-500"
                      }`}
                    />
                  </div>
                </th>

                {/* Analyst Consensus Target */}
                <th
                  onClick={() => handleSort("analystTarget")}
                  className="cursor-pointer px-3 py-3.5 text-right transition-colors hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colAnalystTarget}</span>
                    <ArrowUpDown
                      className={`size-3 ${
                        sortField === "analystTarget"
                          ? "text-accent"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                </th>

                {/* Base Fair Value */}
                <th
                  onClick={() => handleSort("baseUpside")}
                  className="cursor-pointer px-3 py-3.5 text-right transition-colors hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colBaseFairValue}</span>
                    <ArrowUpDown
                      className={`size-3 ${
                        sortField === "baseUpside"
                          ? "text-accent"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                </th>

                {/* Weighted Fair Value & Upside */}
                <th
                  onClick={() => handleSort("upside")}
                  className="cursor-pointer px-4 py-3.5 text-right transition-colors hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colWeightedFairValue}</span>
                    <ArrowUpDown
                      className={`size-3 ${
                        sortField === "upside"
                          ? "text-accent"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                </th>

                {/* Valuation Spectrum */}
                <th className="hidden min-w-[200px] px-4 py-3.5 lg:table-cell">
                  {ts.colValuationRange}
                </th>

                {/* Operating Margin */}
                <th
                  onClick={() => handleSort("opMargin")}
                  className="hidden cursor-pointer px-3 py-3.5 text-right transition-colors hover:text-white xl:table-cell"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colOperatingMargin}</span>
                    <ArrowUpDown
                      className={`size-3 ${
                        sortField === "opMargin"
                          ? "text-accent"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                </th>

                {/* Revenue Growth */}
                <th
                  onClick={() => handleSort("revGrowth")}
                  className="hidden cursor-pointer px-3 py-3.5 text-right transition-colors hover:text-white xl:table-cell"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{ts.colRevenueGrowth}</span>
                    <ArrowUpDown
                      className={`size-3 ${
                        sortField === "revGrowth"
                          ? "text-accent"
                          : "text-slate-500"
                      }`}
                    />
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
                      {/* Ticker & Company */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="size-8 shrink-0 rounded-lg" />
                          <div className="space-y-1.5">
                            <Skeleton className={`h-3.5 ${row.tickerW}`} />
                            <Skeleton className={`h-2.5 ${row.nameW}`} />
                          </div>
                        </div>
                      </td>

                      {/* Moat */}
                      <td className="px-3 py-3.5">
                        <Skeleton className={`h-5 ${row.moatW} rounded-full`} />
                      </td>

                      {/* Snowflake */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <Skeleton className="size-8 shrink-0 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-8" />
                            <Skeleton className="h-2 w-10" />
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3.5 text-right">
                        <Skeleton className="ml-auto h-4 w-16" />
                      </td>

                      {/* Analyst Target */}
                      <td className="px-3 py-3.5 text-right">
                        <Skeleton className={`ml-auto h-4 ${row.targetW}`} />
                      </td>

                      {/* Base Fair Value */}
                      <td className="px-3 py-3.5 text-right">
                        <Skeleton className={`ml-auto h-4 ${row.baseW}`} />
                      </td>

                      {/* Weighted Fair Value & Upside */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="ml-auto space-y-1">
                          <Skeleton className={`ml-auto h-4 ${row.wfvW}`} />
                          <Skeleton className="ml-auto h-3 w-12 rounded-full" />
                        </div>
                      </td>

                      {/* Valuation Spectrum */}
                      <td className="hidden min-w-[200px] px-4 py-3.5 lg:table-cell">
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <Skeleton className="h-2 w-8" />
                            <Skeleton className="h-2 w-8" />
                          </div>
                          <Skeleton className="h-2 w-full rounded-full" />
                        </div>
                      </td>

                      {/* Operating Margin */}
                      <td className="hidden px-3 py-3.5 text-right xl:table-cell">
                        <Skeleton className={`ml-auto h-4 ${row.marginW}`} />
                      </td>

                      {/* Revenue Growth */}
                      <td className="hidden px-3 py-3.5 text-right xl:table-cell">
                        <Skeleton className={`ml-auto h-4 ${row.growthW}`} />
                      </td>
                    </tr>
                  ))}
                </>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    <p className="text-sm font-medium">{ts.noResults}</p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setMoatFilter("all");
                        setUpsideFilter("all");
                      }}
                      className="mt-3 rounded-lg border border-white/[0.08] bg-surface-1 px-3 py-1.5 text-xs text-accent hover:bg-surface-2"
                    >
                      {ts.resetFilters}
                    </button>
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
                      {/* Ticker & Company */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-surface-1 font-mono text-xs font-black tracking-tight text-white shadow-sm group-hover:border-accent/50 group-hover:text-accent">
                            {report.ticker || report.slug.split("-")[0]}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white group-hover:text-accent">
                                {report.ticker || report.slug}
                              </span>
                              {report.ticker && (
                                <a
                                  href={`https://finance.yahoo.com/quote/${report.ticker}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-slate-500 hover:text-accent"
                                  title={
                                    locale === "zh"
                                      ? `在 Yahoo Finance 查看 ${report.ticker}`
                                      : `View ${report.ticker} on Yahoo Finance`
                                  }
                                >
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                              {report.quarter && (
                                <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400">
                                  {report.quarter}
                                </span>
                              )}
                            </div>
                            <p className="max-w-[180px] truncate text-[11px] text-slate-400 sm:max-w-[240px]">
                              {report.company || report.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Economic Moat */}
                      <td className="px-3 py-3.5">
                        {report.moatRating ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                report.moatRating.toLowerCase() === "wide"
                                  ? "border border-purple-500/30 bg-purple-500/10 text-purple-300"
                                  : "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                              }`}
                            >
                              <Shield className="size-2.5" />
                              {report.moatRating}
                            </span>
                            {report.moatTrend && (
                              <span className="hidden font-mono text-[10px] text-slate-500 sm:inline">
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
                      <td className="px-3 py-3.5">
                        {report.snowflakeScore !== undefined ? (
                          <div
                            className="flex items-center gap-2.5"
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
                              size={34}
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
                      <td className="px-3 py-3.5 text-right font-mono font-medium text-white">
                        {price > 0 ? formatCurrency(price) : "—"}
                      </td>

                      {/* Analyst Consensus Target */}
                      <td className="px-3 py-3.5 text-right font-mono">
                        {report.analystTarget && report.analystTarget > 0 ? (
                          <div
                            title={
                              report.analystCount
                                ? `${report.analystCount} ${
                                    locale === "zh"
                                      ? "位分析师评级"
                                      : "analysts"
                                  }${
                                    report.analystRating
                                      ? ` · ${report.analystRating}`
                                      : ""
                                  }`
                                : undefined
                            }
                          >
                            <div className="font-medium text-slate-200">
                              {formatCurrency(report.analystTarget)}
                            </div>
                            <div className="flex items-center justify-end gap-1 text-[11px]">
                              {report.analystUpsidePct !== undefined && (
                                <span
                                  className={
                                    report.analystUpsidePct >= 0
                                      ? "text-emerald-400"
                                      : "text-rose-400"
                                  }
                                >
                                  {report.analystUpsidePct >= 0 ? "+" : ""}
                                  {report.analystUpsidePct.toFixed(1)}%
                                </span>
                              )}
                              {report.analystRating && (
                                <span className="hidden text-[10px] text-slate-500 sm:inline">
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
                      <td className="px-3 py-3.5 text-right font-mono">
                        {baseFv > 0 ? (
                          <div>
                            <div className="font-medium text-slate-200">
                              {formatCurrency(baseFv)}
                            </div>
                            <div
                              className={`text-[11px] ${
                                baseUpside >= 0
                                  ? "text-green-400"
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
                      <td className="px-4 py-3.5 text-right font-mono">
                        {wfv > 0 ? (
                          <div>
                            <div className="font-bold text-white">
                              {formatCurrency(wfv)}
                            </div>
                            <span
                              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold ${
                                isPositive
                                  ? "border border-green-500/30 bg-green-500/10 text-green-400"
                                  : "border border-rose-500/30 bg-rose-500/10 text-rose-400"
                              }`}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="size-3" />
                              ) : (
                                <ArrowDownRight className="size-3" />
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
                      <td className="hidden min-w-[200px] px-4 py-3.5 lg:table-cell">
                        {price > 0 && bull > bear ? (
                          <div className="space-y-1">
                            <div className="relative h-2 w-full rounded-full bg-surface-3">
                              {/* Range track from Bear to Bull */}
                              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/30 via-slate-500/20 to-emerald-500/30" />

                              {/* Base FV Marker */}
                              <div
                                style={{ left: `${basePos}%` }}
                                className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300 bg-sky-400"
                                title={`Base FV: ${formatCurrency(baseFv)}`}
                              />

                              {/* Current Price Marker */}
                              <div
                                style={{ left: `${pricePos}%` }}
                                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow"
                                title={`Current Price: ${formatCurrency(price)}`}
                              />
                            </div>
                            <div className="flex justify-between font-mono text-[10px] text-slate-500">
                              <span>${Math.round(bear)}</span>
                              <span className="font-semibold text-accent">
                                {ts.currentPriceLabel}: ${Math.round(price)}
                              </span>
                              <span>${Math.round(bull)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Operating Margin */}
                      <td className="hidden px-3 py-3.5 text-right font-mono text-slate-300 xl:table-cell">
                        {report.operatingMarginPct !== undefined ? (
                          <span>{report.operatingMarginPct.toFixed(1)}%</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Revenue Growth */}
                      <td className="hidden px-3 py-3.5 text-right font-mono xl:table-cell">
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
