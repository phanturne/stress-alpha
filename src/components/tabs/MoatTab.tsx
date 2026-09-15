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
  AlertCircle,
  Building2,
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
      <div className="p-8 text-center text-sm text-slate-500 bg-surface-1 rounded-xl border border-border">
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
          color: "text-fintech-green bg-fintech-greenGlow/15 border-fintech-green/30",
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
    if (lower.includes("intangible") || lower.includes("无形资产") || lower.includes("专利"))
      return Lock;
    if (lower.includes("switching") || lower.includes("转换成本"))
      return Layers;
    if (lower.includes("cost") || lower.includes("成本优势"))
      return DollarSign;
    if (lower.includes("network") || lower.includes("网络效应"))
      return Share2;
    if (lower.includes("scale") || lower.includes("有效规模"))
      return Scale;
    return ShieldCheck;
  };

  const ratingInfo = getRatingBadge(moatData.overallMoatRating);
  const trendInfo = getTrendBadge(moatData.moatTrend);
  const TrendIcon = trendInfo.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Header & Moat Verdict Banner */}
      <div className="p-5 rounded-2xl bg-surface-1 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">
                {t.title}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${ratingInfo.bg}`}
              >
                {ratingInfo.label}
              </span>
              <span
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${trendInfo.color}`}
              >
                <TrendIcon className="w-3.5 h-3.5" />
                {trendInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-3xl">
              {moatData.competitiveDynamicsSummary}
            </p>
          </div>
        </div>
      </div>

      {/* 5 Moat Sources Breakdown */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-accent" />
            {t.sourcesTitle}
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            Morningstar Framework (5 Pillars)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {moatData.moatSources.map((source, idx) => {
            const SourceIcon = getSourceIcon(source.source);
            const strengthClass = getStrengthBadge(source.strength);

            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-surface-1 border border-border hover:border-slate-600 transition-all flex flex-col justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-surface-2 text-slate-300 border border-border">
                        <SourceIcon className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-sm font-bold text-white tracking-tight">
                        {source.source}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${strengthClass}`}
                    >
                      {source.strength}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {source.description}
                  </p>
                </div>

                {source.durabilityYears !== undefined && source.durabilityYears > 0 && (
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">{t.durability}:</span>
                    <span className="text-accent font-semibold">
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-accent" />
              {t.peersTitle}
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-surface-2 border border-border text-xs font-mono font-semibold text-accent">
              {moatData.competitors.length} {isZh ? "家核心竞品" : "Peers"}
            </span>
          </div>

          <div className="rounded-xl bg-surface-1 border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-2/70 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-border">
                    <th className="p-3 font-semibold">{t.colTicker}</th>
                    <th className="p-3 font-semibold">{t.colCompany}</th>
                    <th className="p-3 text-right font-semibold">{t.colMarketCap}</th>
                    <th className="p-3 text-right font-semibold">{t.colRevenue}</th>
                    <th className="p-3 text-right font-semibold">{t.colGrossMargin}</th>
                    <th className="p-3 text-right font-semibold">{t.colOperatingMargin}</th>
                    <th className="p-3 text-right font-semibold">{t.colFwdPe}</th>
                    <th className="p-3 text-right font-semibold">{t.colShare}</th>
                    <th className="p-3 font-semibold">{t.colPricingPower}</th>
                    <th className="p-3 font-semibold">{isZh ? "产品管线对比" : "Product Comparison"}</th>
                    <th className="p-3 font-semibold">{isZh ? "核心优势/脆弱点" : "Advantage / Vulnerability"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {moatData.competitors.map((peer, idx) => {
                    const pricingClass = getPricingPowerBadge(peer.pricingPower);
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-surface-2/40 transition-colors"
                      >
                        <td className="p-3 font-mono font-bold text-accent">
                          {peer.ticker}
                        </td>
                        <td className="p-3 font-medium text-white whitespace-nowrap">
                          {peer.name}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-200 whitespace-nowrap">
                          {peer.marketCapBillions !== undefined ? `$${peer.marketCapBillions.toFixed(1)}B` : "-"}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-200 whitespace-nowrap">
                          {peer.revenueBillions !== undefined ? `$${peer.revenueBillions.toFixed(1)}B` : "-"}
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
                        <td className="p-3 text-right font-mono text-slate-200 whitespace-nowrap">
                          {peer.grossMarginPct !== undefined
                            ? `${(peer.grossMarginPct).toFixed(1)}%`
                            : "-"}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-200 whitespace-nowrap">
                          {peer.operatingMarginPct !== undefined
                            ? `${(peer.operatingMarginPct).toFixed(1)}%`
                            : "-"}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-200 whitespace-nowrap">
                          {peer.forwardPe !== undefined ? `${peer.forwardPe.toFixed(1)}x` : "-"}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-200 whitespace-nowrap">
                          {peer.marketSharePct !== undefined
                            ? `${(peer.marketSharePct).toFixed(1)}%`
                            : "-"}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {peer.pricingPower ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${pricingClass}`}
                            >
                              {peer.pricingPower}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 text-slate-300 text-[11px] min-w-[200px]">
                          {peer.productComparison}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px] min-w-[200px]">
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

      {/* Strategic Competitive Dynamics Callout */}
      {moatData.competitiveDynamicsSummary && (
        <div className="p-5 rounded-xl bg-surface-1 border border-border/80 flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider font-mono">
            <Building2 className="w-4 h-4" />
            {t.dynamicsTitle}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {moatData.competitiveDynamicsSummary}
          </p>
        </div>
      )}
    </div>
  );
};
