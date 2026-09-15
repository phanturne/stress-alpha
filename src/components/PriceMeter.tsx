"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";

interface PriceMeterProps {
  currentPrice: number;
  panicTarget: number;
  baseTarget: number;
  bullTarget: number;
  locale?: Locale;
}

export const PriceMeter: React.FC<PriceMeterProps> = ({
  currentPrice,
  panicTarget,
  baseTarget,
  bullTarget,
  locale = "zh",
}) => {
  const t = getTranslations(locale).priceMeter;
  const minM = Math.min(panicTarget * 0.88, currentPrice * 0.9);
  const maxM = Math.max(bullTarget * 1.12, currentPrice * 1.1);

  const getPositionPct = (val: number) => {
    if (maxM === minM) return 50;
    const pct = ((val - minM) / (maxM - minM)) * 100;
    return Math.max(6, Math.min(94, pct));
  };

  const currentPct = getPositionPct(currentPrice);
  const panicPct = getPositionPct(panicTarget);
  const basePct = getPositionPct(baseTarget);
  const bullPct = getPositionPct(bullTarget);

  return (
    <div className="w-full rounded-xl p-4 glass-panel-subtle border border-white/[0.08] shadow-inner flex flex-col gap-3">
      {/* Title & Current Price Badge */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300 tracking-wide">
          {t.title}
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-mono text-[11px] font-bold tabular-nums">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>{t.current}: {formatCurrency(currentPrice)}</span>
        </div>
      </div>

      {/* Visual Meter Bar */}
      <div className="relative pt-7 pb-6 select-none">
        {/* Track Bar with Smooth Multi-Stop Gradient */}
        <div className="h-2.5 w-full rounded-full bg-surface-3 relative overflow-hidden shadow-inner ring-1 ring-white/10">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "linear-gradient(90deg, #f43f5e 0%, #f59e0b 35%, #38bdf8 65%, #10b981 100%)",
            }}
          />
        </div>

        {/* Current Price Pin (Floating Above Track) */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-20 pointer-events-none"
          style={{ left: `${currentPct}%` }}
        >
          <div className="px-2 py-0.5 rounded-md bg-accent text-slate-950 font-mono text-[11px] font-black shadow-lg shadow-accent/50 whitespace-nowrap ring-1 ring-white/30 tabular-nums">
            {formatCurrency(currentPrice, 0)}
          </div>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-accent" />
          <div className="w-1 h-3 bg-white rounded-full shadow-sm -mt-0.5" />
        </div>

        {/* Regime Target Markers (Below Track) */}
        {/* Panic Marker */}
        <div
          className="absolute top-8 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
          style={{ left: `${panicPct}%` }}
        >
          <div className="w-0.5 h-2 bg-fintech-red/80 -mt-1 mb-1" />
          <span className="text-[10px] font-mono text-fintech-red font-bold tabular-nums px-1 py-0.2 rounded bg-fintech-redGlow/20 border border-fintech-red/40 whitespace-nowrap">
            {formatCurrency(panicTarget, 0)}
          </span>
        </div>

        {/* Base Marker */}
        <div
          className="absolute top-8 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
          style={{ left: `${basePct}%` }}
        >
          <div className="w-0.5 h-2 bg-slate-300/80 -mt-1 mb-1" />
          <span className="text-[10px] font-mono text-slate-200 font-bold tabular-nums px-1 py-0.2 rounded bg-surface-2 border border-white/[0.1] whitespace-nowrap">
            {formatCurrency(baseTarget, 0)}
          </span>
        </div>

        {/* Bull Marker */}
        <div
          className="absolute top-8 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
          style={{ left: `${bullPct}%` }}
        >
          <div className="w-0.5 h-2 bg-fintech-green/80 -mt-1 mb-1" />
          <span className="text-[10px] font-mono text-fintech-green font-bold tabular-nums px-1 py-0.2 rounded bg-fintech-greenGlow/20 border border-fintech-green/40 whitespace-nowrap">
            {formatCurrency(bullTarget, 0)}
          </span>
        </div>
      </div>

      {/* Bottom Regime Labels */}
      <div className="grid grid-cols-3 text-[11px] font-mono text-slate-400 pt-1 border-t border-white/[0.06]">
        <div className="flex items-center gap-1 text-fintech-red font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-fintech-red" />
          <span className="truncate">{t.panicFloor}</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-slate-300 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span className="truncate">{t.base}</span>
        </div>
        <div className="flex items-center justify-end gap-1 text-fintech-green font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-fintech-green" />
          <span className="truncate">{t.bullRegime}</span>
        </div>
      </div>
    </div>
  );
};
