"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { compareReportsByRecency } from "@/lib/utils";
import { Header } from "@/components/Header";
import { CockpitSkeleton } from "@/components/CockpitSkeleton";
import { MemoView } from "@/components/MemoView";
import { ScreenerView } from "@/components/ScreenerView";
import { WatchlistView } from "@/components/WatchlistView";
import { NoReportSelected } from "@/components/NoReportSelected";
import { CockpitDualPane } from "@/components/CockpitDualPane";
import { CockpitModals } from "@/components/CockpitModals";
import { getWorkspaceTabs } from "@/lib/workspace-tabs";
import { getLocalizedArtifacts } from "@/lib/localized-report";
import { computeSnowflakeScore } from "@/lib/snowflake";
import { getTranslations, type Locale } from "@/lib/i18n";
import { useWatchlist } from "@/lib/watchlist";
import { useReportData } from "@/hooks/useReportData";
import { useStressModel } from "@/hooks/useStressModel";
import { useReportNavigation } from "@/hooks/useReportNavigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { ReportData } from "@/lib/schemas";

function HomePageContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("report") || null;
  const initialMode =
    (searchParams.get("mode") as
      "cockpit" | "memo" | "screener" | "watchlist" | null) ||
    (!initialSlug ? "screener" : "cockpit");
  const initialTab = searchParams.get("tab") || "valuation";

  const [currentSlug, setCurrentSlug] = useState<string | null>(initialSlug);
  const [locale, setLocale] = useState<Locale>("en");
  const [reportDocLang, setReportDocLang] = useState<Locale>("en");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSocialCardOpen, setIsSocialCardOpen] = useState(false);
  const [isSnowflakeOpen, setIsSnowflakeOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toggleFavorite, isAuthenticated } = useWatchlist();
  const t = getTranslations(locale);

  // Restore saved language preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "stress_alpha_locale"
      ) as Locale | null;
      if (saved === "en" || saved === "zh") {
        Promise.resolve().then(() => {
          setLocale(saved);
          setReportDocLang(saved);
        });
      }
    } catch (e) {
      console.warn("Could not load locale preference:", e);
    }
  }, []);

  const handleToggleLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    try {
      localStorage.setItem("stress_alpha_locale", newLocale);
    } catch (e) {
      console.warn("Could not save locale preference:", e);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2500);
  }, []);

  // 1. TanStack Query for reports, active report, revisions, and market events
  const {
    reports,
    isReportsLoading,
    reportData,
    setReportData,
    isReportLoading,
    marketEvents,
    upstreamDependencies,
    valuationRevisions,
  } = useReportData({
    currentSlug,
    onError: (err) => showToast(`Failed to load report: ${err.message}`),
  });

  // 2. Deterministic Stress Valuation Model & Live Sliders
  const {
    stressParams,
    setStressParams,
    initStressParamsFromReport,
    setPendingStressOverrides,
    handleDriverShockChange,
    handleGrossMarginDeltaChange,
    handleFixedOpexShiftChange,
    handleResetDefaults,
    handleSimulateShock,
    handleSimulateGrossMarginDelta,
    handleSimulateCatalystProb,
    handleCatalystProbabilityChange,
    handleScenarioChange,
    handleNavigateToModel,
    stressResult,
    dynamicValuation,
  } = useStressModel({
    reportData,
    setReportData,
    onShowToast: showToast,
    resetSlidersToastMsg: t.page.resetSlidersToast,
    onNavigateToCockpit: () => setMobileSection("cockpit"),
  });

  // Automatically initialize driver shocks when a fresh report loads
  const lastInitSlugRef = useRef<string | null>(null);
  useEffect(() => {
    if (reportData && reportData.folderName !== lastInitSlugRef.current) {
      lastInitSlugRef.current = reportData.folderName;
      initStressParamsFromReport(reportData);
    }
  }, [reportData, initStressParamsFromReport]);

  // 3. Navigation, Deep-link URL Synchronization & Workspace Scrolling
  const {
    viewMode,
    setViewMode,
    activeTab,
    mobileSection,
    setMobileSection,
    showBackToTop,
    tabScrollRef,
    tabButtonRefs,
    workspaceScrollRef,
    switchWorkspace,
    handleScrollToTop,
    handleViewModeChange,
    handleSelectReport,
    handleWheelTabScroll,
    syncStateToUrl,
  } = useReportNavigation({
    currentSlug,
    setCurrentSlug,
    initialMode,
    initialTab,
    locale,
    setLocale,
    onSetReportDocLang: setReportDocLang,
    stressParams,
    setPendingStressOverrides,
    setStressParams,
    isLoading: isReportLoading,
  });

  // Localized artifacts resolution
  const artifacts = useMemo(
    () => getLocalizedArtifacts(reportData, locale),
    [reportData, locale]
  );

  // 5-Pillar Snowflake Score calculation
  const snowflakeScore = useMemo(() => {
    if (!reportData || !artifacts.facts) return null;
    const effectiveReportData: ReportData = {
      ...reportData,
      facts: artifacts.facts,
      catalysts: artifacts.catalysts,
      scenarios: artifacts.scenarios ?? reportData.scenarios,
      moat: artifacts.moat,
      estimates: artifacts.estimates,
      valuation: dynamicValuation ?? reportData.valuation,
    };
    return computeSnowflakeScore(
      effectiveReportData,
      stressResult ?? undefined,
      locale
    );
  }, [reportData, artifacts, dynamicValuation, stressResult, locale]);

  // 7 Focused Intelligence Workspaces (+ Report Tab)
  const tabItems = useMemo(
    () => getWorkspaceTabs(t, reportData, marketEvents.length, artifacts.isZh),
    [t, reportData, marketEvents.length, artifacts.isZh]
  );

  const currentTabIndex = useMemo(() => {
    const idx = tabItems.findIndex((tab) => tab.id === activeTab);
    return idx >= 0 ? idx : 0;
  }, [tabItems, activeTab]);

  const prevTab = currentTabIndex > 0 ? tabItems[currentTabIndex - 1] : null;
  const nextTab =
    currentTabIndex < tabItems.length - 1
      ? tabItems[currentTabIndex + 1]
      : null;

  // 4. Global Keyboard Shortcuts
  useKeyboardShortcuts({
    tabItems,
    currentTabIndex,
    switchWorkspace,
    onResetDefaults: handleResetDefaults,
    onToggleMemo: () => {
      if (!currentSlug) return;
      setViewMode((prev) => (prev === "cockpit" ? "memo" : "cockpit"));
    },
    onOpenScreener: () => handleViewModeChange("screener"),
    onToggleLocale: () => handleToggleLocale(locale === "zh" ? "en" : "zh"),
    onToggleSocialCard: () => {
      if (!currentSlug || !reportData) return;
      setIsSocialCardOpen((prev) => !prev);
    },
    onToggleSnowflake: () => {
      if (!currentSlug || !reportData) return;
      setIsSnowflakeOpen((prev) => !prev);
    },
    onToggleFavorite: () => {
      const symbol = reportData?.facts?.ticker || currentSlug;
      if (symbol) {
        if (!isAuthenticated) {
          toggleFavorite(symbol);
          showToast(t.header.signInRequiredToast);
          return;
        }
        const added = toggleFavorite(symbol);
        showToast(
          added
            ? t.header.addedToWatchlistToast(symbol)
            : t.header.removedFromWatchlistToast(symbol)
        );
      }
    },
    onToggleShortcuts: () => setIsShortcutsOpen((prev) => !prev),
    isSnowflakeOpen,
    setIsSnowflakeOpen,
    isSocialCardOpen,
    setIsSocialCardOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
    viewMode,
  });

  // Historical multi-quarter reporting state
  const currentTicker = reportData?.facts?.ticker;
  const siblingReports = useMemo(() => {
    if (!reports || reports.length === 0 || !currentTicker) return [];
    return reports
      .filter((r) => r.ticker === currentTicker)
      .sort(compareReportsByRecency);
  }, [reports, currentTicker]);

  const latestReport = siblingReports[0];
  const isViewingHistorical = Boolean(
    latestReport && currentSlug && latestReport.slug !== currentSlug
  );

  return (
    <div
      className={`flex min-h-screen flex-col bg-background text-foreground ${viewMode === "cockpit" ? "lg:h-screen lg:overflow-hidden" : ""}`}
    >
      <Header
        facts={artifacts.facts}
        valuation={dynamicValuation ?? reportData?.valuation}
        currentSlug={currentSlug}
        reports={reports}
        onSelectReport={handleSelectReport}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
        onShare={() => {
          syncStateToUrl();
          setIsSocialCardOpen(true);
        }}
        onOpenSnowflake={() => setIsSnowflakeOpen(true)}
        locale={locale}
        onToggleLocale={handleToggleLocale}
      />

      <main
        className={`mx-auto w-full min-w-0 max-w-[1680px] flex-1 p-3 sm:p-5 md:p-6 ${viewMode === "cockpit" ? "lg:h-[calc(100vh-3.5rem)] lg:min-h-0 lg:overflow-hidden lg:p-4 xl:p-5" : ""}`}
      >
        {/* Screener View */}
        <div className={viewMode === "screener" ? "block" : "hidden"}>
          <ScreenerView
            reports={reports}
            onSelectReport={handleSelectReport}
            locale={locale}
            isLoading={isReportsLoading}
          />
        </div>

        {/* Watchlist View */}
        <div className={viewMode === "watchlist" ? "block" : "hidden"}>
          <WatchlistView
            reports={reports}
            onSelectReport={handleSelectReport}
            locale={locale}
            isLoading={isReportsLoading}
          />
        </div>

        {/* Cockpit / Model View */}
        <div
          className={
            viewMode === "cockpit"
              ? "block lg:h-full lg:min-h-0 lg:overflow-hidden"
              : "hidden"
          }
        >
          {isReportLoading ? (
            <CockpitSkeleton />
          ) : !currentSlug || !reportData || !stressResult ? (
            <NoReportSelected
              onOpenScreener={() => handleViewModeChange("screener")}
              locale={locale}
            />
          ) : (
            <CockpitDualPane
              reportData={reportData}
              artifacts={artifacts}
              stressParams={stressParams}
              stressResult={stressResult}
              dynamicValuation={dynamicValuation}
              snowflakeScore={snowflakeScore}
              latestReport={latestReport}
              isViewingHistorical={isViewingHistorical}
              onSelectReport={handleSelectReport}
              onDriverShockChange={handleDriverShockChange}
              onGrossMarginDeltaChange={handleGrossMarginDeltaChange}
              onFixedOpexShiftChange={handleFixedOpexShiftChange}
              onResetDefaults={handleResetDefaults}
              onOpenSnowflake={() => setIsSnowflakeOpen(true)}
              mobileSection={mobileSection}
              setMobileSection={setMobileSection}
              locale={locale}
              tabItems={tabItems}
              activeTab={activeTab}
              currentTabIndex={currentTabIndex}
              prevTab={prevTab}
              nextTab={nextTab}
              switchWorkspace={switchWorkspace}
              tabScrollRef={tabScrollRef}
              tabButtonRefs={tabButtonRefs}
              workspaceScrollRef={workspaceScrollRef}
              onWheelTabScroll={handleWheelTabScroll}
              onViewModeChange={handleViewModeChange}
              valuationRevisions={valuationRevisions}
              marketEvents={marketEvents}
              upstreamDependencies={upstreamDependencies}
              onScenarioChange={handleScenarioChange}
              onCatalystProbabilityChange={handleCatalystProbabilityChange}
              onSimulateShock={handleSimulateShock}
              onSimulateGrossMarginDelta={handleSimulateGrossMarginDelta}
              onSimulateCatalystProb={handleSimulateCatalystProb}
              onNavigateToModel={handleNavigateToModel}
              reportDocLang={reportDocLang}
              setReportDocLang={setReportDocLang}
              showToast={showToast}
            />
          )}
        </div>

        {/* Research Memo View */}
        {viewMode === "memo" && reportData && stressResult && (
          <MemoView
            reportData={{
              ...reportData,
              facts: artifacts.facts!,
              catalysts: artifacts.catalysts,
              scenarios: artifacts.scenarios!,
              filing: artifacts.filing,
              valuation: dynamicValuation ?? reportData.valuation,
            }}
            stressResult={stressResult}
            latestSlug={latestReport?.slug}
            latestQuarter={latestReport?.quarter}
            isHistorical={isViewingHistorical}
            onSelectReport={handleSelectReport}
            onBackToCockpit={() => handleViewModeChange("cockpit")}
            onOpenSocialCard={() => setIsSocialCardOpen(true)}
            onOpenSnowflake={() => setIsSnowflakeOpen(true)}
            locale={locale}
            onLocaleChange={handleToggleLocale}
          />
        )}
      </main>

      <CockpitModals
        isShortcutsOpen={isShortcutsOpen}
        onCloseShortcuts={() => setIsShortcutsOpen(false)}
        tabCount={tabItems.length}
        isSocialCardOpen={isSocialCardOpen}
        onCloseSocialCard={() => setIsSocialCardOpen(false)}
        isSnowflakeOpen={isSnowflakeOpen}
        onCloseSnowflake={() => setIsSnowflakeOpen(false)}
        facts={artifacts.facts}
        valuation={dynamicValuation ?? reportData?.valuation}
        stressResult={stressResult}
        reportData={reportData}
        stressParams={stressParams}
        snowflakeScore={snowflakeScore}
        locale={locale}
        toastMessage={toastMessage}
        showToast={showToast}
        showBackToTop={showBackToTop}
        onScrollToTop={handleScrollToTop}
        onOpenSocialCard={() => setIsSocialCardOpen(true)}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<CockpitSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}
