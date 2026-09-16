"use client";

import React from "react";
import {
  FileText,
  Share2,
  SlidersHorizontal,
  Upload,
  Globe,
  HelpCircle,
} from "lucide-react";
import { ReportSelector } from "./ReportSelector";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";
import type { Facts, Valuation } from "@/lib/schemas";

interface HeaderProps {
  facts?: Facts;
  valuation?: Valuation;
  currentSlug?: string | null;
  onSelectReport: (slug: string) => void;
  viewMode: "cockpit" | "memo";
  onViewModeChange: (mode: "cockpit" | "memo") => void;
  onOpenUploadModal?: () => void;
  onOpenShortcutsModal?: () => void;
  onShare?: () => void;
  locale?: Locale;
  onToggleLocale?: (l: Locale) => void;
}

export const Header: React.FC<HeaderProps> = ({
  facts,
  valuation,
  currentSlug,
  onSelectReport,
  viewMode,
  onViewModeChange,
  onOpenUploadModal,
  onOpenShortcutsModal,
  onShare,
  locale = "zh",
  onToggleLocale = () => {},
}) => {
  const t = getTranslations(locale).header;
  const currentPrice = facts?.currentPrice ?? 0;
  const weightedFairValue = valuation?.weightedFairValue ?? 0;
  const upsidePct = valuation?.upsidePct ?? 0;

  return (
    <header className="glass-panel sticky top-0 z-40 flex w-full items-center justify-between gap-2 border-b border-white/[0.08] px-3 py-2.5 transition-all duration-200 sm:gap-4 sm:px-6">
      {/* Left: Brand Identity & Active Workspace */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl border border-accent/40 bg-gradient-to-tr from-accent/20 to-sky-500/20 text-accent shadow-glow">
            <span className="font-mono text-sm font-extrabold tracking-tighter">
              S<span className="text-white">α</span>
            </span>
          </div>
          <div className="xs:block hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white">
                Stress<span className="text-accent">Alpha</span>
              </span>
              <span className="rounded border border-white/[0.08] bg-surface-2/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                {t.engineTag}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-0.5 hidden h-4 w-px bg-white/[0.08] sm:block" />

        {/* Direct Report Selection from reports/ folder */}
        <ReportSelector
          currentSlug={currentSlug ?? null}
          onSelectReport={onSelectReport}
          locale={locale}
        />
      </div>

      {/* Middle: Live Market Data Bar - Responsive (Compact on md-lg, Full on xl+) */}
      {facts && (
        <>
          {/* Full Bar (xl+) */}
          <div className="glass-panel-subtle hidden items-center gap-5 rounded-lg px-3.5 py-1.5 font-mono text-xs tabular-nums xl:flex">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">
                {t.currentPrice}:
              </span>
              <span className="font-bold text-white">
                {formatCurrency(currentPrice)}
              </span>
            </div>
            <div className="h-3 w-px bg-white/[0.08]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">
                {t.weightedFairValue}:
              </span>
              <span
                className={`font-bold ${
                  upsidePct >= 0 ? "text-fintech-green" : "text-fintech-red"
                }`}
              >
                {formatCurrency(weightedFairValue, 0)}{" "}
                <span className="text-[11px] font-semibold">
                  ({formatPercent(upsidePct)})
                </span>
              </span>
            </div>
            <div className="h-3 w-px bg-white/[0.08]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">{t.cleanEps}:</span>
              <span className="font-bold text-accent">
                {formatCurrency(facts.epsOperating)}
              </span>
            </div>
            <div className="h-3 w-px bg-white/[0.08]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">
                {t.fwdEstimate}:
              </span>
              <span className="text-slate-300">
                {facts.forwardEpsConsensus
                  ? formatCurrency(facts.forwardEpsConsensus)
                  : facts.epsConsensus
                    ? formatCurrency(facts.epsConsensus)
                    : "N/A"}
              </span>
            </div>
          </div>

          {/* Compact Bar (md to lg) */}
          <div className="glass-panel-subtle hidden items-center gap-3 rounded-lg px-3 py-1.5 font-mono text-xs tabular-nums md:flex xl:hidden">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400">
                {t.currentPrice}:
              </span>
              <span className="text-[11px] font-bold text-white">
                {formatCurrency(currentPrice)}
              </span>
            </div>
            <div className="h-3 w-px bg-white/[0.08]" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400">
                {t.weightedFairValue}:
              </span>
              <span
                className={`text-[11px] font-bold ${
                  upsidePct >= 0 ? "text-fintech-green" : "text-fintech-red"
                }`}
              >
                {formatCurrency(weightedFairValue, 0)} (
                {formatPercent(upsidePct)})
              </span>
            </div>
          </div>
        </>
      )}

      {/* Right: Language Switcher, View Mode, Share, Upload */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Prominent Language Switcher */}
        <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-1/90 p-0.5 shadow-sm">
          <Globe className="ml-1.5 mr-0.5 hidden size-3.5 text-accent sm:inline" />
          <button
            type="button"
            onClick={() => onToggleLocale("en")}
            className={`rounded-md px-2 py-1 text-xs font-bold transition-all sm:px-2.5 ${
              locale === "en"
                ? "bg-accent font-extrabold text-slate-950 shadow-sm shadow-accent/30"
                : "text-slate-400 hover:text-white"
            }`}
            title="English Version"
          >
            <span>EN</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleLocale("zh")}
            className={`rounded-md px-2 py-1 text-xs font-bold transition-all sm:px-2.5 ${
              locale === "zh"
                ? "bg-accent font-extrabold text-slate-950 shadow-sm shadow-accent/30"
                : "text-slate-400 hover:text-white"
            }`}
            title="中文版研报与仪表盘"
          >
            <span>中文</span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-1/90 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onViewModeChange("cockpit")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
              viewMode === "cockpit"
                ? "bg-surface-3 font-semibold text-accent shadow-sm ring-1 ring-white/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span className="hidden md:inline">{t.cockpit}</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("memo")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
              viewMode === "memo"
                ? "bg-surface-3 font-semibold text-accent shadow-sm ring-1 ring-white/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="size-3.5" />
            <span className="hidden md:inline">{t.memo}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-1/90 px-2.5 py-1.5 text-xs font-semibold text-slate-300 shadow-sm transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-accent sm:px-3"
          title={t.shareTooltip}
        >
          <Share2 className="size-3.5" />
          <span className="hidden sm:inline">{t.share}</span>
        </button>

        {/* Upload Fallback Button */}
        {onOpenUploadModal && (
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-1/90 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-white sm:px-3"
            title={t.uploadTooltip}
          >
            <Upload className="size-3.5" />
            <span className="hidden sm:inline">{t.upload}</span>
          </button>
        )}

        {/* Shortcuts Helper Button */}
        {onOpenShortcutsModal && (
          <button
            type="button"
            onClick={onOpenShortcutsModal}
            className="rounded-lg border border-white/[0.08] bg-surface-1/90 p-2 text-xs text-slate-400 transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-accent"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="size-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
