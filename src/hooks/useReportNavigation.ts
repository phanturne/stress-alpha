"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { StressTestParams } from "@/lib/valuation";
import {
  parseScenarioUrlState,
  serializeScenarioUrlState,
} from "@/lib/url-state";
import { normalizeWorkspaceTabId } from "@/lib/workspace-tabs";

export interface UseReportNavigationOptions {
  currentSlug: string | null;
  setCurrentSlug: (slug: string | null) => void;
  initialMode?: "home" | "cockpit" | "memo" | "screener" | "watchlist";
  initialTab?: string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  onSetReportDocLang?: (locale: Locale) => void;
  stressParams: StressTestParams;
  setPendingStressOverrides?: (params: StressTestParams) => void;
  setStressParams?: React.Dispatch<React.SetStateAction<StressTestParams>>;
  isLoading: boolean;
}

export interface UseReportNavigationReturn {
  viewMode: "home" | "cockpit" | "memo" | "screener" | "watchlist";
  setViewMode: React.Dispatch<
    React.SetStateAction<"home" | "cockpit" | "memo" | "screener" | "watchlist">
  >;
  sourceViewMode: "home" | "cockpit" | "screener" | "watchlist";
  setSourceViewMode: React.Dispatch<
    React.SetStateAction<"home" | "cockpit" | "screener" | "watchlist">
  >;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  mobileSection: "cockpit" | "workspaces";
  setMobileSection: React.Dispatch<
    React.SetStateAction<"cockpit" | "workspaces">
  >;
  showBackToTop: boolean;
  tabScrollRef: React.RefObject<HTMLDivElement | null>;
  tabButtonRefs: React.MutableRefObject<
    Record<string, HTMLButtonElement | null>
  >;
  workspaceScrollRef: React.RefObject<HTMLDivElement | null>;
  switchWorkspace: (tabId: string, smoothScroll?: boolean) => void;
  handleScrollToTop: () => void;
  handleViewModeChange: (
    mode: "home" | "cockpit" | "memo" | "screener" | "watchlist" | "settings",
    options?: { watchlistOnly?: boolean }
  ) => void;
  handleSelectReport: (slug: string, mode?: "cockpit" | "memo") => void;
  handleWheelTabScroll: (e: React.WheelEvent<HTMLDivElement>) => void;
  syncStateToUrl: () => void;
}

