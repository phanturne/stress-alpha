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

export const ReactionsTab: React.FC<ReactionsTabProps> = ({
  reactionsData,
  locale = "zh",
}) => {
  const t = getTranslations(locale).reactionsTab;
  if (
    !reactionsData ||
    !reactionsData.events ||
    reactionsData.events.length === 0
  ) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center text-sm text-slate-400">
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
        <p className="mt-0.5 text-xs text-slate-400">{t.subtitle}</p>
      </div>

      {/* Conditional Framing Box */}
      {conditionalFraming && (
        <div className="glass-panel flex items-start gap-3.5 rounded-xl border border-accent/20 bg-accent/5 p-4.5 shadow-md">
          <Quote className="mt-0.5 size-5 shrink-0 text-accent" />
          <p className="text-xs italic leading-relaxed text-slate-200">
            &ldquo;{conditionalFraming}&rdquo;
          </p>
        </div>
      )}

      {/* Reactions Table */}
      <div className="glass-panel overflow-hidden rounded-xl border border-border/80 shadow-lg">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/70 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                <th className="p-3 font-semibold">{t.colDate}</th>
                <th className="p-3 font-semibold">{t.colEvent}</th>
                <th className="p-3 text-right font-semibold">{t.colMove}</th>
                <th className="p-3 font-semibold">{t.colContext}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {events.map((ev, idx) => (
                <tr
                  key={idx}
                  className="transition-colors hover:bg-surface-2/40"
                >
                  <td className="whitespace-nowrap p-3 font-mono text-xs text-slate-400">
                    {ev.date}
                  </td>
                  <td className="whitespace-nowrap p-3 text-sm font-bold text-white">
                    {ev.event}
                  </td>
                  <td
                    className={`whitespace-nowrap p-3 text-right font-mono text-sm font-bold tabular-nums ${
                      ev.priceMovePct >= 0
                        ? "text-fintech-green"
                        : "text-fintech-red"
                    }`}
                  >
                    {formatPercent(ev.priceMovePct)}
                  </td>
                  <td className="min-w-[240px] max-w-md p-3 text-xs leading-relaxed text-slate-300">
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
