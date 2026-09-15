"use client";

import React from "react";
import { TrendingUp, TrendingDown, RotateCcw, Clock, Target } from "lucide-react";
import type { Catalyst, Catalysts } from "@/lib/schemas";
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
  if (!catalystsData || !catalystsData.catalysts || catalystsData.catalysts.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-slate-400 glass-panel rounded-xl">
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
          <p className="text-xs text-slate-400 mt-0.5">
            {t.subtitle}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full glass-panel border border-border/80 text-xs font-mono font-semibold text-accent shadow-sm">
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
              className={`p-5 rounded-2xl glass-panel border transition-all shadow-lg ${
                isGrowth
                  ? "border-fintech-green/30 hover:border-fintech-green/60 shadow-[0_0_16px_rgba(16,185,129,0.06)]"
                  : "border-fintech-red/30 hover:border-fintech-red/60 shadow-[0_0_16px_rgba(244,63,94,0.06)]"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`p-2 rounded-xl flex items-center justify-center ${
                      isGrowth
                        ? "bg-fintech-greenGlow/20 text-fintech-green border border-fintech-green/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                        : "bg-fintech-redGlow/20 text-fintech-red border border-fintech-red/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                    }`}
                  >
                    {isGrowth ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </span>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {catalyst.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border shadow-sm ${
                      isGrowth
                        ? "bg-fintech-greenGlow/15 text-fintech-green border-fintech-green/30"
                        : "bg-fintech-redGlow/15 text-fintech-red border-fintech-red/30"
                    }`}
                  >
                    {isGrowth ? t.growth : t.risk}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-surface-2 border border-border text-[11px] text-slate-300">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {catalyst.horizon === "near-term"
                      ? t.nearTerm
                      : catalyst.horizon === "medium-term"
                      ? t.mediumTerm
                      : t.longTerm}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {catalyst.description}
              </p>

              {/* Evidence list */}
              {catalyst.evidence && catalyst.evidence.length > 0 && (
                <div className="mt-3.5 bg-surface-0/70 rounded-xl p-3.5 border border-border/70">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                    <Target className="w-3 h-3 text-accent" />
                    {t.evidenceTitle}
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5">
                    {catalyst.evidence.map((ev, eIdx) => (
                      <li key={eIdx} className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        <span className="leading-relaxed">{ev.fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Probability Slider Bar */}
              <div className="mt-4 pt-3.5 border-t border-border/70 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                  <span className="font-medium">{t.probabilityWeight}:</span>
                  <span className="font-mono font-bold text-accent text-sm tabular-nums">
                    {probPct}%
                  </span>
                </div>

                <div className="flex-1 max-w-sm">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={probPct}
                    onChange={(e) =>
                      onProbabilityChange?.(idx, parseInt(e.target.value, 10) / 100)
                    }
                  />
                </div>

                {onResetProbability && (
                  <button
                    type="button"
                    onClick={() => onResetProbability(idx)}
                    className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors border border-border"
                    title={t.resetTooltip}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
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
