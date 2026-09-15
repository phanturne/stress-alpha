"use client";

import React from "react";
import { Layers, Compass } from "lucide-react";
import type { Facts } from "@/lib/schemas";
import { formatBillions, formatPercent } from "@/lib/utils";

interface SegmentsTabProps {
  facts: Facts;
}

export const SegmentsTab: React.FC<SegmentsTabProps> = ({ facts }) => {
  const { segments } = facts;
  const totalRev = segments.reduce((acc, s) => acc + s.revenueBillions, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Operational Segments & Management Guidance
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Audited unit economics, business unit growth velocities, and forward guidance ranges.
        </p>
      </div>

      {/* Segment Revenue Contribution Bar */}
      <div className="p-3.5 rounded-xl bg-surface-1 border border-border flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Revenue Contribution Breakdown</span>
          <span>Total Segment Revenue: {formatBillions(totalRev)}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-surface-3 flex overflow-hidden">
          {segments.map((s, i) => {
            const pct = (s.revenueBillions / totalRev) * 100;
            const colors = ["#38bdf8", "#10b981", "#a855f7", "#f59e0b", "#f43f5e", "#6366f1"];
            const color = colors[i % colors.length];

            return (
              <div
                key={s.name}
                style={{ width: `${pct}%`, backgroundColor: color }}
                className="h-full transition-all"
                title={`${s.name}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          {segments.map((s, i) => {
            const colors = ["#38bdf8", "#10b981", "#a855f7", "#f59e0b", "#f43f5e", "#6366f1"];
            const color = colors[i % colors.length];
            return (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-300">{s.name}</span>
                <span className="text-slate-500 font-mono">
                  ({((s.revenueBillions / totalRev) * 100).toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segments Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 shadow-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-0/80 border-b border-border text-slate-400 font-mono uppercase text-[11px]">
              <th className="p-3">Segment Name</th>
              <th className="p-3 text-right">Revenue</th>
              <th className="p-3 text-right">YoY Growth</th>
              <th className="p-3 text-right">Operating Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {segments.map((s) => (
              <tr key={s.name} className="hover:bg-surface-2/40 transition-colors">
                <td className="p-3 font-bold text-white text-sm flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  {s.name}
                </td>
                <td className="p-3 text-right font-mono font-bold text-white text-sm">
                  {formatBillions(s.revenueBillions)}
                </td>
                <td
                  className={`p-3 text-right font-mono font-bold text-sm ${
                    s.growthPct >= 0 ? "text-fintech-green" : "text-fintech-red"
                  }`}
                >
                  {formatPercent(s.growthPct)}
                </td>
                <td className="p-3 text-right font-mono text-slate-300 text-sm">
                  {s.operatingMarginPct != null ? `${s.operatingMarginPct}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Management Forward Guidance Callout */}
      {(facts.guidanceOperatingIncomeLowBillions || facts.guidanceRevenueLowBillions) && (
        <div className="p-4 rounded-xl bg-surface-1 border border-accent/30 bg-accentGlow/5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            Executive Forward Guidance Summary
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {facts.guidanceOperatingIncomeLowBillions && (
              <div className="p-3 rounded-lg bg-surface-0 border border-border">
                <div className="text-[11px] text-slate-400 font-medium">
                  Operating Income Guidance Range
                </div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {formatBillions(facts.guidanceOperatingIncomeLowBillions)} –{" "}
                  {facts.guidanceOperatingIncomeHighBillions
                    ? formatBillions(facts.guidanceOperatingIncomeHighBillions)
                    : ""}
                </div>
              </div>
            )}
            {facts.guidanceRevenueLowBillions && (
              <div className="p-3 rounded-lg bg-surface-0 border border-border">
                <div className="text-[11px] text-slate-400 font-medium">
                  Revenue Guidance Range
                </div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
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
