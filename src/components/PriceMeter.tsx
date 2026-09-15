"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";

interface PriceMeterProps {
  currentPrice: number;
  panicTarget: number;
  baseTarget: number;
  bullTarget: number;
  locale?: "en" | "zh";
}

export const PriceMeter: React.FC<PriceMeterProps> = ({
  currentPrice,
  panicTarget,
  baseTarget,
  bullTarget,
  locale = "zh",
}) => {
  const isZh = locale === "zh";
  const minM = Math.min(panicTarget * 0.88, currentPrice * 0.9);
  const maxM = Math.max(bullTarget * 1.12, currentPrice * 1.1);

  const getPositionPct = (val: number) => {
    if (maxM === minM) return 50;
    const pct = ((val - minM) / (maxM - minM)) * 100;
    return Math.max(4, Math.min(96, pct));
  };

  const currentPct = getPositionPct(currentPrice);
  const panicPct = getPositionPct(panicTarget);
  const basePct = getPositionPct(baseTarget);
  const bullPct = getPositionPct(bullTarget);

  return (
    <div className="w-full bg-surface-1 rounded-xl p-3.5 border border-border">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-semibold text-slate-300">
          {isZh ? "估值区间标尺" : "Valuation Meter"}
        </span>
        <span className="text-slate-400 font-mono text-[11px]">
          {isZh ? "现价" : "Current"}: <strong className="text-accent">{formatCurrency(currentPrice)}</strong>
        </span>
      </div>

      <div className="relative pt-6 pb-2">
        {/* Track Bar with Gradient */}
        <div className="h-2 w-full rounded-full bg-surface-3 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background:
                "linear-gradient(90deg, #f43f5e 0%, #f59e0b 35%, #38bdf8 65%, #10b981 100%)",
            }}
          />
        </div>

        {/* Panic Marker */}
        <div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${panicPct}%` }}
        >
          <span className="text-[10px] font-mono text-fintech-red font-semibold">
            {formatCurrency(panicTarget, 0)}
          </span>
          <div className="w-1 h-2 bg-fintech-red rounded-full mt-0.5" />
        </div>

        {/* Base Marker */}
        <div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${basePct}%` }}
        >
          <span className="text-[10px] font-mono text-slate-300 font-semibold">
            {formatCurrency(baseTarget, 0)}
          </span>
          <div className="w-1 h-2 bg-slate-300 rounded-full mt-0.5" />
        </div>

        {/* Bull Marker */}
        <div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${bullPct}%` }}
        >
          <span className="text-[10px] font-mono text-fintech-green font-semibold">
            {formatCurrency(bullTarget, 0)}
          </span>
          <div className="w-1 h-2 bg-fintech-green rounded-full mt-0.5" />
        </div>

        {/* Current Price Pin */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 pointer-events-none"
          style={{ left: `${currentPct}%` }}
        >
          <div className="px-1.5 py-0.5 rounded bg-accent text-slate-950 font-mono text-[10px] font-bold shadow-md shadow-accent/40 whitespace-nowrap">
            {formatCurrency(currentPrice, 0)}
          </div>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-accent" />
          <div className="w-1.5 h-3 bg-white rounded-full shadow" />
        </div>
      </div>

      <div className="grid grid-cols-3 text-[11px] font-mono text-slate-400 mt-1">
        <span className="text-fintech-red font-medium text-left">
          {isZh ? "🚨 恐慌底价" : "🚨 Panic Floor"}
        </span>
        <span className="text-slate-300 font-medium text-center">
          {isZh ? "⚖️ 基准目标" : "⚖️ Base"}: {formatCurrency(baseTarget, 0)}
        </span>
        <span className="text-fintech-green font-medium text-right">
          {isZh ? "🐂 牛市目标" : "🐂 Bull Regime"}
        </span>
      </div>
    </div>
  );
};
