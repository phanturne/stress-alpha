"use client";

import React from "react";
import { Mic, MessageSquare, Quote, Gauge } from "lucide-react";
import type { EarningsSentiment } from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";

interface ToneTabProps {
  sentimentData?: EarningsSentiment;
  locale?: Locale;
}

export const ToneTab: React.FC<ToneTabProps> = ({
  sentimentData,
  locale = "zh",
}) => {
  const t = getTranslations(locale).toneTab;
  if (!sentimentData || !sentimentData.managementTone) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center text-sm text-slate-400">
        {t.empty}
      </div>
    );
  }

  const { managementTone, analystConcerns, keyQuotes } = sentimentData;

  const metrics = [
    { label: t.metrics.specificity, val: managementTone.specificity },
    {
      label: t.metrics.forwardConfidence,
      val: managementTone.forwardConfidence,
    },
    {
      label: t.metrics.capexJustification,
      val: managementTone.capexJustification,
    },
    {
      label: t.metrics.competitivePositioning,
      val: managementTone.competitivePositioning,
    },
    {
      label: t.metrics.riskAcknowledgment,
      val: managementTone.riskAcknowledgment,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          {t.title}
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">{t.subtitle}</p>
      </div>

      {/* Confidence Header & Radar Score */}
      <div className="glass-panel flex flex-col items-center justify-between gap-5 rounded-2xl p-5 shadow-xl md:flex-row">
        <div className="flex items-center gap-4">
          <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Gauge className="size-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.overallConfidence}
            </div>
            <div className="mt-0.5 font-mono text-3xl font-extrabold tabular-nums text-white">
              {managementTone.overallConfidence}{" "}
              <span className="text-sm font-normal text-slate-400">/ 10</span>
            </div>
          </div>
        </div>

        {managementTone.evidenceNotes && (
          <p className="max-w-xl rounded-xl border border-border/70 bg-surface-0/80 p-3.5 text-xs leading-relaxed text-slate-300 shadow-sm">
            {managementTone.evidenceNotes}
          </p>
        )}
      </div>

      {/* 5-Dimension Scorecard */}
      <div className="glass-panel flex flex-col gap-4 rounded-2xl p-5 shadow-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {t.behavioralDimensions}
        </h4>
        <div className="grid grid-cols-1 gap-3.5">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex items-center justify-between gap-4"
            >
              <span className="w-44 shrink-0 text-xs font-semibold text-slate-300">
                {m.label}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent shadow-[0_0_8px_rgba(56,189,248,0.4)] transition-all duration-500"
                  style={{ width: `${(m.val / 5) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right font-mono text-xs font-bold tabular-nums text-accent">
                {m.val}/5
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Analyst Concern Topics Table */}
      {analystConcerns?.topTopics && analystConcerns.topTopics.length > 0 && (
        <div className="glass-panel overflow-hidden rounded-xl border border-border/80 shadow-lg">
          <div className="flex items-center gap-2 border-b border-border bg-surface-0/80 p-3.5">
            <MessageSquare className="size-4 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.qaFocus}
            </h4>
          </div>
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-2/70 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="p-3 font-semibold">{t.colTopic}</th>
                  <th className="p-3 text-right font-semibold">
                    {t.colMentions}
                  </th>
                  <th className="p-3 font-semibold">{t.colResponse}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {analystConcerns.topTopics.map((top) => (
                  <tr
                    key={top.topic}
                    className="transition-colors hover:bg-surface-2/40"
                  >
                    <td className="whitespace-nowrap p-3 text-sm font-bold text-white">
                      {top.topic}
                    </td>
                    <td className="whitespace-nowrap p-3 text-right font-mono font-bold tabular-nums text-accent">
                      {top.frequency}x
                    </td>
                    <td className="min-w-[280px] p-3 text-xs leading-relaxed text-slate-300">
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
            <Quote className="size-4 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.keyQuotes}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
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
                  className={`flex flex-col justify-between gap-3 rounded-xl border p-4 shadow-md transition-all ${borderClass}`}
                >
                  <p className="text-xs italic leading-relaxed text-slate-200">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
                    <span className="font-semibold text-white">
                      — {q.speaker}
                    </span>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${badgeClass}`}
                    >
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
