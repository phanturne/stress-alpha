// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MarketHomeView } from "@/components/home/MarketHomeView";
import {
  GICS_SECTORS,
  getTickerSectorId,
  aggregateSectors,
} from "@/lib/sectors";
import { saveStoredWatchlist } from "@/lib/watchlist";
import type { ReportSummary } from "@/app/api/reports/route";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    prefetch: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const mockReports: ReportSummary[] = [
  {
    slug: "NVDA-Q2-2027-analysis",
    name: "NVDA-Q2-2027-analysis",
    ticker: "NVDA",
    company: "NVIDIA Corporation",
    quarter: "Q2 2027",
    reportDate: "2026-08-26",
    currentPrice: 120.0,
    weightedFairValue: 160.0,
    upsidePct: 33.33,
    consensusSpreadPct: 18.5,
    analystTarget: 135.0,
    snowflakeScore: 26,
    snowflakeTier: "exceptional",
    snowflakePillars: {
      valuation: 5,
      future: 6,
      earnings: 5,
      moat: 5,
      resilience: 5,
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
  },
  {
    slug: "AAPL-Q3-2026-analysis",
    name: "AAPL-Q3-2026-analysis",
    ticker: "AAPL",
    company: "Apple Inc.",
    quarter: "Q3 2026",
    reportDate: "2026-08-01",
    currentPrice: 220.0,
    weightedFairValue: 245.0,
    upsidePct: 11.36,
    consensusSpreadPct: 4.2,
    analystTarget: 235.0,
    snowflakeScore: 23,
    snowflakeTier: "strong",
    snowflakePillars: {
      valuation: 4,
      future: 4,
      earnings: 5,
      moat: 6,
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
  },
  {
    slug: "META-Q2-2026-analysis",
    name: "META-Q2-2026-analysis",
    ticker: "META",
    company: "Meta Platforms",
    quarter: "Q2 2026",
    reportDate: "2026-07-31",
    currentPrice: 510.0,
    weightedFairValue: 620.0,
    upsidePct: 21.57,
    consensusSpreadPct: 12.0,
    analystTarget: 550.0,
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
  },
];

describe("Sector Classification & Aggregation Unit Tests", () => {
  it("resolves ticker symbols to correct GICS sector IDs", () => {
    expect(getTickerSectorId("NVDA")).toBe("technology");
    expect(getTickerSectorId("AAPL")).toBe("technology");
    expect(getTickerSectorId("META")).toBe("communication");
    expect(getTickerSectorId("TSLA")).toBe("consumer_discretionary");
    expect(getTickerSectorId("JPM")).toBe("financials");
    expect(getTickerSectorId("LLY")).toBe("healthcare");
    expect(getTickerSectorId("RKLB")).toBe("industrials");
    expect(getTickerSectorId("XOM")).toBe("energy");
  });

  it("aggregates reports by sector and computes mean WFV upside and Snowflake score", () => {
    const etfQuotes = { XLK: 1.25, XLC: -0.45 };
    const aggregated = aggregateSectors(mockReports, etfQuotes, "en");

    expect(aggregated.length).toBe(GICS_SECTORS.length);

    const tech = aggregated.find((s) => s.sector.id === "technology");
    expect(tech).toBeDefined();
    expect(tech?.coveredCount).toBe(2);
    expect(tech?.changePct).toBe(1.25);
    // Average of 33.33 and 11.36 is ~22.3%
    expect(tech?.avgUpsidePct).toBeCloseTo(22.3, 0);
    // Average of 26 and 23 is 24.5
    expect(tech?.avgSnowflakeScore).toBe(24.5);

    const comm = aggregated.find((s) => s.sector.id === "communication");
    expect(comm).toBeDefined();
    expect(comm?.coveredCount).toBe(1);
    expect(comm?.avgUpsidePct).toBe(21.6);
  });
});

describe("MarketHomeView Component & Invariants", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/market/summary")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                indices: [
                  {
                    symbol: "SPY",
                    name: "S&P 500",
                    price: 578.5,
                    change: 2.1,
                    changePct: 0.36,
                  },
                  {
                    symbol: "QQQ",
                    name: "Nasdaq 100",
                    price: 495.2,
                    change: 4.0,
                    changePct: 0.81,
                  },
                  {
                    symbol: "DIA",
                    name: "Dow Jones",
                    price: 422.4,
                    change: 0.6,
                    changePct: 0.14,
                  },
                  {
                    symbol: "IWM",
                    name: "Russell 2000",
                    price: 222.1,
                    change: -0.5,
                    changePct: -0.22,
                  },
                  {
                    symbol: "^TNX",
                    name: "10Y Treasury",
                    price: 4.28,
                    change: -0.03,
                    changePct: -0.65,
                  },
                  {
                    symbol: "^VIX",
                    name: "Volatility (VIX)",
                    price: 15.8,
                    change: -0.5,
                    changePct: -3.2,
                  },
                ],
                sectors: { XLK: 1.25, XLC: -0.45 },
              }),
          });
        }
        if (url.includes("/api/earnings/calendar")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                earnings: [
                  {
                    symbol: "NVDA",
                    company: "NVIDIA Corporation",
                    date: "2026-11-04",
                    hour: "amc",
                    epsEstimate: 2.15,
                    revenueEstimate: 102500000000,
                    hasModel: true,
                    reportSlug: "NVDA-Q2-2027-analysis",
                    sectorId: "technology",
                    marketCap: 3400000000000,
                  },
                  {
                    symbol: "PLTR",
                    company: "Palantir Technologies",
                    date: "2026-11-04",
                    hour: "amc",
                    epsEstimate: 0.12,
                    revenueEstimate: 815000000,
                    hasModel: true,
                    reportSlug: "pltr-2026q3",
                    sectorId: "technology",
                    marketCap: 110000000000,
                  },
                  {
                    symbol: "PFE",
                    company: "Pfizer Inc.",
                    date: "2026-11-04",
                    hour: "bmo",
                    epsEstimate: 0.62,
                    revenueEstimate: 16500000000,
                    hasModel: false,
                    sectorId: "healthcare",
                    marketCap: 155000000000,
                  },
                ],
              }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      })
    );
  });

  function renderMarketHome(locale: "en" | "zh" = "en") {
    const onSelectReport = vi.fn();
    const onOpenScreener = vi.fn();

    const utils = render(
      <QueryClientProvider client={queryClient}>
        <MarketHomeView
          reports={mockReports}
          onSelectReport={onSelectReport}
          onOpenScreener={onOpenScreener}
          locale={locale}
        />
      </QueryClientProvider>
    );

    return { ...utils, onSelectReport, onOpenScreener };
  }

  it("starts directly with major market indices tape and eliminates duplicate hero search", () => {
    renderMarketHome("en");

    // The hero header and duplicate search are eliminated
    expect(screen.queryByText("Institutional Market Intelligence")).toBeNull();
    expect(
      screen.queryByPlaceholderText(
        "Search tickers, companies, sectors, or filter valuation..."
      )
    ).toBeNull();

    // Starts directly with Macro Index Pulse
    expect(screen.getByText("Macro Index Pulse")).toBeDefined();
    expect(screen.getByText("S&P 500")).toBeDefined();
    expect(screen.getByText("Nasdaq 100")).toBeDefined();
    expect(screen.getByText("Dow Jones")).toBeDefined();
    expect(screen.getByText("Russell 2000")).toBeDefined();
    expect(screen.getByText("10Y Treasury")).toBeDefined();
    expect(screen.getByText("Volatility (VIX)")).toBeDefined();
  });

  it("renders standard S&P 500 Heatmap elevated to top priority with constituents and legend", () => {
    const { onOpenScreener } = renderMarketHome("en");

    expect(screen.getByText("S&P 500 Heatmap")).toBeDefined();
    expect(
      screen.getByText("Constituent performance grouped by GICS sectors")
    ).toBeDefined();

    // Verify key constituents are rendered in the heatmap tiles
    expect(screen.getAllByText("NVDA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AAPL").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MSFT").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GOOGL").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AMZN").length).toBeGreaterThan(0);

    // Verify expand button
    const expandBtn = screen.getByText("Expand ⤢");
    expect(expandBtn).toBeDefined();
    fireEvent.click(expandBtn);
    expect(onOpenScreener).toHaveBeenCalled();

    // Verify legend
    expect(screen.getByText("-3%")).toBeDefined();
    expect(screen.getByText("+3%")).toBeDefined();
  });

  it("clicking covered stock in S&P 500 heatmap launches interactive cockpit model", () => {
    const { onSelectReport } = renderMarketHome("en");

    const nvdaTiles = screen.getAllByText("NVDA");
    // Find the heatmap tile for NVDA and click it
    fireEvent.click(nvdaTiles[0]);
    expect(onSelectReport).toHaveBeenCalledWith(
      "NVDA-Q2-2027-analysis",
      "cockpit"
    );
  });

  it("renders Market Summary accordion with expandable stories, sources, and institutional wire tags", () => {
    renderMarketHome("en");

    expect(screen.getByText("Market Summary")).toBeDefined();
    expect(screen.getAllByText("Macro Wire").length).toBeGreaterThan(0);
    expect(screen.getByText("Form 8-K")).toBeDefined();
    expect(screen.getByText("SEC Form 10-Q")).toBeDefined();
    expect(
      screen.getByText(
        "AI Selloff Hammers Tech, Nasdaq Posts Worst Day Since June"
      )
    ).toBeDefined();
    expect(screen.getByText("69 sources")).toBeDefined();

    // Toggle another accordion item
    const story2 = screen.getByText(
      "Intel Collapses on Guidance Haircut & Foundry Packaging Overhang"
    );
    fireEvent.click(story2);
    expect(screen.getByText(/accelerated packaging delays/i)).toBeDefined();
  });

  it("renders quantitative variant perception Standouts with 4-regime spectrum, FCF Yield, and asymmetry skew ratio", () => {
    const { onSelectReport } = renderMarketHome("en");

    expect(screen.getByText("Standouts")).toBeDefined();
    expect(screen.getAllByText("NVIDIA Corporation").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FCF Yield:").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Market Cap:").length).toBeGreaterThan(0);
    expect(screen.getAllByText("P/E Ratio:").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Operating Margin:").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("4-Regime Valuation Spectrum").length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Asymmetry:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Panic Floor").length).toBeGreaterThan(0);
    expect(screen.getAllByText("WFV").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Catalyst & Fundamental Driver").length
    ).toBeGreaterThan(0);

    // Verify presence of catalyst narrative explaining why it is moving
    expect(
      screen.getByText(
        /NVIDIA pulled back amid sector-wide hyperscaler CapEx monetization debates/i
      )
    ).toBeDefined();

    // Verify launch model button with clean text and no emojis
    const modelButtons = screen.getAllByText("Open Model");
    expect(modelButtons.length).toBeGreaterThan(0);
    fireEvent.click(modelButtons[0]);
    expect(onSelectReport).toHaveBeenCalled();
  });

  it("renders scrollable upcoming earnings container with scroll hint", async () => {
    const { onSelectReport } = renderMarketHome("en");

    expect(screen.getByText("Upcoming Earnings Calendar")).toBeDefined();
    expect(screen.getByText("Scroll to view upcoming schedule")).toBeDefined();

    // Wait for async earnings fetch to populate
    await waitFor(() => {
      expect(screen.getAllByText("Open Model").length).toBeGreaterThan(0);
    });

    const modelButtons = screen.getAllByText("Open Model");
    fireEvent.click(modelButtons[0]);
    expect(onSelectReport).toHaveBeenCalled();
  });

  it("renders movers tabs including watchlist tab and handles switching", () => {
    renderMarketHome("en");

    expect(screen.getByText("Gainers")).toBeDefined();
    expect(screen.getByText("Losers")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("Watchlist")).toBeDefined();

    // Click Watchlist tab
    fireEvent.click(screen.getByText("Watchlist"));
    expect(
      screen.getByText(
        "No stocks in watchlist yet. Star stocks to monitor daily returns."
      )
    ).toBeDefined();
  });

  it("renders upcoming earnings watchlist filter button, toggles filtering, and persists in browser storage", async () => {
    localStorage.clear();
    saveStoredWatchlist(["NVDA"]);

    renderMarketHome("en");

    expect(screen.getByText("Watchlist Only")).toBeDefined();

    const upcomingSection = document.getElementById(
      "upcoming-earnings-section"
    )!;
    expect(upcomingSection).toBeDefined();

    // Initially, all mock earnings should be present in upcoming section
    await waitFor(() => {
      expect(within(upcomingSection).getByText("NVDA")).toBeDefined();
      expect(within(upcomingSection).getByText("PLTR")).toBeDefined();
      expect(within(upcomingSection).getByText("PFE")).toBeDefined();
    });

    const watchlistFilterBtn = screen.getByText("Watchlist Only");
    fireEvent.click(watchlistFilterBtn);

    // After toggling Watchlist Only, PLTR and PFE should be filtered out
    await waitFor(() => {
      expect(within(upcomingSection).getByText("NVDA")).toBeDefined();
      expect(within(upcomingSection).queryByText("PLTR")).toBeNull();
      expect(within(upcomingSection).queryByText("PFE")).toBeNull();
    });

    // Verify persisted in browser localStorage
    expect(localStorage.getItem("stress_alpha_earnings_watchlist_only")).toBe(
      "true"
    );

    // Toggle back off
    fireEvent.click(watchlistFilterBtn);
    await waitFor(() => {
      expect(within(upcomingSection).getByText("PLTR")).toBeDefined();
      expect(within(upcomingSection).getByText("PFE")).toBeDefined();
    });
    expect(localStorage.getItem("stress_alpha_earnings_watchlist_only")).toBe(
      "false"
    );
  });

  it("sorts earnings by chronological date, session (BMO before AMC), and market cap descending", async () => {
    saveStoredWatchlist([]);
    renderMarketHome("en");

    const upcomingContainer = document.getElementById(
      "upcoming-earnings-section"
    )!;
    expect(upcomingContainer).toBeDefined();

    await waitFor(() => {
      expect(within(upcomingContainer).getByText("PFE")).toBeDefined();
    });

    // PFE is BMO ($155B), NVDA is AMC ($3.4T), PLTR is AMC ($110B)
    // Hierarchy: BMO comes before AMC, and within AMC $3.4T comes before $110B
    const tickerElements = Array.from(
      upcomingContainer.querySelectorAll(".font-mono.text-xs.font-bold")
    ).map((el) => el.textContent?.trim());

    // PFE (BMO) should appear before NVDA (AMC), and NVDA ($3.4T) before PLTR ($110B)
    expect(tickerElements).toEqual(["PFE", "NVDA", "PLTR"]);
  });

  it("renders completely in Chinese when locale='zh' with zero inline language leaks", () => {
    renderMarketHome("zh");

    expect(screen.getByText("宏观股指异动脉搏")).toBeDefined();
    expect(screen.getByText("市场全景速递")).toBeDefined();
    expect(screen.getByText("标普 500 全景热力图")).toBeDefined();
    expect(screen.getByText("焦点异动标的")).toBeDefined();
    expect(screen.getByText("前瞻财报披露日程")).toBeDefined();
    expect(screen.getByText("仅看自选")).toBeDefined();
    expect(screen.getAllByText("异动催化与核心驱动").length).toBeGreaterThan(0);
    expect(screen.getAllByText("四维动态估值谱系").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/非对称盈亏比:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("自由现金流收益率:").length).toBeGreaterThan(0);
    expect(screen.getAllByText("宏观快讯").length).toBeGreaterThan(0);
    expect(screen.getAllByText("打开模型").length).toBeGreaterThan(0);
  });
});
