// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PriceMeter } from "@/components/PriceMeter";
import { TechnicalLevelsCard } from "@/components/TechnicalLevelsCard";
import { TradingViewChart } from "@/components/TradingViewChart";
import { TechnicalsTab } from "@/components/tabs/TechnicalsTab";
import { getWorkspaceTabs, WORKSPACE_TAB_IDS } from "@/lib/workspace-tabs";
import { getTranslations } from "@/lib/i18n";
import type { TechnicalLevelsPayload, ReportData } from "@/lib/schemas";

const mockPayload: TechnicalLevelsPayload = {
  asOf: "2026-10-28T12:00:00Z",
  currentPrice: 150,
  sma50: 145,
  sma200: 135,
  high52: 180,
  low52: 110,
  pivotP: 148,
  support1: 142,
  resistance1: 158,
  support2: 136,
  resistance2: 164,
  levels: [
    {
      id: "high52",
      label: "52-Week High",
      price: 180,
      deltaPct: 20,
      type: "resistance",
      importance: "major",
    },
    {
      id: "resistance2",
      label: "Pivot Resistance 2 (R2)",
      price: 164,
      deltaPct: 9.33,
      type: "resistance",
      importance: "minor",
    },
    {
      id: "pivot_r1",
      label: "Pivot Resistance 1 (R1)",
      price: 158,
      deltaPct: 5.33,
      type: "resistance",
      importance: "intermediate",
    },
    {
      id: "pivot_p",
      label: "Classical Pivot (P)",
      price: 148,
      deltaPct: -1.33,
      type: "pivot",
      importance: "intermediate",
    },
    {
      id: "sma50",
      label: "50-Day SMA",
      price: 145,
      deltaPct: -3.33,
      type: "support",
      importance: "intermediate",
    },
    {
      id: "pivot_s1",
      label: "Pivot Support 1 (S1)",
      price: 142,
      deltaPct: -5.33,
      type: "support",
      importance: "intermediate",
    },
    {
      id: "support2",
      label: "Pivot Support 2 (S2)",
      price: 136,
      deltaPct: -9.33,
      type: "support",
      importance: "minor",
    },
    {
      id: "sma200",
      label: "200-Day SMA",
      price: 135,
      deltaPct: -10,
      type: "support",
      importance: "major",
    },
    {
      id: "low52",
      label: "52-Week Low",
      price: 110,
      deltaPct: -26.67,
      type: "support",
      importance: "major",
    },
  ],
};

