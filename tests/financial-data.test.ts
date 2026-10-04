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
});
