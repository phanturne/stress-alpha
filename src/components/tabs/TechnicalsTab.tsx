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
  currentPe?: number;
  operatingEps?: number;
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
  currentPe,
  operatingEps,
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
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Workspace Header & High-Level Telemetry */}
      <div className="glass-panel shadow-xs flex flex-col gap-3 rounded-2xl border border-border p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="shadow-xs flex size-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 text-accent sm:size-9">
              <Compass className="size-4 sm:size-4.5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm font-bold text-foreground sm:text-base">
                  {tt.title}
                </h2>
                <span className="py-0.2 rounded-md border border-accent/30 bg-accent/10 px-1.5 font-mono text-[11px] font-bold text-accent sm:text-xs">
                  {ticker}
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-300">
                  {formatCurrency(activePrice, 2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{tt.subtitle}</p>
            </div>
          </div>

          {/* Trend Status Pill */}
          {isBullishTrend !== null && (
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                isBullishTrend
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                  : "border-amber-500/30 bg-amber-950/20 text-amber-400"
              }`}
            >
              {isBullishTrend ? (
                <TrendingUp className="size-3.5 shrink-0 text-emerald-400" />
              ) : (
                <TrendingDown className="size-3.5 shrink-0 text-amber-400" />
              )}
              <span>{isBullishTrend ? tt.trendBullish : tt.trendBearish}</span>
            </div>
          )}
        </div>

        {/* 5-KPI Metric Badges (Compact 1-row telemetry) */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {/* Current P/E */}
          <div
            className="flex flex-col rounded-xl border border-border/60 bg-surface-1/70 p-2 sm:p-2.5"
            title={
              currentPe && currentPe > 0
                ? tt.currentPeTooltip
                : operatingEps !== undefined && operatingEps <= 0
                  ? tt.currentPeLossTooltip
                  : tt.currentPeTooltip
            }
          >
            <span className="text-[10px] font-medium text-slate-400 sm:text-[11px]">
              {tt.currentPeBadge}
            </span>
            <span
              className={`mt-0.5 font-mono text-xs font-bold tabular-nums sm:text-sm ${
                currentPe && currentPe > 0 ? "text-foreground" : "text-rose-400"
              }`}
            >
              {currentPe && currentPe > 0
                ? `${currentPe.toFixed(1)}x`
                : operatingEps !== undefined && operatingEps <= 0
                  ? tt.currentPeLoss
                  : "—"}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {currentPe && currentPe > 0
                ? tt.currentPeSubtext
                : operatingEps !== undefined && operatingEps <= 0
                  ? operatingEps < 0
                    ? `-$${Math.abs(operatingEps).toFixed(2)} EPS`
                    : tt.currentPeLossSubtext
                  : tt.currentPeSubtext}
            </span>
          </div>

          {/* 50-Day SMA */}
          <div className="flex flex-col rounded-xl border border-border/60 bg-surface-1/70 p-2 sm:p-2.5">
            <span className="text-[10px] font-medium text-slate-400 sm:text-[11px]">
              {tt.sma50Badge}
            </span>
            <span className="mt-0.5 font-mono text-xs font-bold tabular-nums text-foreground sm:text-sm">
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
                % {tt.fromPrice}
              </span>
            )}
          </div>

          {/* 200-Day SMA */}
          <div className="flex flex-col rounded-xl border border-border/60 bg-surface-1/70 p-2 sm:p-2.5">
            <span className="text-[10px] font-medium text-slate-400 sm:text-[11px]">
              {tt.sma200Badge}
            </span>
            <span className="mt-0.5 font-mono text-xs font-bold tabular-nums text-foreground sm:text-sm">
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
                % {tt.fromPrice}
              </span>
            )}
          </div>

          {/* 52-Week High & Low */}
          <div className="flex flex-col rounded-xl border border-border/60 bg-surface-1/70 p-2 sm:p-2.5">
            <span className="text-[10px] font-medium text-slate-400 sm:text-[11px]">
              {tt.range52WBadge}
            </span>
            <div className="mt-0.5 flex items-center justify-between font-mono text-[11px] font-semibold tabular-nums sm:text-xs">
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
          <div className="flex flex-col rounded-xl border border-border/60 bg-surface-1/70 p-2 sm:p-2.5">
            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 sm:text-[11px]">
              <BarChart2 className="size-3 text-accent" />
              <span>{tt.volumePoc}</span>
            </span>
            <span className="mt-0.5 font-mono text-xs font-bold tabular-nums text-foreground sm:text-sm">
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
      <div className="glass-panel shadow-xs flex flex-col gap-3 rounded-2xl border border-border p-3.5 sm:p-5">
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
