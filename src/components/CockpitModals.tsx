"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Keyboard, X, Check, ArrowUp } from "lucide-react";
import { getTranslations, type Locale } from "@/lib/i18n";

const SocialCardModal = dynamic(
  () =>
    import("@/components/social-card/SocialCardModal").then(
      (m) => m.SocialCardModal
    ),
  { ssr: false }
);
const SnowflakeModal = dynamic(
  () =>
    import("@/components/snowflake/SnowflakeModal").then(
      (m) => m.SnowflakeModal
    ),
  { ssr: false }
);
import type { Facts, ReportData } from "@/lib/schemas";
import type {
  StressTestParams,
  StressedValuationResult,
  ValuationSchemaType,
} from "@/lib/valuation";
import type { SnowflakeScoreResult } from "@/lib/snowflake";

export interface CockpitModalsProps {
  isShortcutsOpen: boolean;
  onCloseShortcuts: () => void;
  tabCount: number;
  isSocialCardOpen: boolean;
  onCloseSocialCard: () => void;
  isSnowflakeOpen: boolean;
  onCloseSnowflake: () => void;
  facts?: Facts;
  valuation?: ValuationSchemaType;
  stressResult?: StressedValuationResult | null;
  reportData?: ReportData | null;
  stressParams: StressTestParams;
  snowflakeScore?: SnowflakeScoreResult | null;
  locale: Locale;
  toastMessage?: string | null;
  showToast: (msg: string) => void;
  showBackToTop: boolean;
  onScrollToTop: () => void;
  onOpenSocialCard: () => void;
}

export function CockpitModals({
  isShortcutsOpen,
  onCloseShortcuts,
  tabCount,
  isSocialCardOpen,
  onCloseSocialCard,
  isSnowflakeOpen,
  onCloseSnowflake,
  facts,
  valuation,
  stressResult,
  reportData,
  stressParams,
  snowflakeScore,
  locale,
  toastMessage,
  showToast,
  showBackToTop,
  onScrollToTop,
  onOpenSocialCard,
}: CockpitModalsProps) {
  const t = getTranslations(locale);

  return (
    <>
      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && (
        <div
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onCloseShortcuts}
        >
          <div
            className="glass-panel shadow-xs relative flex w-full max-w-md flex-col gap-5 rounded-2xl border border-border bg-surface-1/95 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="size-4 text-accent" />
                <h3 className="text-sm font-bold tracking-wide text-foreground">
                  {t.shortcuts.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseShortcuts}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-surface-2 hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.tabSwitch}
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                    1
                  </kbd>
                  <span className="text-[11px] text-slate-400">–</span>
                  <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                    {tabCount}
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.prevNextTab}
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                    [
                  </kbd>
                  <span className="text-[11px] text-slate-400">/</span>
                  <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                    ]
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.resetModel}
                </span>
                <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                  R
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.toggleMemo}
                </span>
                <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                  M
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.toggleScreener}
                </span>
                <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                  S
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.toggleLang}
                </span>
                <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                  L
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.exportCard}
                </span>
                <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                  E
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.openSnowflake}
                </span>
                <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                  W
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.toggleFavorite}
                </span>
                <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                  F
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.close}
                </span>
                <div className="flex items-center gap-1.5">
                  <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                    ?
                  </kbd>
                  <span className="text-[11px] text-slate-400">/</span>
                  <kbd className="shadow-xs rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-300">
                    Esc
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Media Card Export Modal */}
      <SocialCardModal
        isOpen={isSocialCardOpen}
        onClose={onCloseSocialCard}
        facts={facts}
        valuation={valuation}
        stressResult={stressResult ?? undefined}
        reportData={reportData ?? undefined}
        stressParams={stressParams}
        locale={locale}
        onShowToast={showToast}
      />

      {/* 30-Point Snowflake Audit Modal */}
      {snowflakeScore && facts && (
        <SnowflakeModal
          isOpen={isSnowflakeOpen}
          onClose={onCloseSnowflake}
          scoreResult={snowflakeScore}
          ticker={facts.ticker}
          company={facts.company}
          locale={locale}
          onOpenSocialCard={onOpenSocialCard}
        />
      )}

      {/* Floating Back to Top Button on Desktop */}
      {showBackToTop && (
        <button
          type="button"
          onClick={onScrollToTop}
          className="shadow-xs no-print fixed bottom-6 right-6 z-40 hidden animate-fade-in items-center gap-2 rounded-xl border border-border bg-surface-1/95 px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-foreground active:scale-95 lg:flex"
          title={locale === "zh" ? "回到顶部" : "Back to top"}
          aria-label="Back to top"
        >
          <ArrowUp className="size-3.5 text-accent" />
          <span className="font-medium">
            {locale === "zh" ? "回到顶部" : "Back to top"}
          </span>
        </button>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-fade-in items-center gap-2 rounded-xl border border-accent/40 bg-surface-2 px-4 py-2.5 text-xs font-semibold text-slate-100 shadow-2xl">
          <Check className="size-4 text-accent" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
