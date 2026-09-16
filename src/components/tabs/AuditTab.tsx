"use client";

import React, { useState } from "react";
import { Mic, FileSearch, History } from "lucide-react";
import type {
  EarningsSentiment,
  FilingExtracts,
  Reactions,
} from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";
import { ToneTab } from "./ToneTab";
import { FilingTab } from "./FilingTab";
import { ReactionsTab } from "./ReactionsTab";

interface AuditTabProps {
  sentimentData?: EarningsSentiment;
  filingData?: FilingExtracts;
  reactionsData?: Reactions;
  locale?: Locale;
}

export const AuditTab: React.FC<AuditTabProps> = ({
  sentimentData,
  filingData,
  reactionsData,
  locale = "zh",
}) => {
  const [subTab, setSubTab] = useState<"tone" | "filing" | "reactions">("tone");
  const t = getTranslations(locale).auditTab;

  const toneScore = sentimentData?.managementTone?.overallConfidence;
  const newRisksCount = filingData?.newRiskFactors?.length ?? 0;
  const reactionsCount = reactionsData?.events?.length ?? 0;

  const subNavItems = [
    {
      id: "tone" as const,
      label: t.subTone,
      icon: Mic,
      countBadge: toneScore !== undefined ? `${toneScore}/10` : undefined,
    },
    {
      id: "filing" as const,
      label: t.subFiling,
      icon: FileSearch,
      countBadge: newRisksCount > 0 ? `${newRisksCount}` : undefined,
    },
    {
      id: "reactions" as const,
      label: t.subReactions,
      icon: History,
      countBadge: reactionsCount > 0 ? `${reactionsCount}` : undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            {t.title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">{t.subtitle}</p>
        </div>

        {/* Sub-Pills Switcher */}
        <div className="flex items-center rounded-xl border border-white/[0.08] bg-surface-0/80 p-1 text-xs">
          {subNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = subTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSubTab(item.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  isActive
                    ? "bg-accent/20 font-bold text-accent shadow-sm ring-1 ring-accent/30"
                    : "text-slate-400 hover:bg-surface-2/60 hover:text-slate-200"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{item.label}</span>
                {item.countBadge && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
                      isActive
                        ? "bg-accent/30 font-bold text-accent"
                        : "bg-surface-2 text-slate-400"
                    }`}
                  >
                    {item.countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab View Rendering */}
      <div className="w-full">
        {subTab === "tone" && (
          <ToneTab sentimentData={sentimentData} locale={locale} />
        )}
        {subTab === "filing" && (
          <FilingTab filingData={filingData} locale={locale} />
        )}
        {subTab === "reactions" && (
          <ReactionsTab reactionsData={reactionsData} locale={locale} />
        )}
      </div>
    </div>
  );
};