export function useReportNavigation({
  currentSlug,
  setCurrentSlug,
  locale,
  setLocale,
  onSetReportDocLang,
  initialMode,
  initialTab,
  stressParams,
  setPendingStressOverrides,
  setStressParams,
  isLoading,
}: UseReportNavigationOptions): UseReportNavigationReturn {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<
    "home" | "cockpit" | "memo" | "screener" | "watchlist"
  >(initialMode || "home");
  const [sourceViewMode, setSourceViewMode] = useState<
    "home" | "cockpit" | "screener" | "watchlist"
  >(initialMode && initialMode !== "memo" ? initialMode : "cockpit");
  const [activeTab, setActiveTab] = useState<string>(
    normalizeWorkspaceTabId(initialTab)
  );
  const [mobileSection, setMobileSection] = useState<"cockpit" | "workspaces">(
    "cockpit"
  );
  const [showBackToTop, setShowBackToTop] = useState(false);

  const tabScrollRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const workspaceScrollRef = useRef<HTMLDivElement | null>(null);

  const currentSlugRef = useRef(currentSlug);
  const activeTabRef = useRef(activeTab);
  const viewModeRef = useRef(viewMode);
  const sourceViewModeRef = useRef(sourceViewMode);
  const localeRef = useRef(locale);
  const stressParamsRef = useRef(stressParams);
  const hasParsedInitialUrlRef = useRef(false);

  useEffect(() => {
    currentSlugRef.current = currentSlug;
    activeTabRef.current = activeTab;
    viewModeRef.current = viewMode;
    sourceViewModeRef.current = sourceViewMode;
    localeRef.current = locale;
    stressParamsRef.current = stressParams;
  });

  // Initial load: parse URL search or hash to restore exact scenario, report, tab, and mode
  useEffect(() => {
    if (typeof window === "undefined" || hasParsedInitialUrlRef.current) return;
    hasParsedInitialUrlRef.current = true;

    const urlState = parseScenarioUrlState(
      window.location.search || window.location.hash
    );

    Promise.resolve().then(() => {
      if (urlState.tab) {
        const safeTab = normalizeWorkspaceTabId(urlState.tab);
        setActiveTab((prev) => (prev !== safeTab ? safeTab : prev));
      }
      if (urlState.mode) {
        setViewMode((prev) => (prev !== urlState.mode ? urlState.mode! : prev));
      }
      if (urlState.lang) {
        setLocale(urlState.lang);
        if (onSetReportDocLang) {
          onSetReportDocLang(urlState.lang);
        }
      }

      if (urlState.stressParams) {
        if (setPendingStressOverrides) {
          setPendingStressOverrides(urlState.stressParams);
        } else if (setStressParams) {
          setStressParams(urlState.stressParams);
        }
      }

      // Default to home/initial view when explicitly requested or when no report is specified
      if (
        urlState.mode === "home" ||
        urlState.mode === "screener" ||
        !urlState.report
      ) {
        if (!urlState.report && !urlState.mode) {
          const fallbackMode = initialMode || "home";
          setViewMode((prev) => (prev !== fallbackMode ? fallbackMode : prev));
        } else if (urlState.mode) {
          setViewMode(urlState.mode);
        }
        return;
      }

      if (urlState.report !== currentSlugRef.current) {
        currentSlugRef.current = urlState.report;
        setCurrentSlug(urlState.report);
      }
    });
  }, [
    router,
    setCurrentSlug,
    setLocale,
    onSetReportDocLang,
    setPendingStressOverrides,
    setStressParams,
  ]);

  // Handle browser Back / Forward history navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const urlState = parseScenarioUrlState(
        window.location.search || window.location.hash
      );
      if (urlState.tab) {
        setActiveTab(normalizeWorkspaceTabId(urlState.tab));
      }
      if (urlState.mode) {
        if (urlState.mode !== "memo") {
          setSourceViewMode(urlState.mode);
        }
        setViewMode(urlState.mode);
      }
      if (urlState.lang) {
        setLocale(urlState.lang);
        if (onSetReportDocLang) {
          onSetReportDocLang(urlState.lang);
        }
      }
      if (urlState.stressParams) {
        if (setPendingStressOverrides) {
          setPendingStressOverrides(urlState.stressParams);
        } else if (setStressParams) {
          setStressParams(urlState.stressParams);
        }
      }
      if (urlState.report && urlState.report !== currentSlugRef.current) {
        currentSlugRef.current = urlState.report;
        setCurrentSlug(urlState.report);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    setCurrentSlug,
    setLocale,
    onSetReportDocLang,
    setPendingStressOverrides,
    setStressParams,
  ]);

  // Handle URL search parameter synchronization for shareable deep linking
  const syncStateToUrl = useCallback(() => {
    if (
      typeof window === "undefined" ||
      isLoading ||
      !currentSlug ||
      viewMode === "screener" ||
      viewMode === "watchlist"
    ) {
      return;
    }

    const safeTab = normalizeWorkspaceTabId(activeTab);
    const queryString = serializeScenarioUrlState({
      report: currentSlug ?? undefined,
      tab: safeTab,
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
    (
      mode: "home" | "cockpit" | "memo" | "screener" | "watchlist" | "settings",
      options?: { watchlistOnly?: boolean }
    ) => {
      if (mode === "settings") {
        router.push("/settings");
        return;
      }
      if (mode === "memo" && viewModeRef.current !== "memo") {
        setSourceViewMode(viewModeRef.current);
      }
      setViewMode(mode);
      const safeTab = normalizeWorkspaceTabId(activeTabRef.current);
      if (safeTab !== activeTabRef.current) {
        setActiveTab(safeTab);
      }
      if (typeof window !== "undefined") {
        const queryString = serializeScenarioUrlState({
          report: currentSlugRef.current ?? undefined,
          tab: safeTab,
          mode,
          lang: localeRef.current,
          stressParams: stressParamsRef.current,
        });
        window.history.pushState(
          null,
          "",
          window.location.pathname + queryString
        );
      }
    },
    [router]
  );

  // Select report and navigate directly to Cockpit
  const handleSelectReport = useCallback(
    (slug: string, mode?: "cockpit" | "memo") => {
      const nextMode = mode ?? "cockpit";
      if (viewModeRef.current !== "memo") {
        setSourceViewMode(viewModeRef.current);
      }
      const safeTab = normalizeWorkspaceTabId(activeTabRef.current);
      currentSlugRef.current = slug;
      setViewMode(nextMode);
      setCurrentSlug(slug);
      if (safeTab !== activeTabRef.current) {
        setActiveTab(safeTab);
      }
      if (typeof window !== "undefined") {
        const queryString = serializeScenarioUrlState({
          report: slug,
          tab: safeTab,
          mode: nextMode,
          lang: localeRef.current,
          stressParams: stressParamsRef.current,
        });
        window.history.pushState(
          null,
          "",
          window.location.pathname + queryString
        );
      }
    },
    [setCurrentSlug]
  );

  // Smooth workspace switcher with auto-scroll to top
  const switchWorkspace = useCallback((tabId: string, smoothScroll = true) => {
    const safeTab = normalizeWorkspaceTabId(tabId);
    setActiveTab(safeTab);
    setMobileSection("workspaces");
    if (smoothScroll) {
      if (workspaceScrollRef.current && window.innerWidth >= 1024) {
        workspaceScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      } else if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, []);

  // Back to top scroll handler
  const handleScrollToTop = useCallback(() => {
    if (workspaceScrollRef.current && window.innerWidth >= 1024) {
      workspaceScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Track vertical scroll to show floating "Back to Top" button on desktop & mobile
  useEffect(() => {
    const handleWindowScroll = () => {
      if (window.innerWidth < 1024) {
        setShowBackToTop(window.scrollY > 350);
      }
    };
    const workspaceEl = workspaceScrollRef.current;
    const handleWorkspaceScroll = () => {
      if (workspaceEl && window.innerWidth >= 1024) {
        setShowBackToTop(workspaceEl.scrollTop > 350);
      }
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    if (workspaceEl) {
      workspaceEl.addEventListener("scroll", handleWorkspaceScroll, {
        passive: true,
      });
    }
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      if (workspaceEl) {
        workspaceEl.removeEventListener("scroll", handleWorkspaceScroll);
      }
    };
  }, [viewMode, activeTab]);

  // Auto-scroll active tab into view smoothly whenever activeTab changes
  useEffect(() => {
    const activeBtn = tabButtonRefs.current[activeTab];
    const container = tabScrollRef.current;
    if (activeBtn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const scrollOffset =
        btnRect.left -
        containerRect.left -
        containerRect.width / 2 +
        btnRect.width / 2;
      container.scrollBy({ left: scrollOffset, behavior: "smooth" });
    }
  }, [activeTab]);

  const handleWheelTabScroll = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (tabScrollRef.current) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          tabScrollRef.current.scrollLeft += e.deltaY * 1.5;
        }
      }
    },
    []
  );

  return {
    viewMode,
    setViewMode,
    sourceViewMode,
    setSourceViewMode,
    activeTab,
    setActiveTab,
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
  };
}
