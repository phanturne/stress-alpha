"use client";

import React from "react";
import { Sparkles, ChevronRight, Eye } from "lucide-react";
import type { SnowflakeScoreResult } from "@/lib/snowflake";
import { SnowflakeRadar } from "./SnowflakeRadar";
import { getTranslations, type Locale } from "@/lib/i18n";

export interface SnowflakeCardProps {
  scoreResult: SnowflakeScoreResult;
  onOpenModal: () => void;
  locale?: Locale;
  className?: string;
}

export const SnowflakeCard: React.FC<SnowflakeCardProps> = ({
  scoreResult,
  onOpenModal,
  locale = "en",
  className = "",
}) => {
  const t = getTranslations(locale).snowflake;

  return (
    <div
      onClick={onOpenModal}
      className={`glass-panel shadow-xs group flex cursor-pointer flex-col gap-3 rounded-2xl border border-border p-4 transition-all duration-150 hover:border-accent/40 hover:bg-surface-1/90 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            {t.scoreCardTitle}
          </h3>
          <p className="text-[11px] text-slate-400">
            {scoreResult.ratingLabel}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-base font-bold text-white">
            {scoreResult.totalScore}
          </span>
          <span className="font-mono text-xs text-slate-500">/ 30</span>
          <ChevronRight className="size-3.5 text-slate-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center py-1">
        <SnowflakeRadar
          scoreResult={scoreResult}
          size="sm"
          interactive={false}
          locale={locale}
          showLabels={true}
        />
      </div>

      {/* 5 Pillar Mini Pills */}
      <div className="grid grid-cols-5 gap-1 border-t border-white/[0.06] pt-1">
        {scoreResult.pillarList.map((p) => {
          return (
            <div
              key={p.id}
              className="flex flex-col items-center rounded-lg bg-surface-2/60 px-1 py-1 text-center transition-colors group-hover:bg-surface-2"
            >
              <span className="w-full truncate font-mono text-[9px] uppercase text-slate-400">
                {p.shortLabel}
              </span>
              <span
                className="snowflake-pillar-score font-mono text-[10px] font-bold"
                style={{ color: p.color }}
              >
                {p.score}/6
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA hint */}
      <div className="flex items-center justify-center gap-1 font-mono text-[10px] text-slate-400 transition-colors group-hover:text-accent">
        <Eye className="size-3" />
        <span>{t.clickToViewAudit}</span>
      </div>
    </div>
  );
};
