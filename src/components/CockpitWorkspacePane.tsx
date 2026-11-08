"use client";

import React from "react";
import { ChevronLeft, ChevronRight, FileText, Sliders } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";
import {
  normalizeWorkspaceTabId,
  type WorkspaceTabDescriptor,
} from "@/lib/workspace-tabs";
import type {
  Facts,
  ReportData,
  Scenarios,
  Scenario,
  Catalysts,
  Moat,
  Estimates,
  Filing,
  Sentiment,
  Reactions,
  MarketEvent,
  UpstreamDependency,
  ValuationRevision,
} from "@/lib/schemas";
import type { ValuationSchemaType } from "@/lib/valuation";
import { ScenariosTab } from "@/components/tabs/ScenariosTab";
import { TechnicalsTab } from "@/components/tabs/TechnicalsTab";
import { EstimatesTab } from "@/components/tabs/EstimatesTab";
import { MoatTab } from "@/components/tabs/MoatTab";
import { SegmentsTab } from "@/components/tabs/SegmentsTab";
import { CatalystsTab } from "@/components/tabs/CatalystsTab";
import { AuditTab } from "@/components/tabs/AuditTab";
import { ReactionsTab } from "@/components/tabs/ReactionsTab";
export type { WorkspaceTabDescriptor };

export interface CockpitWorkspacePaneProps {
  tabItems: WorkspaceTabDescriptor[];
  activeTab: string;
  currentTabIndex: number;
  prevTab: WorkspaceTabDescriptor | null;
  nextTab: WorkspaceTabDescriptor | null;
  switchWorkspace: (tabId: string) => void;
  tabScrollRef: React.RefObject<HTMLDivElement | null>;
  tabButtonRefs: React.MutableRefObject<
    Record<string, HTMLButtonElement | null>
  >;
  workspaceScrollRef: React.RefObject<HTMLDivElement | null>;
  onWheelTabScroll: (e: React.WheelEvent<HTMLDivElement>) => void;
  onViewModeChange: (
    mode: "cockpit" | "memo" | "screener" | "watchlist" | "settings"
  ) => void;
  mobileSection: "cockpit" | "workspaces";
  onAdjustShocks: () => void;
  locale: Locale;
  reportData: ReportData;
  displayFacts?: Facts;
  displayCatalysts?: Catalysts;
  displayScenarios?: Scenarios;
  displaySentiment?: Sentiment;
  displayFiling?: Filing;
  displayReactions?: Reactions;
  displayMoat?: Moat;
  displayEstimates?: Estimates;
  dynamicValuation?: ValuationSchemaType;
  valuationRevisions: ValuationRevision[];
  marketEvents: MarketEvent[];
  upstreamDependencies: UpstreamDependency[];
  onScenarioChange: (idx: number, patch: Partial<Scenario>) => void;
  onCatalystProbabilityChange: (idx: number, prob: number) => void;
  onSimulateShock: (driverId: string, shockPct: number) => void;
  onSimulateGrossMarginDelta: (bps: number) => void;
  onSimulateCatalystProb: (catalystId: string, prob: number) => void;
  onNavigateToModel: () => void;
  reportDocLang: Locale;
  setReportDocLang: (lang: Locale) => void;
  showToast: (msg: string) => void;
}

