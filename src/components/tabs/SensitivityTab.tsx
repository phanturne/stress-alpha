"use client";

import React from "react";
import { Grid, Activity } from "lucide-react";
import type { SensitivityEntry } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";

interface SensitivityTabProps {
  sensitivityData: SensitivityEntry[];
  locale?: Locale;
}

export const SensitivityTab: React.FC<SensitivityTabProps> = ({ sensitivityData, locale = "zh" }) => {
  const t = getTranslations(locale).sensitivityTab;
  if (!sensitivityData || sensitivityData.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-slate-400 glass-panel rounded-xl">
        {t.empty}
      </div>
    );
  }

  // Group by scenario
  const grouped: Record<string, SensitivityEntry[]> = {};
  for (const item of sensitivityData) {
    if (!grouped[item.scenario]) {
      grouped[item.scenario] = [];
    }
    grouped[item.scenario].push(item);
  }

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Object.entries(grouped).map(([scenarioName, items]) => (
          <div
            key={scenarioName}
            className="p-5 rounded-xl glass-panel shadow-lg flex flex-col gap-3.5 hover:border-slate-500/40 transition-all"
          >
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-bold text-white tracking-tight">
                  {scenarioName} {t.sensitivitySuffix}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                {t.deltaFairValue}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
              {items.map((it, idx) => {
                const isPositive = it.fairValueDelta >= 0;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex flex-col justify-between gap-1.5 transition-all ${
                      isPositive
                        ? "bg-fintech-greenGlow/10 border-fintech-green/30 hover:border-fintech-green/50 shadow-[0_0_12px_rgba(16,185,129,0.06)]"
                        : "bg-fintech-redGlow/10 border-fintech-red/30 hover:border-fintech-red/50 shadow-[0_0_12px_rgba(244,63,94,0.06)]"
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-slate-300">
                      {it.parameter}
                    </span>
                    <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-white/5">
                      <span className="text-[10px] font-mono text-slate-400">
                        {it.baseValue} → {it.altValue}
                      </span>
                      <span
                        className={`text-sm font-bold font-mono tabular-nums ${
                          isPositive ? "text-fintech-green" : "text-fintech-red"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {formatCurrency(it.fairValueDelta, 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
