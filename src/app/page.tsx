"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Sparkles,
  TrendingUp,
  Layers,
  FileSearch,
  FileText,
  Check,
  ShieldCheck,
  Target,
  Keyboard,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Cockpit } from "@/components/Cockpit";
import { CockpitSkeleton } from "@/components/CockpitSkeleton";
import { MemoView } from "@/components/MemoView";
import { EstimatesTab } from "@/components/tabs/EstimatesTab";
import { CatalystsTab } from "@/components/tabs/CatalystsTab";
import { MoatTab } from "@/components/tabs/MoatTab";
import { ScenariosTab } from "@/components/tabs/ScenariosTab";
import { SegmentsTab } from "@/components/tabs/SegmentsTab";
import { AuditTab } from "@/components/tabs/AuditTab";
import { ScreenerView } from "@/components/ScreenerView";
import { SocialCardModal } from "@/components/social-card/SocialCardModal";
import { SnowflakeModal } from "@/components/snowflake/SnowflakeModal";
import { computeSnowflakeScore } from "@/lib/snowflake";
import type { ReportData, Scenario } from "@/lib/schemas";
import type { ReportSummary } from "@/app/api/reports/route";
import {
  computeStressedValuation,
  computeValuation,
  type StressTestParams,
} from "@/lib/valuation";
import { getTranslations, type Locale } from "@/lib/i18n";
import {
  parseScenarioUrlState,
  serializeScenarioUrlState,
} from "@/lib/url-state";
import { useWatchlist } from "@/lib/watchlist";

const clientReportDataCache = new Map<string, ReportData>();
let clientReportsListCache: ReportSummary[] | null = null;

