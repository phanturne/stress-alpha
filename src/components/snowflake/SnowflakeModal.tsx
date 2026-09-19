"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Award,
  Layers,
  Share2,
} from "lucide-react";
import type {
  SnowflakeAxisId,
  SnowflakePillar,
  SnowflakeScoreResult,
} from "@/lib/snowflake";
import { SnowflakeRadar } from "./SnowflakeRadar";
import { getTranslations, type Locale } from "@/lib/i18n";

export interface SnowflakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreResult: SnowflakeScoreResult;
  ticker: string;
  company: string;
  locale?: Locale;
  onOpenSocialCard?: () => void;
}

export const SnowflakeModal: React.FC<SnowflakeModalProps> = ({
  isOpen,
  onClose,
  scoreResult,
  ticker,
  company,
  locale = "en",
  onOpenSocialCard,
}) => {
  const t = getTranslations(locale).snowflake;
  const [selectedPillarId, setSelectedPillarId] = useState<
    SnowflakeAxisId | "all"
  >("all");

  if (!isOpen) return null;

  const displayedPillars: SnowflakePillar[] =
    selectedPillarId === "all"
      ? scoreResult.pillarList
      : [scoreResult.pillars[selectedPillarId]];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 duration-200 animate-in fade-in sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/[0.12] bg-surface-0 shadow-2xl">
        {/* Modal Top Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-surface-1/60 px-5 py-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-accent/30 bg-accent/15 text-accent shadow-sm">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                  {ticker} &bull; {company}
                </h2>
                <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                  {t.badgeTitle}
                </span>
              </div>
              <p className="font-mono text-xs text-slate-400">
                {t.overallScoreSub(
                  scoreResult.totalScore,
                  30,
                  scoreResult.percentage,
                  scoreResult.ratingLabel
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSocialCard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSocialCard();
                }}
                className="hidden items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent shadow-sm transition-all hover:bg-accent/20 hover:text-white sm:flex"
              >
                <Share2 className="size-3.5" />
                <span>{t.exportCard}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-xl border border-white/[0.08] bg-surface-2 text-slate-400 transition-all hover:border-white/20 hover:bg-surface-3 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Split Radar & 30-Point Audit */}
        <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto lg:flex-row">
          {/* Left Column: Interactive Radar & Pillar Filter */}
          <div className="flex w-full flex-col items-center border-b border-white/[0.08] bg-surface-1/30 p-6 lg:w-[380px] lg:shrink-0 lg:border-b-0 lg:border-r xl:w-[420px]">
            {/* Overall Score Badge */}
            <div className="mb-3 flex flex-col items-center text-center">
              <div className="flex items-baseline gap-1 font-mono text-3xl font-black text-white sm:text-4xl">
                <span className="text-accent">{scoreResult.totalScore}</span>
                <span className="text-slate-500">/ 30</span>
              </div>
              <div className="mt-1 rounded-full border border-white/[0.08] bg-surface-2 px-3 py-0.5 text-xs font-semibold text-slate-300">
                {scoreResult.ratingLabel}
              </div>
            </div>

            {/* Large Snowflake Radar */}
            <div className="relative my-2 w-full max-w-[320px]">
              <SnowflakeRadar
                scoreResult={scoreResult}
                size="md"
                interactive={true}
                activePillar={
                  selectedPillarId === "all" ? null : selectedPillarId
                }
                onSelectPillar={(id) => setSelectedPillarId(id)}
                locale={locale}
                className="scale-105"
              />
            </div>

            {/* Quick Filter Pill Buttons */}
            <div className="mt-6 flex w-full flex-col gap-1.5">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t.filterByPillar}
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedPillarId("all")}
                  className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    selectedPillarId === "all"
                      ? "border border-white/30 bg-white/10 text-white shadow-sm"
                      : "border border-white/[0.06] bg-surface-2/60 text-slate-400 hover:border-white/15 hover:text-slate-200"
                  }`}
                >
                  <span>{t.filterAll}</span>
                  <span className="font-mono text-[10px] font-bold text-accent">
                    {scoreResult.totalScore}/30
                  </span>
                </button>

                {scoreResult.pillarList.map((p) => {
                  const isActive = selectedPillarId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPillarId(p.id)}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                        isActive
                          ? "border text-white shadow-sm"
                          : "border border-white/[0.06] bg-surface-2/60 text-slate-400 hover:border-white/15 hover:text-slate-200"
                      }`}
                      style={{
                        borderColor: isActive ? p.color : undefined,
                        backgroundColor: isActive ? `${p.color}22` : undefined,
                      }}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="truncate">{p.shortLabel}</span>
                      </div>
                      <span
                        className="font-mono text-[10px] font-bold"
                        style={{ color: p.color }}
                      >
                        {p.score}/6
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: 30-Point Audit Breakdown Table */}
          <div className="custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-6">
              {displayedPillars.map((pillar) => {
                return (
                  <div
                    key={pillar.id}
                    className="glass-panel overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-1/40 p-4 shadow-sm sm:p-5"
                  >
                    {/* Pillar Title Bar */}
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="size-3 rounded-full shadow-sm"
                          style={{ backgroundColor: pillar.color }}
                        />
                        <h3 className="text-sm font-bold text-white sm:text-base">
                          {pillar.label}
                        </h3>
                      </div>
                      <div
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-bold"
                        style={{
                          color: pillar.color,
                          backgroundColor: `${pillar.color}18`,
                          border: `1px solid ${pillar.color}33`,
                        }}
                      >
                        <span>{pillar.score} / 6</span>
                        <span className="text-[10px] font-normal opacity-80">
                          {t.passedBadge}
                        </span>
                      </div>
                    </div>

                    {/* Pillar Summary Statement */}
                    <p className="mt-2.5 text-xs text-slate-300">
                      {pillar.summary}
                    </p>

                    {/* 6 Criteria List */}
                    <div className="mt-4 flex flex-col divide-y divide-white/[0.05]">
                      {pillar.criteria.map((crit, idx) => {
                        return (
                          <div
                            key={crit.id}
                            className="flex flex-col justify-between gap-2 py-2.5 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:gap-4"
                          >
                            <div className="flex items-start gap-2.5">
                              {crit.passed ? (
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                              ) : (
                                <XCircle className="mt-0.5 size-4 shrink-0 text-slate-500" />
                              )}
                              <div>
                                <div className="text-xs font-semibold text-slate-200">
                                  {crit.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {crit.description}
                                </div>
                              </div>
                            </div>

                            {/* Actual vs Benchmark Pills */}
                            <div className="ml-6.5 flex shrink-0 items-center gap-2 sm:ml-0">
                              <span
                                className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                                  crit.passed
                                    ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                                    : "border border-white/[0.06] bg-surface-3 text-slate-400"
                                }`}
                              >
                                {crit.valueDisplay}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">
                                vs
                              </span>
                              <span className="rounded-md border border-white/[0.06] bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                                {crit.benchmarkDisplay}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-white/[0.08] bg-surface-1/70 px-6 py-3 text-xs text-slate-400">
          <div>{t.footerNotice}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] bg-surface-2 px-4 py-1.5 font-semibold text-slate-200 transition-all hover:border-white/20 hover:bg-surface-3 hover:text-white"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
