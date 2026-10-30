"use client";

import React from "react";
import {
  Compass,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Anchor,
  Layers,
} from "lucide-react";
import type { TechnicalLevelsPayload } from "@/lib/schemas";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";
import { TradingViewChart } from "@/components/TradingViewChart";
import { TechnicalLevelsCard } from "@/components/TechnicalLevelsCard";

interface TechnicalsTabProps {
  ticker: string;
  currentPrice: number;
  technicalLevels?: TechnicalLevelsPayload;
  valuation?: {
    panic?: number;
    bear?: number;
    base?: number;
    bull?: number;
  };
  locale?: Locale;
}

export const TechnicalsTab: React.FC<TechnicalsTabProps> = ({
  ticker,
  currentPrice,
  technicalLevels,
  valuation,
  locale = "zh",
}) => {
  const t = getTranslations(locale);
  const tt = t.technicalsTab;

  const activePrice =
    currentPrice > 0 ? currentPrice : (technicalLevels?.currentPrice ?? 0);

  // Trend determination based on 200-Day SMA
  const sma200 = technicalLevels?.sma200;
  const isBullishTrend = sma200 ? activePrice >= sma200 : null;

  // 52-Week Range distances
  const high52 = technicalLevels?.high52;
  const low52 = technicalLevels?.low52;
  const distFromHigh =
    high52 && activePrice > 0
      ? (((activePrice - high52) / high52) * 100).toFixed(1)
      : null;
  const distFromLow =
    low52 && activePrice > 0
      ? (((activePrice - low52) / low52) * 100).toFixed(1)
      : null;

  // Volume POC and Anchored VWAP from levels array
  const volumePocItem = technicalLevels?.levels?.find(
    (l) => l.id === "volume_poc"
  );
  const avwapHighItem = technicalLevels?.levels?.find(
    (l) => l.id === "avwap_high"
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Workspace Header & High-Level Telemetry */}
      <div className="glass-panel shadow-xs flex flex-col gap-4 rounded-2xl border border-border p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="shadow-xs flex size-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/15 text-accent">
              <Compass className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground sm:text-lg">
                  {tt.title}
                </h2>
                <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-xs font-bold text-accent">
                  {ticker}
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-300">
                  {formatCurrency(activePrice, 2)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{tt.subtitle}</p>
            </div>
          </div>

          {/* Trend Status Pill */}
          {isBullishTrend !== null && (
            <div
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                isBullishTrend
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                  : "border-amber-500/30 bg-amber-950/20 text-amber-400"
              }`}
            >
              {isBullishTrend ? (
                <TrendingUp className="size-4 shrink-0 text-emerald-400" />
              ) : (
                <TrendingDown className="size-4 shrink-0 text-amber-400" />
              )}
              <span>{isBullishTrend ? tt.trendBullish : tt.trendBearish}</span>
            </div>
          )}
        </div>

        {/* 4-KPI Metric Badges */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* 50-Day SMA */}
          <div className="flex flex-col rounded-xl border border-border/60 bg-surface-1/70 p-3">
            <span className="text-[11px] font-medium text-slate-400">
              50-Day SMA
            </span>
            <span className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">
              {technicalLevels?.sma50
                ? formatCurrency(technicalLevels.sma50, 2)
                : "—"}
            </span>
            {technicalLevels?.sma50 && activePrice > 0 && (
              <span className="font-mono text-[10px] text-slate-400">
                {(
                  ((activePrice - technicalLevels.sma50) /
                    technicalLevels.sma50) *
                  100
                ).toFixed(1)}
                % from price
              </span>
            )}
          </div>

          {/* 200-Day SMA */}
          <div className="flex flex-col rounded-xl border border-border/60 bg-surface-1/70 p-3">
            <span className="text-[11px] font-medium text-slate-400">
              200-Day SMA
            </span>
            <span className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">
              {technicalLevels?.sma200
                ? formatCurrency(technicalLevels.sma200, 2)
                : "—"}
            </span>
            {technicalLevels?.sma200 && activePrice > 0 && (
              <span className="font-mono text-[10px] text-slate-400">
                {(
                  ((activePrice - technicalLevels.sma200) /
                    technicalLevels.sma200) *
                  100
                ).toFixed(1)}
                % from price
              </span>
            )}
          </div>

          {/* 52-Week High & Low */}
          <div className="flex flex-col rounded-xl border border-border/60 bg-surface-1/70 p-3">
            <span className="text-[11px] font-medium text-slate-400">
              52-Week Range
            </span>
            <div className="mt-1 flex items-center justify-between font-mono text-xs font-semibold tabular-nums">
              <span className="text-cyan-400">
                L: {low52 ? formatCurrency(low52, 2) : "—"}
              </span>
              <span className="text-amber-400">
                H: {high52 ? formatCurrency(high52, 2) : "—"}
              </span>
            </div>
            {distFromHigh && (
              <span className="font-mono text-[10px] text-slate-400">
                {distFromHigh}% {tt.distanceTo52WHigh}
              </span>
            )}
          </div>

          {/* 1-Year Volume POC / AVWAP */}
          <div className="flex flex-col rounded-xl border border-border/60 bg-surface-1/70 p-3">
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <BarChart2 className="size-3 text-accent" />
              <span>{tt.volumePoc}</span>
            </span>
            <span className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">
              {volumePocItem ? formatCurrency(volumePocItem.price, 2) : "—"}
            </span>
            {avwapHighItem && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                <Anchor className="size-2.5 text-slate-400" />
                <span>AVWAP: {formatCurrency(avwapHighItem.price, 2)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Candlestick Chart (TradingView) */}
      <div className="glass-panel shadow-xs flex flex-col gap-3 rounded-2xl border border-border p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200 sm:text-sm">
              {tt.chartCardTitle}
            </h3>
            <p className="text-[11px] text-slate-400 sm:text-xs">
              {tt.chartCardSubtitle}
            </p>
          </div>
        </div>

        <TradingViewChart ticker={ticker} locale={locale} />
      </div>

      {/* Full 3-Tier Price Corridors & Confluence Engine */}
      {technicalLevels && (
        <TechnicalLevelsCard
          technicalLevels={technicalLevels}
          currentPrice={activePrice}
          valuation={valuation}
          locale={locale}
          compact={false}
        />
      )}
    </div>
  );
};