describe("Technical Levels UI Components", () => {
  describe("PriceMeter clean valuation display", () => {
    it("renders clean price meter without cluttered technical tick marks", () => {
      render(
        <PriceMeter
          currentPrice={150}
          panicTarget={115}
          baseTarget={160}
          bullTarget={190}
          locale="en"
        />
      );

      // Verify meter rendered
      expect(screen.getByText("Valuation Meter")).toBeDefined();
      expect(screen.getByText(/Current: \$150/)).toBeDefined();

      // Ensure S/R button and technical tick marks are NOT present
      expect(screen.queryByRole("button", { name: /S\/R/i })).toBeNull();
    });

    it("renders in Chinese locale without inline ternaries", () => {
      render(
        <PriceMeter
          currentPrice={150}
          panicTarget={115}
          baseTarget={160}
          bullTarget={190}
          locale="zh"
        />
      );

      expect(screen.getByText("估值区间标尺")).toBeDefined();
      expect(screen.getByText(/现价: \$150/)).toBeDefined();
    });
  });

  describe("TechnicalLevelsCard", () => {
    it("renders 3-tier institutional price corridors by default and allows switching to all levels", () => {
      render(
        <TechnicalLevelsCard
          technicalLevels={mockPayload}
          valuation={{
            panic: 100,
            bear: 120,
            base: 170,
            bull: 220,
          }}
          locale="en"
        />
      );

      // Default view: 3-Tier Corridors
      expect(screen.getByText("Institutional Price Corridors")).toBeDefined();
      expect(screen.getByText("3-Tier Corridors")).toBeDefined();
      expect(screen.getByText("All Levels")).toBeDefined();
      expect(screen.getByText("Key Support")).toBeDefined();
      expect(screen.getByText("Key Resistance")).toBeDefined();

      // Corridors Tiers (S1, S2, S3, R1, R2, R3)
      expect(screen.getByText("S1")).toBeDefined();
      expect(screen.getByText("R1")).toBeDefined();

      // Switch to All Levels view
      const allLevelsBtn = screen.getByRole("button", { name: /All Levels/i });
      fireEvent.click(allLevelsBtn);

      expect(screen.getByText("Key Support & Resistance")).toBeDefined();
      expect(screen.getByText("50-Day SMA")).toBeDefined();
      expect(screen.getByText("Pivot Resistance 1 (R1)")).toBeDefined();
    });

    it("displays confluence banner when technical level converges with fundamental regime", () => {
      // 135 (200 SMA) converges with 136 (bear target) within 0.74%
      render(
        <TechnicalLevelsCard
          technicalLevels={mockPayload}
          valuation={{
            panic: 100,
            bear: 136,
            base: 170,
            bull: 220,
          }}
          locale="en"
        />
      );

      expect(screen.getByText("⚡ CONFLUENCE DETECTED")).toBeDefined();
      expect(screen.getByText(/converges with/)).toBeDefined();
    });

    it("renders in Chinese locale", () => {
      render(
        <TechnicalLevelsCard
          technicalLevels={mockPayload}
          valuation={{
            panic: 100,
            bear: 136,
            base: 170,
            bull: 220,
          }}
          locale="zh"
        />
      );

      expect(screen.getByText("机构级价格走廊")).toBeDefined();
      expect(screen.getByText("3阶核心走廊")).toBeDefined();
      expect(screen.getByText("全部技术位")).toBeDefined();
      expect(screen.getByText("关键支撑位 (Support)")).toBeDefined();
      expect(screen.getByText("关键阻力位 (Resistance)")).toBeDefined();
      expect(screen.getByText("⚡ 发现技术共振")).toBeDefined();
    });

    it("returns null gracefully if no technical levels provided", () => {
      const { container } = render(
        <TechnicalLevelsCard technicalLevels={undefined} locale="en" />
      );
      expect(container.firstChild).toBeNull();
    });

    it("displays clustered zone range and clean signed percentages in detailed view", () => {
      const clusteredPayload: TechnicalLevelsPayload = {
        asOf: "2026-10-28T12:00:00Z",
        currentPrice: 350,
        levels: [
          {
            id: "pivot_r1",
            label: "Pivot Resistance 1 (R1)",
            price: 360,
            deltaPct: 2.86,
            type: "resistance",
            importance: "intermediate",
          },
          {
            id: "sma50",
            label: "50-Day SMA",
            price: 340.29,
            deltaPct: -2.77,
            type: "support",
            importance: "intermediate",
            zoneRange: [340.29, 340.94],
            clusterCount: 2,
          },
          {
            id: "sma200",
            label: "200-Day SMA",
            price: 340.94,
            deltaPct: -2.59,
            type: "support",
            importance: "major",
            zoneRange: [340.29, 340.94],
            clusterCount: 2,
          },
        ],
      };

      render(
        <TechnicalLevelsCard
          technicalLevels={clusteredPayload}
          currentPrice={350}
          locale="en"
        />
      );

      // Switch to All Levels detailed view
      const allLevelsBtn = screen.getByRole("button", { name: /All Levels/i });
      fireEvent.click(allLevelsBtn);

      // Verify zone range is displayed
      const zoneElements = screen.getAllByText(/\$340\.29\s*–\s*\$340\.94/);
      expect(zoneElements.length).toBeGreaterThan(0);

      // Verify clean signed percentage: "+2.9%" for resistance, "-2.8%" for support, zero "+-"
      expect(screen.getByText("+2.9%")).toBeDefined();
      expect(screen.getByText("-2.8%")).toBeDefined();

      // Ensure no "+-" string exists anywhere in the container
      expect(document.body.textContent).not.toContain("+-");
    });

    it("renders compact mode for Left Pane without text collisions and triggers onOpenTechnicals", () => {
      const handleOpenTechnicals = vi.fn();
      render(
        <TechnicalLevelsCard
          technicalLevels={mockPayload}
          currentPrice={150}
          valuation={{
            panic: 100,
            bear: 136,
            base: 170,
            bull: 220,
          }}
          compact={true}
          onOpenTechnicals={handleOpenTechnicals}
          locale="en"
        />
      );

      // Verify compact header & telemetry
      expect(screen.getByText("S/R Telemetry")).toBeDefined();
      expect(screen.getByText("Spot")).toBeDefined();
      expect(screen.getByText("$150.00")).toBeDefined();

      // Click onOpenTechnicals trigger button
      const openBtn = screen.getByRole("button", {
        name: /Full Chart & Analysis/i,
      });
      fireEvent.click(openBtn);
      expect(handleOpenTechnicals).toHaveBeenCalledTimes(1);
    });
  });

  describe("TradingViewChart", () => {
    it("renders TradingView widget container with correct ticker reference and link", () => {
      render(<TradingViewChart ticker="GOOGL" locale="en" />);

      expect(
        screen.getByText(/TradingView Real-Time Telemetry · GOOGL/i)
      ).toBeDefined();
      const link = screen.getByRole("link", { name: /TradingView/i });
      expect(link.getAttribute("href")).toBe(
        "https://www.tradingview.com/symbols/GOOGL/"
      );
    });
  });

  describe("TechnicalsTab", () => {
    it("renders live interactive chart and 3-tier price corridors", () => {
      render(
        <TechnicalsTab
          ticker="GOOGL"
          currentPrice={283.82}
          technicalLevels={mockPayload}
          valuation={{
            panic: 240,
            bear: 270,
            base: 320,
            bull: 380,
          }}
          locale="en"
        />
      );

      expect(screen.getByText("Technical Analysis & Chart")).toBeDefined();
      expect(screen.getByText("GOOGL")).toBeDefined();
      expect(screen.getByText("$283.82")).toBeDefined();
      expect(screen.getByText("Live Interactive Chart")).toBeDefined();
      expect(screen.getByText("Institutional Price Corridors")).toBeDefined();
    });
  });

  describe("Workspace Tabs Registration", () => {
    it("registers technicals as tab 2 in WORKSPACE_TAB_IDS and getWorkspaceTabs", () => {
      expect(WORKSPACE_TAB_IDS).toContain("technicals");
      expect(WORKSPACE_TAB_IDS[1]).toBe("technicals");

      const t = getTranslations("en");
      const mockReportData = {
        technicalLevels: mockPayload,
        facts: { ticker: "NVDA", segments: [] },
      } as unknown as ReportData;

      const tabs = getWorkspaceTabs(t, mockReportData, 3, false);
      expect(tabs[1].id).toBe("technicals");
      expect(tabs[1].shortcut).toBe("2");
      expect(tabs[1].label).toBe("Technicals & Chart");
      expect(tabs[1].shortLabel).toBe("Technicals");
      expect(tabs[1].count).toBe(mockPayload.levels.length);
    });
  });
});
