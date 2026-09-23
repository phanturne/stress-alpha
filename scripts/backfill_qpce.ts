#!/usr/bin/env node
/**
 * Backfill script: Recalculates and persists Quantitative Probability Calibration Engine (QPCE)
 * across all existing reports in Neon PostgreSQL and local report staging directories.
 *
 * Usage:
 *   npx tsx scripts/backfill_qpce.ts
 */

import fs from "node:fs";
import path from "node:path";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { getReportRepository } from "../src/lib/repository/index.js";
import { computeValuation } from "../src/lib/valuation.js";
import { renderReport } from "../src/lib/report.js";
import {
  ValuationSchema,
  ScenariosSchema,
  FactsSchema,
} from "../src/lib/schemas.js";
import { getDb } from "../src/db/index.js";
import { reportsTable } from "../src/db/schema.js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  console.log(
    "================================================================================"
  );
  console.log(
    "🚀 [StressAlpha] Universe-Wide QPCE Probability Backfill Engine"
  );
  console.log(
    "================================================================================\n"
  );

  const repo = getReportRepository();
  const db = getDb();
  const reportSummaries = await repo.listReports();

  console.log(
    `Found ${reportSummaries.length} total reports in Neon PostgreSQL.\n`
  );

  const results: Array<{
    ticker: string;
    slug: string;
    archetype: string;
    runway: string;
    oldWfv: number;
    newWfv: number;
    bullPct: string;
    basePct: string;
    panicPct: string;
    governanceVeto: boolean;
    moat: string;
  }> = [];

  for (const summary of reportSummaries) {
    const slug = summary.slug;
    const report = await repo.getReport(slug);
    if (!report) {
      console.warn(`⚠️ Report not found for slug: ${slug}`);
      continue;
    }

    const localDir = path.resolve(process.cwd(), "reports", slug);
    let effectiveFacts = report.facts;
    let effectiveFactsZh = report.factsZh;

    if (fs.existsSync(path.join(localDir, "facts.json"))) {
      try {
        const localFactsRaw = JSON.parse(
          fs.readFileSync(path.join(localDir, "facts.json"), "utf-8")
        );
        effectiveFacts = FactsSchema.parse({
          ...effectiveFacts,
          ...localFactsRaw,
        });
      } catch (err) {
        console.warn(`Could not parse local facts for ${slug}:`, err);
      }
    }

    if (fs.existsSync(path.join(localDir, "facts_zh.json"))) {
      try {
        const localFactsZhRaw = JSON.parse(
          fs.readFileSync(path.join(localDir, "facts_zh.json"), "utf-8")
        );
        effectiveFactsZh = FactsSchema.parse({
          ...effectiveFactsZh,
          ...localFactsZhRaw,
        });
      } catch (err) {
        console.warn(`Could not parse local facts_zh for ${slug}:`, err);
      }
    }

    const baseline = report.baseline || report.scenarios.baseline;

    // 1. Run deterministic QPCE valuation calculation
    const calibratedValuation = computeValuation({
      facts: effectiveFacts,
      scenarios: report.scenarios,
      baseline,
      moat: report.moat,
      estimates: report.estimates,
    });

    const validatedValuation = ValuationSchema.parse(calibratedValuation);
    const oldWfv = report.valuation?.weightedFairValue ?? 0;
    const newWfv = validatedValuation.weightedFairValue;

    // 2. Synchronize scenario probabilities (raw vs calibrated)
    const auditProbs =
      validatedValuation.calibrationAudit?.calibratedProbabilities || {};
    const updatedScenariosList = report.scenarios.scenarios.map((s) => {
      const sAny = s as any;
      const reg =
        sAny.regime ||
        (s.name.toLowerCase().includes("bull")
          ? "bull"
          : s.name.toLowerCase().includes("panic") ||
              s.name.toLowerCase().includes("bear")
            ? "panic"
            : "base");
      const calProb =
        auditProbs[s.name] ??
        (reg === "bull"
          ? auditProbs["Bull"]
          : reg === "panic"
            ? (auditProbs["Panic"] ?? auditProbs["Bear"])
            : auditProbs["Base"]) ??
        s.probability;
      return {
        ...s,
        rawProbability: s.rawProbability ?? s.probability,
        calibratedProbability: calProb,
        probability: calProb,
      };
    });

    const updatedScenarios = ScenariosSchema.parse({
      ...report.scenarios,
      scenarios: updatedScenariosList,
    });

    let updatedScenariosZh = report.scenariosZh;
    if (updatedScenariosZh?.scenarios) {
      const updatedZhList = updatedScenariosZh.scenarios.map((s, idx) => {
        const matchingEn = updatedScenariosList[idx];
        return {
          ...s,
          rawProbability:
            matchingEn?.rawProbability ?? s.rawProbability ?? s.probability,
          calibratedProbability:
            matchingEn?.calibratedProbability ??
            s.calibratedProbability ??
            s.probability,
          probability: matchingEn?.probability ?? s.probability,
        };
      });
      updatedScenariosZh = {
        ...updatedScenariosZh,
        scenarios: updatedZhList,
      };
    }

    // 3. Render updated reports
    let updatedReportMd = report.reportMarkdown;
    try {
      updatedReportMd = renderReport(
        {
          facts: report.facts,
          catalysts: report.catalysts,
          valuation: validatedValuation,
          reactions: report.reactions,
          moat: report.moat,
          estimates: report.estimates,
        },
        { language: "en" }
      );
    } catch {
      // keep existing
    }

    let updatedReportZh = report.reportMarkdownZh;
    if (report.factsZh) {
      try {
        updatedReportZh = renderReport(
          {
            facts: report.factsZh,
            catalysts: report.catalystsZh || report.catalysts,
            valuation: validatedValuation,
            reactions: report.reactionsZh || report.reactions,
            moat: report.moatZh || report.moat,
            estimates: report.estimatesZh || report.estimates,
          },
          { language: "zh" }
        );
      } catch {
        // keep existing
      }
    }

    // 4. Extract regime fair values for database column denormalization
    let baseFairValue = validatedValuation.weightedFairValue;
    let bullFairValue = validatedValuation.weightedFairValue;
    let bearFairValue = validatedValuation.weightedFairValue;

    if (validatedValuation.scenarioResults) {
      const baseScen = validatedValuation.scenarioResults.find(
        (s) =>
          s.name.toLowerCase() === "base" ||
          s.name.toLowerCase() === "base case"
      );
      const bullScen = validatedValuation.scenarioResults.find(
        (s) =>
          s.name.toLowerCase() === "bull" ||
          s.name.toLowerCase() === "bull case"
      );
      const bearScen = validatedValuation.scenarioResults.find(
        (s) =>
          s.name.toLowerCase() === "bear" ||
          s.name.toLowerCase() === "bear case" ||
          s.name.toLowerCase() === "panic" ||
          s.name.toLowerCase() === "panic case" ||
          s.name.toLowerCase() === "panic floor"
      );
      if (baseScen) baseFairValue = baseScen.fairValue;
      if (bullScen) bullFairValue = bullScen.fairValue;
      if (bearScen) bearFairValue = bearScen.fairValue;
    }

    const panicFairValue =
      validatedValuation.stressTest?.valuationBands?.panic?.targetPrice;

    // 5. Persist to Neon PostgreSQL
    await db
      .update(reportsTable)
      .set({
        facts: effectiveFacts,
        factsZh: effectiveFactsZh,
        weightedFairValue: String(validatedValuation.weightedFairValue),
        baseFairValue: String(baseFairValue),
        bullFairValue: String(bullFairValue),
        bearFairValue: String(bearFairValue),
        panicFairValue: panicFairValue ? String(panicFairValue) : null,
        scenarios: updatedScenarios,
        scenariosZh: updatedScenariosZh,
        valuation: validatedValuation,
        reportMd: updatedReportMd,
        reportMdZh: updatedReportZh,
        updatedAt: new Date(),
      })
      .where(eq(reportsTable.slug, slug));

    // 6. If local on-disk folder exists, write artifacts
    if (fs.existsSync(localDir)) {
      fs.writeFileSync(
        path.join(localDir, "valuation.json"),
        JSON.stringify(validatedValuation, null, 2)
      );
      fs.writeFileSync(
        path.join(localDir, "scenarios.json"),
        JSON.stringify(updatedScenarios, null, 2)
      );
      if (
        updatedScenariosZh &&
        fs.existsSync(path.join(localDir, "scenarios_zh.json"))
      ) {
        fs.writeFileSync(
          path.join(localDir, "scenarios_zh.json"),
          JSON.stringify(updatedScenariosZh, null, 2)
        );
      }
      if (updatedReportMd) {
        fs.writeFileSync(path.join(localDir, "report.md"), updatedReportMd);
      }
      if (
        updatedReportZh &&
        fs.existsSync(path.join(localDir, "report_zh.md"))
      ) {
        fs.writeFileSync(path.join(localDir, "report_zh.md"), updatedReportZh);
      }
    }

    const bullP =
      auditProbs["Bull"] !== undefined
        ? `${(auditProbs["Bull"] * 100).toFixed(1)}%`
        : "N/A";
    const baseP =
      auditProbs["Base"] !== undefined
        ? `${(auditProbs["Base"] * 100).toFixed(1)}%`
        : "N/A";
    const panicP =
      auditProbs["Panic"] !== undefined
        ? `${(auditProbs["Panic"] * 100).toFixed(1)}%`
        : auditProbs["Bear"] !== undefined
          ? `${(auditProbs["Bear"] * 100).toFixed(1)}%`
          : "N/A";
    const archetypeUsed =
      validatedValuation.calibrationAudit?.archetypeUsed ?? "compounder";
    const runwayVal =
      validatedValuation.calibrationAudit?.netRunwayMonths !== undefined
        ? `${validatedValuation.calibrationAudit.netRunwayMonths}m`
        : "N/A";

    results.push({
      ticker: report.facts.ticker,
      slug,
      archetype: archetypeUsed,
      runway: runwayVal,
      oldWfv,
      newWfv,
      bullPct: bullP,
      basePct: baseP,
      panicPct: panicP,
      governanceVeto:
        validatedValuation.calibrationAudit?.governanceVetoTriggered ?? false,
      moat: report.moat?.overallMoatRating ?? "None",
    });

    console.log(
      `✅ [${report.facts.ticker.padEnd(5)}] ${slug.padEnd(24)} WFV: $${String(oldWfv).padStart(7)} -> $${String(newWfv).padStart(7)} | Archetype: ${archetypeUsed.padEnd(19)} | Runway: ${runwayVal.padStart(6)} | Bull: ${bullP.padStart(5)}, Base: ${baseP.padStart(5)}, Panic: ${panicP.padStart(5)} | Moat: ${report.moat?.overallMoatRating ?? "None"}`
    );
  }

  console.log(
    "\n================================================================================"
  );
  console.log(
    `🏁 QPCE Universe Backfill Successfully Completed for All ${results.length} Reports!`
  );
  console.log(
    "================================================================================\n"
  );

  console.table(
    results.map((r) => ({
      Ticker: r.ticker,
      Archetype: r.archetype,
      Runway: r.runway,
      "Prior WFV": `$${r.oldWfv}`,
      "Calibrated WFV": `$${r.newWfv}`,
      "Bull %": r.bullPct,
      "Base %": r.basePct,
      "Panic/Bear %": r.panicPct,
      "Gov Veto": r.governanceVeto ? "YES 🚨" : "No",
      Moat: r.moat,
    }))
  );
}

main().catch((err) => {
  console.error("❌ Backfill failed:", err);
  process.exit(1);
});
