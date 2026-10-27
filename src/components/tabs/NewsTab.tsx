"use client";

import React, { useState, useMemo } from "react";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Filter,
  Layers,
  Sparkles,
  BarChart3,
  FileText,
  Clock,
  ArrowRight,
  Radio,
} from "lucide-react";
import type { MarketEvent, UpstreamDependency } from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";

function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "number" ? val : parseFloat(String(val));
  return isNaN(num) ? null : num;
}

function formatDate(dateVal: unknown): string {
  if (!dateVal) return "";
  const str = String(dateVal);
  return str.split("T")[0] || str;
}

export interface NewsTabProps {
  ticker?: string;
  events?: MarketEvent[];
  upstreamDependencies?: UpstreamDependency[];
  currentPrice?: number;
  locale?: Locale;
  onSimulateShock?: (driverId: string, shockPct: number) => void;
  onSimulateGrossMarginDelta?: (bps: number) => void;
  onSimulateCatalystProb?: (catalystId: string, prob: number) => void;
  onNavigateToModel?: () => void;
}

export const NewsTab: React.FC<NewsTabProps> = ({
  ticker,
  events = [],
  upstreamDependencies = [],
  currentPrice,
  locale = "zh",
  onSimulateShock,
  onSimulateGrossMarginDelta,
  onSimulateCatalystProb,
  onNavigateToModel,
}) => {
  const t = getTranslations(locale).newsTab;
  const [filterType, setFilterType] = useState<
    "all" | "upstream" | "product" | "analyst" | "sec"
  >("all");

  const filteredEvents = useMemo(() => {
    if (filterType === "all") return events;
    return events.filter((evt) => {
      if (filterType === "upstream") {
        return (
          evt.eventType === "upstream_earnings" ||
          evt.transmissionType === "driver_shock"
        );
      }
      if (filterType === "product") {
        return (
          evt.eventType === "product_release" ||
          evt.transmissionType === "catalyst_prob"
        );
      }
      if (filterType === "analyst") {
        return (
          evt.eventType === "analyst_rating" ||
          evt.transmissionType === "qpce_skew"
        );
      }
      if (filterType === "sec") {
        return evt.eventType === "sec_filing";
      }
      return true;
    });
  }, [events, filterType]);

  const latestPulseEvent = useMemo(() => {
    if (!events || events.length === 0) return null;
    return (
      events.find((e) => e.transmissionType !== "none") || events[0] || null
    );
  }, [events]);

  const handleSimulate = (event: MarketEvent) => {
    const payload = event.transmissionPayload;
    if (!payload) return;

    let simulated = false;

    if (payload.driverId && payload.deltaShockPct !== undefined) {
      onSimulateShock?.(payload.driverId, payload.deltaShockPct);
      simulated = true;
    }
    if (payload.grossMarginBpsDelta !== undefined) {
      onSimulateGrossMarginDelta?.(payload.grossMarginBpsDelta);
      simulated = true;
    } else if (payload.segmentDeltaGrowthPct !== undefined) {
      // Map segment growth outlook into gross margin bps (e.g. +5% -> +100 bps)
      onSimulateGrossMarginDelta?.(payload.segmentDeltaGrowthPct * 20);
      simulated = true;
    }
    if (payload.catalystId && payload.newProbability !== undefined) {
      onSimulateCatalystProb?.(payload.catalystId, payload.newProbability);
      simulated = true;
    } else if (event.transmissionType === "catalyst_prob") {
      onSimulateCatalystProb?.("catalyst", payload.newProbability ?? 0.75);
      simulated = true;
    }

    if (simulated) {
      onNavigateToModel?.();
    }
  };

  const renderChannelBadge = (type: string) => {
    switch (type) {
      case "driver_shock":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
            <Zap className="size-3" />
            {t.channels.driverShock}
          </span>
        );
      case "catalyst_prob":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-indigo-400">
            <Sparkles className="size-3" />
            {t.channels.catalystProb}
          </span>
        );
      case "qpce_skew":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-amber-400">
            <BarChart3 className="size-3" />
            {t.channels.qpceSkew}
          </span>
        );
      case "segment_growth":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-400">
            <Layers className="size-3" />
            {t.channels.segmentGrowth}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-300">
            <FileText className="size-3" />
            {t.channels.none}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Workspace Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-accent" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 sm:text-base">
              {t.title}
            </h3>
            {ticker && (
              <span className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs font-bold text-slate-200">
                {ticker}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">{t.subtitle}</p>
        </div>

        {/* Filter Pills */}
        <div className="shadow-xs flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface-1/90 p-1">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-all ${
              filterType === "all"
                ? "shadow-xs border border-border bg-surface-2 font-bold text-foreground"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.allFilter} ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("upstream")}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-all ${
              filterType === "upstream"
                ? "shadow-xs border border-emerald-500/30 bg-surface-2 font-bold text-emerald-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.upstreamFilter}
          </button>
          <button
            type="button"
            onClick={() => setFilterType("product")}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-all ${
              filterType === "product"
                ? "shadow-xs border border-sky-500/30 bg-surface-2 font-bold text-sky-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.productFilter}
          </button>
          <button
            type="button"
            onClick={() => setFilterType("analyst")}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-all ${
              filterType === "analyst"
                ? "shadow-xs border border-amber-500/30 bg-surface-2 font-bold text-amber-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.analystFilter}
          </button>
          <button
            type="button"
            onClick={() => setFilterType("sec")}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-all ${
              filterType === "sec"
                ? "shadow-xs border border-rose-500/30 bg-surface-2 font-bold text-rose-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.secFilter}
          </button>
        </div>
      </div>

      {/* Hero: Latest Market Pulse Banner */}
      {latestPulseEvent && (
        <div className="shadow-xs relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-surface-1/95 via-surface-2/90 to-accent/5 p-5 backdrop-blur-xl sm:p-6">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 size-48 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-2 animate-ping rounded-full bg-accent" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
                  {t.latestPulse}
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-mono text-xs text-slate-400">
                  {latestPulseEvent.publisher}
                </span>
                <span className="text-slate-400">•</span>
                <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
                  <Clock className="size-3" />
                  {formatDate(latestPulseEvent.publishedAt)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const priceMove = parseNumber(latestPulseEvent.priceMovePct);
                  if (priceMove === null) return null;
                  const isPositive = priceMove >= 0;
                  return (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                        isPositive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="size-3" />
                      ) : (
                        <TrendingDown className="size-3" />
                      )}
                      {t.priceReaction}: {isPositive ? "+" : ""}
                      {priceMove.toFixed(2)}%
                    </span>
                  );
                })()}
                {(() => {
                  const sigma = parseNumber(
                    latestPulseEvent.abnormalReturnSigma
                  );
                  if (sigma === null) return null;
                  return (
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-400">
                      {sigma.toFixed(1)}σ
                    </span>
                  );
                })()}
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold leading-snug text-foreground sm:text-lg">
                {latestPulseEvent.title}
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
                {latestPulseEvent.summary}
              </p>
            </div>

            {/* Transmission Vector Card */}
            <div className="mt-1 flex flex-col gap-3 rounded-xl border border-border bg-surface-0/80 p-4 shadow-inner sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {renderChannelBadge(latestPulseEvent.transmissionType)}

                {latestPulseEvent.transmissionPayload?.driverId && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                    <span className="text-slate-400">Driver:</span>
                    <span className="font-semibold text-foreground">
                      {latestPulseEvent.transmissionPayload.driverId}
                    </span>
                    {(() => {
                      const deltaShock = parseNumber(
                        latestPulseEvent.transmissionPayload.deltaShockPct
                      );
                      if (deltaShock === null) return null;
                      return (
                        <span className="font-bold text-emerald-400">
                          ({deltaShock > 0 ? "+" : ""}
                          {deltaShock}%)
                        </span>
                      );
                    })()}
                  </div>
                )}

                {(() => {
                  const wfvImpact = parseNumber(
                    latestPulseEvent.impliedWfvImpactPct
                  );
                  if (wfvImpact === null) return null;
                  return (
                    <div className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/15 px-2.5 py-1 font-mono text-xs font-bold text-accent">
                      <span>{t.wfvImpact}:</span>
                      <span>
                        {wfvImpact >= 0 ? "+" : ""}
                        {wfvImpact.toFixed(2)}%
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {latestPulseEvent.transmissionPayload && (
                  <button
                    type="button"
                    onClick={() => handleSimulate(latestPulseEvent)}
                    className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 font-mono text-xs font-bold text-surface-0 shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 active:scale-95"
                    title={t.simulateTooltip}
                  >
                    <Sliders className="size-3.5" />
                    <span>{t.simulateButton}</span>
                  </button>
                )}

                {latestPulseEvent.sourceUrl && (
                  <a
                    href={latestPulseEvent.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-border bg-surface-2/90 px-3 py-1.5 font-mono text-xs font-medium text-slate-300 transition-all hover:border-accent/40 hover:text-foreground"
                  >
                    <span>{t.viewSource}</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upstream Supply Chain Dependencies Strip (if available) */}
      {upstreamDependencies.length > 0 && (
        <div className="shadow-xs rounded-xl border border-border bg-surface-1/80 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Layers className="size-3.5 text-accent" />
            <span>
              Cross-Company Supply Chain Dependencies (
              {upstreamDependencies.length})
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {upstreamDependencies.map((dep, i) => (
              <div
                key={dep.id || i}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-2/60 p-2.5 font-mono text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-accent">
                      {dep.sourceTicker}
                    </span>
                    <ArrowRight className="size-3 text-slate-400" />
                    <span className="font-bold text-foreground">
                      {dep.targetTicker}
                    </span>
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {dep.driverName || dep.driverId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-200">
                    {parseNumber(dep.exposureShare) !== null
                      ? `${(parseNumber(dep.exposureShare)! * 100).toFixed(0)}% Exp`
                      : "0% Exp"}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {parseNumber(dep.elasticity) !== null
                      ? `${parseNumber(dep.elasticity)!.toFixed(2)}x Elas`
                      : "0.00x Elas"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline of All Filtered Events */}
      <div className="flex flex-col gap-3">
        {filteredEvents.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-sm text-slate-400">
            {t.empty}
          </div>
        ) : (
          filteredEvents.map((event) => {
            const hasTransmission =
              event.transmissionType && event.transmissionType !== "none";

            return (
              <div
                key={event.id}
                className="shadow-xs group relative flex flex-col gap-2.5 rounded-xl border border-border bg-surface-1/90 p-4 transition-all hover:border-accent/40 hover:bg-surface-2/95"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {renderChannelBadge(event.transmissionType)}
                    <span className="font-mono text-xs font-semibold text-slate-300">
                      {event.publisher}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
                      <Clock className="size-3" />
                      {formatDate(event.publishedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const priceMove = parseNumber(event.priceMovePct);
                      if (priceMove === null) return null;
                      const isPositive = priceMove >= 0;
                      return (
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                            isPositive
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {priceMove.toFixed(2)}%
                        </span>
                      );
                    })()}

                    {(() => {
                      const wfvImpact = parseNumber(event.impliedWfvImpactPct);
                      if (wfvImpact === null) return null;
                      return (
                        <span className="rounded border border-accent/30 bg-accent/15 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                          {wfvImpact >= 0 ? "+" : ""}
                          {wfvImpact.toFixed(2)}% WFV
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-foreground group-hover:text-accent">
                    {event.title}
                  </h5>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {event.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="font-mono text-[11px] text-slate-400">
                    {event.transmissionPayload?.rationale && (
                      <span>{event.transmissionPayload.rationale}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hasTransmission && (
                      <button
                        type="button"
                        onClick={() => handleSimulate(event)}
                        className="flex items-center gap-1 rounded border border-accent/30 bg-accent/10 px-2 py-1 font-mono text-[11px] font-bold text-accent transition-all hover:bg-accent hover:text-surface-0"
                      >
                        <Sliders className="size-3" />
                        <span>{t.simulateButton}</span>
                      </button>
                    )}

                    {event.sourceUrl && (
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-foreground"
                      >
                        <span>{t.viewSource}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
