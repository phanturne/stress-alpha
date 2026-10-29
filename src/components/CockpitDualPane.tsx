"use client";

import React from "react";
import { Sliders, BarChart3, ArrowRight } from "lucide-react";
import { Cockpit } from "@/components/Cockpit";
import {
  CockpitWorkspacePane,
  type WorkspaceTabDescriptor,
} from "@/components/CockpitWorkspacePane";
import { getTranslations, type Locale } from "@/lib/i18n";
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
import type {
  StressTestParams,
  StressedValuationResult,
  ValuationSchemaType,
} from "@/lib/valuation";
import type { SnowflakeScoreResult } from "@/lib/snowflake";
import type { ReportSummary } from "@/app/api/reports/route";
import type { getLocalizedArtifacts } from "@/lib/localized-report";

export interface CockpitDualPaneProps {
  reportData: ReportData;
  artifacts?: ReturnType<typeof getLocalizedArtifacts>;
  displayFacts?: Facts;
  displayCatalysts?: Catalysts;
  displayScenarios?: Scenarios;
  displaySentiment?: Sentiment;
  displayFiling?: Filing;
  displayReactions?: Reactions;
  displayMoat?: Moat;
  displayEstimates?: Estimates;
  stressParams: StressTestParams;
  stressResult: StressedValuationResult | null;
  dynamicValuation?: ValuationSchemaType;
  snowflakeScore?: SnowflakeScoreResult | null;
  latestReport?: ReportSummary;
  isViewingHistorical: boolean;
  onSelectReport: (slug: string, mode?: "cockpit" | "memo") => void;
  onDriverShockChange: (driverId: string, shockPct: number) => void;
  onGrossMarginDeltaChange: (bps: number) => void;
  onFixedOpexShiftChange: (shiftPct: number) => void;
  onResetDefaults: () => void;
  onOpenSnowflake: () => void;
  mobileSection: "cockpit" | "workspaces";
  setMobileSection: React.Dispatch<
    React.SetStateAction<"cockpit" | "workspaces">
  >;
  locale: Locale;
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

export const CockpitDualPane = React.memo(function CockpitDualPane({
  reportData,
  artifacts,
  displayFacts = artifacts?.facts,
  displayCatalysts = artifacts?.catalysts,
  displayScenarios = artifacts?.scenarios,
  displaySentiment = artifacts?.sentiment,
  displayFiling = artifacts?.filing,
  displayReactions = artifacts?.reactions,
  displayMoat = artifacts?.moat,
  displayEstimates = artifacts?.estimates,
  stressParams,
  stressResult,
  dynamicValuation,
  snowflakeScore,
  latestReport,
  isViewingHistorical,
  onSelectReport,
  onDriverShockChange,
  onGrossMarginDeltaChange,
  onFixedOpexShiftChange,
  onResetDefaults,
  onOpenSnowflake,
  mobileSection,
  setMobileSection,
  locale,
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
}: CockpitDualPaneProps) {
  const t = getTranslations(locale);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-5 lg:flex-row lg:items-stretch xl:gap-6">
      {/* Mobile Switcher: [ Cockpit ] [ Deep Dive (7) ] */}
      <div className="-mx-3 mb-1 flex w-[calc(100%+24px)] items-center justify-between px-3 py-1 lg:hidden">
        <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-border bg-surface-1 p-1">
          <button
            type="button"
            onClick={() => {
              setMobileSection("cockpit");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-colors ${
              mobileSection === "cockpit"
                ? "shadow-xs border-border bg-surface-2 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders
              className={`size-3.5 ${
                mobileSection === "cockpit" ? "text-accent" : "text-slate-400"
              }`}
            />
            <span>{t.cockpit.mobileCockpitTab}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileSection("workspaces");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-colors ${
              mobileSection === "workspaces"
                ? "shadow-xs border-border bg-surface-2 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3
              className={`size-3.5 ${
                mobileSection === "workspaces"
                  ? "text-accent"
                  : "text-slate-400"
              }`}
            />
            <span>{t.cockpit.mobileWorkspacesTab}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 font-mono text-[11px] ${
                mobileSection === "workspaces"
                  ? "bg-accent/15 font-bold text-accent"
                  : "bg-surface-3 text-slate-400"
              }`}
            >
              7
            </span>
          </button>
        </div>
      </div>

      {/* Left Model Pane (~400px responsive) */}
      <div
        id="model-cockpit-pane"
        className={`w-full shrink-0 lg:h-full lg:min-h-0 lg:w-[380px] xl:w-[415px] 2xl:w-[440px] ${
          mobileSection === "cockpit" ? "block" : "hidden lg:block"
        }`}
      >
        <Cockpit
          baseline={reportData.baseline!}
          facts={displayFacts!}
          stressParams={stressParams}
          stressResult={stressResult!}
          valuation={dynamicValuation ?? reportData.valuation}
          snowflakeScore={snowflakeScore}
          reportData={{
            ...reportData,
            facts: displayFacts!,
            catalysts: displayCatalysts,
            scenarios: displayScenarios!,
            moat: displayMoat,
            estimates: displayEstimates,
            filing: displayFiling,
            valuation: dynamicValuation ?? reportData.valuation,
          }}
          latestSlug={latestReport?.slug}
          latestQuarter={latestReport?.quarter}
          isHistorical={isViewingHistorical}
          onSelectReport={onSelectReport}
          onDriverShockChange={onDriverShockChange}
          onGrossMarginDeltaChange={onGrossMarginDeltaChange}
          onFixedOpexShiftChange={onFixedOpexShiftChange}
          onResetDefaults={onResetDefaults}
          onOpenSnowflake={onOpenSnowflake}
          locale={locale}
        />
        <div className="mt-4 block lg:hidden">
          <button
            type="button"
            onClick={() => {
              setMobileSection("workspaces");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/15 py-3 text-xs font-bold text-accent shadow-sm transition-all hover:bg-accent/25 active:scale-[0.99]"
          >
            <span>{t.cockpit.exploreWorkspaces}</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Right Tabbed Intelligence Workspace */}
      <CockpitWorkspacePane
        tabItems={tabItems}
        activeTab={activeTab}
        currentTabIndex={currentTabIndex}
        prevTab={prevTab}
        nextTab={nextTab}
        switchWorkspace={switchWorkspace}
        tabScrollRef={tabScrollRef}
        tabButtonRefs={tabButtonRefs}
        workspaceScrollRef={workspaceScrollRef}
        onWheelTabScroll={onWheelTabScroll}
        onViewModeChange={onViewModeChange}
        mobileSection={mobileSection}
        onAdjustShocks={() => {
          setMobileSection("cockpit");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        locale={locale}
        reportData={reportData}
        displayFacts={displayFacts}
        displayCatalysts={displayCatalysts}
        displayScenarios={displayScenarios}
        displaySentiment={displaySentiment}
        displayFiling={displayFiling}
        displayReactions={displayReactions}
        displayMoat={displayMoat}
        displayEstimates={displayEstimates}
        dynamicValuation={dynamicValuation}
        valuationRevisions={valuationRevisions}
        marketEvents={marketEvents}
        upstreamDependencies={upstreamDependencies}
        onScenarioChange={onScenarioChange}
        onCatalystProbabilityChange={onCatalystProbabilityChange}
        onSimulateShock={onSimulateShock}
        onSimulateGrossMarginDelta={onSimulateGrossMarginDelta}
        onSimulateCatalystProb={onSimulateCatalystProb}
        onNavigateToModel={onNavigateToModel}
        reportDocLang={reportDocLang}
        setReportDocLang={setReportDocLang}
        showToast={showToast}
      />
    </div>
  );
});
