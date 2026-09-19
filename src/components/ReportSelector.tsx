"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  RefreshCw,
  ChevronDown,
  Check,
  Sparkles,
  BarChart3,
} from "lucide-react";
import type { ReportSummary } from "@/app/api/reports/route";
import { getTranslations, type Locale } from "@/lib/i18n";

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
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setIsFetching(false);
    }
  }, []);

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

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1.5">
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

        <button
          type="button"
          onClick={fetchReports}
          disabled={isFetching}
          className="rounded-lg border border-white/[0.08] bg-surface-1/90 p-1.5 text-slate-400 transition-colors hover:border-accent/50 hover:bg-surface-2 hover:text-accent"
          title={t.refreshTitle}
        >
          <RefreshCw
            className={`size-3.5 ${isFetching ? "animate-spin text-accent" : ""}`}
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

            <div className="max-h-64 overflow-y-auto py-1">
              {reports.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  {t.noReportsFound}
                </div>
              ) : (
                reports.map((r) => {
                  const isSelected = r.slug === currentSlug;
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
                      <div className="flex flex-col gap-0.5 truncate">
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
                      </div>

                      {isSelected && (
                        <Check className="ml-2 size-4 shrink-0 text-accent" />
                      )}
                    </button>
                  );
                })
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
