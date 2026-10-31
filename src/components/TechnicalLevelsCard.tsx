"use client";

import React, { useState, useMemo } from "react";
import {
  Zap,
  Shield,
  Flame,
  Compass,
  Layers,
  ListFilter,
  ArrowRight,
  CandlestickChart,
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";
import type { TechnicalLevelsPayload, TechnicalLevelItem } from "@/lib/schemas";
import {
  findConfluenceSignals,
  synthesizePriceCorridors,
} from "@/lib/technical";

interface TechnicalLevelsCardProps {
  technicalLevels?: TechnicalLevelsPayload;
  currentPrice?: number;
  valuation?: {
    panic?: number;
    bear?: number;
    base?: number;
    bull?: number;
  };
  locale?: Locale;
  compact?: boolean;
  onOpenTechnicals?: () => void;
}

export const TechnicalLevelsCard: React.FC<TechnicalLevelsCardProps> = ({
  technicalLevels,
  currentPrice: propCurrentPrice,
  valuation,
  locale = "zh",
  compact = false,
  onOpenTechnicals,
}) => {
  const t = getTranslations(locale).technicalLevels;
  const [viewMode, setViewMode] = useState<"corridors" | "all">("corridors");

  const activePrice =
    propCurrentPrice && propCurrentPrice > 0
      ? propCurrentPrice
      : (technicalLevels?.currentPrice ?? 0);

  const confluenceSignals = useMemo(() => {
    if (!technicalLevels || !valuation) return [];
    return findConfluenceSignals(technicalLevels, valuation, locale);
  }, [technicalLevels, valuation, locale]);

  // 3-Tier Institutional Price Corridors (Immediate, Structural, Macro)
  const corridors = useMemo(() => {
    if (!technicalLevels) return { supports: [], resistances: [] };
    return synthesizePriceCorridors(technicalLevels, activePrice, locale);
  }, [technicalLevels, activePrice, locale]);

  // Dynamically compute active distance delta and classify strictly by active price for detailed view
  const { supports, resistances } = useMemo(() => {
    if (!technicalLevels?.levels) return { supports: [], resistances: [] };

    const processed = technicalLevels.levels.map((lvl) => {
      const deltaPct =
        activePrice > 0
          ? Number((((lvl.price - activePrice) / activePrice) * 100).toFixed(1))
          : lvl.deltaPct;
      return {
        ...lvl,
        activeDeltaPct: deltaPct,
      };
    });

    // Support: strictly below activePrice, sorted descending (closest to price at top)
    const sup = processed
      .filter((l) =>
        activePrice > 0 ? l.price < activePrice : l.type === "support"
      )
      .sort((a, b) => b.price - a.price);

    // Resistance: strictly above activePrice, sorted ascending (closest to price at top)
    const res = processed
      .filter((l) =>
        activePrice > 0 ? l.price > activePrice : l.type === "resistance"
      )
      .sort((a, b) => a.price - b.price);

    return { supports: sup, resistances: res };
  }, [technicalLevels, activePrice]);

  if (
    !technicalLevels ||
    !technicalLevels.levels ||
    technicalLevels.levels.length === 0
  ) {
    return null;
  }

  const getLocalizedLabel = (item: TechnicalLevelItem) => {
    return t.levelNames[item.id as keyof typeof t.levelNames] ?? item.label;
  };

  // Immediate levels for quick telemetry
  const immSup = corridors.supports[0];
  const immRes = corridors.resistances[0];

  // COMPACT VIEW: Rendered inside Cockpit's narrow Left Pane (~400px width)
  if (compact) {
    return (
      <div className="glass-panel shadow-xs flex flex-col gap-2.5 rounded-2xl border border-border p-3.5 sm:p-4">
        {/* Header with shortcut to full Technicals & Chart tab */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex min-w-0 items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            <Compass className="size-3.5 shrink-0 text-accent" />
            <span className="truncate">{t.compactSummary}</span>
          </div>

          {onOpenTechnicals && (
            <button
              type="button"
              onClick={onOpenTechnicals}
              className="hover:text-accent-bright flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-bold text-accent transition-colors hover:bg-accent/15"
              title={t.openChartTab}
            >
              <CandlestickChart className="size-3" />
              <span>{t.openFullAnalysis}</span>
            </button>
          )}
        </div>

        {/* Confluence Alert Pill (if technical level converges with fundamental regime) */}
        {confluenceSignals.length > 0 && (
          <div className="shadow-xs flex flex-col gap-1 rounded-xl border border-accent/40 bg-accent/10 p-2">
            <div className="flex items-center justify-between gap-1">
              <div className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] font-bold text-accent">
                <Zap className="size-3.5 shrink-0 animate-pulse text-accent" />
                <span className="truncate">{t.confluenceBadge}</span>
              </div>
              <span className="py-0.2 shrink-0 rounded-full bg-accent/20 px-1.5 font-mono text-[10px] font-bold text-accent">
                ±{confluenceSignals[0].divergencePct.toFixed(1)}%
              </span>
            </div>
            <p className="line-clamp-2 text-[11px] leading-tight text-slate-200">
              {confluenceSignals[0].description}
            </p>
          </div>
        )}

        {/* Immediate Corridor Telemetry Strip (Spot vs S1 / R1) */}
        <div className="grid grid-cols-3 items-center gap-1.5 rounded-xl border border-border/80 bg-surface-0/60 p-2 text-center font-mono">
          {/* Support S1 */}
          <div className="flex min-w-0 flex-col items-center">
            <span className="text-[10px] font-semibold text-cyan-400">
              {immSup ? immSup.id.toUpperCase() : "S1"}
            </span>
            <span className="truncate text-xs font-bold tabular-nums text-foreground">
              {immSup ? formatCurrency(immSup.range[0], 2) : "—"}
            </span>
            <span className="text-[10px] font-bold tabular-nums text-cyan-400">
              {immSup
                ? immSup.deltaPct < 0
                  ? `-${Math.abs(immSup.deltaPct).toFixed(1)}%`
                  : `${immSup.deltaPct.toFixed(1)}%`
                : ""}
            </span>
          </div>

          {/* Current Spot Price */}
          <div className="flex min-w-0 flex-col items-center border-x border-border/60 px-1">
            <span className="text-[10px] font-semibold text-slate-400">
              {t.spot}
            </span>
            <span className="truncate text-xs font-extrabold tabular-nums text-foreground">
              {formatCurrency(activePrice, 2)}
            </span>
            <span className="text-[10px] text-slate-400">●</span>
          </div>

          {/* Resistance R1 */}
          <div className="flex min-w-0 flex-col items-center">
            <span className="text-[10px] font-semibold text-amber-400">
              {immRes ? immRes.id.toUpperCase() : "R1"}
            </span>
            <span className="truncate text-xs font-bold tabular-nums text-foreground">
              {immRes ? formatCurrency(immRes.range[0], 2) : "—"}
            </span>
            <span className="text-[10px] font-bold tabular-nums text-amber-400">
              {immRes ? `+${Math.abs(immRes.deltaPct).toFixed(1)}%` : ""}
            </span>
          </div>
        </div>

        {/* 3-Tier Corridor Quick Rows (Clean, unclipped stacked presentation) */}
        <div className="flex flex-col gap-1.5">
          {corridors.supports.slice(0, 3).map((supTier, idx) => {
            const resTier = corridors.resistances[idx];
            const supRange =
              supTier.range[0] !== supTier.range[1]
                ? `${formatCurrency(supTier.range[0], 2)} – ${formatCurrency(supTier.range[1], 2)}`
                : formatCurrency(supTier.range[0], 2);
            const supDelta =
              supTier.deltaPct < 0
                ? `-${Math.abs(supTier.deltaPct).toFixed(1)}%`
                : `${supTier.deltaPct.toFixed(1)}%`;

            const resRange = resTier
              ? resTier.range[0] !== resTier.range[1]
                ? `${formatCurrency(resTier.range[0], 2)} – ${formatCurrency(resTier.range[1], 2)}`
                : formatCurrency(resTier.range[0], 2)
              : "—";
            const resDelta = resTier
              ? `+${Math.abs(resTier.deltaPct).toFixed(1)}%`
              : "";

            return (
              <div
                key={supTier.id}
                title={`${supTier.tierTitle}: ${supTier.rationale}${resTier ? ` | ${resTier.tierTitle}: ${resTier.rationale}` : ""}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-surface-1/60 px-2 py-1.5 font-mono text-xs transition-colors hover:border-border"
              >
                {/* Left: Support */}
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="py-0.2 shrink-0 rounded bg-cyan-500/20 px-1 text-[9px] font-bold uppercase text-cyan-300">
                    {supTier.id.toUpperCase()}
                  </span>
                  <span className="truncate text-[11px] font-semibold text-foreground">
                    {supRange}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold text-cyan-400">
                    {supDelta}
                  </span>
                </div>

                <span className="text-slate-400">|</span>

                {/* Right: Resistance */}
                <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                  {resTier && (
                    <>
                      <span className="py-0.2 shrink-0 rounded bg-amber-500/20 px-1 text-[9px] font-bold uppercase text-amber-300">
                        {resTier.id.toUpperCase()}
                      </span>
                      <span className="truncate text-[11px] font-semibold text-foreground">
                        {resRange}
                      </span>
                      <span className="shrink-0 text-[10px] font-bold text-amber-400">
                        {resDelta}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button to switch to Full Technicals Tab */}
        {onOpenTechnicals && (
          <button
            type="button"
            onClick={onOpenTechnicals}
            className="active:scale-98 flex w-full items-center justify-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 py-1.5 text-xs font-semibold text-accent transition-all hover:border-accent/50 hover:bg-accent/20"
          >
            <span>{t.openChartTab}</span>
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    );
  }

  // FULL VIEW: Rendered in Technicals Workspace Tab (full-width container)
  return (
    <div className="glass-panel shadow-xs flex flex-col gap-3 rounded-2xl border border-border p-4 sm:p-5">
      {/* Header with 3-Tier Corridor / All Levels Switcher */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex min-w-0 items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-200 sm:text-sm">
          <Compass className="size-4 shrink-0 text-accent" />
          <span className="truncate">
            {viewMode === "corridors" ? t.corridors.title : t.cardTitle}
          </span>
        </div>
        <div className="flex items-center rounded-lg border border-border bg-surface-2/60 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("corridors")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-all ${
              viewMode === "corridors"
                ? "shadow-xs bg-accent/20 font-bold text-accent ring-1 ring-accent/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="size-3.5" />
            <span>{t.corridors.viewCorridors}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-all ${
              viewMode === "all"
                ? "shadow-xs bg-accent/20 font-bold text-accent ring-1 ring-accent/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ListFilter className="size-3.5" />
            <span>{t.corridors.viewAllLevels}</span>
          </button>
        </div>
      </div>

      {/* Confluence Alert Banner (if technical level converges with fundamental regime) */}
      {confluenceSignals.length > 0 && (
        <div className="shadow-xs flex flex-col gap-1.5 rounded-xl border border-accent/40 bg-accent/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5 font-mono text-xs font-bold text-accent sm:text-sm">
              <Zap className="size-4 shrink-0 animate-pulse text-accent" />
              <span className="truncate">{t.confluenceBadge}</span>
            </div>
            <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-0.5 font-mono text-xs font-bold text-accent">
              ±{confluenceSignals[0].divergencePct.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-200 sm:text-[13px]">
            {confluenceSignals[0].description}
          </p>
          {confluenceSignals.length > 1 && (
            <div className="mt-1 border-t border-accent/20 pt-1.5 text-xs text-slate-300">
              {confluenceSignals.slice(1).map((s, idx) => (
                <div key={idx} className="truncate">
                  • {s.description}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: 3-TIER INSTITUTIONAL CORRIDORS (DEFAULT) */}
      {viewMode === "corridors" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Support Corridors (S1, S2, S3) */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-3 sm:p-3.5">
            <div className="flex items-center gap-1.5 border-b border-cyan-500/20 pb-2 font-mono text-xs font-bold text-cyan-400 sm:text-sm">
              <Shield className="size-3.5 shrink-0 text-cyan-400" />
              <span className="truncate">{t.supportTitle}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {corridors.supports.map((tier) => {
                const rangeStr =
                  tier.range[0] !== tier.range[1]
                    ? `${formatCurrency(tier.range[0], 2)} – ${formatCurrency(tier.range[1], 2)}`
                    : formatCurrency(tier.range[0], 2);
                const deltaStr =
                  tier.deltaPct < 0
                    ? `-${Math.abs(tier.deltaPct).toFixed(1)}%`
                    : `${tier.deltaPct.toFixed(1)}%`;

                return (
                  <div
                    key={tier.id}
                    className="shadow-xs flex flex-col gap-1 rounded-lg border border-cyan-500/15 bg-surface-1/90 p-2.5 transition-colors hover:border-cyan-500/30"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex min-w-0 items-center gap-1.5 font-mono text-xs font-bold text-cyan-300">
                        <span className="py-0.2 shrink-0 rounded bg-cyan-500/20 px-1.5 text-[10px] uppercase">
                          {tier.id.toUpperCase()}
                        </span>
                        <span className="truncate">{tier.tierTitle}</span>
                      </div>
                      <span className="py-0.2 shrink-0 rounded bg-cyan-500/15 px-1.5 font-mono text-xs font-bold tabular-nums text-cyan-400">
                        {deltaStr}
                      </span>
                    </div>
                    <div className="font-mono text-sm font-bold tabular-nums text-foreground sm:text-base">
                      {rangeStr}
                    </div>
                    <div className="text-[11px] leading-relaxed text-slate-400">
                      {tier.rationale}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resistance Corridors (R1, R2, R3) */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 sm:p-3.5">
            <div className="flex items-center gap-1.5 border-b border-amber-500/20 pb-2 font-mono text-xs font-bold text-amber-400 sm:text-sm">
              <Flame className="size-3.5 shrink-0 text-amber-400" />
              <span className="truncate">{t.resistanceTitle}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {corridors.resistances.map((tier) => {
                const rangeStr =
                  tier.range[0] !== tier.range[1]
                    ? `${formatCurrency(tier.range[0], 2)} – ${formatCurrency(tier.range[1], 2)}`
                    : formatCurrency(tier.range[0], 2);
                const deltaStr = `+${Math.abs(tier.deltaPct).toFixed(1)}%`;

                return (
                  <div
                    key={tier.id}
                    className="shadow-xs flex flex-col gap-1 rounded-lg border border-amber-500/15 bg-surface-1/90 p-2.5 transition-colors hover:border-amber-500/30"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex min-w-0 items-center gap-1.5 font-mono text-xs font-bold text-amber-300">
                        <span className="py-0.2 shrink-0 rounded bg-amber-500/20 px-1.5 text-[10px] uppercase">
                          {tier.id.toUpperCase()}
                        </span>
                        <span className="truncate">{tier.tierTitle}</span>
                      </div>
                      <span className="py-0.2 shrink-0 rounded bg-amber-500/15 px-1.5 font-mono text-xs font-bold tabular-nums text-amber-400">
                        {deltaStr}
                      </span>
                    </div>
                    <div className="font-mono text-sm font-bold tabular-nums text-foreground sm:text-base">
                      {rangeStr}
                    </div>
                    <div className="text-[11px] leading-relaxed text-slate-400">
                      {tier.rationale}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: ALL INDIVIDUAL LEVELS (DETAILED) */
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Support Column */}
          <div className="flex flex-col gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-3">
            <div className="flex items-center gap-1.5 border-b border-cyan-500/20 pb-2 font-mono text-xs font-bold text-cyan-400 sm:text-sm">
              <Shield className="size-3.5 shrink-0 text-cyan-400" />
              <span className="truncate">{t.supportTitle}</span>
            </div>
            <div className="custom-scrollbar flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1.5">
              {supports.map((lvl) => {
                const deltaStr =
                  lvl.activeDeltaPct < 0
                    ? `-${Math.abs(lvl.activeDeltaPct).toFixed(1)}%`
                    : `${lvl.activeDeltaPct.toFixed(1)}%`;
                const hasZone =
                  lvl.zoneRange && lvl.zoneRange[0] !== lvl.zoneRange[1];
                const priceDisplay = hasZone
                  ? `${formatCurrency(lvl.zoneRange![0], 2)} – ${formatCurrency(lvl.zoneRange![1], 2)}`
                  : formatCurrency(lvl.price, 2);

                return (
                  <div
                    key={lvl.id}
                    className="flex items-center justify-between gap-2 font-mono text-xs"
                    title={`${getLocalizedLabel(lvl)}: ${priceDisplay}${hasZone && lvl.clusterCount ? ` (${t.zoneDesc(lvl.clusterCount)})` : ""}`}
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      {lvl.importance === "major" && (
                        <span className="size-1.5 shrink-0 rounded-full bg-cyan-400" />
                      )}
                      <span className="truncate text-slate-300">
                        {getLocalizedLabel(lvl)}
                      </span>
                      {hasZone && (
                        <span className="py-0.2 shrink-0 rounded bg-cyan-500/20 px-1.5 font-mono text-[9px] text-cyan-300">
                          {t.zone}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-semibold tabular-nums text-foreground">
                        {priceDisplay}
                      </span>
                      <span className="py-0.2 rounded bg-cyan-500/10 px-1.5 text-[11px] font-bold tabular-nums text-cyan-400">
                        {deltaStr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resistance Column */}
          <div className="flex flex-col gap-2 rounded-xl border border-amber-500/20 bg-amber-950/10 p-3">
            <div className="flex items-center gap-1.5 border-b border-amber-500/20 pb-2 font-mono text-xs font-bold text-amber-400 sm:text-sm">
              <Flame className="size-3.5 shrink-0 text-amber-400" />
              <span className="truncate">{t.resistanceTitle}</span>
            </div>
            <div className="custom-scrollbar flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1.5">
              {resistances.map((lvl) => {
                const deltaStr =
                  lvl.activeDeltaPct > 0
                    ? `+${Math.abs(lvl.activeDeltaPct).toFixed(1)}%`
                    : `${lvl.activeDeltaPct.toFixed(1)}%`;
                const hasZone =
                  lvl.zoneRange && lvl.zoneRange[0] !== lvl.zoneRange[1];
                const priceDisplay = hasZone
                  ? `${formatCurrency(lvl.zoneRange![0], 2)} – ${formatCurrency(lvl.zoneRange![1], 2)}`
                  : formatCurrency(lvl.price, 2);

                return (
                  <div
                    key={lvl.id}
                    className="flex items-center justify-between gap-2 font-mono text-xs"
                    title={`${getLocalizedLabel(lvl)}: ${priceDisplay}${hasZone && lvl.clusterCount ? ` (${t.zoneDesc(lvl.clusterCount)})` : ""}`}
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      {lvl.importance === "major" && (
                        <span className="size-1.5 shrink-0 rounded-full bg-amber-400" />
                      )}
                      <span className="truncate text-slate-300">
                        {getLocalizedLabel(lvl)}
                      </span>
                      {hasZone && (
                        <span className="py-0.2 shrink-0 rounded bg-amber-500/20 px-1.5 font-mono text-[9px] text-amber-300">
                          {t.zone}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-semibold tabular-nums text-foreground">
                        {priceDisplay}
                      </span>
                      <span className="py-0.2 rounded bg-amber-500/10 px-1.5 text-[11px] font-bold tabular-nums text-amber-400">
                        {deltaStr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
