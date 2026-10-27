"use client";

import React from "react";
import { ChevronLeft, ChevronRight, FileText, Sliders } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";
import type { WorkspaceTabDescriptor } from "@/lib/workspace-tabs";
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
import { EstimatesTab } from "@/components/tabs/EstimatesTab";
import { MoatTab } from "@/components/tabs/MoatTab";
import { SegmentsTab } from "@/components/tabs/SegmentsTab";
import { CatalystsTab } from "@/components/tabs/CatalystsTab";
import { NewsTab } from "@/components/tabs/NewsTab";
import { AuditTab } from "@/components/tabs/AuditTab";
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

export function CockpitWorkspacePane({
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
                    reportData.valuation?.weightedFairValue ??
                    0
                )}
              </span>
              <span
                className={`text-xs ${
                  (dynamicValuation?.upsidePct ??
                    reportData.valuation?.upsidePct ??
                    0) >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {(dynamicValuation?.upsidePct ??
                  reportData.valuation?.upsidePct ??
                  0) >= 0
                  ? "+"
                  : ""}
                {formatPercent(
                  dynamicValuation?.upsidePct ??
                    reportData.valuation?.upsidePct ??
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
                ? "text-slate-300 hover:border-accent/40 hover:bg-surface-2 hover:text-white active:scale-95"
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
              const isActive = activeTab === tab.id;
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
                      ? "shadow-xs border border-border bg-surface-2 font-bold text-slate-100 dark:text-white"
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
                  {tab.count !== undefined && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums transition-all ${
                        isActive
                          ? "bg-accent/15 font-bold text-accent"
                          : "bg-surface-3/80 text-slate-400 group-hover:text-slate-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                  <kbd
                    className={`hidden rounded border border-border/80 px-1 py-0.5 font-mono text-[11px] font-medium transition-opacity ${
                      tab.count !== undefined
                        ? "opacity-0 group-hover:opacity-100"
                        : ""
                    } xl:inline ${
                      isActive
                        ? "bg-surface-3 text-slate-300"
                        : "bg-surface-0/60 text-slate-400 group-hover:text-slate-300"
                    }`}
                  >
                    {tab.shortcut}
                  </kbd>
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
                ? "text-slate-300 hover:border-accent/40 hover:bg-surface-2 hover:text-white active:scale-95"
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
          <div className="mx-1 hidden h-4 w-px bg-white/[0.08] lg:block" />
          <button
            type="button"
            onClick={() => onViewModeChange("memo")}
            className="shadow-xs hidden shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface-1 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-white active:scale-95 lg:flex xl:px-3"
            title={`${t.header.memo} (M)`}
          >
            <FileText className="size-3.5 text-accent" />
            <span className="hidden xl:inline">{t.header.memo}</span>
            <kbd className="rounded border border-border/80 bg-surface-0/60 px-1 py-0.5 font-mono text-[11px] text-slate-400">
              M
            </kbd>
          </button>
        </div>
      </div>

      {/* Scrollable Workspace Tab Contents (Independent scroll on desktop) */}
      <div
        ref={workspaceScrollRef}
        className="custom-scrollbar min-h-0 w-full flex-1 overflow-y-auto pr-0 lg:pr-1.5"
      >
        <div className="w-full">
          {(activeTab === "valuation" ||
            activeTab === "scenarios" ||
            activeTab === "sensitivity") && (
            <ScenariosTab
              scenariosData={displayScenarios!}
              currentPrice={displayFacts!.currentPrice}
              valuation={dynamicValuation ?? reportData.valuation}
              sensitivityData={
                dynamicValuation?.sensitivity ??
                reportData.valuation?.sensitivity ??
                []
              }
              onScenarioChange={onScenarioChange}
              locale={locale}
              revisions={valuationRevisions}
            />
          )}

          {activeTab === "estimates" && (
            <EstimatesTab
              estimatesData={displayEstimates}
              currentPrice={displayFacts?.currentPrice}
              locale={locale}
            />
          )}

          {activeTab === "moat" && (
            <MoatTab moatData={displayMoat} locale={locale} />
          )}

          {activeTab === "segments" && (
            <SegmentsTab facts={displayFacts!} locale={locale} />
          )}

          {activeTab === "catalysts" && (
            <CatalystsTab
              catalystsData={displayCatalysts}
              onProbabilityChange={onCatalystProbabilityChange}
              locale={locale}
            />
          )}

          {activeTab === "news" && (
            <NewsTab
              ticker={displayFacts?.ticker}
              events={marketEvents}
              upstreamDependencies={upstreamDependencies}
              currentPrice={displayFacts?.currentPrice}
              locale={locale}
              onSimulateShock={onSimulateShock}
              onSimulateGrossMarginDelta={onSimulateGrossMarginDelta}
              onSimulateCatalystProb={onSimulateCatalystProb}
              onNavigateToModel={onNavigateToModel}
            />
          )}

          {(activeTab === "audit" ||
            activeTab === "tone" ||
            activeTab === "filing" ||
            activeTab === "reactions") && (
            <AuditTab
              sentimentData={displaySentiment}
              filingData={displayFiling}
              reactionsData={displayReactions}
              locale={locale}
              ticker={reportData?.facts?.ticker}
            />
          )}

          {activeTab === "report" && (
            <div className="glass-panel shadow-xs flex flex-col gap-4 rounded-2xl border border-border p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-accent" />
                  <div>
                    <span className="block font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                      {reportDocLang === "zh"
                        ? t.page.reportTitleZh
                        : t.page.reportTitleEn}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {reportData.folderName}
                    </span>
                  </div>
                </div>

                {/* Language Switcher for Report View */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-border bg-surface-0/80 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setReportDocLang("en")}
                      className={`rounded-md px-3 py-1 font-semibold transition-all ${
                        reportDocLang === "en"
                          ? "shadow-xs bg-surface-2 text-accent ring-1 ring-border"
                          : "text-slate-400 hover:text-foreground"
                      }`}
                    >
                      English (report.md)
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportDocLang("zh")}
                      className={`rounded-md px-3 py-1 font-semibold transition-all ${
                        reportDocLang === "zh"
                          ? "shadow-xs bg-accent/20 font-bold text-accent ring-1 ring-accent/30"
                          : "text-slate-400 hover:text-foreground"
                      }`}
                    >
                      🇨🇳 中文研报 (report_zh.md)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const content =
                        reportDocLang === "zh"
                          ? reportData.reportMarkdownZh
                          : reportData.reportMarkdown;
                      if (content) {
                        navigator.clipboard.writeText(content);
                        showToast(
                          reportDocLang === "zh"
                            ? t.page.copiedZh
                            : t.page.copiedEn
                        );
                      }
                    }}
                    className="shadow-xs flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/90 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all hover:border-accent/40 hover:bg-surface-3 hover:text-foreground"
                  >
                    <span>{t.page.copyBtn}</span>
                  </button>
                </div>
              </div>
              <pre className="custom-scrollbar max-h-[72vh] overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-0/90 p-5 font-mono text-xs leading-relaxed text-slate-200 shadow-inner selection:bg-accent/30 sm:text-[13px]">
                {(reportDocLang === "zh"
                  ? reportData.reportMarkdownZh
                  : reportData.reportMarkdown) ||
                  (reportDocLang === "zh"
                    ? t.page.noReportFileZh
                    : t.page.noReportFileEn)}
              </pre>
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
}
