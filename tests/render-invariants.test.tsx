// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import {
  render,
  act,
  waitFor,
  fireEvent,
  screen,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ScreenerTableRow,
  ScreenerCard,
  ScreenerView,
  SCREENER_PAGE_SIZE,
} from "@/components/ScreenerView";
import { WatchlistView, WATCHLIST_PAGE_SIZE } from "@/components/WatchlistView";
import { CockpitDualPane } from "@/components/CockpitDualPane";
import {
  CockpitWorkspacePane,
  type CockpitWorkspacePaneProps,
  type WorkspaceTabDescriptor,
} from "@/components/CockpitWorkspacePane";
import {
  ReportSelector,
  MAX_DROPDOWN_GROUPS,
} from "@/components/ReportSelector";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/context/ThemeContext";
import {
  useRecentReport,
  setStoredLastReport,
  clearStoredLastReport,
} from "@/lib/recent-report";
import { getTranslations } from "@/lib/i18n";
import { TrendingUp } from "lucide-react";
import type { ReportSummary } from "@/app/api/reports/route";

// Mock next/navigation router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    prefetch: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const mockReport: ReportSummary = {
  slug: "NVDA-Q2-2027-analysis",
  name: "NVDA-Q2-2027-analysis",
  ticker: "NVDA",
  company: "NVIDIA Corporation",
  quarter: "Q2 2027",
  reportDate: "2026-08-26",
  currentPrice: 120.0,
  weightedFairValue: 155.0,
  upsidePct: 29.17,
  baseFairValue: 145.0,
  baseUpsidePct: 20.83,
  bullFairValue: 195.0,
  bearFairValue: 95.0,
  moatRating: "Wide",
  moatTrend: "Stable",
  operatingMarginPct: 62.5,
  revenueGrowthPct: 55.0,
  snowflakeScore: 24,
  snowflakeTier: "exceptional",
  snowflakePillars: {
    valuation: 5,
    future: 5,
    earnings: 5,
    moat: 5,
    resilience: 4,
  },
  hasFacts: true,
  hasScenarios: true,
  hasValuation: true,
  hasBaseline: true,
  hasSentiment: true,
  hasFiling: true,
  hasCatalysts: true,
  hasReactions: true,
  hasEstimates: true,
};

const ts = getTranslations("en").screener;
const tHeader = getTranslations("en").header;
const noop = () => {};

// Mock fetch to prevent happy-dom detached frame async fetch abort warnings
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ watchlist: [] }),
} as unknown as Response);

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

