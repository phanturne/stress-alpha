import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  fetchCompletePipelineBundle,
  fetchFundamentalProfile,
  fetchAnalystEstimates,
  generateFactsDraft,
  generateBaselineDraft,
  generateScenariosDraft,
  writePipelineArtifacts,
  RATING_ZH_MAP,
  ACTION_ZH_MAP,
} from "@/lib/services/financial-data";
import {
  AnalystEstimatesSchema,
  FactsSchema,
  ReactionsSchema,
} from "@/lib/schemas";
import { GET, POST } from "@/app/api/pipeline/data/route";

describe("Financial Data Ingestion Service & Pipeline Endpoint", () => {
  it("maps ratings and actions correctly to institutional Chinese lexicon", () => {
    expect(RATING_ZH_MAP["strong buy"]).toBe("强烈推荐买入 (Strong Buy)");
    expect(RATING_ZH_MAP["buy"]).toBe("买入 (Buy)");
    expect(RATING_ZH_MAP["hold"]).toBe("持有 (Hold)");
    expect(RATING_ZH_MAP["sell"]).toBe("卖出 (Sell)");

    expect(ACTION_ZH_MAP["raised"]).toBe("上调 (Raised)");
    expect(ACTION_ZH_MAP["lowered"]).toBe("下调 (Lowered)");
    expect(ACTION_ZH_MAP["reiterated"]).toBe("重申 (Reiterated)");
    expect(ACTION_ZH_MAP["upgraded"]).toBe("调高 (Upgraded)");
  });

  it("fetches fundamental profile for active ticker with verified schema invariants", async () => {
    const profile = await fetchFundamentalProfile("MSFT");

    expect(profile.ticker).toBe("MSFT");
    expect(typeof profile.companyName).toBe("string");
    expect(profile.currentPrice).toBeGreaterThan(0);
    expect(profile.marketCapBillions).toBeGreaterThan(0);
    expect(profile.sharesOutstandingBillions).toBeGreaterThan(0);
    expect(profile.balanceSheet).toBeDefined();
    expect(profile.balanceSheet.totalCashBillions).toBeGreaterThan(0);
    expect(profile.quarterlyStatements.length).toBeGreaterThanOrEqual(1);

    const first = profile.quarterlyStatements[0];
    expect(first.revenueBillions).toBeGreaterThan(0);
  });

  it("fetches analyst consensus and price targets conforming to AnalystEstimatesSchema", async () => {
    const { estimatesEn, estimatesZh } = await fetchAnalystEstimates("MSFT", {
      limit: 10,
    });

    const parsedEn = AnalystEstimatesSchema.safeParse(estimatesEn);
    expect(parsedEn.success).toBe(true);

    const parsedZh = AnalystEstimatesSchema.safeParse(estimatesZh);
    expect(parsedZh.success).toBe(true);

    expect(estimatesEn.ticker).toBe("MSFT");
    expect(estimatesZh.ticker).toBe("MSFT");
    expect(estimatesEn.priceTargets.average).toBeGreaterThan(0);
    expect(estimatesEn.priceTargets.low).toBeLessThanOrEqual(
      estimatesEn.priceTargets.high
    );
    expect(estimatesEn.consensus.totalAnalysts).toBeGreaterThan(0);
    expect(estimatesEn.consensus.bullishPct).toBeGreaterThanOrEqual(0);
    expect(estimatesEn.consensus.bullishPct).toBeLessThanOrEqual(100);
    expect(estimatesEn.synthesisNarrative.length).toBeGreaterThan(20);
    expect(estimatesZh.synthesisNarrative.length).toBeGreaterThan(20);
  });

  it("generates a draft facts object conforming strictly to FactsSchema", async () => {
    const profile = await fetchFundamentalProfile("MSFT");
    const { estimatesEn } = await fetchAnalystEstimates("MSFT");

    const draft = generateFactsDraft(profile, estimatesEn, "Q4 2026");
    const parsed = FactsSchema.safeParse(draft);

    expect(parsed.success).toBe(true);
    expect(draft.ticker).toBe("MSFT");
    expect(draft.quarter).toBe("Q4 2026");
    expect(draft.revenueBillions).toBeGreaterThan(0);
    expect(draft.operatingIncomeBillions).toBeGreaterThan(0);
    expect(draft.epsOperating).toBeGreaterThan(0);
    expect(draft.segments.length).toBeGreaterThanOrEqual(1);
    expect(["compounder", "operating_scaler", "venture_hypergrowth"]).toContain(
      draft.valuationArchetype
    );
  });

  it("fetches complete pipeline bundle and stages artifacts to disk", async () => {
    const bundle = await fetchCompletePipelineBundle("MSFT");

    expect(bundle.ticker).toBe("MSFT");
    expect(bundle.profile).toBeDefined();
    expect(bundle.analystEstimatesEn).toBeDefined();
    expect(bundle.reactions).toBeDefined();
    expect(bundle.filings).toBeDefined();
    expect(bundle.factsDraft).toBeDefined();

    // Verify Reactions schema
    const reactionsParsed = ReactionsSchema.safeParse(bundle.reactions);
    expect(reactionsParsed.success).toBe(true);

    // Verify All 8 Scaffolding Modules
    expect(bundle.factsZh).toBeDefined();
    expect(bundle.baseline).toBeDefined();
    expect(bundle.scenariosEn).toBeDefined();
    expect(bundle.scenariosZh).toBeDefined();
    expect(bundle.moatEn).toBeDefined();
    expect(bundle.moatZh).toBeDefined();
    expect(bundle.catalystsEn).toBeDefined();
    expect(bundle.catalystsZh).toBeDefined();
    expect(bundle.sentiment).toBeDefined();
    expect(bundle.filingEn).toBeDefined();
    expect(bundle.filingZh).toBeDefined();

    // Test writing to staging directory
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "stress-alpha-test-staging-")
    );
    try {
      const written = await writePipelineArtifacts(tempDir, bundle);
      expect(written.length).toBeGreaterThanOrEqual(14);

      expect(fs.existsSync(path.join(tempDir, "analyst-estimates.json"))).toBe(
        true
      );
      expect(
        fs.existsSync(path.join(tempDir, "analyst-estimates_zh.json"))
      ).toBe(true);
      expect(
        fs.existsSync(path.join(tempDir, "fundamental_profile.json"))
      ).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "reactions.json"))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "facts.draft.json"))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "facts.json"))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "facts_zh.json"))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "stress-baseline.json"))).toBe(
        true
      );
      expect(fs.existsSync(path.join(tempDir, "scenarios.json"))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "scenarios_zh.json"))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "moat-competitors.json"))).toBe(
        true
      );
      expect(
        fs.existsSync(path.join(tempDir, "moat-competitors_zh.json"))
      ).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "catalysts.json"))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "catalysts_zh.json"))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "earnings-sentiment.json"))).toBe(
        true
      );
      expect(fs.existsSync(path.join(tempDir, "filing-extracts.json"))).toBe(
        true
      );
      expect(fs.existsSync(path.join(tempDir, "filing-extracts_zh.json"))).toBe(
        true
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("API Route: /api/pipeline/data", () => {
    it("GET /api/pipeline/data returns 400 when ticker query param is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/pipeline/data");
      const res = await GET(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toMatch(/ticker/i);
    });

    it("GET /api/pipeline/data?ticker=MSFT returns complete bundle", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/pipeline/data?ticker=MSFT"
      );
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.ticker).toBe("MSFT");
      expect(json.bundle).toBeDefined();
      expect(json.bundle.profile.currentPrice).toBeGreaterThan(0);
    });

    it("POST /api/pipeline/data returns 400 when body lacks ticker", async () => {
      const req = new NextRequest("http://localhost:3000/api/pipeline/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("POST /api/pipeline/data with stagingDir stages files and returns success", async () => {
      const tempDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "stress-alpha-api-test-")
      );
      try {
        const req = new NextRequest("http://localhost:3000/api/pipeline/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker: "MSFT",
            stagingDir: tempDir,
          }),
        });
        const res = await POST(req);
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.ticker).toBe("MSFT");
        expect(json.artifactsWritten).toBeDefined();
        expect(json.artifactsWritten.length).toBeGreaterThanOrEqual(14);

        expect(
          fs.existsSync(path.join(tempDir, "analyst-estimates.json"))
        ).toBe(true);
        expect(fs.existsSync(path.join(tempDir, "scenarios.json"))).toBe(true);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("preserves existing qualitative files during staging unless overwriteAll is specified", async () => {
      const tempDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "stress-alpha-api-test-preserve-")
      );
      try {
        const scenariosPath = path.join(tempDir, "scenarios.json");
        const customContent = JSON.stringify({
          custom: "analyst-handcrafted-content",
        });
        fs.writeFileSync(scenariosPath, customContent, "utf-8");

        const bundle = await fetchCompletePipelineBundle("MSFT");
        await writePipelineArtifacts(tempDir, bundle, { overwriteAll: false });

        // Verify scenarios.json was NOT overwritten
        const preserved = fs.readFileSync(scenariosPath, "utf-8");
        expect(preserved).toBe(customContent);

        // Verify that with overwriteAll: true, it IS replaced
        await writePipelineArtifacts(tempDir, bundle, { overwriteAll: true });
        const replaced = JSON.parse(fs.readFileSync(scenariosPath, "utf-8"));
        expect(replaced.ticker).toBe("MSFT");
        expect(replaced.scenarios).toBeDefined();
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("Deterministic Baseline & Scenario Guardrails", () => {
    it("preserves legitimate low forward P/E multiples down to 1.5x (e.g. debt-heavy compounders)", () => {
      const mockProfile: any = {
        ticker: "CHTR",
        companyName: "Charter Communications",
        currentPrice: 108.0,
        marketCapBillions: 12.0,
        sharesOutstandingBillions: 0.114,
        forwardPE: 2.26,
        balanceSheet: { totalCashBillions: 1.0, shortTermDebtBillions: 2.0 },
        cashFlow: { operatingCashFlowBillions: 10.0 },
      };
      const mockFacts: any = {
        ticker: "CHTR",
        revenueBillions: 13.5,
        grossMarginPct: 40.0,
        operatingIncomeBillions: 3.1,
        valuationArchetype: "compounder",
      };

      const baseline = generateBaselineDraft(mockFacts, mockProfile);
      expect(baseline.multipleRegimes.base).toBe(2.26);
      expect(baseline.multipleRegimes.bull).toBe(3.05);
      expect(baseline.multipleRegimes.panic).toBe(1.24);
    });

    it("anchors negative forward EPS starter drafts to consensus price target instead of flatlining at $13", () => {
      const mockProfile: any = {
        ticker: "MRNA",
        companyName: "Moderna",
        currentPrice: 200.0,
        marketCapBillions: 78.0,
        sharesOutstandingBillions: 0.39,
        balanceSheet: { totalCashBillions: 8.0, shortTermDebtBillions: 0.0 },
        cashFlow: { operatingCashFlowBillions: -1.5 },
      };
      const mockFacts: any = {
        ticker: "MRNA",
        revenueBillions: 0.15,
        grossMarginPct: 30.0,
        operatingIncomeBillions: -0.8,
        epsOperating: -1.99,
        forwardEpsConsensus: -4.53, // Negative forward consensus
        valuationArchetype: "compounder",
      };
      const mockBaseline: any = {
        baseRevenueBillions: 0.6,
        baseGrossMarginPct: 30.0,
        fixedOpexBillions: 0.5,
        taxRatePct: 16.5,
        dilutedSharesBillions: 0.39,
        multipleRegimes: { bull: 34.0, base: 26.0, panic: 16.0 },
        upstreamDrivers: [],
      };
      const mockEstimates: any = {
        priceTargets: { average: 135.84, high: 200.0, low: 80.0 },
      };

      const { scenariosEn } = generateScenariosDraft(
        mockFacts,
        mockProfile,
        mockBaseline,
        mockEstimates
      );

      const baseScenario = scenariosEn.scenarios.find(
        (s) => s.name === "Base"
      )!;
      // Base EPS should be anchored to consensus (135.84 / 26 = 5.22), yielding Base Target ~ $135.72
      expect(baseScenario.forwardEps).toBe(5.22);
      const baseTarget = baseScenario.forwardEps * baseScenario.multiple;
      expect(baseTarget).toBeCloseTo(135.72, 1);
      expect(baseTarget).toBeGreaterThan(100); // Definitely NOT flatlined at $13!
    });

    it("detects unadjusted stock split mismatch and re-normalizes base EPS to consensus target", () => {
      const mockProfile: any = {
        ticker: "MSTR",
        companyName: "MicroStrategy",
        currentPrice: 145.0,
        marketCapBillions: 58.0,
        sharesOutstandingBillions: 0.4,
        balanceSheet: { totalCashBillions: 0.5, shortTermDebtBillions: 0.0 },
        cashFlow: { operatingCashFlowBillions: 0.1 },
      };
      const mockFacts: any = {
        ticker: "MSTR",
        revenueBillions: 0.12,
        grossMarginPct: 70.0,
        operatingIncomeBillions: -8.0,
        epsOperating: -24.77,
        forwardEpsConsensus: 49.49, // Unadjusted pre-split EPS from 10:1 split
        valuationArchetype: "compounder",
      };
      const mockBaseline: any = {
        baseRevenueBillions: 0.48,
        baseGrossMarginPct: 70.0,
        fixedOpexBillions: 0.2,
        taxRatePct: 16.5,
        dilutedSharesBillions: 0.4,
        multipleRegimes: { bull: 34.0, base: 26.0, panic: 16.0 },
        upstreamDrivers: [],
      };
      const mockEstimates: any = {
        priceTargets: { average: 239.27, high: 300.0, low: 180.0 },
      };

      const { scenariosEn } = generateScenariosDraft(
        mockFacts,
        mockProfile,
        mockBaseline,
        mockEstimates
      );

      const baseScenario = scenariosEn.scenarios.find(
        (s) => s.name === "Base"
      )!;
      // Without guardrail: 49.49 * 26 = $1,286 (880% blowup).
      // With guardrail: normalized to consensus target (239.27 / 26 = 9.20), yielding Base Target ~ $239.20
      expect(baseScenario.forwardEps).toBe(9.2);
      const baseTarget = baseScenario.forwardEps * baseScenario.multiple;
      expect(baseTarget).toBeCloseTo(239.2, 1);
      expect(baseTarget).toBeLessThan(350); // Blowup eliminated!
    });
  });
});
