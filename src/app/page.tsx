"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FolderOpen,
  Sparkles,
  TrendingUp,
  Layers,
  Mic,
  FileSearch,
  History,
  Grid,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Cockpit } from "@/components/Cockpit";
import { MemoView } from "@/components/MemoView";
import { FileUploader } from "@/components/FileUploader";
import { CatalystsTab } from "@/components/tabs/CatalystsTab";
import { MoatTab } from "@/components/tabs/MoatTab";
import { ScenariosTab } from "@/components/tabs/ScenariosTab";
import { SegmentsTab } from "@/components/tabs/SegmentsTab";
import { ToneTab } from "@/components/tabs/ToneTab";
import { FilingTab } from "@/components/tabs/FilingTab";
import { ReactionsTab } from "@/components/tabs/ReactionsTab";
import { SensitivityTab } from "@/components/tabs/SensitivityTab";
import type { ReportData, Scenario } from "@/lib/schemas";
import {
  computeStressedValuation,
  computeValuation,
  type StressTestParams,
} from "@/lib/valuation";
import { getTranslations, type Locale } from "@/lib/i18n";

export default function HomePage() {
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"cockpit" | "memo">("cockpit");
  const [activeTab, setActiveTab] = useState<string>("catalysts");
  const [locale, setLocale] = useState<Locale>("zh");
  const [reportDocLang, setReportDocLang] = useState<Locale>("zh");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = getTranslations(locale);

  const handleToggleLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setReportDocLang(newLocale);
  };

  const [stressParams, setStressParams] = useState<StressTestParams>({
    driverShocks: {},
    grossMarginBpsDelta: 0,
    fixedOpexShiftPct: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Load report from API
  const loadReport = useCallback(async (slug: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch report ${slug}`);
      }
      const data: ReportData = await res.json();
      setReportData(data);
      setCurrentSlug(slug);

      // Initialize default driver shocks from baseline
      const initialShocks: Record<string, number> = {};
      if (data.baseline?.upstreamDrivers) {
        for (const d of data.baseline.upstreamDrivers) {
          initialShocks[d.id] = d.defaultShockPct ?? 0;
        }
      }

      setStressParams({
        driverShocks: initialShocks,
        grossMarginBpsDelta: 0,
        fixedOpexShiftPct: 0,
      });

      // Update URL query param without full reload
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("report", slug);
        window.history.replaceState({}, "", url.toString());
      }
    } catch (err) {
      console.error(err);
      showToast(`Failed to load report: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load: check query param or pick first available report
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const queryReport = params.get("report");

      if (queryReport) {
        await loadReport(queryReport);
      } else {
        try {
          const res = await fetch("/api/reports");
          if (res.ok) {
            const data = await res.json();
            if (data.reports && data.reports.length > 0) {
              await loadReport(data.reports[0].slug);
            } else {
              setIsLoading(false);
            }
          }
        } catch {
          setIsLoading(false);
        }
      }
    };
    init();
  }, [loadReport]);

  // Handle URL hash state synchronization
  const syncStateToHash = useCallback(() => {
    if (typeof window === "undefined") return;
    const parts: string[] = [];
    parts.push(`tab=${activeTab}`);
    if (viewMode !== "cockpit") parts.push(`mode=${viewMode}`);

    if (stressParams.driverShocks) {
      for (const [k, v] of Object.entries(stressParams.driverShocks)) {
        if (v !== 0) parts.push(`d_${encodeURIComponent(k)}=${v}`);
      }
    }
    if (stressParams.grossMarginBpsDelta !== 0) {
      parts.push(`gm=${stressParams.grossMarginBpsDelta}`);
    }
    if (stressParams.fixedOpexShiftPct !== 0) {
      parts.push(`opex=${stressParams.fixedOpexShiftPct}`);
    }

    const hash = "#" + parts.join("&");
    const newUrl = window.location.pathname + window.location.search + hash;
    window.history.replaceState(null, "", newUrl);
  }, [activeTab, viewMode, stressParams]);

  useEffect(() => {
    syncStateToHash();
  }, [syncStateToHash]);

  // Share scenario link
  const handleShare = () => {
    syncStateToHash();
    if (typeof window !== "undefined") {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => showToast(t.page.linkCopiedToast))
        .catch(() => prompt("Copy link:", window.location.href));
    }
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

  const handleResetDefaults = () => {
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
  };

  // Catalyst probability changes
  const handleCatalystProbabilityChange = (idx: number, prob: number) => {
    if (!reportData?.catalysts) return;
    const updated = [...reportData.catalysts.catalysts];
    updated[idx] = { ...updated[idx], probability: prob };
    setReportData({
      ...reportData,
      catalysts: {
        ...reportData.catalysts,
        catalysts: updated,
      },
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
    if (!reportData?.facts || !reportData.scenarios) return reportData?.valuation;
    return computeValuation({
      facts: reportData.facts,
      scenarios: reportData.scenarios,
      baseline: reportData.baseline,
      stressParams,
    });
  }, [reportData, stressParams]);

  // Localized artifacts resolution
  const isZh = locale === "zh";
  const displayFacts = (isZh && reportData?.factsZh) ? reportData.factsZh : reportData?.facts;
  const displayCatalysts = (isZh && reportData?.catalystsZh) ? reportData.catalystsZh : reportData?.catalysts;
  const displayScenarios = (isZh && reportData?.scenariosZh) ? reportData.scenariosZh : reportData?.scenarios;
  const displaySentiment = (isZh && reportData?.sentimentZh) ? reportData.sentimentZh : reportData?.sentiment;
  const displayFiling = (isZh && reportData?.filingZh) ? reportData.filingZh : reportData?.filing;
  const displayReactions = (isZh && reportData?.reactionsZh) ? reportData.reactionsZh : reportData?.reactions;
  const displayMoat = (isZh && reportData?.moatZh) ? reportData.moatZh : reportData?.moat;

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      {/* Top Navigation */}
      <Header
        facts={displayFacts}
        valuation={dynamicValuation ?? reportData?.valuation}
        currentSlug={currentSlug}
        onSelectReport={loadReport}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onShare={handleShare}
        locale={locale}
        onToggleLocale={handleToggleLocale}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6">
        {isLoading ? (
          <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <span className="text-xs font-mono text-slate-400">
              {t.page.loading}
            </span>
          </div>
        ) : !reportData || !stressResult ? (
          <div className="max-w-xl mx-auto my-16 p-8 rounded-2xl bg-surface-1 border border-border text-center flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {t.page.noReportSelected}
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                {t.page.noReportDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-accent text-slate-950 font-bold text-xs hover:bg-accent-hover transition-colors"
            >
              {t.page.uploadFolderBtn}
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
            onBackToCockpit={() => setViewMode("cockpit")}
            locale={locale}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Sticky Cockpit (~440px) */}
            <Cockpit
              baseline={reportData.baseline!}
              facts={displayFacts!}
              stressParams={stressParams}
              stressResult={stressResult}
              onDriverShockChange={handleDriverShockChange}
              onGrossMarginDeltaChange={handleGrossMarginDeltaChange}
              onFixedOpexShiftChange={handleFixedOpexShiftChange}
              onResetDefaults={handleResetDefaults}
              locale={locale}
            />

            {/* Right Tabbed Intelligence Workspace */}
            <div className="flex-1 w-full flex flex-col gap-4">
              {/* Tab Navigation Ribbon */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/80">
                {[
                  { id: "catalysts", label: t.tabs.catalysts, icon: Sparkles, count: displayCatalysts?.catalysts?.length },
                  { id: "moat", label: t.tabs.moat, icon: ShieldCheck, count: displayMoat?.competitors?.length },
                  { id: "scenarios", label: t.tabs.scenarios, icon: TrendingUp, count: displayScenarios?.scenarios.length },
                  { id: "segments", label: t.tabs.segments, icon: Layers, count: displayFacts?.segments.length },
                  { id: "tone", label: t.tabs.tone, icon: Mic },
                  { id: "filing", label: t.tabs.filing, icon: FileSearch, count: displayFiling?.newRiskFactors?.length },
                  { id: "reactions", label: t.tabs.reactions, icon: History, count: displayReactions?.events?.length },
                  { id: "sensitivity", label: t.tabs.sensitivity, icon: Grid, count: (dynamicValuation?.sensitivity ?? reportData.valuation?.sensitivity)?.length },
                  { id: "report", label: t.tabs.report, icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-surface-2 text-accent border border-accent/40 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-surface-1"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            isActive
                              ? "bg-accent/20 text-accent font-bold"
                              : "bg-surface-3 text-slate-400"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="w-full">
                {activeTab === "catalysts" && (
                  <CatalystsTab
                    catalystsData={displayCatalysts}
                    onProbabilityChange={handleCatalystProbabilityChange}
                    locale={locale}
                  />
                )}

                {activeTab === "moat" && (
                  <MoatTab
                    moatData={displayMoat}
                    locale={locale}
                  />
                )}

                {activeTab === "scenarios" && (
                  <ScenariosTab
                    scenariosData={displayScenarios!}
                    currentPrice={displayFacts!.currentPrice}
                    valuation={dynamicValuation ?? reportData.valuation}
                    onScenarioChange={handleScenarioChange}
                    locale={locale}
                  />
                )}

                {activeTab === "segments" && (
                  <SegmentsTab
                    facts={displayFacts!}
                    locale={locale}
                  />
                )}

                {activeTab === "tone" && (
                  <ToneTab
                    sentimentData={displaySentiment}
                    locale={locale}
                  />
                )}

                {activeTab === "filing" && (
                  <FilingTab
                    filingData={displayFiling}
                    locale={locale}
                  />
                )}

                {activeTab === "reactions" && (
                  <ReactionsTab
                    reactionsData={displayReactions}
                    locale={locale}
                  />
                )}

                {activeTab === "sensitivity" && (
                  <SensitivityTab
                    sensitivityData={dynamicValuation?.sensitivity ?? reportData.valuation?.sensitivity ?? []}
                    locale={locale}
                  />
                )}

                {activeTab === "report" && (
                  <div className="p-6 rounded-xl bg-surface-1 border border-border flex flex-col gap-4 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-accent" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          {reportDocLang === "zh"
                            ? t.page.reportTitleZh
                            : t.page.reportTitleEn}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {reportData.folderName}
                        </span>
                      </div>

                      {/* Language Switcher for Report View */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-surface-0 p-0.5 rounded-lg border border-border text-xs">
                          <button
                            type="button"
                            onClick={() => setReportDocLang("en")}
                            className={`px-3 py-1 rounded-md font-semibold transition-all ${
                              reportDocLang === "en"
                                ? "bg-surface-2 text-accent shadow-sm"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            English (report.md)
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportDocLang("zh")}
                            className={`px-3 py-1 rounded-md font-semibold transition-all ${
                              reportDocLang === "zh"
                                ? "bg-accent/20 text-accent font-bold shadow-sm"
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
                          className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-xs text-slate-300 hover:text-white transition-colors"
                        >
                          {t.page.copyBtn}
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 rounded-lg bg-surface-0 border border-border text-xs text-slate-200 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
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

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <FileUploader
          onDataLoaded={(data) => {
            setReportData(data);
            setCurrentSlug(data.folderSlug);
            setIsUploadModalOpen(false);
            showToast(t.page.customLoadedToast);
          }}
          onClose={() => setIsUploadModalOpen(false)}
          locale={locale}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-accent/40 text-slate-100 text-xs font-semibold shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 text-accent" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
