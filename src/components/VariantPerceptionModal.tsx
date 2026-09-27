"use client";

import React, { useEffect } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  Scale,
  Activity,
} from "lucide-react";
import type { SanityAudit } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";

export interface VariantPerceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sanityAudit: SanityAudit;
  ticker: string;
  locale?: Locale;
}

export const VariantPerceptionModal: React.FC<VariantPerceptionModalProps> = ({
  isOpen,
  onClose,
  sanityAudit,
  ticker,
  locale = "en",
}) => {
  const t = getTranslations(locale).scenariosTab;
  const ca = sanityAudit.consensusAttribution;

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 duration-200 animate-in fade-in sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="glass-panel relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-surface-1/95 p-0 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent">
                  {ticker}
                </span>
                <h3 className="font-sans text-base font-bold tracking-tight text-white sm:text-lg">
                  {t.variantPerceptionTitle}
                </h3>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {t.variantPerceptionSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
          {/* Status Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              {t.dataCompletenessBadge(
                sanityAudit.dataCompletenessScore,
                sanityAudit.populatedModulesCount,
                sanityAudit.totalModulesCount
              )}
            </span>

            {ca && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-xs font-semibold ${
                  ca.divergenceClassification === "in_line"
                    ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                    : ca.divergenceClassification === "moderate_alpha"
                      ? "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                      : ca.divergenceClassification === "high_conviction_alpha"
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
                }`}
              >
                {t.divergenceLabels[ca.divergenceClassification]}
              </span>
            )}
          </div>

          {/* Quantitative Attribution Grid */}
          {ca && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.06] bg-surface-2/60 p-3.5 shadow-sm">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  {t.divergenceAttributionTitle}
                </span>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span
                    className={`font-mono text-2xl font-black tabular-nums ${
                      ca.divergencePct >= 0
                        ? "text-fintech-green"
                        : "text-fintech-red"
                    }`}
                  >
                    {ca.divergencePct >= 0 ? "+" : ""}
                    {ca.divergencePct.toFixed(1)}%
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  WFV {formatCurrency(ca.weightedFairValue, 2)} vs Street{" "}
                  {formatCurrency(ca.consensusTarget, 2)}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-surface-2/60 p-3.5 shadow-sm">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  {t.baseMultipleVsStreet}
                </span>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-black tabular-nums text-slate-100">
                    {ca.baseFairValue !== undefined
                      ? formatCurrency(ca.baseFairValue, 2)
                      : "—"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  {ca.multipleDeltaPct !== undefined
                    ? `${ca.multipleDeltaPct >= 0 ? "+" : ""}${ca.multipleDeltaPct.toFixed(1)}% multiple spread`
                    : "Base guidance multiple"}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-surface-2/60 p-3.5 shadow-sm">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  {t.regimeStressImpact}
                </span>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span
                    className={`font-mono text-2xl font-black tabular-nums ${
                      ca.regimeStressHaircutPct !== undefined &&
                      ca.regimeStressHaircutPct < 0
                        ? "text-fintech-red"
                        : "text-fintech-green"
                    }`}
                  >
                    {ca.regimeStressHaircutPct !== undefined
                      ? `${ca.regimeStressHaircutPct >= 0 ? "+" : ""}${ca.regimeStressHaircutPct.toFixed(1)}%`
                      : "—"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {t.discountedSafety}
                </p>
              </div>
            </div>
          )}

          {/* Institutional Analytical Stance */}
          {ca?.rationaleComment && (
            <div className="rounded-xl border border-accent/25 bg-accent/[0.07] p-4 shadow-sm">
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                <TrendingUp className="size-3.5" />
                <span>{t.modelStanceTitle}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-200 sm:text-sm">
                {ca.rationaleComment}
              </p>
            </div>
          )}

          {/* Audit Notices & Missing Modules */}
          {sanityAudit.issues.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-surface-2/40 p-4">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {t.dataNotesTitle} ({sanityAudit.issues.length})
              </span>
              <ul className="mt-2 space-y-1.5">
                {sanityAudit.issues.map((issue, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 font-mono text-[11px] leading-relaxed"
                  >
                    {issue.severity === "critical" ? (
                      <X className="mt-0.5 size-3.5 shrink-0 text-rose-400" />
                    ) : issue.severity === "warning" ? (
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                    ) : (
                      <Info className="mt-0.5 size-3.5 shrink-0 text-sky-400" />
                    )}
                    <span className="text-slate-300">
                      <strong className="text-slate-200">[{issue.code}]</strong>{" "}
                      {issue.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-white/[0.08] bg-surface-2/40 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface-3 px-4 py-2 font-mono text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            {t.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
};
