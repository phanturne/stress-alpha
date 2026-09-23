"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Clock,
  Target,
} from "lucide-react";
import type { Catalysts } from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";

interface CatalystsTabProps {
  catalystsData?: Catalysts;
  onProbabilityChange?: (index: number, prob: number) => void;
  onResetProbability?: (index: number) => void;
  locale?: Locale;
}

export const CatalystsTab: React.FC<CatalystsTabProps> = ({
  catalystsData,
  onProbabilityChange,
  onResetProbability,
  locale = "zh",
}) => {
  const t = getTranslations(locale).catalystsTab;
  if (
    !catalystsData ||
    !catalystsData.catalysts ||
    catalystsData.catalysts.length === 0
  ) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center text-sm text-slate-400">
        {t.empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            {t.title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">{t.subtitle}</p>
        </div>
        <span className="glass-panel rounded-full border border-border/80 px-3 py-1 font-mono text-xs font-semibold text-accent shadow-sm">
          {catalystsData.catalysts.length} {t.countLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {catalystsData.catalysts.map((catalyst, idx) => {
          const isGrowth = catalyst.direction === "growth";
          const probPct = Math.round(catalyst.probability * 100);

          return (
            <div
              key={catalyst.id || idx}
              className={`glass-panel rounded-2xl border p-5 shadow-lg transition-all ${
                isGrowth
                  ? "border-fintech-green/30 shadow-[0_0_16px_rgba(16,185,129,0.06)] hover:border-fintech-green/60"
                  : "border-fintech-red/30 shadow-[0_0_16px_rgba(244,63,94,0.06)] hover:border-fintech-red/60"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center justify-center rounded-xl p-2 ${
                      isGrowth
                        ? "bg-fintech-greenGlow/20 border border-fintech-green/30 text-fintech-green shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                        : "bg-fintech-redGlow/20 border border-fintech-red/30 text-fintech-red shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                    }`}
                  >
                    {isGrowth ? (
                      <TrendingUp className="size-4" />
                    ) : (
                      <TrendingDown className="size-4" />
                    )}
                  </span>
                  <h4 className="text-sm font-bold tracking-tight text-white">
                    {catalyst.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider shadow-sm ${
                      isGrowth
                        ? "bg-fintech-greenGlow/15 border-fintech-green/30 text-fintech-green"
                        : "bg-fintech-redGlow/15 border-fintech-red/30 text-fintech-red"
                    }`}
                  >
                    {isGrowth ? t.growth : t.risk}
                  </span>
                  <span className="flex items-center gap-1.5 rounded border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] text-slate-300">
                    <Clock className="size-3 text-slate-400" />
                    {catalyst.horizon === "near-term"
                      ? t.nearTerm
                      : catalyst.horizon === "medium-term"
                        ? t.mediumTerm
                        : t.longTerm}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                {catalyst.description}
              </p>

              {/* Evidence list */}
              {catalyst.evidence && catalyst.evidence.length > 0 && (
                <div className="mt-3.5 rounded-xl border border-border/70 bg-surface-0/70 p-3.5">
                  <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <Target className="size-3 text-accent" />
                    {t.evidenceTitle}
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {catalyst.evidence.map((ev, eIdx) => (
                      <li key={eIdx} className="flex items-start gap-2">
                        <span className="mt-0.5 text-accent">•</span>
                        <span className="leading-relaxed">{ev.fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Probability Slider Bar */}
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/70 pt-3.5">
                <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium">{t.probabilityWeight}:</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-accent">
                    {probPct}%
                  </span>
                </div>

                <div className="max-w-sm flex-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={probPct}
                    onChange={(e) =>
                      onProbabilityChange?.(
                        idx,
                        parseInt(e.target.value, 10) / 100
                      )
                    }
                  />
                </div>

                {onResetProbability && (
                  <button
                    type="button"
                    onClick={() => onResetProbability(idx)}
                    className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1.5 text-xs text-slate-400 transition-colors hover:bg-surface-3 hover:text-white"
                    title={t.resetTooltip}
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
