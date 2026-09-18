"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Share2,
  SlidersHorizontal,
  Globe,
  HelpCircle,
  BarChart3,
  BookOpen,
  ExternalLink,
} from "lucide-react";

function GithubIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}
import { ReportSelector } from "./ReportSelector";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";
import type { Facts, Valuation } from "@/lib/schemas";

interface HeaderProps {
  facts?: Facts;
  valuation?: Valuation;
  currentSlug?: string | null;
  onSelectReport: (slug: string) => void;
  viewMode: "cockpit" | "memo" | "screener";
  onViewModeChange: (mode: "cockpit" | "memo" | "screener") => void;
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
    <header className="glass-panel sticky top-0 z-40 flex w-full flex-nowrap items-center justify-between gap-2 border-b border-white/[0.08] px-3 py-2.5 transition-all duration-200 sm:gap-4 sm:px-6">
      {/* Left: Brand Identity & Active Workspace */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Clickable Brand Logo -> Returns to Home (Screener) */}
        <button
          type="button"
          onClick={() => onViewModeChange("screener")}
          className="group flex items-center gap-2 text-left transition-opacity hover:opacity-90"
          title="StressAlpha Home — Universe Screener"
        >
          <div className="flex size-8 items-center justify-center rounded-xl border border-accent/40 bg-gradient-to-tr from-accent/20 to-sky-500/20 text-accent shadow-glow transition-transform group-hover:scale-105">
            <span className="font-mono text-sm font-extrabold tracking-tighter">
              S<span className="text-white">α</span>
            </span>
          </div>
          <div className="xs:block hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white transition-colors group-hover:text-accent">
                Stress<span className="text-accent">Alpha</span>
              </span>
              <span className="rounded border border-white/[0.08] bg-surface-2/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                {t.engineTag}
              </span>
            </div>
          </div>
        </button>

        <div className="mx-0.5 hidden h-4 w-px bg-white/[0.08] sm:block" />

        {/* Direct Report Selection from reports/ folder */}
        <ReportSelector
          currentSlug={currentSlug ?? null}
          onSelectReport={(slug) => {
            onViewModeChange("cockpit");
            onSelectReport(slug);
          }}
          locale={locale}
          onOpenScreener={() => onViewModeChange("screener")}
        />

        {/* Ticker Hyperlink to Yahoo Finance */}
        {facts?.ticker && (
          <a
            href={`https://finance.yahoo.com/quote/${facts.ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 rounded-lg border border-white/[0.08] bg-surface-1/90 px-2 py-1.5 font-mono text-xs font-semibold text-slate-400 transition-colors hover:border-accent/40 hover:text-accent sm:inline-flex"
            title={`View ${facts.ticker} quote on Yahoo Finance`}
          >
            <span>{facts.ticker}</span>
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      {/* Middle: Live Market Data Bar - Absolutely Centered in Viewport */}
      {facts && (
        <>
          {/* Full Bar (xl+) */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 xl:flex">
            <div className="glass-panel-subtle pointer-events-auto flex items-center gap-5 whitespace-nowrap rounded-lg px-3.5 py-1.5 font-mono text-xs tabular-nums shadow-sm">
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
                <span className="text-[11px] text-slate-400">
                  {t.cleanEps}:
                </span>
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
          </div>

          {/* Compact Bar (md to lg) */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex xl:hidden">
            <div className="glass-panel-subtle pointer-events-auto flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-1.5 font-mono text-xs tabular-nums shadow-sm">
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
          </div>
        </>
      )}

      {/* Right: Language Switcher, View Mode, Methodology, GitHub, Share, Shortcuts */}
      <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap sm:gap-2">
        {/* Prominent Language Switcher (Clicking toggles EN <-> ZH) */}
        <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-1/90 p-0.5 shadow-sm">
          <Globe className="ml-1.5 mr-0.5 hidden size-3.5 text-accent sm:inline" />
          <button
            type="button"
            onClick={() => onToggleLocale(locale === "en" ? "zh" : "en")}
            className={`rounded-md px-2 py-1 text-xs font-bold transition-all sm:px-2.5 ${
              locale === "en"
                ? "bg-accent font-extrabold text-slate-950 shadow-sm shadow-accent/30"
                : "text-slate-400 hover:text-white"
            }`}
            title="Click to toggle English / 中文"
          >
            <span>EN</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleLocale(locale === "en" ? "zh" : "en")}
            className={`rounded-md px-2 py-1 text-xs font-bold transition-all sm:px-2.5 ${
              locale === "zh"
                ? "bg-accent font-extrabold text-slate-950 shadow-sm shadow-accent/30"
                : "text-slate-400 hover:text-white"
            }`}
            title="点击切换 中文 / English"
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
          <button
            type="button"
            onClick={() => onViewModeChange("screener")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
              viewMode === "screener"
                ? "bg-surface-3 font-semibold text-accent shadow-sm ring-1 ring-white/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="size-3.5" />
            <span className="hidden md:inline">{t.screener}</span>
          </button>
        </div>

        {/* Methodology Documentation Link */}
        <Link
          href="/methodology"
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-1/90 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-accent sm:px-3"
          title={t.methodology}
        >
          <BookOpen className="size-3.5" />
          <span className="hidden lg:inline">{t.methodology}</span>
        </Link>

        {/* GitHub Repository Link */}
        <a
          href="https://github.com/phanturne/stress-alpha"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-1/90 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-accent sm:px-3"
          title={t.github}
        >
          <GithubIcon className="size-3.5" />
          <span className="hidden xl:inline">{t.github}</span>
        </a>

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
