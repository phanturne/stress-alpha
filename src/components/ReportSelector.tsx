"use client";

import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  ChevronDown,
  Check,
  Sparkles,
  BarChart3,
  Star,
} from "lucide-react";
import type { ReportSummary } from "@/app/api/reports/route";
import { getTranslations, type Locale } from "@/lib/i18n";
import { useWatchlist } from "@/lib/watchlist";

interface ReportSelectorProps {
  currentSlug: string | null;
  onSelectReport: (slug: string) => void;
  isLoading?: boolean;
  locale?: Locale;
  onOpenScreener?: () => void;
}

export const ReportSelector: React.FC<ReportSelectorProps> = ({
  currentSlug,
  onSelectReport,
  isLoading = false,
  locale = "zh",
  onOpenScreener,
}) => {
  const t = getTranslations(locale).selector;
  const { isFavorite, toggleFavorite } = useWatchlist();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.reports) {
          setReports(data.reports);
        }
      })
      .catch((err) => {
        console.error("Failed to load reports:", err);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const currentReport = reports.find((r) => r.slug === currentSlug);
  const currentLabel = currentReport
    ? `${currentReport.ticker || currentReport.slug}${currentReport.quarter ? ` • ${currentReport.quarter}` : ""}${currentReport.company ? ` — ${currentReport.company}` : ""}`
    : t.selectReport;

  const pinnedReports = reports.filter((r) => isFavorite(r.ticker || r.slug));
  const otherReports = reports.filter((r) => !isFavorite(r.ticker || r.slug));

  const renderReportItem = (r: ReportSummary) => {
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
          }}
          className="flex min-w-0 flex-1 flex-col gap-0.5 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white">
              {r.ticker || r.name}
            </span>
            {r.quarter && (
              <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                {r.quarter}
              </span>
            )}
          </div>
          <span
            className="truncate text-[11px] text-slate-400"
            title={r.company || r.name}
          >
            {r.company || r.name}
          </span>
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

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-surface-1/90 px-2.5 py-1.5 text-xs font-medium text-slate-200 shadow-sm transition-all hover:border-accent/50 hover:bg-surface-2 sm:px-3 sm:text-sm"
          title={currentLabel}
        >
          <FolderOpen className="size-3.5 shrink-0 text-accent sm:size-4" />
          <span
            className="max-w-[120px] truncate font-mono sm:max-w-[180px] md:max-w-[240px]"
            title={currentLabel}
          >
            {currentReport ? (
              <>
                <span className="font-bold text-accent">
                  {currentReport.ticker || currentReport.slug}
                </span>{" "}
                {currentReport.quarter ? `• ${currentReport.quarter}` : ""}
              </>
            ) : (
              t.selectReport
            )}
          </span>
          <ChevronDown
            className={`size-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : ""}`}
          />
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="glass-panel absolute left-0 z-50 mt-2 w-72 divide-y divide-white/[0.06] overflow-hidden rounded-xl shadow-2xl duration-150 animate-in fade-in zoom-in-95 sm:w-80">
            <div className="flex items-center justify-between bg-surface-0/70 px-3.5 py-2.5 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3 text-accent" />
                {t.availableReports} ({reports.length})
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                /reports
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto py-1">
              {reports.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  {t.noReportsFound}
                </div>
              ) : (
                <>
                  {pinnedReports.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 border-b border-white/[0.04] bg-amber-500/5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        <span>
                          {t.watchlistSection} ({pinnedReports.length})
                        </span>
                      </div>
                      {pinnedReports.map(renderReportItem)}
                    </div>
                  )}

                  {otherReports.length > 0 && (
                    <div>
                      {pinnedReports.length > 0 && (
                        <div className="flex items-center gap-1.5 border-y border-white/[0.04] bg-surface-0/60 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          <span>{t.allReportsSection}</span>
                        </div>
                      )}
                      {otherReports.map(renderReportItem)}
                    </div>
                  )}
                </>
              )}
            </div>

            {onOpenScreener && (
              <div className="border-t border-white/[0.06] bg-surface-0/90 p-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenScreener();
                    setIsOpen(false);
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
