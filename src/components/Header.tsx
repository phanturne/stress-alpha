"use client";

import React from "react";
import {
  Activity,
  FileText,
  Share2,
  SlidersHorizontal,
  Upload,
  Zap,
} from "lucide-react";
import type { Facts, Valuation } from "@/lib/schemas";
import { ReportSelector } from "./ReportSelector";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface HeaderProps {
  facts?: Facts;
  valuation?: Valuation;
  currentSlug: string | null;
  onSelectReport: (slug: string) => void;
  viewMode: "cockpit" | "memo";
  onViewModeChange: (mode: "cockpit" | "memo") => void;
  onOpenUploadModal?: () => void;
  onShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  facts,
  valuation,
  currentSlug,
  onSelectReport,
  viewMode,
  onViewModeChange,
  onOpenUploadModal,
  onShare,
}) => {
  const currentPrice = facts?.currentPrice ?? 0;
  const weightedFairValue = valuation?.weightedFairValue ?? 0;
  const upsidePct = valuation?.upsidePct ?? 0;

  return (
    <header className="sticky top-0 z-30 w-full bg-surface-0/90 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Brand & Report Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-md shadow-accent/20">
            <Zap className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-base">
                Stress<span className="text-accent">Alpha</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-surface-2 border border-border text-[9px] font-mono text-slate-400 font-semibold tracking-wider uppercase">
                ENGINE
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-border mx-1 hidden sm:block" />

        {/* The New Feature: Direct Report Selection from reports/ folder */}
        <ReportSelector
          currentSlug={currentSlug}
          onSelectReport={onSelectReport}
        />
      </div>

      {/* Middle: Live Market Data Bar */}
      {facts && (
        <div className="hidden xl:flex items-center gap-6 px-4 py-1.5 rounded-lg bg-surface-1/70 border border-border/70 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">PRICE:</span>
            <span className="font-bold text-white">
              {formatCurrency(currentPrice)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">WFV:</span>
            <span
              className={`font-bold ${
                upsidePct >= 0 ? "text-fintech-green" : "text-fintech-red"
              }`}
            >
              {formatCurrency(weightedFairValue, 0)} ({formatPercent(upsidePct)})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">CLEAN EPS:</span>
            <span className="font-bold text-accent">
              {formatCurrency(facts.epsOperating)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">CONSENSUS:</span>
            <span className="text-slate-200">
              {facts.epsConsensus ? formatCurrency(facts.epsConsensus) : "N/A"}
            </span>
          </div>
        </div>
      )}

      {/* Right: View Mode, Share, Upload */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-surface-1 p-0.5 rounded-lg border border-border text-xs">
          <button
            type="button"
            onClick={() => onViewModeChange("cockpit")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
              viewMode === "cockpit"
                ? "bg-surface-3 text-accent font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cockpit</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("memo")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
              viewMode === "memo"
                ? "bg-surface-3 text-accent font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Memo</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border text-xs font-semibold text-slate-300 hover:text-accent transition-colors shadow-sm"
          title="Share current scenario (copies link with slider state)"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Upload Fallback Button */}
        {onOpenUploadModal && (
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            title="Upload custom folder"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        )}
      </div>
    </header>
  );
};
