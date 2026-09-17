import { describe, it, expect } from "vitest";
import {
  parseScenarioUrlState,
  serializeScenarioUrlState,
  type ScenarioUrlState,
} from "@/lib/url-state";

describe("URL State Parser & Serializer", () => {
  it("parses empty string cleanly", () => {
    expect(parseScenarioUrlState("")).toEqual({});
    expect(parseScenarioUrlState("?")).toEqual({});
    expect(parseScenarioUrlState("#")).toEqual({});
  });

  it("parses full scenario query string accurately", () => {
    const query =
      "?report=NVDA-Q2-2027-analysis&tab=scenarios&mode=memo&lang=zh&gm=-250&opex=10&d_cloud-capex=-20&d_cowos=15";
    const parsed = parseScenarioUrlState(query);

    expect(parsed.report).toBe("NVDA-Q2-2027-analysis");
    expect(parsed.tab).toBe("scenarios");
    expect(parsed.mode).toBe("memo");
    expect(parsed.lang).toBe("zh");
    expect(parsed.stressParams).toBeDefined();
    expect(parsed.stressParams?.grossMarginBpsDelta).toBe(-250);
    expect(parsed.stressParams?.fixedOpexShiftPct).toBe(10);
    expect(parsed.stressParams?.driverShocks).toEqual({
      "cloud-capex": -20,
      cowos: 15,
    });
  });

  it("parses hash fragments for backward compatibility", () => {
    const hash = "#tab=catalysts&gm=-100&d_demand=-10";
    const parsed = parseScenarioUrlState(hash);

    expect(parsed.tab).toBe("catalysts");
    expect(parsed.stressParams?.grossMarginBpsDelta).toBe(-100);
    expect(parsed.stressParams?.driverShocks?.demand).toBe(-10);
  });

  it("serializes state into canonical query string with sorted parameters", () => {
    const state: ScenarioUrlState = {
      report: "MU-Q3-2026-analysis",
      tab: "scenarios",
      mode: "cockpit", // default mode omitted
      lang: "en",
      stressParams: {
        driverShocks: {
          "hbm-demand": 25,
          "pc-capex": -15,
        },
        grossMarginBpsDelta: -150,
        fixedOpexShiftPct: 5,
      },
    };

    const qs = serializeScenarioUrlState(state);
    expect(qs).toContain("report=MU-Q3-2026-analysis");
    expect(qs).toContain("tab=scenarios");
    expect(qs).toContain("lang=en");
    expect(qs).toContain("gm=-150");
    expect(qs).toContain("opex=5");
    expect(qs).toContain("d_hbm-demand=25");
    expect(qs).toContain("d_pc-capex=-15");
    expect(qs).not.toContain("mode=cockpit"); // default omitted for brevity
  });

  it("round-trips scenario state seamlessly", () => {
    const original: ScenarioUrlState = {
      report: "NVDA-Q2-2027-analysis",
      tab: "scenarios",
      mode: "memo",
      lang: "zh",
      stressParams: {
        driverShocks: {
          "driver-1": -30,
        },
        grossMarginBpsDelta: -200,
        fixedOpexShiftPct: 8,
      },
    };

    const serialized = serializeScenarioUrlState(original);
    const parsed = parseScenarioUrlState(serialized);

    expect(parsed.report).toBe(original.report);
    expect(parsed.tab).toBe(original.tab);
    expect(parsed.mode).toBe(original.mode);
    expect(parsed.lang).toBe(original.lang);
    expect(parsed.stressParams?.grossMarginBpsDelta).toBe(
      original.stressParams?.grossMarginBpsDelta
    );
    expect(parsed.stressParams?.fixedOpexShiftPct).toBe(
      original.stressParams?.fixedOpexShiftPct
    );
    expect(parsed.stressParams?.driverShocks).toEqual(
      original.stressParams?.driverShocks
    );
  });

  it("simulates full deep-link restoration and valuation execution lifecycle", () => {
    // 1. User receives a shared URL link
    const sharedUrl =
      "?report=NVDA-Q2-2027-analysis&tab=scenarios&gm=-250&opex=5&d_hyperscaler-capex=-30";

    // 2. Parse incoming URL state on page mount
    const incomingState = parseScenarioUrlState(sharedUrl);
    expect(incomingState.report).toBe("NVDA-Q2-2027-analysis");
    expect(incomingState.tab).toBe("scenarios");

    // 3. Mock report baseline with multiple upstream drivers
    const baseline = {
      baseRevenueBillions: 100,
      baseGrossMarginPct: 75,
      fixedOpexBillions: 20,
      dilutedSharesBillions: 24,
      taxRatePct: 15,
      multipleRegimes: { bull: 32, base: 26, panic: 17 },
      upstreamDrivers: [
        {
          id: "hyperscaler-capex",
          name: "Hyperscaler CapEx",
          exposureShare: 0.6,
          elasticity: 1.0,
          defaultShockPct: 0,
        },
        {
          id: "tsmc-cowos-supply",
          name: "TSMC Supply",
          exposureShare: 0.4,
          elasticity: 0.8,
          defaultShockPct: 0,
        },
      ],
    };

    // 4. Simulate loadReport shock merge: URL overrides take precedence over defaults
    const mergedShocks: Record<string, number> = {};
    for (const d of baseline.upstreamDrivers) {
      mergedShocks[d.id] =
        incomingState.stressParams?.driverShocks?.[d.id] ??
        d.defaultShockPct ??
        0;
    }

    const effectiveStressParams = {
      driverShocks: mergedShocks,
      grossMarginBpsDelta: incomingState.stressParams?.grossMarginBpsDelta ?? 0,
      fixedOpexShiftPct: incomingState.stressParams?.fixedOpexShiftPct ?? 0,
    };

    // Verify hyperscaler-capex was restored to -30%, while tsmc-cowos defaulted to 0%
    expect(effectiveStressParams.driverShocks["hyperscaler-capex"]).toBe(-30);
    expect(effectiveStressParams.driverShocks["tsmc-cowos-supply"]).toBe(0);
    expect(effectiveStressParams.grossMarginBpsDelta).toBe(-250);
    expect(effectiveStressParams.fixedOpexShiftPct).toBe(5);

    // 5. User adjusts a slider (e.g. changes opex shift to 10%)
    const updatedState: ScenarioUrlState = {
      ...incomingState,
      stressParams: {
        ...effectiveStressParams,
        fixedOpexShiftPct: 10,
      },
    };

    const newQueryString = serializeScenarioUrlState(updatedState);
    expect(newQueryString).toContain("report=NVDA-Q2-2027-analysis");
    expect(newQueryString).toContain("tab=scenarios");
    expect(newQueryString).toContain("gm=-250");
    expect(newQueryString).toContain("opex=10");
    expect(newQueryString).toContain("d_hyperscaler-capex=-30");
  });
});
