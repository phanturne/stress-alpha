"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, Check, History, Info } from "lucide-react";
import type { ReportSummary } from "@/app/api/reports/route";
import { getTranslations, type Locale } from "@/lib/i18n";

interface QuarterSwitcherProps {
  currentSlug: string | null;
  currentQuarter?: string;
  currentDate?: string;
  ticker?: string;
  siblingReports: ReportSummary[];
  onSelectReport: (slug: string) => void;
  locale?: Locale;
}

export const QuarterSwitcher: React.FC<QuarterSwitcherProps> = ({
  currentSlug,
  currentQuarter,
  currentDate,
  ticker,
  siblingReports,
  onSelectReport,
  locale = "zh",
}) => {
  const t = getTranslations(locale).header;
  const [isOpen, setIsOpen] = useState(false);

  if (!currentQuarter) return null;

  // Fallback single item list if siblingReports is empty or not yet loaded
  const displayReports: ReportSummary[] =
    siblingReports.length > 0
      ? siblingReports
      : currentSlug
        ? [
            {
              slug: currentSlug,
              name: currentSlug,
              ticker,
              quarter: currentQuarter,
              reportDate: currentDate,
              hasFacts: true,
              hasScenarios: true,
              hasValuation: true,
              hasBaseline: true,
              hasSentiment: false,
              hasFiling: false,
              hasCatalysts: false,
              hasReactions: false,
              hasEstimates: false,
            },
          ]
        : [];

  const isLatest =
    displayReports.length > 0 ? displayReports[0].slug === currentSlug : true;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all sm:px-3 ${
          isLatest
            ? "border-white/[0.08] bg-surface-1/90 hover:border-accent/50 hover:bg-surface-2"
            : "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:border-amber-500/60 hover:bg-amber-500/20"
        }`}
        title={`${t.quarterHistory} — ${ticker ?? ""} ${currentQuarter}`}
      >
        <Calendar
          className={`size-3.5 shrink-0 ${
            isLatest ? "text-accent" : "text-amber-400"
          }`}
        />
        <span className="font-mono font-bold text-white">{currentQuarter}</span>
        <span
          className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
            isLatest
              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
              : "border border-amber-500/30 bg-amber-500/20 text-amber-400"
          }`}
        >
          {isLatest ? t.latestBadge : t.historicalBadge}
        </span>
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
            onClick={() => setIsOpen(false)}
          />
          <div className="glass-panel absolute left-0 z-50 mt-2 w-72 divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.1] bg-surface-1/95 shadow-2xl backdrop-blur-xl duration-150 animate-in fade-in zoom-in-95 sm:w-80">
            <div className="flex items-center justify-between bg-surface-0/70 px-3.5 py-2.5 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <History className="size-3.5 text-accent" />
                <span>
                  {t.quarterHistory} ({displayReports.length})
                </span>
              </span>
              {ticker && (
                <span className="font-mono text-[10px] font-bold text-accent">
                  {ticker}
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto py-1">
              {displayReports.map((r, idx) => {
                const isSelected = r.slug === currentSlug;
                const isReportLatest = idx === 0;
                return (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => {
                      onSelectReport(r.slug);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-accent/10 font-semibold text-accent"
                        : "text-slate-300 hover:bg-surface-2 hover:text-white"
                    }`}
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">
                          {r.quarter || r.slug}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                            isReportLatest
                              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                              : "border border-amber-500/30 bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {isReportLatest ? t.latestBadge : t.historicalBadge}
                        </span>
                      </div>
                      {r.reportDate && (
                        <span className="font-mono text-[10px] text-slate-400">
                          {r.reportDate}
                        </span>
                      )}
                    </div>

                    <div className="ml-2 flex shrink-0 items-center gap-2 text-right">
                      {r.weightedFairValue ? (
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-[11px] font-semibold text-slate-200">
                            ${r.weightedFairValue}
                          </span>
                          {r.upsidePct !== undefined && (
                            <span
                              className={`font-mono text-[10px] font-bold ${
                                r.upsidePct >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {r.upsidePct >= 0 ? "+" : ""}
                              {r.upsidePct}%
                            </span>
                          )}
                        </div>
                      ) : null}
                      {isSelected && (
                        <Check className="size-3.5 shrink-0 text-accent" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {displayReports.length <= 1 && (
              <div className="flex items-center gap-2 border-t border-white/[0.06] bg-surface-0/60 px-3.5 py-2 text-[11px] text-slate-400">
                <Info className="size-3.5 shrink-0 text-accent/80" />
                <span>{t.noEarlierQuarters}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
