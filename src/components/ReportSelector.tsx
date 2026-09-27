"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FolderOpen,
  ChevronDown,
  Check,
  BarChart3,
  Star,
  Search,
  X,
  Calendar,
} from "lucide-react";
import type { ReportSummary } from "@/app/api/reports/route";
import { getTranslations, type Locale } from "@/lib/i18n";
import { useWatchlist } from "@/lib/watchlist";

export interface ReportSelectorProps {
  currentSlug: string | null;
  onSelectReport: (slug: string) => void;
  reports?: ReportSummary[];
  isLoading?: boolean;
  locale?: Locale;
  onOpenScreener?: () => void;
  currentTicker?: string;
  currentQuarter?: string;
  currentDate?: string;
  siblingReports?: ReportSummary[];
}

interface TickerReportGroup {
  ticker: string;
  company: string;
  reports: ReportSummary[];
  isFav: boolean;
}

export const ReportSelector: React.FC<ReportSelectorProps> = ({
  currentSlug,
  onSelectReport,
  reports: externalReports,
  isLoading: _isLoading = false,
  locale = "zh",
  onOpenScreener,
  currentTicker,
  currentQuarter,
  currentDate: _currentDate,
  siblingReports,
}) => {
  const translations = getTranslations(locale);
  const t = translations.selector;
  const tHeader = translations.header;
  const { isFavorite, toggleFavorite } = useWatchlist();
  const [internalReports, setInternalReports] = useState<ReportSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (externalReports && externalReports.length > 0) return;
    let ignore = false;
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.reports) {
          setInternalReports(data.reports);
        }
      })
      .catch((err) => {
        console.error("Failed to load reports:", err);
      });
    return () => {
      ignore = true;
    };
  }, [externalReports]);

  const activeReports = useMemo(() => {
    return externalReports && externalReports.length > 0
      ? externalReports
      : internalReports;
  }, [externalReports, internalReports]);

  const currentReport = activeReports.find((r) => r.slug === currentSlug);
  const displayTicker =
    currentTicker || currentReport?.ticker || currentReport?.slug || "";
  const displayQuarter = currentQuarter || currentReport?.quarter || "";
  const displayCompany = currentReport?.company || "";

  // Derive sibling reports for the active ticker
  const activeSiblingReports = useMemo(() => {
    if (siblingReports && siblingReports.length > 0) return siblingReports;
    if (!displayTicker) return [];
    return activeReports
      .filter(
        (r) =>
          (r.ticker || r.slug).toUpperCase() === displayTicker.toUpperCase()
      )
      .sort(
        (a, b) =>
          (b.reportDate || "").localeCompare(a.reportDate || "") ||
          b.slug.localeCompare(a.slug)
      );
  }, [siblingReports, displayTicker, activeReports]);

  const isLatest =
    activeSiblingReports.length > 0
      ? activeSiblingReports[0].slug === currentSlug
      : true;

  // Filter reports by search query
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeReports;
    return activeReports.filter((r) => {
      const ticker = (r.ticker || "").toLowerCase();
      const company = (r.company || "").toLowerCase();
      const quarter = (r.quarter || "").toLowerCase();
      const slug = (r.slug || "").toLowerCase();
      return (
        ticker.includes(q) ||
        company.includes(q) ||
        quarter.includes(q) ||
        slug.includes(q)
      );
    });
  }, [activeReports, searchQuery]);

  // Group reports by ticker and sort by reportDate desc
  const { pinnedGroups, otherGroups } = useMemo(() => {
    const groupMap = new Map<string, TickerReportGroup>();

    for (const r of filteredReports) {
      const key = r.ticker || r.slug;
      let group = groupMap.get(key);
      if (!group) {
        group = {
          ticker: r.ticker || r.name,
          company: r.company || r.name,
          reports: [],
          isFav: isFavorite(key),
        };
        groupMap.set(key, group);
      }
      group.reports.push(r);
    }

    // Sort reports within each group by reportDate desc
    for (const g of groupMap.values()) {
      g.reports.sort(
        (a, b) =>
          (b.reportDate || "").localeCompare(a.reportDate || "") ||
          b.slug.localeCompare(a.slug)
      );
    }

    const pinned: TickerReportGroup[] = [];
    const other: TickerReportGroup[] = [];

    for (const g of groupMap.values()) {
      if (g.isFav) {
        pinned.push(g);
      } else {
        other.push(g);
      }
    }

    return { pinnedGroups: pinned, otherGroups: other };
  }, [filteredReports, isFavorite]);

  const renderSingleReportItem = (r: ReportSummary) => {
    const isSelected = r.slug === currentSlug;
    const isFav = isFavorite(r.ticker || r.slug);
    return (
      <div
        key={r.slug}
        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
          isSelected
            ? "bg-accent/10 font-semibold text-accent"
            : "text-slate-300 hover:bg-surface-2 hover:text-white"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            onSelectReport(r.slug);
            setIsOpen(false);
            setSearchQuery("");
          }}
          className="flex min-w-0 flex-1 items-center justify-between pr-2 text-left"
          title={r.company || r.name}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-mono font-bold text-white">
              {r.ticker || r.name}
            </span>
            {r.quarter && (
              <span className="font-mono text-[11px] text-slate-400">
                {r.quarter}
              </span>
            )}
            {r.company && (
              <span className="truncate text-[11px] text-slate-500">
                {r.company}
              </span>
            )}
          </div>
          {r.weightedFairValue ? (
            <span className="font-mono text-[11px] text-slate-400">
              ${r.weightedFairValue}
            </span>
          ) : null}
        </button>

        <div className="ml-2 flex shrink-0 items-center gap-1.5">
          {isSelected && <Check className="size-3.5 shrink-0 text-accent" />}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(r.ticker || r.slug);
            }}
            className="rounded p-1 text-slate-500 transition-all hover:scale-125"
            title={t.starredTooltip}
            aria-label={t.starredTooltip}
          >
            <Star
              className={`size-3.5 transition-colors ${
                isFav
                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                  : "text-slate-600 hover:text-amber-400"
              }`}
            />
          </button>
        </div>
      </div>
    );
  };

  const renderGroup = (g: TickerReportGroup) => {
    if (g.reports.length === 1) {
      return renderSingleReportItem(g.reports[0]);
    }

    return (
      <div
        key={g.ticker}
        className="border-b border-white/[0.04] last:border-b-0"
      >
        {/* Group Header */}
        <div className="flex items-center justify-between bg-surface-0/40 px-3 py-1.5 text-xs">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-mono font-bold text-white" title={g.company}>
              {g.ticker}
            </span>
            {g.company && (
              <span className="truncate text-[11px] text-slate-500">
                {g.company}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-400">
              {t.quartersCount(g.reports.length)}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(g.ticker);
              }}
              className="rounded p-1 text-slate-500 transition-all hover:scale-125"
              title={t.starredTooltip}
              aria-label={t.starredTooltip}
            >
              <Star
                className={`size-3.5 transition-colors ${
                  g.isFav
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                    : "text-slate-600 hover:text-amber-400"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Indented Sub-quarters */}
        <div className="ml-2 border-l border-white/[0.08] py-0.5 pl-1.5">
          {g.reports.map((r, idx) => {
            const isSelected = r.slug === currentSlug;
            const isQuarterLatest = idx === 0;
            return (
              <div
                key={r.slug}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  isSelected
                    ? "bg-accent/10 font-semibold text-accent"
                    : "text-slate-300 hover:bg-surface-2 hover:text-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectReport(r.slug);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-slate-200">
                      {r.quarter || r.slug}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                        isQuarterLatest
                          ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                          : "border border-amber-500/30 bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {isQuarterLatest
                        ? tHeader.latestBadge
                        : tHeader.historicalBadge}
                    </span>
                    {r.reportDate && (
                      <span className="font-mono text-[10px] text-slate-500">
                        {r.reportDate}
                      </span>
                    )}
                  </div>
                  {r.weightedFairValue ? (
                    <span className="font-mono text-[11px] text-slate-400">
                      ${r.weightedFairValue}
                    </span>
                  ) : null}
                </button>
                {isSelected && (
                  <Check className="ml-2 size-3.5 shrink-0 text-accent" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative inline-block text-left">
      {/* Unified Ticker · Quarter Financial Capsule */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all sm:gap-2 sm:px-3 ${
          !isLatest
            ? "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:border-amber-500/60 hover:bg-amber-500/20"
            : "border-white/[0.08] bg-surface-1/90 text-slate-200 hover:border-accent/50 hover:bg-surface-2"
        }`}
        title={
          displayCompany
            ? `${displayTicker} — ${displayCompany}${displayQuarter ? ` (${displayQuarter})` : ""}`
            : `${displayTicker}${displayQuarter ? ` (${displayQuarter})` : ""}`
        }
      >
        <FolderOpen
          className={`size-3.5 shrink-0 ${!isLatest ? "text-amber-400" : "text-accent"}`}
        />
        <span className="font-mono font-bold text-white">
          {displayTicker || t.selectReport}
        </span>
        {displayQuarter && (
          <>
            <span className="font-bold text-slate-600">·</span>
            <span className="font-mono font-semibold text-slate-300">
              {displayQuarter}
            </span>
            <span
              className={`hidden rounded px-1.5 py-0.5 font-mono text-[9px] font-bold sm:inline ${
                isLatest
                  ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                  : "border border-amber-500/30 bg-amber-500/20 text-amber-400"
              }`}
            >
              {isLatest ? tHeader.latestBadge : tHeader.historicalBadge}
            </span>
          </>
        )}
        <ChevronDown
          className={`size-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-accent" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery("");
            }}
          />
          <div className="glass-panel absolute left-0 z-50 mt-2 w-80 max-w-[calc(100vw-24px)] divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.1] bg-surface-1/95 shadow-2xl backdrop-blur-xl duration-150 animate-in fade-in zoom-in-95 sm:w-96">
            {/* Search Input Bar */}
            <div className="bg-surface-0/80 p-2.5">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 size-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    locale === "zh"
                      ? "搜索代码、公司或季度..."
                      : "Search ticker, company or quarter..."
                  }
                  className="w-full rounded-lg border border-white/[0.08] bg-surface-1 py-1.5 pl-8 pr-7 text-xs text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-slate-400 hover:text-white"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Quarter Switcher Bar for Current Stock */}
            {activeSiblingReports.length > 1 && !searchQuery && (
              <div className="border-b border-white/[0.06] bg-surface-0/50 p-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-200">
                    <Calendar className="size-3 text-accent" />
                    <span>
                      {displayTicker} {tHeader.quarterHistory}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    {tHeader.quartersAvailable(activeSiblingReports.length)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeSiblingReports.map((r, idx) => {
                    const isCurrent = r.slug === currentSlug;
                    const isQuarterLatest = idx === 0;
                    return (
                      <button
                        key={r.slug}
                        type="button"
                        onClick={() => {
                          onSelectReport(r.slug);
                          setIsOpen(false);
                          setSearchQuery("");
                        }}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold transition-all ${
                          isCurrent
                            ? "border-accent/60 bg-accent/20 text-accent shadow-sm shadow-accent/20"
                            : "border-white/[0.08] bg-surface-1 text-slate-300 hover:border-accent/40 hover:bg-surface-2 hover:text-white"
                        }`}
                      >
                        <span>{r.quarter || r.slug}</span>
                        <span
                          className={`rounded px-1 py-0.5 font-mono text-[8px] font-bold ${
                            isQuarterLatest
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {isQuarterLatest
                            ? tHeader.latestBadge
                            : tHeader.historicalBadge}
                        </span>
                        {isCurrent && <Check className="size-3 text-accent" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Reports / Universe List */}
            <div className="custom-scrollbar max-h-72 overflow-y-auto py-1">
              {filteredReports.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-slate-500">
                  {t.noReportsFound}
                </div>
              ) : (
                <>
                  {pinnedGroups.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 border-b border-white/[0.04] bg-amber-500/5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        <span>
                          {t.watchlistSection} ({pinnedGroups.length})
                        </span>
                      </div>
                      {pinnedGroups.map(renderGroup)}
                    </div>
                  )}

                  {otherGroups.length > 0 && (
                    <div>
                      {pinnedGroups.length > 0 && (
                        <div className="flex items-center gap-1.5 border-y border-white/[0.04] bg-surface-0/60 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          <span>{t.allReportsSection}</span>
                        </div>
                      )}
                      {otherGroups.map(renderGroup)}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Screener Action Footer */}
            {onOpenScreener && (
              <div className="border-t border-white/[0.06] bg-surface-0/90 p-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenScreener();
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                >
                  <BarChart3 className="size-3.5" />
                  <span>{t.openScreener}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
