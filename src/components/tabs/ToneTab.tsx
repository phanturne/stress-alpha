"use client";

import React from "react";
import { Mic, MessageSquare, Quote, Gauge } from "lucide-react";
import type { EarningsSentiment } from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";

interface ToneTabProps {
  sentimentData?: EarningsSentiment;
  locale?: Locale;
}

export const ToneTab: React.FC<ToneTabProps> = ({ sentimentData, locale = "zh" }) => {
  const t = getTranslations(locale).toneTab;
  if (!sentimentData || !sentimentData.managementTone) {
    return (
      <div className="p-12 text-center text-sm text-slate-400 glass-panel rounded-xl">
        {t.empty}
      </div>
    );
  }

  const { managementTone, analystConcerns, keyQuotes } = sentimentData;

  const metrics = [
    { label: t.metrics.specificity, val: managementTone.specificity },
    { label: t.metrics.forwardConfidence, val: managementTone.forwardConfidence },
    { label: t.metrics.capexJustification, val: managementTone.capexJustification },
    { label: t.metrics.competitivePositioning, val: managementTone.competitivePositioning },
    { label: t.metrics.riskAcknowledgment, val: managementTone.riskAcknowledgment },
  ];

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

      {/* Confidence Header & Radar Score */}
      <div className="p-5 rounded-2xl glass-panel flex flex-col md:flex-row items-center justify-between gap-5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {t.overallConfidence}
            </div>
            <div className="text-3xl font-extrabold font-mono text-white mt-0.5 tabular-nums">
              {managementTone.overallConfidence}{" "}
              <span className="text-sm font-normal text-slate-400">/ 10</span>
            </div>
          </div>
        </div>

        {managementTone.evidenceNotes && (
          <p className="text-xs text-slate-300 max-w-xl bg-surface-0/80 p-3.5 rounded-xl border border-border/70 leading-relaxed shadow-sm">
            {managementTone.evidenceNotes}
          </p>
        )}
      </div>

      {/* 5-Dimension Scorecard */}
      <div className="p-5 rounded-2xl glass-panel flex flex-col gap-4 shadow-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {t.behavioralDimensions}
        </h4>
        <div className="grid grid-cols-1 gap-3.5">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-300 w-44 shrink-0">
                {m.label}
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-surface-3/80 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent/80 to-accent rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                  style={{ width: `${(m.val / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-accent w-12 text-right tabular-nums">
                {m.val}/5
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Analyst Concern Topics Table */}
      {analystConcerns?.topTopics && analystConcerns.topTopics.length > 0 && (
        <div className="rounded-xl glass-panel border border-border/80 overflow-hidden shadow-lg">
          <div className="p-3.5 bg-surface-0/80 border-b border-border flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.qaFocus}
            </h4>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-2/70 border-b border-border text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="p-3 font-semibold">{t.colTopic}</th>
                  <th className="p-3 text-right font-semibold">{t.colMentions}</th>
                  <th className="p-3 font-semibold">{t.colResponse}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {analystConcerns.topTopics.map((top) => (
                  <tr key={top.topic} className="hover:bg-surface-2/40 transition-colors">
                    <td className="p-3 font-bold text-white text-sm whitespace-nowrap">
                      {top.topic}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-accent tabular-nums whitespace-nowrap">
                      {top.frequency}x
                    </td>
                    <td className="p-3 text-slate-300 text-xs leading-relaxed min-w-[280px]">
                      {top.managementResponse}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Key Quotes Cards */}
      {keyQuotes && keyQuotes.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Quote className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.keyQuotes}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {keyQuotes.map((q, idx) => {
              const sentiment = q.sentiment.toLowerCase();
              const borderClass =
                sentiment === "bullish"
                  ? "border-fintech-green/30 bg-fintech-greenGlow/5 shadow-[0_0_12px_rgba(16,185,129,0.06)]"
                  : sentiment === "bearish"
                  ? "border-fintech-red/30 bg-fintech-redGlow/5 shadow-[0_0_12px_rgba(244,63,94,0.06)]"
                  : "border-border/80 glass-panel";

              const badgeClass =
                sentiment === "bullish"
                  ? "text-fintech-green bg-fintech-greenGlow/20 border-fintech-green/30"
                  : sentiment === "bearish"
                  ? "text-fintech-red bg-fintech-redGlow/20 border-fintech-red/30"
                  : "text-slate-300 bg-surface-2 border-border";

              const sentimentLabel =
                sentiment === "bullish"
                  ? t.sentimentLabels.bullish
                  : sentiment === "bearish"
                  ? t.sentimentLabels.bearish
                  : t.sentimentLabels.neutral;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 shadow-md transition-all ${borderClass}`}
                >
                  <p className="text-xs italic text-slate-200 leading-relaxed">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/60">
                    <span className="font-semibold text-white">
                      — {q.speaker}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeClass}`}>
                      {sentimentLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
