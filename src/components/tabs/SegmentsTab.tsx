"use client";

import React from "react";
import { Layers, Compass } from "lucide-react";
import type { Facts } from "@/lib/schemas";
import { formatBillions, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";

interface SegmentsTabProps {
  facts: Facts;
  locale?: Locale;
}

export const SegmentsTab: React.FC<SegmentsTabProps> = ({ facts, locale = "zh" }) => {
  const t = getTranslations(locale).segmentsTab;
  const { segments } = facts;
  const totalRev = segments.reduce((acc, s) => acc + s.revenueBillions, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          {t.title}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {t.subtitle}
        </p>
      </div>

      {/* Segment Revenue Contribution Bar */}
      <div className="p-4 rounded-xl glass-panel flex flex-col gap-2.5 shadow-md">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="font-semibold uppercase tracking-wider">{t.breakdownTitle}</span>
          <span className="font-bold text-white tabular-nums">
            {t.totalRevenue}: {formatBillions(totalRev)}
          </span>
        </div>
        <div className="h-3.5 w-full rounded-full bg-surface-3/80 flex overflow-hidden shadow-inner">
          {segments.map((s, i) => {
            const pct = (s.revenueBillions / totalRev) * 100;
            const colors = ["#38bdf8", "#10b981", "#a855f7", "#f59e0b", "#f43f5e", "#6366f1"];
            const color = colors[i % colors.length];

            return (
              <div
                key={s.name}
                style={{ width: `${pct}%`, backgroundColor: color }}
                className="h-full transition-all hover:opacity-85 cursor-pointer"
                title={`${s.name}: ${pct.toFixed(1)}% (${formatBillions(s.revenueBillions)})`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2.5 pt-1">
          {segments.map((s, i) => {
            const colors = ["#38bdf8", "#10b981", "#a855f7", "#f59e0b", "#f43f5e", "#6366f1"];
            const color = colors[i % colors.length];
            return (
              <div
                key={s.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-0/60 border border-border/70 text-xs"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                <span className="text-slate-300 font-medium">{s.name}</span>
                <span className="text-slate-400 font-mono tabular-nums">
                  ({((s.revenueBillions / totalRev) * 100).toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segments Table */}
      <div className="rounded-xl glass-panel border border-border/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-2/70 border-b border-border text-slate-400 font-mono uppercase text-[11px] tracking-wider">
                <th className="p-3 font-semibold">{t.colName}</th>
                <th className="p-3 text-right font-semibold">{t.colRevenue}</th>
                <th className="p-3 text-right font-semibold">{t.colGrowth}</th>
                <th className="p-3 text-right font-semibold">{t.colMargin}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {segments.map((s) => (
                <tr key={s.name} className="hover:bg-surface-2/40 transition-colors">
                  <td className="p-3 font-bold text-white text-sm flex items-center gap-2 whitespace-nowrap">
                    <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
                    {s.name}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-white text-sm tabular-nums whitespace-nowrap">
                    {formatBillions(s.revenueBillions)}
                  </td>
                  <td
                    className={`p-3 text-right font-mono font-bold text-sm tabular-nums whitespace-nowrap ${
                      s.growthPct >= 0 ? "text-fintech-green" : "text-fintech-red"
                    }`}
                  >
                    {formatPercent(s.growthPct)}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-300 text-sm tabular-nums whitespace-nowrap">
                    {s.operatingMarginPct != null ? `${s.operatingMarginPct}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Management Forward Guidance Callout */}
      {(facts.guidanceOperatingIncomeLowBillions || facts.guidanceRevenueLowBillions) && (
        <div className="p-5 rounded-xl glass-panel border border-accent/30 bg-accent/5 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider font-mono">
            <Compass className="w-4 h-4" />
            {t.guidanceTitle}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-0.5">
            {facts.guidanceOperatingIncomeLowBillions && (
              <div className="p-4 rounded-xl bg-surface-0/80 border border-border/80 shadow-sm">
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {t.operatingIncomeRange}
                </div>
                <div className="text-lg font-extrabold font-mono text-white mt-1 tabular-nums">
                  {formatBillions(facts.guidanceOperatingIncomeLowBillions)} –{" "}
                  {facts.guidanceOperatingIncomeHighBillions
                    ? formatBillions(facts.guidanceOperatingIncomeHighBillions)
                    : ""}
                </div>
              </div>
            )}
            {facts.guidanceRevenueLowBillions && (
              <div className="p-4 rounded-xl bg-surface-0/80 border border-border/80 shadow-sm">
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {t.revenueRange}
                </div>
                <div className="text-lg font-extrabold font-mono text-white mt-1 tabular-nums">
                  {formatBillions(facts.guidanceRevenueLowBillions)} –{" "}
                  {facts.guidanceRevenueHighBillions
                    ? formatBillions(facts.guidanceRevenueHighBillions)
                    : ""}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
