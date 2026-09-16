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
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] glass-panel px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-200">
      {/* Left: Brand Identity & Active Workspace */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent/20 to-sky-500/20 border border-accent/40 flex items-center justify-center text-accent shadow-glow/30">
            <span className="font-mono font-extrabold text-sm tracking-tighter">
              S<span className="text-white">α</span>
            </span>
          </div>
          <div className="hidden xs:block">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-base">
                Stress<span className="text-accent">Alpha</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-2/90 border border-white/[0.08] text-[9px] font-mono text-slate-400 font-semibold tracking-wider uppercase">
                {t.engineTag}
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-white/[0.08] mx-0.5 hidden sm:block" />

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
          <div className="hidden xl:flex items-center gap-5 px-3.5 py-1.5 rounded-lg glass-panel-subtle text-xs font-mono tabular-nums">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">{t.currentPrice}:</span>
              <span className="font-bold text-white">
                {formatCurrency(currentPrice)}
              </span>
            </div>
            <div className="h-3 w-[1px] bg-white/[0.08]" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">{t.weightedFairValue}:</span>
              <span
                className={`font-bold ${
                  upsidePct >= 0 ? "text-fintech-green" : "text-fintech-red"
                }`}
              >
                {formatCurrency(weightedFairValue, 0)}{" "}
                <span className="text-[11px] font-semibold">({formatPercent(upsidePct)})</span>
              </span>
            </div>
            <div className="h-3 w-[1px] bg-white/[0.08]" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">{t.cleanEps}:</span>
              <span className="font-bold text-accent">
                {formatCurrency(facts.epsOperating)}
              </span>
            </div>
            <div className="h-3 w-[1px] bg-white/[0.08]" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">{t.fwdEstimate}:</span>
              <span className="text-slate-300">
                {facts.forwardEpsConsensus ? formatCurrency(facts.forwardEpsConsensus) : (facts.epsConsensus ? formatCurrency(facts.epsConsensus) : "N/A")}
              </span>
            </div>
          </div>

          {/* Compact Bar (md to lg) */}
          <div className="hidden md:flex xl:hidden items-center gap-3 px-3 py-1.5 rounded-lg glass-panel-subtle text-xs font-mono tabular-nums">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[10px]">{t.currentPrice}:</span>
              <span className="font-bold text-white text-[11px]">
                {formatCurrency(currentPrice)}
              </span>
            </div>
            <div className="h-3 w-[1px] bg-white/[0.08]" />
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[10px]">{t.weightedFairValue}:</span>
              <span
                className={`font-bold text-[11px] ${
                  upsidePct >= 0 ? "text-fintech-green" : "text-fintech-red"
                }`}
              >
                {formatCurrency(weightedFairValue, 0)} ({formatPercent(upsidePct)})
              </span>
            </div>
          </div>
        </>
      )}

      {/* Right: Language Switcher, View Mode, Share, Upload */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Prominent Language Switcher */}
        <div className="flex items-center bg-surface-1/90 p-0.5 rounded-lg border border-white/[0.08] shadow-sm">
          <Globe className="w-3.5 h-3.5 text-accent ml-1.5 mr-0.5 hidden sm:inline" />
          <button
            type="button"
            onClick={() => onToggleLocale("en")}
            className={`px-2 sm:px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              locale === "en"
                ? "bg-accent text-slate-950 shadow-sm shadow-accent/30 font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
            title="English Version"
          >
            <span>EN</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleLocale("zh")}
            className={`px-2 sm:px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              locale === "zh"
                ? "bg-accent text-slate-950 shadow-sm shadow-accent/30 font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
            title="中文版研报与仪表盘"
          >
            <span>中文</span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-surface-1/90 p-0.5 rounded-lg border border-white/[0.08] text-xs">
          <button
            type="button"
            onClick={() => onViewModeChange("cockpit")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
              viewMode === "cockpit"
                ? "bg-surface-3 text-accent font-semibold shadow-sm ring-1 ring-white/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.cockpit}</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("memo")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
              viewMode === "memo"
                ? "bg-surface-3 text-accent font-semibold shadow-sm ring-1 ring-white/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.memo}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-1/90 hover:bg-surface-2 border border-white/[0.08] hover:border-accent/40 text-xs font-semibold text-slate-300 hover:text-accent transition-all shadow-sm"
          title={t.shareTooltip}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.share}</span>
        </button>

        {/* Upload Fallback Button */}
        {onOpenUploadModal && (
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-1/90 hover:bg-surface-2 border border-white/[0.08] hover:border-accent/40 text-xs font-semibold text-slate-300 hover:text-white transition-all"
            title={t.uploadTooltip}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.upload}</span>
          </button>
        )}

        {/* Shortcuts Helper Button */}
        {onOpenShortcutsModal && (
          <button
            type="button"
            onClick={onOpenShortcutsModal}
            className="p-2 rounded-lg bg-surface-1/90 hover:bg-surface-2 border border-white/[0.08] hover:border-accent/40 text-xs text-slate-400 hover:text-accent transition-all"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