export default function HomePage() {
  const router = useRouter();
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isReportsLoading, setIsReportsLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"cockpit" | "memo" | "screener">(
    "cockpit"
  );
  const [activeTab, setActiveTab] = useState<string>("valuation");
  const [locale, setLocale] = useState<Locale>("en");
  const [reportDocLang, setReportDocLang] = useState<Locale>("en");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isSocialCardOpen, setIsSocialCardOpen] = useState<boolean>(false);
  const [isSnowflakeOpen, setIsSnowflakeOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { isFavorite, toggleFavorite, isAuthenticated } = useWatchlist();

  // Restore saved language preference from localStorage on mount
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(
        "stress_alpha_locale"
      ) as Locale | null;
      if (savedLocale === "en" || savedLocale === "zh") {
        Promise.resolve().then(() => {
          setLocale(savedLocale);
          setReportDocLang(savedLocale);
        });
      }
    } catch (e) {
      console.warn("Could not load locale preference:", e);
    }
  }, []);

  const t = getTranslations(locale);

  const handleToggleLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    try {
      localStorage.setItem("stress_alpha_locale", newLocale);
    } catch (e) {
      console.warn("Could not save locale preference:", e);
    }
  }, []);

  const [stressParams, setStressParams] = useState<StressTestParams>({
    driverShocks: {},
    grossMarginBpsDelta: 0,
    fixedOpexShiftPct: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Load report from API with optional initial shock overrides & client cache
  const loadReport = useCallback(
    async (slug: string, initialOverrides?: StressTestParams) => {
      const cached = clientReportDataCache.get(slug);
      if (cached) {
        setReportData(cached);
        setCurrentSlug(slug);
        const initialShocks: Record<string, number> = {};
        if (cached.baseline?.upstreamDrivers) {
          for (const d of cached.baseline.upstreamDrivers) {
            initialShocks[d.id] =
              initialOverrides?.driverShocks?.[d.id] ?? d.defaultShockPct ?? 0;
          }
        }
        setStressParams({
          driverShocks: initialShocks,
          grossMarginBpsDelta: initialOverrides?.grossMarginBpsDelta ?? 0,
          fixedOpexShiftPct: initialOverrides?.fixedOpexShiftPct ?? 0,
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/reports/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch report ${slug}`);
        }
        const data: ReportData = await res.json();
        clientReportDataCache.set(slug, data);
        setReportData(data);
        setCurrentSlug(slug);

        // Initialize driver shocks from baseline, allowing initial overrides from URL
        const initialShocks: Record<string, number> = {};
        if (data.baseline?.upstreamDrivers) {
          for (const d of data.baseline.upstreamDrivers) {
            initialShocks[d.id] =
              initialOverrides?.driverShocks?.[d.id] ?? d.defaultShockPct ?? 0;
          }
        }

        setStressParams({
          driverShocks: initialShocks,
          grossMarginBpsDelta: initialOverrides?.grossMarginBpsDelta ?? 0,
          fixedOpexShiftPct: initialOverrides?.fixedOpexShiftPct ?? 0,
        });
      } catch (err) {
        console.error(err);
        showToast(`Failed to load report: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchReportsList = useCallback(async () => {
    if (clientReportsListCache) {
      setReports(clientReportsListCache);
      setIsReportsLoading(false);
      return clientReportsListCache;
    }
    setIsReportsLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        const list: ReportSummary[] = data.reports || [];
        clientReportsListCache = list;
        setReports(list);
        return list;
      }
    } catch (err) {
      console.error("Failed to fetch reports list:", err);
    } finally {
      setIsReportsLoading(false);
    }
    return [];
  }, []);

  // Initial load: parse URL search or hash to restore exact scenario, report, tab, and mode
  useEffect(() => {
    const init = async () => {
      const urlState = parseScenarioUrlState(
        window.location.search || window.location.hash
      );

      if (urlState.tab) {
        setActiveTab(urlState.tab);
      }
      if (urlState.mode === "memo" || urlState.mode === "cockpit") {
        setViewMode(urlState.mode);
      }
      if (urlState.lang) {
        setLocale(urlState.lang);
        setReportDocLang(urlState.lang);
      }

      // Requirement 2: screener is a separate page and not associated with a specific report
      if (urlState.mode === "screener" || !urlState.report) {
        router.replace("/screener");
        return;
      }

      // Parallelize: Load active report immediately without waiting for full reports list
      const reportPromise = urlState.report
        ? loadReport(urlState.report, urlState.stressParams)
        : Promise.resolve();
      const listPromise = fetchReportsList();
      await Promise.all([reportPromise, listPromise]);
    };
    init();
  }, [fetchReportsList, loadReport, router]);

  // Handle browser Back / Forward history navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const urlState = parseScenarioUrlState(
        window.location.search || window.location.hash
      );
      if (urlState.tab) setActiveTab(urlState.tab);
      if (urlState.mode) setViewMode(urlState.mode);
      if (urlState.lang) setLocale(urlState.lang);
      if (urlState.report && urlState.report !== currentSlug) {
        loadReport(urlState.report, urlState.stressParams);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentSlug, loadReport]);

  // Handle URL search parameter synchronization for shareable deep linking
  const syncStateToUrl = useCallback(() => {
    if (
      typeof window === "undefined" ||
      isLoading ||
      !currentSlug ||
      viewMode === "screener"
    )
      return;

    const queryString = serializeScenarioUrlState({
      report: currentSlug ?? undefined,
      tab: activeTab,
      mode: viewMode,
      lang: locale,
      stressParams,
    });

    const newUrl = window.location.pathname + queryString;
    window.history.replaceState(null, "", newUrl);
  }, [currentSlug, activeTab, viewMode, locale, stressParams, isLoading]);

  useEffect(() => {
    syncStateToUrl();
  }, [syncStateToUrl]);

  // View mode navigation with browser history push
  const handleViewModeChange = useCallback(
    (mode: "cockpit" | "memo" | "screener") => {
      if (mode === "screener") {
        router.push("/screener");
        return;
      }
      setViewMode(mode);
      if (typeof window !== "undefined") {
        const queryString = serializeScenarioUrlState({
          report: currentSlug ?? undefined,
          tab: activeTab,
          mode,
          lang: locale,
          stressParams,
        });
        window.history.pushState(
          null,
          "",
          window.location.pathname + queryString
        );
      }
    },
    [currentSlug, activeTab, locale, stressParams, router]
  );

  // Select report and navigate directly to Cockpit
  const handleSelectReport = useCallback(
    (slug: string, mode?: "cockpit" | "memo") => {
      const nextMode = mode ?? "cockpit";
      setViewMode(nextMode);
      loadReport(slug);
      if (typeof window !== "undefined") {
        const queryString = serializeScenarioUrlState({
          report: slug,
          tab: activeTab,
          mode: nextMode,
          lang: locale,
          stressParams,
        });
        window.history.pushState(
          null,
          "",
          window.location.pathname + queryString
        );
      }
    },
    [loadReport, activeTab, locale, stressParams]
  );

  // Unified Share & Export action
  const handleShare = () => {
    syncStateToUrl();
    setIsSocialCardOpen(true);
  };

  // Slider handlers
  const handleDriverShockChange = (driverId: string, shockPct: number) => {
    setStressParams((prev) => ({
      ...prev,
      driverShocks: {
        ...(prev.driverShocks ?? {}),
        [driverId]: shockPct,
      },
    }));
  };

  const handleGrossMarginDeltaChange = (bps: number) => {
    setStressParams((prev) => ({
      ...prev,
      grossMarginBpsDelta: bps,
    }));
  };

  const handleFixedOpexShiftChange = (shiftPct: number) => {
    setStressParams((prev) => ({
      ...prev,
      fixedOpexShiftPct: shiftPct,
    }));
  };

  const handleResetDefaults = useCallback(() => {
    if (!reportData?.baseline) return;
    const defaultShocks: Record<string, number> = {};
    for (const d of reportData.baseline.upstreamDrivers) {
      defaultShocks[d.id] = d.defaultShockPct ?? 0;
    }
    setStressParams({
      driverShocks: defaultShocks,
      grossMarginBpsDelta: 0,
      fixedOpexShiftPct: 0,
    });
    showToast(t.page.resetSlidersToast);
  }, [reportData?.baseline, t.page.resetSlidersToast]);

  // Catalyst probability changes
  const handleCatalystProbabilityChange = (idx: number, prob: number) => {
    if (!reportData?.catalysts) return;
    const updated = [...reportData.catalysts.catalysts];
    updated[idx] = { ...updated[idx], probability: prob };

    let updatedZh = reportData.catalystsZh;
    if (updatedZh?.catalysts?.[idx]) {
      const zhList = [...updatedZh.catalysts];
      zhList[idx] = { ...zhList[idx], probability: prob };
      updatedZh = { ...updatedZh, catalysts: zhList };
    }

    setReportData({
      ...reportData,
      catalysts: {
        ...reportData.catalysts,
        catalysts: updated,
      },
      catalystsZh: updatedZh,
    });
  };

  // Scenario inline field changes
  const handleScenarioChange = (idx: number, patch: Partial<Scenario>) => {
    if (!reportData) return;
    const updatedScenarios = [...reportData.scenarios.scenarios];
    updatedScenarios[idx] = { ...updatedScenarios[idx], ...patch };

    const newScenarios = {
      ...reportData.scenarios,
      scenarios: updatedScenarios,
    };

    // Synchronize numerical edits to Chinese scenarios so inputs persist across language switches
    let newScenariosZh = reportData.scenariosZh;
    if (newScenariosZh?.scenarios?.[idx]) {
      const updatedZh = [...newScenariosZh.scenarios];
      updatedZh[idx] = {
        ...updatedZh[idx],
        ...(patch.probability !== undefined && {
          probability: patch.probability,
        }),
        ...(patch.forwardEps !== undefined && { forwardEps: patch.forwardEps }),
        ...(patch.multiple !== undefined && { multiple: patch.multiple }),
      };
      newScenariosZh = { ...newScenariosZh, scenarios: updatedZh };
    }

    // Deterministically recompute valuation
    const updatedValuation = computeValuation({
      facts: reportData.facts,
      scenarios: newScenarios,
      baseline: reportData.baseline,
      stressParams,
    });

    setReportData({
      ...reportData,
      scenarios: newScenarios,
      scenariosZh: newScenariosZh,
      valuation: updatedValuation,
    });
  };

  // Compute live stressed valuation
  const stressResult = useMemo(() => {
    if (!reportData?.baseline || !reportData.facts) return null;
    return computeStressedValuation(
      reportData.baseline,
      reportData.facts.currentPrice,
      stressParams
    );
  }, [reportData, stressParams]);

  // Compute live dynamic valuation tree (WFV, scenario targets, upside %)
  const dynamicValuation = useMemo(() => {
    if (!reportData?.facts || !reportData.scenarios)
      return reportData?.valuation;
    return computeValuation({
      facts: reportData.facts,
      scenarios: reportData.scenarios,
      baseline: reportData.baseline,
      stressParams,
    });
  }, [reportData, stressParams]);

  // Localized artifacts resolution
  const isZh = locale === "zh";
  const displayFacts =
    isZh && reportData?.factsZh ? reportData.factsZh : reportData?.facts;
  const displayCatalysts =
    isZh && reportData?.catalystsZh
      ? reportData.catalystsZh
      : reportData?.catalysts;
  const displayScenarios =
    isZh && reportData?.scenariosZh
      ? reportData.scenariosZh
      : reportData?.scenarios;
  const displaySentiment =
    isZh && reportData?.sentimentZh
      ? reportData.sentimentZh
      : reportData?.sentiment;
  const displayFiling =
    isZh && reportData?.filingZh ? reportData.filingZh : reportData?.filing;
  const displayReactions =
    isZh && reportData?.reactionsZh
      ? reportData.reactionsZh
      : reportData?.reactions;
  const displayMoat =
    isZh && reportData?.moatZh ? reportData.moatZh : reportData?.moat;
  const displayEstimates =
    isZh && reportData?.estimatesZh
      ? reportData.estimatesZh
      : reportData?.estimates;

  // 5-Pillar Snowflake Score calculation
  const snowflakeScore = useMemo(() => {
    if (!reportData || !displayFacts) return null;
    const effectiveReportData: ReportData = {
      ...reportData,
      facts: displayFacts,
      catalysts: displayCatalysts,
      scenarios: displayScenarios ?? reportData.scenarios,
      moat: displayMoat,
      valuation: dynamicValuation ?? reportData.valuation,
    };
    return computeSnowflakeScore(
      effectiveReportData,
      stressResult ?? undefined,
      locale
    );
  }, [
    reportData,
    displayFacts,
    displayCatalysts,
    displayScenarios,
    displayMoat,
    dynamicValuation,
    stressResult,
    locale,
  ]);

  // 7 Focused Institutional Intelligence Workspaces
  const tabItems = useMemo(
    () => [
      {
        id: "valuation",
        shortcut: "1",
        label: t.tabs.valuation,
        icon: TrendingUp,
        count: displayScenarios?.scenarios.length,
      },
      {
        id: "estimates",
        shortcut: "2",
        label: t.tabs.estimates || "Estimates",
        icon: Target,
        count: displayEstimates?.estimates?.length,
      },
      {
        id: "moat",
        shortcut: "3",
        label: t.tabs.moat,
        icon: ShieldCheck,
        count: displayMoat?.competitors?.length,
      },
      {
        id: "segments",
        shortcut: "4",
        label: t.tabs.segments,
        icon: Layers,
        count: displayFacts?.segments.length,
      },
      {
        id: "catalysts",
        shortcut: "5",
        label: t.tabs.catalysts,
        icon: Sparkles,
        count: displayCatalysts?.catalysts?.length,
      },
      {
        id: "audit",
        shortcut: "6",
        label: t.tabs.audit,
        icon: FileSearch,
        count:
          (displayFiling?.newRiskFactors?.length ?? 0) +
          (displayReactions?.events?.length ?? 0),
      },
      { id: "report", shortcut: "7", label: t.tabs.report, icon: FileText },
    ],
    [
      t,
      displayScenarios,
      displayEstimates,
      displayMoat,
      displayFacts,
      displayCatalysts,
      displayFiling,
      displayReactions,
    ]
  );

  // Global Keyboard Shortcuts (1-9 for tabs, R for reset, M for memo, L for lang, ? for help)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept browser-native shortcuts (Cmd+R, Ctrl+R, Cmd+W, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= tabItems.length) {
        e.preventDefault();
        setActiveTab(tabItems[num - 1].id);
        return;
      }

      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setViewMode((prev) => (prev === "cockpit" ? "memo" : "cockpit"));
        return;
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleViewModeChange("screener");
        return;
      }

      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        handleToggleLocale(locale === "zh" ? "en" : "zh");
        return;
      }

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setIsSocialCardOpen((prev) => !prev);
        return;
      }

      if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        setIsSnowflakeOpen((prev) => !prev);
        return;
      }

      if (e.key === "f" || e.key === "F") {
        const symbol = reportData?.facts?.ticker || currentSlug;
        if (symbol) {
          e.preventDefault();
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
          return;
        }
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        if (isSnowflakeOpen) {
          e.preventDefault();
          setIsSnowflakeOpen(false);
          return;
        }
        if (isSocialCardOpen) {
          e.preventDefault();
          setIsSocialCardOpen(false);
          return;
        }
        if (isShortcutsOpen) {
          e.preventDefault();
          setIsShortcutsOpen(false);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    tabItems,
    locale,
    t,
    reportData?.facts?.ticker,
    currentSlug,
    toggleFavorite,
    isAuthenticated,
    isShortcutsOpen,
    isSocialCardOpen,
    isSnowflakeOpen,
    handleResetDefaults,
    handleToggleLocale,
    handleViewModeChange,
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-100">
      {/* Top Navigation */}
      <Header
        facts={displayFacts}
        valuation={dynamicValuation ?? reportData?.valuation}
        currentSlug={currentSlug}
        onSelectReport={handleSelectReport}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
        onShare={handleShare}
        onOpenSnowflake={() => setIsSnowflakeOpen(true)}
        locale={locale}
        onToggleLocale={handleToggleLocale}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full min-w-0 max-w-[1680px] flex-1 p-3 sm:p-5 md:p-6">
        {viewMode === "screener" ? (
          <ScreenerView
            reports={reports}
            onSelectReport={handleSelectReport}
            locale={locale}
            isLoading={isReportsLoading}
          />
        ) : !currentSlug && !reportData ? (
          <div className="min-h-[60vh]" />
        ) : isLoading ? (
          <CockpitSkeleton />
        ) : !reportData || !stressResult ? (
          <div className="glass-panel relative mx-auto my-16 flex max-w-xl flex-col items-center gap-5 overflow-hidden rounded-3xl border border-white/[0.08] p-8 text-center shadow-2xl sm:p-10">
            <div className="pointer-events-none absolute -left-24 -top-24 size-48 rounded-full bg-accent/10 blur-3xl" />
            <div className="flex size-14 items-center justify-center rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/20 to-sky-500/10 text-accent shadow-lg shadow-accent/10">
              <FolderOpen className="size-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                {t.page.noReportSelected}
              </h2>
              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-400">
                {t.page.noReportDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleViewModeChange("screener")}
              className="rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] hover:bg-accent-hover hover:shadow-accent/40 active:scale-[0.98]"
            >
              {t.header.screener}
            </button>
          </div>
        ) : viewMode === "memo" ? (
          <MemoView
            reportData={{
              ...reportData,
              facts: displayFacts!,
              catalysts: displayCatalysts,
              scenarios: displayScenarios!,
              filing: displayFiling,
              valuation: dynamicValuation ?? reportData.valuation,
            }}
            stressResult={stressResult}
            onBackToCockpit={() => handleViewModeChange("cockpit")}
            onOpenSocialCard={() => setIsSocialCardOpen(true)}
            onOpenSnowflake={() => setIsSnowflakeOpen(true)}
            locale={locale}
            onLocaleChange={handleToggleLocale}
          />
        ) : (
          <div className="flex flex-col items-start gap-5 lg:flex-row xl:gap-6">
            {/* Left Sticky Cockpit (~400px responsive) */}
            <Cockpit
              baseline={reportData.baseline!}
              facts={displayFacts!}
              stressParams={stressParams}
              stressResult={stressResult}
              valuation={dynamicValuation ?? reportData.valuation}
              reportData={{
                ...reportData,
                facts: displayFacts!,
                catalysts: displayCatalysts,
                scenarios: displayScenarios!,
                filing: displayFiling,
                valuation: dynamicValuation ?? reportData.valuation,
              }}
              onDriverShockChange={handleDriverShockChange}
              onGrossMarginDeltaChange={handleGrossMarginDeltaChange}
              onFixedOpexShiftChange={handleFixedOpexShiftChange}
              onResetDefaults={handleResetDefaults}
              onOpenSnowflake={() => setIsSnowflakeOpen(true)}
              locale={locale}
            />

            {/* Right Tabbed Intelligence Workspace (min-w-0 prevents blowout) */}
            <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
              {/* Tab Navigation Ribbon */}
              <div className="custom-scrollbar flex items-center gap-1.5 overflow-x-auto scroll-smooth border-b border-white/[0.08] pb-2">
                {tabItems.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`group flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 sm:px-3.5 ${
                        isActive
                          ? "border border-accent/40 bg-accent/15 font-bold text-accent shadow-glow"
                          : "border border-transparent text-slate-400 hover:bg-surface-1 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
                            isActive
                              ? "bg-accent/25 font-bold text-accent"
                              : "bg-surface-3 text-slate-400"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                      <span
                        className={`hidden font-mono text-[10px] transition-opacity sm:inline ${
                          isActive
                            ? "font-bold text-accent/70"
                            : "text-slate-600 group-hover:text-slate-400"
                        }`}
                      >
                        [{tab.shortcut}]
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
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
                    onScenarioChange={handleScenarioChange}
                    locale={locale}
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
                    onProbabilityChange={handleCatalystProbabilityChange}
                    locale={locale}
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
                  <div className="glass-panel flex flex-col gap-4 rounded-2xl border border-white/[0.08] p-5 shadow-xl sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-lg border border-accent/20 bg-accent/10 p-1.5 text-accent">
                          <FileText className="size-4" />
                        </div>
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
                        <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-0/80 p-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setReportDocLang("en")}
                            className={`rounded-md px-3 py-1 font-semibold transition-all ${
                              reportDocLang === "en"
                                ? "bg-surface-2 text-accent shadow-sm ring-1 ring-white/10"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            English (report.md)
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportDocLang("zh")}
                            className={`rounded-md px-3 py-1 font-semibold transition-all ${
                              reportDocLang === "zh"
                                ? "bg-accent/20 font-bold text-accent shadow-sm ring-1 ring-accent/30"
                                : "text-slate-400 hover:text-white"
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
                          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-2/90 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm transition-all hover:border-accent/40 hover:bg-surface-3 hover:text-white"
                        >
                          <span>{t.page.copyBtn}</span>
                        </button>
                      </div>
                    </div>
                    <pre className="custom-scrollbar max-h-[72vh] overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-surface-0/90 p-5 font-mono text-xs leading-relaxed text-slate-200 shadow-inner selection:bg-accent/30 sm:text-[13px]">
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
            </div>
          </div>
        )}
      </main>

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && (
        <div
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setIsShortcutsOpen(false)}
        >
          <div
            className="glass-panel relative flex w-full max-w-md flex-col gap-5 rounded-2xl border border-white/[0.12] bg-surface-1/95 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg border border-accent/30 bg-accent/15 p-1.5 text-accent">
                  <Keyboard className="size-4" />
                </div>
                <h3 className="text-sm font-bold tracking-wide text-white">
                  {t.shortcuts.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-surface-2 hover:text-white"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.tabSwitch}
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="rounded border border-white/[0.12] bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent shadow-sm">
                    1
                  </kbd>
                  <span className="text-[10px] text-slate-500">–</span>
                  <kbd className="rounded border border-white/[0.12] bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent shadow-sm">
                    7
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.resetModel}
                </span>
                <kbd className="rounded border border-white/[0.12] bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent shadow-sm">
                  R
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.toggleMemo}
                </span>
                <kbd className="rounded border border-white/[0.12] bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent shadow-sm">
                  M
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.toggleScreener}
                </span>
                <kbd className="rounded border border-white/[0.12] bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent shadow-sm">
                  S
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.toggleLang}
                </span>
                <kbd className="rounded border border-white/[0.12] bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent shadow-sm">
                  L
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.exportCard}
                </span>
                <kbd className="rounded border border-white/[0.12] bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent shadow-sm">
                  E
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.openSnowflake}
                </span>
                <kbd className="rounded border border-white/[0.12] bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent shadow-sm">
                  W
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.toggleFavorite}
                </span>
                <kbd className="rounded border border-white/[0.12] bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent shadow-sm">
                  F
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-0/60 px-3 py-2">
                <span className="text-xs text-slate-300">
                  {t.shortcuts.close}
                </span>
                <div className="flex items-center gap-1.5">
                  <kbd className="rounded border border-white/[0.12] bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-accent shadow-sm">
                    ?
                  </kbd>
                  <span className="text-[10px] text-slate-500">/</span>
                  <kbd className="rounded border border-white/[0.12] bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-300 shadow-sm">
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
        onClose={() => setIsSocialCardOpen(false)}
        facts={displayFacts ?? undefined}
        valuation={dynamicValuation ?? reportData?.valuation}
        stressResult={stressResult ?? undefined}
        reportData={reportData ?? undefined}
        stressParams={stressParams}
        locale={locale}
        onShowToast={showToast}
      />

      {/* 30-Point Snowflake Audit Modal */}
      {snowflakeScore && displayFacts && (
        <SnowflakeModal
          isOpen={isSnowflakeOpen}
          onClose={() => setIsSnowflakeOpen(false)}
          scoreResult={snowflakeScore}
          ticker={displayFacts.ticker}
          company={displayFacts.company}
          locale={locale}
          onOpenSocialCard={() => setIsSocialCardOpen(true)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex animate-fade-in items-center gap-2 rounded-xl border border-accent/40 bg-surface-2 px-4 py-2.5 text-xs font-semibold text-slate-100 shadow-2xl">
          <Check className="size-4 text-accent" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
