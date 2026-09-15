"use client";

import React from "react";
import { AlertOctagon, FileSearch, Sparkles } from "lucide-react";
import type { FilingExtracts } from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";

interface FilingTabProps {
  filingData?: FilingExtracts;
  locale?: Locale;
}

export const FilingTab: React.FC<FilingTabProps> = ({ filingData, locale = "zh" }) => {
  const t = getTranslations(locale).filingTab;
  if (!filingData || (!filingData.newRiskFactors?.length && !filingData.sections?.length)) {
    return (
      <div className="p-12 text-center text-sm text-slate-400 glass-panel rounded-xl">
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
        <p className="text-xs text-slate-400 mt-0.5">
          {t.subtitle}
        </p>
      </div>

      {/* New or Escalated Risks */}
      {newRiskFactors && newRiskFactors.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-fintech-red" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.newRisksTitle}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {newRiskFactors.map((r, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl glass-panel border border-fintech-red/30 bg-fintech-redGlow/5 flex items-start justify-between gap-4 shadow-[0_0_12px_rgba(244,63,94,0.06)]"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-200 leading-relaxed">
                    {r.risk}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {r.priorLanguage === "new"
                      ? t.newTag
                      : t.expandedTag}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-fintech-redGlow/20 text-fintech-red border border-fintech-red/40 shrink-0 shadow-sm">
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
            <FileSearch className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.findingsTitle}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {sections.map((sec, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl glass-panel border border-border/80 shadow-lg flex flex-col gap-3"
              >
                <h5 className="text-xs font-bold text-accent uppercase tracking-wider font-mono flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
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
                        className="text-xs text-slate-300 pl-3.5 border-l-2 py-1 flex items-start justify-between gap-3 rounded-r-lg bg-surface-0/40"
                        style={{
                          borderColor: isGrowth
                            ? "#10b981"
                            : isRisk
                            ? "#f43f5e"
                            : "#38bdf8",
                        }}
                      >
                        <span className="leading-relaxed">{finding.finding}</span>
                        {isNew && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-fintech-amberGlow/20 text-fintech-amber border border-fintech-amber/30 text-[9px] font-bold font-mono uppercase shrink-0 shadow-sm">
                            <Sparkles className="w-2.5 h-2.5" />
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
