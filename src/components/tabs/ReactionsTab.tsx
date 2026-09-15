"use client";

import React from "react";
import { History, Quote } from "lucide-react";
import type { Reactions } from "@/lib/schemas";
import { formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";

interface ReactionsTabProps {
  reactionsData?: Reactions;
  locale?: Locale;
}

export const ReactionsTab: React.FC<ReactionsTabProps> = ({ reactionsData, locale = "zh" }) => {
  const t = getTranslations(locale).reactionsTab;
  if (!reactionsData || !reactionsData.events || reactionsData.events.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-slate-400 glass-panel rounded-xl">
        {t.empty}
      </div>
    );
  }

  const { events, conditionalFraming } = reactionsData;

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

      {/* Conditional Framing Box */}
      {conditionalFraming && (
        <div className="p-4.5 rounded-xl glass-panel border border-accent/20 bg-accent/5 flex items-start gap-3.5 shadow-md">
          <Quote className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-xs text-slate-200 italic leading-relaxed">
            &ldquo;{conditionalFraming}&rdquo;
          </p>
        </div>
      )}

      {/* Reactions Table */}
      <div className="rounded-xl glass-panel border border-border/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-2/70 border-b border-border text-slate-400 font-mono uppercase text-[11px] tracking-wider">
                <th className="p-3 font-semibold">{t.colDate}</th>
                <th className="p-3 font-semibold">{t.colEvent}</th>
                <th className="p-3 text-right font-semibold">{t.colMove}</th>
                <th className="p-3 font-semibold">{t.colContext}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {events.map((ev, idx) => (
                <tr key={idx} className="hover:bg-surface-2/40 transition-colors">
                  <td className="p-3 font-mono text-slate-400 text-xs whitespace-nowrap">
                    {ev.date}
                  </td>
                  <td className="p-3 font-bold text-white text-sm whitespace-nowrap">
                    {ev.event}
                  </td>
                  <td
                    className={`p-3 text-right font-mono font-bold text-sm tabular-nums whitespace-nowrap ${
                      ev.priceMovePct >= 0 ? "text-fintech-green" : "text-fintech-red"
                    }`}
                  >
                    {formatPercent(ev.priceMovePct)}
                  </td>
                  <td className="p-3 text-slate-300 text-xs leading-relaxed min-w-[240px] max-w-md">
                    {ev.context}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
