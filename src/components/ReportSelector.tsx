"use client";

import React, { useState, useEffect } from "react";
import { FolderOpen, RefreshCw, ChevronDown, Check, Sparkles } from "lucide-react";
import type { ReportSummary } from "@/app/api/reports/route";
import { getTranslations, type Locale } from "@/lib/i18n";

interface ReportSelectorProps {
  currentSlug: string | null;
  onSelectReport: (slug: string) => void;
  isLoading?: boolean;
  locale?: Locale;
}

export const ReportSelector: React.FC<ReportSelectorProps> = ({
  currentSlug,
  onSelectReport,
  isLoading = false,
  locale = "zh",
}) => {
  const t = getTranslations(locale).selector;
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchReports = async () => {
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
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const currentReport = reports.find((r) => r.slug === currentSlug);

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-1/90 hover:bg-surface-2 border border-white/[0.08] hover:border-accent/50 text-xs sm:text-sm font-medium text-slate-200 transition-all shadow-sm"
          title="Select from /reports folder"
        >
          <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
          <span className="max-w-[100px] sm:max-w-[160px] md:max-w-[220px] truncate font-mono">
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
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : ""}`} />
        </button>

        <button
          type="button"
          onClick={fetchReports}
          disabled={isFetching}
          className="p-1.5 rounded-lg bg-surface-1/90 hover:bg-surface-2 border border-white/[0.08] hover:border-accent/50 text-slate-400 hover:text-accent transition-colors"
          title={t.refreshTitle}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-accent" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-xl glass-panel shadow-2xl z-50 overflow-hidden divide-y divide-white/[0.06] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3.5 py-2.5 bg-surface-0/70 flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-accent" />
                {t.availableReports} ({reports.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/reports</span>
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
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-accent/10 text-accent font-semibold"
                          : "text-slate-300 hover:bg-surface-2 hover:text-white"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">
                            {r.ticker || r.name}
                          </span>
                          {r.quarter && (
                            <span className="px-1.5 py-0.5 rounded bg-surface-2 text-[10px] text-accent font-mono">
                              {r.quarter}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 truncate">
                          {r.company || r.name}
                        </span>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-accent shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
