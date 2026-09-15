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
      <div className="p-8 text-center text-sm text-slate-500 bg-surface-1 rounded-xl border border-border">
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
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          {t.title}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(grouped).map(([scenarioName, items]) => (
          <div
            key={scenarioName}
            className="p-4 rounded-xl bg-surface-1 border border-border shadow-md flex flex-col gap-3"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm font-bold text-white tracking-tight">
                {scenarioName} {t.sensitivitySuffix}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {t.deltaFairValue}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {items.map((it, idx) => {
                const isPositive = it.fairValueDelta >= 0;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                      isPositive
                        ? "bg-fintech-greenGlow/10 border-fintech-green/30"
                        : "bg-fintech-redGlow/10 border-fintech-red/30"
                    }`}
                  >
                    <span className="text-[11px] font-medium text-slate-300">
                      {it.parameter}
                    </span>
                    <div className="flex items-baseline justify-between mt-0.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        {it.baseValue} → {it.altValue}
                      </span>
                      <span
                        className={`text-sm font-bold font-mono ${
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
