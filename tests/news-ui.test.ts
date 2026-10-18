import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { NewsTab } from "../src/components/tabs/NewsTab";
import { ScenariosTab } from "../src/components/tabs/ScenariosTab";
import {
  MarketEventSchema,
  type MarketEvent,
  type UpstreamDependency,
  type ValuationRevision,
  type Scenarios,
} from "../src/lib/schemas";

describe("News & Catalyst UI Rendering & Null-Safety Guardrails", () => {
  describe("Zod Schema Nullable Invariants", () => {
    it("validates market events with null database fields (PostgreSQL wire format)", () => {
      const rawDbEvent = {
        id: "evt-mu-1",
        ticker: "MU",
        title: "Micron Reports Q4 Results and HBM3E Guidance",
        summary:
          "Micron reported strong revenue growth driven by AI memory demand.",
        sourceUrl: null,
        publisher: "Finnhub News",
        publishedAt: "2026-10-18T10:00:00Z",
        eventType: "upstream_earnings",
        priceMovePct: null,
        abnormalReturnSigma: null,
        transmissionType: "none",
        transmissionPayload: null,
        impliedWfvImpactPct: null,
      };

      const parsed = MarketEventSchema.safeParse(rawDbEvent);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.priceMovePct).toBeNull();
        expect(parsed.data.abnormalReturnSigma).toBeNull();
        expect(parsed.data.impliedWfvImpactPct).toBeNull();
      }
    });

    it("validates market events with undefined (omitted) fields", () => {
      const omittedEvent = {
        id: "evt-mu-2",
        ticker: "MU",
        title: "Micron Unveils HBM4 Roadmap",
        summary: "Next-gen memory architecture announced.",
        publisher: "Reuters",
        publishedAt: "2026-10-18T12:00:00Z",
        eventType: "product_release",
      };

      const parsed = MarketEventSchema.safeParse(omittedEvent);
      expect(parsed.success).toBe(true);
    });
  });

  describe("NewsTab Component Rendering Invariants", () => {
    it("renders cleanly without throwing when events have null numeric fields", () => {
      const eventsWithNulls: MarketEvent[] = [
        {
          id: "evt-1",
          ticker: "MU",
          title: "Semiconductor Market Update",
          summary: "Market analysis on memory chips.",
          publisher: "Bloomberg",
          publishedAt: "2026-10-18T08:00:00Z",
          eventType: "general_catalyst",
          priceMovePct: null as unknown as undefined,
          abnormalReturnSigma: null as unknown as undefined,
          transmissionType: "none",
          impliedWfvImpactPct: null as unknown as undefined,
          sources: [],
        },
      ];

      // Must not throw TypeError: Cannot read properties of null (reading 'toFixed')
      expect(() => {
        const html = renderToString(
          React.createElement(NewsTab, {
            ticker: "MU",
            events: eventsWithNulls,
            locale: "en",
          })
        );
        expect(html).toContain("Semiconductor Market Update");
      }).not.toThrow();
    });

    it("renders cleanly when events have string numbers or mixed types", () => {
      const eventsWithStrings = [
        {
          id: "evt-2",
          ticker: "NVDA",
          title: "TSMC Increases Advanced Packaging CapEx",
          summary: "CoWoS capacity surge positively impacts NVIDIA supply.",
          publisher: "Reuters",
          publishedAt: "2026-10-18T09:30:00Z",
          eventType: "upstream_earnings" as const,
          priceMovePct: "3.45" as unknown as number,
          abnormalReturnSigma: "2.10" as unknown as number,
          transmissionType: "driver_shock" as const,
          transmissionPayload: {
            driverId: "hyperscaler-capex",
            deltaShockPct: 15,
            rationale: "Upstream packaging volume expansion.",
          },
          impliedWfvImpactPct: "4.20" as unknown as number,
        },
      ];

      expect(() => {
        const html = renderToString(
          React.createElement(NewsTab, {
            ticker: "NVDA",
            events: eventsWithStrings as unknown as MarketEvent[],
            locale: "zh",
          })
        );
        expect(html).toContain("TSMC Increases Advanced Packaging CapEx");
        expect(html).toContain("3.45");
      }).not.toThrow();
    });

    it("renders cleanly with negative price reactions and negative WFV impacts", () => {
      const negativeEvents: MarketEvent[] = [
        {
          id: "evt-neg",
          ticker: "MU",
          title: "Antitrust Inquiry Announced",
          summary: "Regulatory review announced.",
          publisher: "WSJ",
          publishedAt: "2026-10-18T14:00:00Z",
          eventType: "sec_filing",
          priceMovePct: -4.82,
          abnormalReturnSigma: -3.1,
          transmissionType: "segment_growth",
          transmissionPayload: {
            segmentName: "DRAM",
            segmentDeltaGrowthPct: -10,
            rationale: "Supply chain restriction impact.",
          },
          impliedWfvImpactPct: -5.6,
          sources: [],
        },
      ];

      const html = renderToString(
        React.createElement(NewsTab, {
          ticker: "MU",
          events: negativeEvents,
          locale: "en",
        })
      );
      expect(html).toContain("-4.82");
      expect(html).toContain("-5.60");
      expect(html).toContain("-3.1");
    });

    it("renders cleanly with empty events and empty upstream dependencies", () => {
      expect(() => {
        const html = renderToString(
          React.createElement(NewsTab, {
            ticker: "MU",
            events: [],
            upstreamDependencies: [],
            locale: "en",
          })
        );
        expect(html).toBeDefined();
      }).not.toThrow();
    });

    it("renders upstream dependencies with string and numeric exposures safely", () => {
      const dependencies: UpstreamDependency[] = [
        {
          id: "up-1",
          sourceTicker: "TSM",
          targetTicker: "MU",
          driverId: "wafer-capacity",
          driverName: "Silicon Wafer Supply",
          exposureShare: "0.65" as unknown as number,
          elasticity: "0.80" as unknown as number,
          notes: "Critical supply chain node.",
        },
      ];

      const html = renderToString(
        React.createElement(NewsTab, {
          ticker: "MU",
          events: [],
          upstreamDependencies: dependencies,
          locale: "zh",
        })
      );
      expect(html).toContain("TSM");
      expect(html).toContain("65% Exp");
      expect(html).toContain("0.80x Elas");
    });
  });

  describe("ScenariosTab Revision Ledger Invariants", () => {
    const mockScenarios: Scenarios = {
      ticker: "MU",
      basisYear: "FY2026",
      currentPrice: 100,
      consensusTarget: 115,
      scenarios: [
        {
          name: "Bull",
          probability: 0.25,
          multiple: 20,
          forwardEps: 7,
          assumptions: ["Strong growth"],
          keyDrivers: [],
        },
        {
          name: "Base",
          probability: 0.5,
          multiple: 16,
          forwardEps: 6,
          assumptions: ["Guidance midpoint"],
          keyDrivers: [],
        },
        {
          name: "Bear",
          probability: 0.25,
          multiple: 12,
          forwardEps: 5,
          assumptions: ["Deceleration"],
          keyDrivers: [],
        },
      ],
    };

    it("renders cleanly when revisions contain string numbers from PostgreSQL", () => {
      const revisions: ValuationRevision[] = [
        {
          id: "rev-1",
          ticker: "MU",
          revisionDate: "2026-10-18T10:00:00Z",
          triggerType: "sec_8k",
          headline: "HBM3E Yield Upgrade",
          rationale: "Yield improvement expands forward gross margins.",
          priorWfv: "110.00" as unknown as number,
          newWfv: "125.50" as unknown as number,
          wfvDeltaPct: "14.09" as unknown as number,
          fullStateDiff: {
            priorRegimes: { bull: 140, base: 110, panic: 70 },
            newRegimes: { bull: 155, base: 125.5, panic: 75 },
          },
        },
      ];

      expect(() => {
        const html = renderToString(
          React.createElement(ScenariosTab, {
            scenariosData: mockScenarios,
            currentPrice: 100,
            onScenarioChange: () => {},
            revisions,
            locale: "en",
          })
        );
        expect(html).toContain("HBM3E Yield Upgrade");
        expect(html).toContain("$110.00");
        expect(html).toContain("$125.50");
        expect(html).toContain("14.09");
      }).not.toThrow();
    });

    it("renders cleanly when revisions array is empty", () => {
      expect(() => {
        const html = renderToString(
          React.createElement(ScenariosTab, {
            scenariosData: mockScenarios,
            currentPrice: 100,
            onScenarioChange: () => {},
            revisions: [],
            locale: "zh",
          })
        );
        expect(html).toBeDefined();
      }).not.toThrow();
    });
  });
});
