"use client";

import React from "react";
import { AlertOctagon, FileSearch, Sparkles } from "lucide-react";
import type { FilingExtracts } from "@/lib/schemas";

interface FilingTabProps {
  filingData?: FilingExtracts;
  locale?: "en" | "zh";
}

export const FilingTab: React.FC<FilingTabProps> = ({ filingData, locale = "zh" }) => {
  const isZh = locale === "zh";
  if (!filingData || (!filingData.newRiskFactors?.length && !filingData.sections?.length)) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 bg-surface-1 rounded-xl border border-border">
        {isZh ? "当前研报暂无 SEC 10-Q 监管申报审计底稿。" : "No SEC 10-Q filing extract artifacts available for this report."}
      </div>
    );
  }

  const { newRiskFactors, sections } = filingData;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          {isZh ? "SEC 10-Q 定期报告对比审计与风险披露" : "SEC 10-Q Filing Audit & Escalated Disclosures"}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {isZh
            ? "与往期法定监管申报文件的差异对比审计，识别新增法律表述与合规风险因素。"
            : "Diff audit against previous regulatory filings highlighting novel disclosures and modified legal risk factors."}
        </p>
      </div>

      {/* New or Escalated Risks */}
      {newRiskFactors && newRiskFactors.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-fintech-red" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isZh ? "新增或升级的风险因素披露" : "New / Escalated Risk Disclosures"}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {newRiskFactors.map((r, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-surface-1 border border-fintech-red/30 bg-fintech-redGlow/5 flex items-start justify-between gap-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-200">
                    {r.risk}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {r.priorLanguage === "new"
                      ? (isZh ? "⚡ 本报告期全新增加" : "⚡ Newly added this filing period")
                      : (isZh ? "相较上季度表述显著扩充" : "Language expanded from previous quarter")}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-fintech-redGlow/20 text-fintech-red border border-fintech-red/40 shrink-0">
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
              {isZh ? "关键章节提取与重大发现" : "Key Section Extractions & Findings"}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {sections.map((sec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-surface-1 border border-border shadow-md flex flex-col gap-2.5"
              >
                <h5 className="text-xs font-bold text-accent uppercase tracking-wider font-mono">
                  {sec.section}
                </h5>

                <div className="space-y-2">
                  {sec.keyFindings.map((finding, fIdx) => {
                    const isGrowth = finding.implication === "growth";
                    const isRisk = finding.implication === "risk";
                    const isNew = finding.novelty === "new";

                    return (
                      <div
                        key={fIdx}
                        className="text-xs text-slate-300 pl-3 border-l-2 py-0.5 flex items-start justify-between gap-2"
                        style={{
                          borderColor: isGrowth
                            ? "#10b981"
                            : isRisk
                            ? "#f43f5e"
                            : "#38bdf8",
                        }}
                      >
                        <span>{finding.finding}</span>
                        {isNew && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-fintech-amberGlow/20 text-fintech-amber border border-fintech-amber/30 text-[9px] font-bold font-mono uppercase shrink-0">
                            <Sparkles className="w-2.5 h-2.5" />
                            NEW
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
