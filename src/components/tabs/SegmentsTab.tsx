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

export const SegmentsTab: React.FC<SegmentsTabProps> = ({
  facts,
  locale = "zh",
}) => {
  const t = getTranslations(locale).segmentsTab;
  const { segments } = facts;
  const totalRev = segments.reduce((acc, s) => acc + s.revenueBillions, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          {t.title}
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">{t.subtitle}</p>
      </div>

      {/* Segment Revenue Contribution Bar */}
      <div className="glass-panel flex flex-col gap-2.5 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between font-mono text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider">
            {t.breakdownTitle}
          </span>
          <span className="font-bold tabular-nums text-white">
            {t.totalRevenue}: {formatBillions(totalRev)}
          </span>
        </div>
        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-surface-3/80 shadow-inner">
          {segments.map((s, i) => {
            const pct = (s.revenueBillions / totalRev) * 100;
            const colors = [
              "#38bdf8",
              "#10b981",
              "#a855f7",
              "#f59e0b",
              "#f43f5e",
              "#6366f1",
            ];
            const color = colors[i % colors.length];

            return (
              <div
                key={s.name}
                style={{ width: `${pct}%`, backgroundColor: color }}
                className="h-full cursor-pointer transition-all hover:opacity-85"
                title={`${s.name}: ${pct.toFixed(1)}% (${formatBillions(s.revenueBillions)})`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2.5 pt-1">
          {segments.map((s, i) => {
            const colors = [
              "#38bdf8",
              "#10b981",
              "#a855f7",
              "#f59e0b",
              "#f43f5e",
              "#6366f1",
            ];
            const color = colors[i % colors.length];
            return (
              <div
                key={s.name}
                className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-surface-0/60 px-2.5 py-1 text-xs"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-slate-300">{s.name}</span>
                <span className="font-mono tabular-nums text-slate-400">
                  ({((s.revenueBillions / totalRev) * 100).toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segments Table */}
      <div className="glass-panel overflow-hidden rounded-xl border border-border/80 shadow-lg">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/70 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                <th className="p-3 font-semibold">{t.colName}</th>
                <th className="p-3 text-right font-semibold">{t.colRevenue}</th>
                <th className="p-3 text-right font-semibold">{t.colGrowth}</th>
                <th className="p-3 text-right font-semibold">{t.colMargin}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {segments.map((s) => (
                <tr
                  key={s.name}
                  className="transition-colors hover:bg-surface-2/40"
                >
                  <td className="flex items-center gap-2 whitespace-nowrap p-3 text-sm font-bold text-white">
                    <Layers className="size-3.5 shrink-0 text-accent" />
                    {s.name}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono text-sm font-bold tabular-nums text-white">
                    {formatBillions(s.revenueBillions)}
                  </td>
                  <td
                    className={`whitespace-nowrap p-3 text-right font-mono text-sm font-bold tabular-nums ${
                      s.growthPct >= 0
                        ? "text-fintech-green"
                        : "text-fintech-red"
                    }`}
                  >
                    {formatPercent(s.growthPct)}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono text-sm tabular-nums text-slate-300">
                    {s.operatingMarginPct != null
                      ? `${s.operatingMarginPct}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Management Forward Guidance Callout */}
      {(facts.guidanceOperatingIncomeLowBillions ||
        facts.guidanceRevenueLowBillions) && (
        <div className="glass-panel flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/5 p-5 shadow-lg">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
            <Compass className="size-4" />
            {t.guidanceTitle}
          </div>
          <div className="mt-0.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {facts.guidanceOperatingIncomeLowBillions && (
              <div className="rounded-xl border border-border/80 bg-surface-0/80 p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t.operatingIncomeRange}
                </div>
                <div className="mt-1 font-mono text-lg font-extrabold tabular-nums text-white">
                  {formatBillions(facts.guidanceOperatingIncomeLowBillions)} –{" "}
                  {facts.guidanceOperatingIncomeHighBillions
                    ? formatBillions(facts.guidanceOperatingIncomeHighBillions)
                    : ""}
                </div>
              </div>
            )}
            {facts.guidanceRevenueLowBillions && (
              <div className="rounded-xl border border-border/80 bg-surface-0/80 p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t.revenueRange}
                </div>
                <div className="mt-1 font-mono text-lg font-extrabold tabular-nums text-white">
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
