"use client";

import React from "react";
import { AlertOctagon, FileSearch, Sparkles, ExternalLink } from "lucide-react";
import type { FilingExtracts } from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";

interface FilingTabProps {
  filingData?: FilingExtracts;
  locale?: Locale;
  ticker?: string;
}

export const FilingTab: React.FC<FilingTabProps> = ({
  filingData,
  locale = "zh",
  ticker,
}) => {
  const t = getTranslations(locale).filingTab;
  if (
    !filingData ||
    (!filingData.newRiskFactors?.length && !filingData.sections?.length)
  ) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center text-sm text-slate-400">
        {t.empty}
      </div>
    );
  }

  const { newRiskFactors, sections } = filingData;

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

      {/* New or Escalated Risks */}
      {newRiskFactors && newRiskFactors.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="size-4 text-fintech-red" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.newRisksTitle}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
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
