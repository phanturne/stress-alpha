"use client";

import React from "react";
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Users,
  Lock,
  Layers,
  DollarSign,
  Scale,
  Share2,
} from "lucide-react";
import type { MoatCompetitors } from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";

interface MoatTabProps {
  moatData?: MoatCompetitors;
  locale?: Locale;
}

export const MoatTab: React.FC<MoatTabProps> = ({
  moatData,
  locale = "zh",
}) => {
  const t = getTranslations(locale).moatTab;
  const isZh = locale === "zh";

  if (!moatData) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center text-sm text-slate-400">
        {t.empty}
      </div>
    );
  }

  const getRatingBadge = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "wide":
        return {
          bg: "bg-fintech-greenGlow/20 text-fintech-green border-fintech-green/40",
          label: isZh ? "宽护城河 (Wide Moat)" : "Wide Moat",
        };
      case "narrow":
        return {
          bg: "bg-fintech-amberGlow/20 text-fintech-amber border-fintech-amber/40",
          label: isZh ? "窄护城河 (Narrow Moat)" : "Narrow Moat",
        };
      default:
        return {
          bg: "bg-surface-2 text-slate-400 border-border",
          label: isZh ? "无护城河 (No Moat)" : "No Moat",
        };
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend.toLowerCase()) {
      case "widening":
        return {
          icon: TrendingUp,
          color:
            "text-fintech-green bg-fintech-greenGlow/15 border-fintech-green/30",
          label: isZh ? "护城河持续扩宽 (Widening)" : "Widening",
        };
      case "narrowing":
        return {
          icon: TrendingDown,
          color: "text-fintech-red bg-fintech-redGlow/15 border-fintech-red/30",
          label: isZh ? "护城河正在收窄 (Narrowing)" : "Narrowing",
        };
      default:
        return {
          icon: Minus,
          color: "text-slate-300 bg-surface-2 border-border",
          label: isZh ? "护城河保持稳固 (Stable)" : "Stable",
        };
    }
  };

  const getStrengthBadge = (strength: string) => {
    switch (strength.toLowerCase()) {
      case "strong":
        return "bg-fintech-greenGlow/15 text-fintech-green border-fintech-green/30";
      case "moderate":
        return "bg-fintech-amberGlow/15 text-fintech-amber border-fintech-amber/30";
      case "weak":
        return "bg-surface-2 text-slate-400 border-border";
      default:
        return "bg-surface-2/50 text-slate-500 border-border/50";
    }
  };

  const getPricingPowerBadge = (power?: string) => {
    switch (power?.toLowerCase()) {
      case "superior":
        return "bg-fintech-greenGlow/15 text-fintech-green border-fintech-green/30";
      case "inferior":
        return "bg-fintech-redGlow/15 text-fintech-red border-fintech-red/30";
      default:
        return "bg-surface-2 text-slate-300 border-border";
    }
  };

  const getSourceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (
      lower.includes("intangible") ||
      lower.includes("无形资产") ||
      lower.includes("专利")
    )
      return Lock;
    if (lower.includes("switching") || lower.includes("转换成本"))
      return Layers;
    if (lower.includes("cost") || lower.includes("成本优势")) return DollarSign;
    if (lower.includes("network") || lower.includes("网络效应")) return Share2;
    if (lower.includes("scale") || lower.includes("有效规模")) return Scale;
    return ShieldCheck;
  };

  const ratingInfo = getRatingBadge(moatData.overallMoatRating);
  const trendInfo = getTrendBadge(moatData.moatTrend);
  const TrendIcon = trendInfo.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Header & Moat Verdict Banner */}
      <div className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-5 shadow-xl md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent shadow-[0_0_15px_rgba(56,189,248,0.15)]">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-base font-bold tracking-tight text-white">
                {t.title}
              </h3>
              <span
                className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider shadow-sm ${ratingInfo.bg}`}
              >
                {ratingInfo.label}
              </span>
              <span
                className={`flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold shadow-sm ${trendInfo.color}`}
              >
                <TrendIcon className="size-3.5" />
                {trendInfo.label}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-300">
              {moatData.competitiveDynamicsSummary}
            </p>
          </div>
        </div>
      </div>

      {/* 5 Moat Sources Breakdown */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Award className="size-3.5 text-accent" />
            {t.sourcesTitle}
          </h4>
          <span className="font-mono text-[11px] text-slate-400">
            Morningstar Framework (5 Pillars)
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {moatData.moatSources.map((source, idx) => {
            const SourceIcon = getSourceIcon(source.source);
            const strengthClass = getStrengthBadge(source.strength);

            return (
              <div
                key={idx}
                className="glass-panel group flex flex-col justify-between gap-3 rounded-xl p-4 shadow-md transition-all hover:border-slate-500/50"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg border border-border bg-surface-2 p-1.5 text-slate-300 transition-colors group-hover:border-accent/30">
                        <SourceIcon className="size-4 text-accent" />
                      </div>
                      <span className="text-sm font-bold tracking-tight text-white">
                        {source.source}
                      </span>
                    </div>
                    <span
                      className={`rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${strengthClass}`}
                    >
                      {source.strength}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-300">
                    {source.description}
                  </p>
                </div>

                {source.durabilityYears !== undefined &&
                  source.durabilityYears > 0 && (
                    <div className="flex items-center justify-between border-t border-border/60 pt-2 font-mono text-[11px]">
                      <span className="text-slate-400">{t.durability}:</span>
                      <span className="rounded border border-accent/20 bg-accent/10 px-2 py-0.5 font-semibold text-accent">
                        {source.durabilityYears} {isZh ? "年壁垒期" : "Years"}
                      </span>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Competitor Benchmarking Matrix */}
      {moatData.competitors && moatData.competitors.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Users className="size-3.5 text-accent" />
              {t.peersTitle}
            </h4>
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs font-semibold text-accent">
              {moatData.competitors.length} {isZh ? "家核心竞品" : "Peers"}
            </span>
          </div>

          <div className="glass-panel overflow-hidden rounded-xl border border-border/80 shadow-lg">
            <div className="custom-scrollbar overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-2/90 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="sticky left-0 z-20 min-w-[75px] bg-surface-2/95 p-3 font-semibold">
                      {t.colTicker}
                    </th>
                    <th className="sticky left-[75px] z-20 min-w-[120px] border-r border-border/70 bg-surface-2/95 p-3 font-semibold shadow-[3px_0_8px_rgba(0,0,0,0.3)]">
                      {t.colCompany}
                    </th>
                    <th className="p-3 text-right font-semibold">
                      {t.colMarketCap}
                    </th>
                    <th className="p-3 text-right font-semibold">
                      {t.colRevenue}
                    </th>
                    <th className="p-3 text-right font-semibold">
                      {t.colGrossMargin}
                    </th>
                    <th className="p-3 text-right font-semibold">
                      {t.colOperatingMargin}
                    </th>
                    <th className="p-3 text-right font-semibold">
                      {t.colFwdPe}
                    </th>
                    <th className="p-3 text-right font-semibold">
                      {t.colShare}
                    </th>
                    <th className="p-3 font-semibold">{t.colPricingPower}</th>
                    <th className="p-3 font-semibold">
                      {isZh ? "产品管线对比" : "Product Comparison"}
                    </th>
                    <th className="p-3 font-semibold">
                      {isZh ? "核心优势/脆弱点" : "Advantage / Vulnerability"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {moatData.competitors.map((peer, idx) => {
                    const pricingClass = getPricingPowerBadge(
                      peer.pricingPower
                    );
                    return (
                      <tr
                        key={idx}
                        className="transition-colors hover:bg-surface-2/50"
                      >
                        <td className="sticky left-0 z-10 bg-surface-1 p-3 font-mono font-bold text-accent">
                          {peer.ticker}
                        </td>
                        <td className="sticky left-[75px] z-10 whitespace-nowrap border-r border-border/70 bg-surface-1 p-3 font-medium text-white shadow-[3px_0_8px_rgba(0,0,0,0.3)]">
                          {peer.name}
                        </td>
                        <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums text-slate-200">
                          {peer.marketCapBillions !== undefined
                            ? `$${peer.marketCapBillions.toFixed(1)}B`
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums text-slate-200">
                          {peer.revenueBillions !== undefined
                            ? `$${peer.revenueBillions.toFixed(1)}B`
                            : "-"}
                          {peer.revenueGrowthPct !== undefined && (
                            <span
                              className={`ml-1.5 font-bold ${
                                peer.revenueGrowthPct >= 0
                                  ? "text-fintech-green"
                                  : "text-fintech-red"
                              }`}
                            >
                              {peer.revenueGrowthPct >= 0 ? "+" : ""}
                              {peer.revenueGrowthPct.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums text-slate-200">
                          {peer.grossMarginPct !== undefined
                            ? `${peer.grossMarginPct.toFixed(1)}%`
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums text-slate-200">
                          {peer.operatingMarginPct !== undefined
                            ? `${peer.operatingMarginPct.toFixed(1)}%`
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums text-slate-200">
                          {peer.forwardPe !== undefined
                            ? `${peer.forwardPe.toFixed(1)}x`
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums text-slate-200">
                          {peer.marketSharePct !== undefined
                            ? `${peer.marketSharePct.toFixed(1)}%`
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap p-3">
                          {peer.pricingPower ? (
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${pricingClass}`}
                            >
                              {peer.pricingPower}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="min-w-[200px] p-3 text-[11px] text-slate-300">
                          {peer.productComparison}
                        </td>
                        <td className="min-w-[200px] p-3 text-[11px] text-slate-400">
                          {peer.keyAdvantageOrVulnerability}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
