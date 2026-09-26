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
    return Math.max(8, Math.min(92, pct));
  };

  const currentPct = getPositionPct(currentPrice);
  const panicPct = getPositionPct(panicTarget);
  const basePct = getPositionPct(baseTarget);
  const bullPct = getPositionPct(bullTarget);

  return (
    <div className="glass-panel-subtle flex w-full flex-col gap-3 rounded-xl border border-white/[0.08] p-4 shadow-inner">
      {/* Title & Current Price Badge */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold tracking-wide text-slate-300">
          {t.title}
        </span>
        <div className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-accent">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
          <span>
            {t.current}: {formatCurrency(currentPrice)}
          </span>
        </div>
      </div>

      {/* Visual Meter Bar */}
      <div className="relative select-none pb-6 pt-7">
        {/* Track Bar with Smooth Multi-Stop Gradient */}
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-3 shadow-inner ring-1 ring-white/10">
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
          className="pointer-events-none absolute top-0 z-20 flex -translate-x-1/2 flex-col items-center transition-all duration-300"
          style={{ left: `${currentPct}%` }}
        >
          <div className="whitespace-nowrap rounded-md bg-accent px-2 py-0.5 font-mono text-[11px] font-black tabular-nums text-slate-950 shadow-lg shadow-accent/50 ring-1 ring-white/30">
            {formatCurrency(currentPrice, 0)}
          </div>
          <div className="size-0 border-x-4 border-t-[5px] border-x-transparent border-t-accent" />
          <div className="-mt-0.5 h-3 w-1 rounded-full bg-white shadow-sm" />
        </div>

        {/* Regime Target Markers (Below Track) */}
        {/* Panic Marker */}
        <div
          className="pointer-events-none absolute top-8 z-10 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${panicPct}%` }}
        >
          <div className="-mt-1 mb-1 h-2 w-0.5 bg-fintech-red/80" />
          <span className="bg-fintech-redGlow/20 whitespace-nowrap rounded border border-fintech-red/40 px-1 py-0.5 font-mono text-[10px] font-bold tabular-nums text-fintech-red">
            {formatCurrency(panicTarget, 0)}
          </span>
        </div>

        {/* Base Marker */}
        <div
          className="pointer-events-none absolute top-8 z-10 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${basePct}%` }}
        >
          <div className="-mt-1 mb-1 h-2 w-0.5 bg-slate-300/80" />
          <span className="whitespace-nowrap rounded border border-white/[0.1] bg-surface-2 px-1 py-0.5 font-mono text-[10px] font-bold tabular-nums text-slate-200">
            {formatCurrency(baseTarget, 0)}
          </span>
        </div>

        {/* Bull Marker */}
        <div
          className="pointer-events-none absolute top-8 z-10 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${bullPct}%` }}
        >
          <div className="-mt-1 mb-1 h-2 w-0.5 bg-fintech-green/80" />
          <span className="bg-fintech-greenGlow/20 whitespace-nowrap rounded border border-fintech-green/40 px-1 py-0.5 font-mono text-[10px] font-bold tabular-nums text-fintech-green">
            {formatCurrency(bullTarget, 0)}
          </span>
        </div>
      </div>

      {/* Bottom Regime Labels */}
      <div className="grid grid-cols-3 border-t border-white/[0.06] pt-1 font-mono text-[11px] text-slate-400">
        <div className="flex items-center gap-1 font-semibold text-fintech-red">
          <span className="size-1.5 rounded-full bg-fintech-red" />
          <span className="truncate">{t.panicFloor}</span>
        </div>
        <div className="flex items-center justify-center gap-1 font-semibold text-slate-300">
          <span className="size-1.5 rounded-full bg-slate-400" />
          <span className="truncate">{t.base}</span>
        </div>
        <div className="flex items-center justify-end gap-1 font-semibold text-fintech-green">
          <span className="size-1.5 rounded-full bg-fintech-green" />
          <span className="truncate">{t.bullRegime}</span>
        </div>
      </div>
    </div>
  );
};
