"use client";

import React from "react";
import { History, Quote } from "lucide-react";
import type { Reactions } from "@/lib/schemas";
import { formatPercent } from "@/lib/utils";

interface ReactionsTabProps {
  reactionsData?: Reactions;
}

export const ReactionsTab: React.FC<ReactionsTabProps> = ({ reactionsData }) => {
  if (!reactionsData || !reactionsData.events || reactionsData.events.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 bg-surface-1 rounded-xl border border-border">
        No historical earnings reactions data available for this report.
      </div>
    );
  }

  const { events, conditionalFraming } = reactionsData;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Historical Earnings Market Reactions & Framing
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Empirical post-earnings 1-day price reaction history and conditional catalyst framing.
        </p>
      </div>

      {/* Conditional Framing Box */}
      {conditionalFraming && (
        <div className="p-4 rounded-xl bg-surface-1 border border-border flex items-start gap-3 shadow-md">
          <Quote className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-xs text-slate-200 italic leading-relaxed">
            &ldquo;{conditionalFraming}&rdquo;
          </p>
        </div>
      )}

      {/* Reactions Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 shadow-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-0/80 border-b border-border text-slate-400 font-mono uppercase text-[11px]">
              <th className="p-3">Report Date</th>
              <th className="p-3">Event / Quarter</th>
              <th className="p-3 text-right">Day 1 Move</th>
              <th className="p-3">Context & Primary Driver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {events.map((ev, idx) => (
              <tr key={idx} className="hover:bg-surface-2/40 transition-colors">
                <td className="p-3 font-mono text-slate-400 text-xs">
                  {ev.date}
                </td>
                <td className="p-3 font-bold text-white text-sm">
                  {ev.event}
                </td>
                <td
                  className={`p-3 text-right font-mono font-bold text-sm ${
                    ev.priceMovePct >= 0 ? "text-fintech-green" : "text-fintech-red"
                  }`}
                >
                  {formatPercent(ev.priceMovePct)}
                </td>
                <td className="p-3 text-slate-300 text-xs leading-relaxed max-w-md">
                  {ev.context}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
