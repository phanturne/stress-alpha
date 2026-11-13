"use client";

import React from "react";
import {
  AlertOctagon,
  FileSearch,
  Sparkles,
  ExternalLink,
  Building2,
} from "lucide-react";
import type { FilingExtracts, Facts } from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";

interface FilingTabProps {
  filingData?: FilingExtracts;
  facts?: Facts;
  businessSummary?: string;
  sector?: string;
  industry?: string;
  locale?: Locale;
  ticker?: string;
}

export const FilingTab: React.FC<FilingTabProps> = ({
  filingData,
  facts,
  businessSummary,
  sector,
  industry,
  locale = "zh",
  ticker,
}) => {
  const t = getTranslations(locale).filingTab;
  const effectiveSummary = businessSummary || facts?.businessSummary;
  const effectiveSector = sector || facts?.sector;
  const effectiveIndustry = industry || facts?.industry;

  if (
    !effectiveSummary &&
    (!filingData ||
      (!filingData.newRiskFactors?.length && !filingData.sections?.length))
  ) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center text-sm text-slate-400">
        {t.empty}
      </div>
    );
  }

  const newRiskFactors = filingData?.newRiskFactors ?? [];
  const sections = filingData?.sections ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            {t.title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">{t.subtitle}</p>
        </div>
        {ticker && (
          <a
            href={`https://www.sec.gov/edgar/searchedgar/companysearch?companySearchBox=${encodeURIComponent(ticker)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent/10"
            title={
              locale === "zh"
                ? `在 SEC EDGAR 查看 ${ticker} 官方 10-Q/10-K 文件`
                : `View official ${ticker} 10-Q/10-K filings on SEC EDGAR`
            }
          >
            <span>
              {locale === "zh" ? "SEC EDGAR 原版申报" : "SEC EDGAR Filings"}
            </span>
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      {/* Item 1: Business Overview */}
      {effectiveSummary && (
        <div className="glass-panel shadow-xs flex flex-col gap-3 rounded-2xl border border-accent/25 bg-surface-1/90 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-4 shrink-0 text-accent" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {t.businessOverviewTitle}
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {t.businessOverviewSubtitle}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded border border-accent/30 bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
                {t.item1Badge}
              </span>
              {(effectiveSector || effectiveIndustry) && (
                <span className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-300">
                  {[effectiveSector, effectiveIndustry]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3 text-xs leading-relaxed">
            {effectiveSummary.split("\n\n").map((block, bIdx) => {
              const trimmed = block.trim();
              if (trimmed.startsWith("•")) {
                const lines = trimmed.split("\n");
                const headerLine = lines[0].replace(/^•\s*/, "");
                const bulletItems = lines.slice(1);
                return (
                  <div
                    key={bIdx}
                    className="rounded-xl border border-border/60 bg-surface-0/70 p-3.5"
                  >
                    <div className="font-mono text-xs font-bold tracking-tight text-foreground">
                      {headerLine}
                    </div>
                    {bulletItems.length > 0 && (
                      <ul className="mt-2 space-y-1.5 pl-4 text-xs text-slate-300">
                        {bulletItems.map((item, iIdx) => {
                          const itemTrimmed = item
                            .trim()
                            .replace(/^[-•]\s*/, "");
                          const parts = itemTrimmed.split(":");
                          if (parts.length > 1) {
                            return (
                              <li
                                key={iIdx}
                                className="list-disc leading-relaxed"
                              >
                                <span className="font-semibold text-slate-100">
                                  {parts[0]}:
                                </span>
                                <span>{parts.slice(1).join(":")}</span>
                              </li>
                            );
                          }
                          return (
                            <li
                              key={iIdx}
                              className="list-disc leading-relaxed"
                            >
                              {itemTrimmed}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              }
              return (
                <p key={bIdx} className="leading-relaxed text-slate-300">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* New or Escalated Risks */}
      {newRiskFactors && newRiskFactors.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="size-4 text-fintech-red" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.newRisksTitle}
            </h4>
          </div>

          <div className="custom-scrollbar grid max-h-72 grid-cols-1 gap-2.5 overflow-y-auto pr-1">
            {newRiskFactors.map((r, idx) => (
              <div
                key={idx}
                className="glass-panel bg-fintech-redGlow/5 shadow-xs flex items-start justify-between gap-4 rounded-xl border border-fintech-red/30 p-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold leading-relaxed text-slate-200">
                    {r.risk}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {r.priorLanguage === "new" ? t.newTag : t.expandedTag}
                  </span>
                </div>
                <span className="bg-fintech-redGlow/20 shadow-xs shrink-0 rounded-full border border-fintech-red/40 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-fintech-red">
                  {r.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filing Sections */}
      {sections && sections.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FileSearch className="size-4 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.findingsTitle}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {sections.map((sec, idx) => (
              <div
                key={idx}
                className="glass-panel shadow-xs flex flex-col gap-3 rounded-xl border border-border p-5"
              >
                <h5 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
                  <span className="size-1.5 rounded-full bg-accent" />
                  {sec.section}
                </h5>

                <div className="space-y-2.5">
                  {sec.keyFindings.map((finding, fIdx) => {
                    const isGrowth = finding.implication === "growth";
                    const isRisk = finding.implication === "risk";
                    const isNew = finding.novelty === "new";

                    return (
                      <div
                        key={fIdx}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border/80 bg-surface-0/40 p-2.5 text-xs text-slate-300"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                              isGrowth
                                ? "bg-emerald-400"
                                : isRisk
                                  ? "bg-rose-400"
                                  : "bg-sky-400"
                            }`}
                          />
                          <span className="leading-relaxed">
                            {finding.finding}
                          </span>
                        </div>
                        {isNew && (
                          <span className="bg-fintech-amberGlow/20 inline-flex shrink-0 items-center rounded border border-fintech-amber/30 px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase text-fintech-amber">
                            {t.newBadge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