export const CockpitWorkspacePane = React.memo(function CockpitWorkspacePane({
  tabItems,
  activeTab,
  currentTabIndex,
  prevTab,
  nextTab,
  switchWorkspace,
  tabScrollRef,
  tabButtonRefs,
  workspaceScrollRef,
  onWheelTabScroll,
  onViewModeChange,
  mobileSection,
  onAdjustShocks,
  locale,
  reportData,
  displayFacts,
  displayCatalysts,
  displayScenarios,
  displaySentiment,
  displayFiling,
  displayReactions,
  displayMoat,
  displayEstimates,
  dynamicValuation,
  valuationRevisions,
  marketEvents,
  upstreamDependencies,
  onScenarioChange,
  onCatalystProbabilityChange,
  onSimulateShock,
  onSimulateGrossMarginDelta,
  onSimulateCatalystProb,
  onNavigateToModel,
  reportDocLang,
  setReportDocLang,
  showToast,
}: CockpitWorkspacePaneProps) {
  const t = getTranslations(locale);
  const effectiveTab = normalizeWorkspaceTabId(activeTab);

  return (
    <div
      className={`flex w-full min-w-0 flex-1 flex-col gap-3 lg:h-full lg:min-h-0 lg:overflow-hidden ${
        mobileSection === "workspaces" ? "flex" : "hidden lg:flex"
      }`}
    >
      {/* Mobile Live Valuation Bar when viewing tabs */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-1/90 px-3.5 py-2.5 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {displayFacts?.ticker} {displayFacts?.quarter}
            </div>
            <div className="flex items-baseline gap-2 font-mono text-sm font-bold text-slate-100">
              <span>
                {formatCurrency(
                  dynamicValuation?.weightedFairValue ??
                    reportData?.valuation?.weightedFairValue ??
                    0
                )}
              </span>
              <span
                className={`text-xs ${
                  (dynamicValuation?.upsidePct ??
                    reportData?.valuation?.upsidePct ??
                    0) >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {(dynamicValuation?.upsidePct ??
                  reportData?.valuation?.upsidePct ??
                  0) >= 0
                  ? "+"
                  : ""}
                {formatPercent(
                  dynamicValuation?.upsidePct ??
                    reportData?.valuation?.upsidePct ??
                    0
                )}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdjustShocks}
          className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/15 px-2.5 py-1.5 text-[11px] font-bold text-accent transition-all hover:bg-accent/25 active:scale-95"
        >
          <Sliders className="size-3" />
          <span>{t.cockpit.adjustShocks}</span>
        </button>
      </div>

      {/* Tab Navigation Ribbon - Pinned at top of right panel on desktop, sticky on mobile */}
      <div className="glass-header lg:shadow-xs sticky top-14 z-30 -mx-3 shrink-0 px-3 py-1.5 sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 lg:static lg:mx-0 lg:shrink-0 lg:rounded-2xl lg:border lg:border-border lg:bg-surface-1/90 lg:p-1.5 lg:backdrop-blur-xl">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Desktop Prev Workspace Step Button */}
          <button
            type="button"
            disabled={!prevTab}
            onClick={() => {
              if (prevTab) {
                switchWorkspace(prevTab.id);
              }
            }}
            className={`hidden size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-1 transition-all lg:flex ${
              prevTab
                ? "text-slate-300 hover:border-accent/40 hover:bg-surface-2 hover:text-foreground active:scale-95"
                : "cursor-not-allowed text-slate-600 opacity-30"
            }`}
            title={
              prevTab
                ? `${t.tabs.prevTab}: ${prevTab.label} ([)`
                : t.tabs.prevTab
            }
            aria-label="Previous Workspace"
          >
            <ChevronLeft className="size-4" />
          </button>

          {/* Tabs Container with Mouse Wheel Support */}
          <div
            ref={tabScrollRef}
            onWheel={onWheelTabScroll}
            className="custom-scrollbar flex flex-1 items-center gap-1 overflow-x-auto py-0.5 sm:gap-1.5"
          >
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = effectiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabButtonRefs.current[tab.id] = el;
                  }}
                  type="button"
                  onClick={() => switchWorkspace(tab.id)}
                  title={`${tab.label} (${locale === "zh" ? "快捷键" : "Press"} ${tab.shortcut})`}
                  className={`group flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-1.5 text-xs font-semibold transition-all duration-150 xl:px-2.5 xl:py-2 ${
                    isActive
                      ? "shadow-xs border border-border bg-surface-2 font-bold text-foreground"
                      : "border border-transparent text-slate-400 hover:bg-surface-1 hover:text-slate-200"
                  }`}
                >
                  <Icon
                    className={`size-3.5 shrink-0 ${
                      isActive
                        ? "text-accent"
                        : "text-slate-400 group-hover:text-slate-300"
                    }`}
                  />
                  <span className="2xl:hidden">{tab.shortLabel}</span>
                  <span className="hidden 2xl:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Next Workspace Step Button */}
          <button
            type="button"
            disabled={!nextTab}
            onClick={() => {
              if (nextTab) {
                switchWorkspace(nextTab.id);
              }
            }}
            className={`hidden size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-1 transition-all lg:flex ${
              nextTab
                ? "text-slate-300 hover:border-accent/40 hover:bg-surface-2 hover:text-foreground active:scale-95"
                : "cursor-not-allowed text-slate-600 opacity-30"
            }`}
            title={
              nextTab
                ? `${t.tabs.nextTab}: ${nextTab.label} (])`
                : t.tabs.nextTab
            }
            aria-label="Next Workspace"
          >
            <ChevronRight className="size-4" />
          </button>

          {/* Research Memo Action Button docked next to chevrons */}
          <div className="mx-1 hidden h-4 w-px bg-border lg:block" />
          <button
            type="button"
            onClick={() => onViewModeChange("memo")}
            className="shadow-xs hidden shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface-1 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-foreground active:scale-95 lg:flex xl:px-3"
            title={`${t.header.memo} (M)`}
          >
            <FileText className="size-3.5 text-accent" />
            <span className="hidden xl:inline">{t.header.memo}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Workspace Tab Contents (Independent scroll on desktop) */}
      <div
        ref={workspaceScrollRef}
        className="custom-scrollbar min-h-0 w-full flex-1 overflow-y-auto pr-0 lg:pr-1.5"
      >
        <div className="flex w-full flex-col gap-6">
          {/* WORKSPACE 1: CHART & LEVELS (technicals) */}
          {effectiveTab === "technicals" && (
            <div className="flex flex-col gap-6">
              {(() => {
                const val = dynamicValuation ?? reportData?.valuation;
                const scenarioResults = val?.scenarioResults ?? [];
                const baseTarget = scenarioResults.find(
                  (s) => s.name === "Base"
                )?.fairValue;
                const bullTarget = scenarioResults.find(
                  (s) => s.name === "Bull"
                )?.fairValue;
                const bearTarget = scenarioResults.find(
                  (s) => s.name === "Bear"
                )?.fairValue;
                const panicTarget =
                  val?.stressTest?.valuationBands?.panic?.targetPrice;
                const activePrice =
                  displayFacts?.currentPrice ??
                  reportData?.technicalLevels?.currentPrice ??
                  0;
                const trailingEps =
                  displayFacts?.trailingEps ??
                  reportData?.facts?.trailingEps ??
                  0;
                const forwardEps =
                  displayFacts?.forwardEpsConsensus ??
                  reportData?.facts?.forwardEpsConsensus ??
                  0;
                const reportedPe =
                  displayFacts?.trailingPe ??
                  reportData?.facts?.trailingPe ??
                  displayFacts?.forwardPe ??
                  reportData?.facts?.forwardPe;
                const currentPe =
                  reportedPe && reportedPe > 0
                    ? Number(reportedPe.toFixed(1))
                    : activePrice > 0 && trailingEps > 0
                      ? Number((activePrice / trailingEps).toFixed(1))
                      : activePrice > 0 && forwardEps > 0
                        ? Number((activePrice / forwardEps).toFixed(1))
                        : undefined;
                const operatingEps =
                  trailingEps > 0
                    ? trailingEps
                    : (displayFacts?.epsOperating ??
                      reportData?.facts?.epsOperating);

                return (
                  <TechnicalsTab
                    ticker={
                      displayFacts?.ticker || reportData?.facts?.ticker || "SPY"
                    }
                    currentPrice={activePrice}
                    currentPe={currentPe}
                    operatingEps={operatingEps}
                    technicalLevels={reportData?.technicalLevels}
                    valuation={{
                      panic: panicTarget,
                      bear: bearTarget,
                      base: baseTarget,
                      bull: bullTarget,
                    }}
                    locale={locale}
                  />
                );
              })()}

              {displayReactions &&
                displayReactions.events &&
                displayReactions.events.length > 0 && (
                  <div className="border-t border-border/60 pt-2">
                    <ReactionsTab
                      reactionsData={displayReactions}
                      locale={locale}
                    />
                  </div>
                )}
            </div>
          )}

          {/* WORKSPACE 2: VALUATION & DRIVERS (valuation, scenarios, sensitivity, segments, catalysts) */}
          {effectiveTab === "valuation" && (
            <div className="flex flex-col gap-6">
              <ScenariosTab
                scenariosData={displayScenarios!}
                currentPrice={displayFacts!.currentPrice}
                valuation={dynamicValuation ?? reportData?.valuation}
                sensitivityData={
                  dynamicValuation?.sensitivity ??
                  reportData?.valuation?.sensitivity ??
                  []
                }
                onScenarioChange={onScenarioChange}
                locale={locale}
                revisions={valuationRevisions}
              />

              {displayFacts &&
                displayFacts.segments &&
                displayFacts.segments.length > 0 && (
                  <div className="border-t border-border/60 pt-2">
                    <SegmentsTab facts={displayFacts} locale={locale} />
                  </div>
                )}

              {displayCatalysts &&
                displayCatalysts.catalysts &&
                displayCatalysts.catalysts.length > 0 && (
                  <div className="border-t border-border/60 pt-2">
                    <CatalystsTab
                      catalystsData={displayCatalysts}
                      onProbabilityChange={onCatalystProbabilityChange}
                      locale={locale}
                    />
                  </div>
                )}
            </div>
          )}

          {/* WORKSPACE 3: CONSENSUS, MOAT & FILINGS (estimates, moat, audit, tone, filing) */}
          {effectiveTab === "estimates" && (
            <div className="flex flex-col gap-6">
              <EstimatesTab
                estimatesData={displayEstimates}
                currentPrice={displayFacts?.currentPrice}
                locale={locale}
              />

              {displayMoat && (
                <div className="border-t border-border/60 pt-2">
                  <MoatTab moatData={displayMoat} locale={locale} />
                </div>
              )}

              {(displaySentiment || displayFiling) && (
                <div className="border-t border-border/60 pt-2">
                  <AuditTab
                    sentimentData={displaySentiment}
                    filingData={displayFiling}
                    reactionsData={displayReactions}
                    locale={locale}
                    ticker={reportData?.facts?.ticker}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sequential Bottom Workspace Pager (Unified Glass Capsule) - Mobile Only */}
        <div className="mt-8 flex items-center justify-center border-t border-border/40 pb-8 pt-5 lg:hidden">
          <div className="flex w-full max-w-2xl items-center justify-between rounded-2xl border border-border/60 bg-surface-1/80 p-1.5 shadow-xl backdrop-blur-md sm:p-2">
            {/* Left: Previous Workspace */}
            <div className="min-w-0">
              {prevTab ? (
                <button
                  type="button"
                  onClick={() => switchWorkspace(prevTab.id)}
                  className="group flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground/80 transition-all hover:bg-surface-2 hover:text-foreground active:scale-95 sm:gap-2 sm:px-3 sm:py-2"
                >
                  <ChevronLeft className="size-3.5 shrink-0 text-foreground/50 transition-transform group-hover:-translate-x-0.5 group-hover:text-foreground sm:size-4" />
                  <span className="hidden font-normal text-foreground/50 md:inline">
                    {t.tabs.prevTab}:
                  </span>
                  <span className="truncate font-bold text-foreground/90 group-hover:text-foreground md:hidden">
                    {prevTab.shortLabel}
                  </span>
                  <span className="hidden truncate font-bold text-foreground/90 group-hover:text-foreground md:inline">
                    {prevTab.label}
                  </span>
                </button>
              ) : (
                <div className="w-14 sm:w-24" />
              )}
            </div>

            {/* Center: Step Indicator Dots */}
            <div className="flex items-center gap-1.5 px-1 sm:gap-2">
              <div className="flex items-center gap-1">
                {tabItems.map((tab, idx) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchWorkspace(tab.id)}
                    title={tab.label}
                    className={`rounded-full transition-all ${
                      idx === currentTabIndex
                        ? "h-1.5 w-4 bg-accent sm:w-5"
                        : "size-1.5 bg-surface-3 hover:bg-foreground/40"
                    }`}
                    aria-label={`Jump to ${tab.label}`}
                  />
                ))}
              </div>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground/60">
                {currentTabIndex + 1}{" "}
                <span className="text-foreground/30">/</span> {tabItems.length}
              </span>
            </div>

            {/* Right: Next Workspace */}
            <div className="min-w-0">
              {nextTab ? (
                <button
                  type="button"
                  onClick={() => switchWorkspace(nextTab.id)}
                  className="hover:text-accent-bright group flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent shadow-sm transition-all hover:border-accent/50 hover:bg-accent/20 active:scale-95 sm:gap-2 sm:px-3 sm:py-2"
                >
                  <span className="hidden font-normal text-accent/70 md:inline">
                    {t.tabs.nextTab}:
                  </span>
                  <span className="group-hover:text-accent-bright truncate font-bold text-accent md:hidden">
                    {nextTab.shortLabel}
                  </span>
                  <span className="group-hover:text-accent-bright hidden truncate font-bold text-accent md:inline">
                    {nextTab.label}
                  </span>
                  <ChevronRight className="size-3.5 shrink-0 text-accent transition-transform group-hover:translate-x-0.5 sm:size-4" />
                </button>
              ) : (
                <div className="w-14 sm:w-24" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
