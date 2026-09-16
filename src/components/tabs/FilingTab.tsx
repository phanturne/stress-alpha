"use client";

import React from "react";
import { AlertOctagon, FileSearch, Sparkles } from "lucide-react";
import type { FilingExtracts } from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";

interface FilingTabProps {
  filingData?: FilingExtracts;
  locale?: Locale;
}

export const FilingTab: React.FC<FilingTabProps> = ({
  filingData,
  locale = "zh",
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
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          {t.title}
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">{t.subtitle}</p>
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
                className="glass-panel flex items-start justify-between gap-4 rounded-xl border border-fintech-red/30 bg-fintech-redGlow/5 p-4 shadow-[0_0_12px_rgba(244,63,94,0.06)]"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold leading-relaxed text-slate-200">
                    {r.risk}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {r.priorLanguage === "new" ? t.newTag : t.expandedTag}
                  </span>
                </div>
                <span className="shrink-0 rounded-full border border-fintech-red/40 bg-fintech-redGlow/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fintech-red shadow-sm">
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
                className="glass-panel flex flex-col gap-3 rounded-xl border border-border/80 p-5 shadow-lg"
              >
                <h5 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
                  <span className="size-1.5 animate-pulse rounded-full bg-accent" />
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
                        className="flex items-start justify-between gap-3 rounded-r-lg border-l-2 bg-surface-0/40 py-1 pl-3.5 text-xs text-slate-300"
                        style={{
                          borderColor: isGrowth
                            ? "#10b981"
                            : isRisk
                              ? "#f43f5e"
                              : "#38bdf8",
                        }}
                      >
                        <span className="leading-relaxed">
                          {finding.finding}
                        </span>
                        {isNew && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded border border-fintech-amber/30 bg-fintech-amberGlow/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-fintech-amber shadow-sm">
                            <Sparkles className="size-2.5" />
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