describe("Frontend Render & Efficiency Invariants", () => {
  describe("Component Memoization Contracts ($$typeof === Symbol(react.memo))", () => {
    it("ensures critical high-density components are wrapped in React.memo", () => {
      // Invariant: React.memo wrapper must be present to prevent cascading DOM churn
      const isMemo = (comp: unknown) => {
        const typeSymbol = (comp as { $$typeof?: symbol })?.$$typeof;
        return (
          typeSymbol === Symbol.for("react.memo") ||
          String(typeSymbol) === "Symbol(react.memo)"
        );
      };

      expect(isMemo(ScreenerView)).toBe(true);
      expect(isMemo(ScreenerTableRow)).toBe(true);
      expect(isMemo(ScreenerCard)).toBe(true);
      expect(isMemo(WatchlistView)).toBe(true);
      expect(isMemo(CockpitDualPane)).toBe(true);
      expect(isMemo(CockpitWorkspacePane)).toBe(true);
    });
  });

  describe("Batching & DOM Boundary Invariants", () => {
    it("exports verified batch pagination and dropdown ceiling constants", () => {
      // Invariant: Screener and Watchlist progressive batches must be capped at 50
      expect(SCREENER_PAGE_SIZE).toBe(50);
      expect(WATCHLIST_PAGE_SIZE).toBe(50);

      // Invariant: ReportSelector dropdown must cap rendered groups to 40
      expect(MAX_DROPDOWN_GROUPS).toBe(40);
    });
  });

  describe("ScreenerTableRow Render Invariants", () => {
    it("bails out of rendering ScreenerTableRow when parent re-renders with stable props", () => {
      const originalType = (ScreenerTableRow as unknown as { type: React.FC })
        .type;
      let executionCount = 0;

      (ScreenerTableRow as unknown as { type: unknown }).type = (
        props: Parameters<typeof originalType>[0]
      ) => {
        executionCount++;
        return originalType(props);
      };

      try {
        const props = {
          report: mockReport,
          isFav: false,
          onToggleFav: noop,
          onSelectReport: noop,
          onPrefetch: noop,
          ts,
          tHeader,
        };

        const { rerender } = render(
          <table>
            <tbody>
              <ScreenerTableRow {...props} />
            </tbody>
          </table>
        );

        expect(executionCount).toBe(1);

        // Re-render parent with identical prop references
        rerender(
          <table>
            <tbody>
              <ScreenerTableRow {...props} />
            </tbody>
          </table>
        );

        // Invariant: React.memo MUST skip executing the function body!
        expect(executionCount).toBe(1);

        // Re-render with changed prop (isFav)
        rerender(
          <table>
            <tbody>
              <ScreenerTableRow {...props} isFav={true} />
            </tbody>
          </table>
        );

        // Invariant: Component body executes exactly once more
        expect(executionCount).toBe(2);
      } finally {
        (ScreenerTableRow as unknown as { type: unknown }).type = originalType;
      }
    });
  });

  describe("ScreenerCard Render Invariants", () => {
    it("bails out of rendering ScreenerCard when parent re-renders with stable props", () => {
      const originalType = (ScreenerCard as unknown as { type: React.FC }).type;
      let executionCount = 0;

      (ScreenerCard as unknown as { type: unknown }).type = (
        props: Parameters<typeof originalType>[0]
      ) => {
        executionCount++;
        return originalType(props);
      };

      try {
        const props = {
          report: mockReport,
          isFav: false,
          onToggleFav: noop,
          onSelectReport: noop,
          onPrefetch: noop,
          ts,
          tHeader,
        };

        const { rerender } = render(<ScreenerCard {...props} />);

        expect(executionCount).toBe(1);

        // Re-render parent with stable props
        rerender(<ScreenerCard {...props} />);

        // Invariant: React.memo skips execution
        expect(executionCount).toBe(1);

        // Re-render with updated price
        const updatedReport = { ...mockReport, currentPrice: 125.0 };
        rerender(<ScreenerCard {...props} report={updatedReport} />);

        expect(executionCount).toBe(2);
      } finally {
        (ScreenerCard as unknown as { type: unknown }).type = originalType;
      }
    });
  });

  describe("ReportSelector Dropdown Rendering Bound", () => {
    it("limits rendered items to MAX_DROPDOWN_GROUPS (40) when opening universe of 100+ stocks", () => {
      const queryClient = createTestQueryClient();
      try {
        // Create 100 distinct constituent reports
        const largeReportList: ReportSummary[] = [];
        for (let i = 0; i < 100; i++) {
          const ticker = `TK${String(i).padStart(3, "0")}`;
          largeReportList.push({
            ...mockReport,
            slug: `${ticker}-Q1-2026-analysis`,
            ticker,
            company: `${ticker} Technologies Inc`,
          });
        }

        const { container } = render(
          <QueryClientProvider client={queryClient}>
            <ReportSelector
              currentSlug="TK000-Q1-2026-analysis"
              onSelectReport={noop}
              reports={largeReportList}
              locale="en"
            />
          </QueryClientProvider>
        );

        // Open dropdown by clicking the main trigger button
        const triggerButton = container.querySelector("button");
        expect(triggerButton).not.toBeNull();
        fireEvent.click(triggerButton!);

        // Invariant: Rendered dropdown items must NOT dump all 100 companies at once.
        // Must be capped strictly at MAX_DROPDOWN_GROUPS (40).
        const summaryNotice = screen.getByText(/Showing 40 of 100 companies/i);
        expect(summaryNotice).not.toBeNull();
      } finally {
        queryClient.clear();
      }
    });
  });

  describe("CockpitWorkspacePane Render Invariants", () => {
    it("bails out of re-rendering CockpitWorkspacePane when parent re-renders with stable tab props", () => {
      const originalType = (
        CockpitWorkspacePane as unknown as { type: React.FC }
      ).type;
      let executionCount = 0;

      (CockpitWorkspacePane as unknown as { type: unknown }).type = (
        props: Parameters<typeof originalType>[0]
      ) => {
        executionCount++;
        return originalType(props);
      };

      try {
        const mockTab: WorkspaceTabDescriptor = {
          id: "valuation",
          shortcut: "1",
          label: "Valuation & Drivers",
          shortLabel: "Valuation",
          icon: TrendingUp,
        };

        const workspaceProps: CockpitWorkspacePaneProps = {
          tabItems: [mockTab],
          activeTab: "valuation",
          currentTabIndex: 0,
          prevTab: null,
          nextTab: null,
          switchWorkspace: noop,
          tabScrollRef: { current: null },
          tabButtonRefs: { current: {} },
          workspaceScrollRef: { current: null },
          onWheelTabScroll: noop,
          onViewModeChange: noop,
          mobileSection: "workspaces" as const,
          onAdjustShocks: noop,
          locale: "en" as const,
          displayFacts: {
            ticker: "NVDA",
            quarter: "Q2 2027",
            currentPrice: 120.0,
          } as unknown as CockpitWorkspacePaneProps["displayFacts"],
          displayScenarios: {
            scenarios: [],
          } as unknown as CockpitWorkspacePaneProps["displayScenarios"],
          reportData: {
            folderSlug: "NVDA-Q2-2027-analysis",
            folderName: "NVDA-Q2-2027",
            reportMarkdown: "# NVDA Report",
            reportMarkdownZh: "# NVDA 研报",
            facts: {} as unknown,
            scenarios: {} as unknown,
            valuation: {} as unknown,
          } as unknown as CockpitWorkspacePaneProps["reportData"],
          valuationRevisions: [],
          marketEvents: [],
          upstreamDependencies: [],
          onScenarioChange: noop,
          onCatalystProbabilityChange: noop,
          onSimulateShock: noop,
          onSimulateGrossMarginDelta: noop,
          onSimulateCatalystProb: noop,
          onNavigateToModel: noop,
          reportDocLang: "en" as const,
          setReportDocLang: noop,
          showToast: noop,
        };

        const { rerender } = render(
          <CockpitWorkspacePane {...workspaceProps} />
        );
        expect(executionCount).toBe(1);

        // Re-render parent (e.g. left pane slider change) with stable workspaceProps
        rerender(<CockpitWorkspacePane {...workspaceProps} />);

        // Invariant: React.memo skips re-rendering CockpitWorkspacePane
        expect(executionCount).toBe(1);

        // Re-render when active tab changes
        rerender(
          <CockpitWorkspacePane {...workspaceProps} activeTab="estimates" />
        );
        expect(executionCount).toBe(2);
      } finally {
        (CockpitWorkspacePane as unknown as { type: unknown }).type =
          originalType;
      }
    });
  });

  describe("useRecentReport SSR Parity & Hydration Safety", () => {
    it("initializes with currentSlug synchronously when provided", async () => {
      let initialRenderValue: unknown = undefined;
      function TestConsumer() {
        const { recentReport } = useRecentReport("AAPL-2025Q1", "AAPL");
        if (initialRenderValue === undefined) {
          initialRenderValue = recentReport;
        }
        return <div data-testid="recent">{recentReport?.ticker ?? "none"}</div>;
      }

      await act(async () => {
        render(<TestConsumer />);
      });
      expect(initialRenderValue).toEqual({
        slug: "AAPL-2025Q1",
        ticker: "AAPL",
      });
      expect(screen.getByTestId("recent").textContent).toBe("AAPL");
    });

    it("initializes to null on initial render when currentSlug is not provided to preserve SSR parity", async () => {
      setStoredLastReport("LITE-2025Q2", "LITE");

      let initialRenderValue: unknown = undefined;
      function TestConsumer() {
        const { recentReport } = useRecentReport(null);
        if (initialRenderValue === undefined) {
          initialRenderValue = recentReport;
        }
        return <div data-testid="recent">{recentReport?.ticker ?? "none"}</div>;
      }

      await act(async () => {
        render(<TestConsumer />);
      });

      // Synchronous initial render MUST be null so client initial tree matches SSR output
      expect(initialRenderValue).toBeNull();
      expect(screen.getByTestId("recent").textContent).toBe("LITE");

      act(() => {
        clearStoredLastReport();
      });
    });
  });

  describe("Header Default Stock & Navigation Invariants", () => {
    const mockGoogleReport: ReportSummary = {
      ...mockReport,
      slug: "GOOGL-Q4-2025-analysis",
      name: "GOOGL-Q4-2025-analysis",
      ticker: "GOOGL",
      company: "Alphabet Inc.",
    };

    const mockNvdaReport: ReportSummary = {
      ...mockReport,
      slug: "NVDA-Q2-2027-analysis",
      name: "NVDA-Q2-2027-analysis",
      ticker: "NVDA",
      company: "NVIDIA Corporation",
    };

    it("hides Model button on homepage when no report is selected (Option B)", async () => {
      const queryClient = createTestQueryClient();
      const onSelectReport = vi.fn();
      const onViewModeChange = vi.fn();

      const reports = [mockGoogleReport, mockNvdaReport];

      await act(async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <Header
                currentSlug={null}
                reports={reports}
                viewMode="screener"
                onSelectReport={onSelectReport}
                onViewModeChange={onViewModeChange}
                onOpenShortcutsModal={noop}
                onShare={noop}
                locale="en"
              />
            </ThemeProvider>
          </QueryClientProvider>
        );
      });

      // Invariant: On homepage (currentSlug === null), Model button is hidden
      const cockpitButton = screen.queryByTitle(/Model/i);
      expect(cockpitButton).toBeNull();

      // Screener and Watchlist are present in center nav
      expect(screen.getByTitle("Screener (S)")).toBeDefined();
      expect(screen.getByTitle(/Watchlist/i)).toBeDefined();

      // ReportSelector capsule shows Select Stock...
      expect(screen.getByText("Select Stock...")).toBeDefined();
    });

    it("renders Model button and navigates directly on first click once a report is selected", async () => {
      const queryClient = createTestQueryClient();
      const onSelectReport = vi.fn();
      const onViewModeChange = vi.fn();

      const reports = [mockGoogleReport, mockNvdaReport];

      await act(async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <Header
                currentSlug="NVDA-Q2-2027-analysis"
                reports={reports}
                viewMode="screener"
                onSelectReport={onSelectReport}
                onViewModeChange={onViewModeChange}
                onOpenShortcutsModal={noop}
                onShare={noop}
                locale="en"
              />
            </ThemeProvider>
          </QueryClientProvider>
        );
      });

      // Invariant: When currentSlug is set, Model button appears
      const cockpitButton = screen.getByTitle("Return to NVDA Model (M)");
      expect(cockpitButton).toBeDefined();
      expect(cockpitButton.textContent).toContain("NVDA");

      fireEvent.click(cockpitButton);

      // Invariant: onSelectReport must be called on first click without redundant onViewModeChange
      expect(onSelectReport).toHaveBeenCalledTimes(1);
      expect(onSelectReport).toHaveBeenCalledWith("NVDA-Q2-2027-analysis");
      expect(onViewModeChange).not.toHaveBeenCalled();
    });
  });
});
