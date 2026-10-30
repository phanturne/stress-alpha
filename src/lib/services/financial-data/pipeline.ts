import fs from "node:fs";
import path from "node:path";
import type { PipelineDataBundle, PipelineBundleOptions } from "./types";
import {
  fetchFundamentalProfile,
  fetchAnalystEstimates,
  fetchFinnhubFilings,
  fetchHistoricalReactions,
} from "./fetchers";
import {
  generateFactsDraft,
  generateFactsZh,
  generateBaselineDraft,
  generateScenariosDraft,
  generateMoatCompetitorsDraft,
  generateCatalystsDraft,
  generateEarningsSentimentDraft,
  generateFilingExtractsDraft,
} from "./scaffolders";

// --- Master Orchestrator: Fetch Complete Dataset Bundle ---

export async function fetchCompletePipelineBundle(
  tickerSymbol: string,
  folderSlugOrOptions?: string | PipelineBundleOptions,
  maybeOptions?: PipelineBundleOptions
): Promise<PipelineDataBundle> {
  let folderSlug: string | undefined;
  let options: PipelineBundleOptions | undefined;

  if (typeof folderSlugOrOptions === "string") {
    folderSlug = folderSlugOrOptions;
    options = maybeOptions;
  } else {
    options = folderSlugOrOptions;
  }

  const ticker = tickerSymbol.toUpperCase();

  // If quarterStr is not provided, try to extract from folderSlug (e.g. nvda-2026q3 -> Q3 2026)
  let quarterStr = options?.quarterStr;
  if (!quarterStr && folderSlug) {
    const match = folderSlug.match(
      /(?:q([1-4])[-_ ]?(20\d{2})|(20\d{2})[-_ ]?q([1-4]))/i
    );
    if (match) {
      const q = match[1] || match[4];
      const y = match[2] || match[3];
      quarterStr = `Q${q} ${y}`;
    }
  }

  // 1. Fetch Profile & Statements
  const profile = await fetchFundamentalProfile(ticker, {
    apiKey: options?.apiKey,
    massiveApiKey: options?.massiveApiKey,
  });

  // 2. Fetch Analyst Consensus & Estimates
  const { estimatesEn, estimatesZh } = await fetchAnalystEstimates(ticker, {
    benchmarkPrice: options?.benchmarkPrice || profile.currentPrice,
    apiKey: options?.apiKey,
  });

  // 3. Fetch SEC Filings
  const filings = await fetchFinnhubFilings(ticker, options?.apiKey);

  // 4. Fetch Historical Reactions
  const reactions = await fetchHistoricalReactions(
    ticker,
    profile.quarterlyStatements
  );

  // 5. Pre-populate Facts Draft (EN & ZH)
  const factsDraft = generateFactsDraft(profile, estimatesEn, quarterStr);
  const factsZh = generateFactsZh(factsDraft);

  // 6. Pre-populate Baseline Draft
  const baseline = generateBaselineDraft(factsDraft, profile);

  // 7. Pre-populate Scenarios Draft (EN & ZH)
  const { scenariosEn, scenariosZh } = generateScenariosDraft(
    factsDraft,
    profile,
    baseline,
    estimatesEn
  );

  // 8. Pre-populate Moat & Competitors Draft (EN & ZH)
  const { moatEn, moatZh } = generateMoatCompetitorsDraft(profile, factsDraft);

  // 9. Pre-populate Catalysts Draft (EN & ZH)
  const { catalystsEn, catalystsZh } = generateCatalystsDraft(
    profile,
    factsDraft
  );

  // 10. Pre-populate Sentiment & Filing Extracts (EN & ZH)
  const sentiment = generateEarningsSentimentDraft(profile, factsDraft);
  const { filingEn, filingZh } = generateFilingExtractsDraft(
    profile,
    factsDraft
  );

  return {
    ticker,
    asOfDate: new Date().toISOString().split("T")[0],
    profile,
    analystEstimatesEn: estimatesEn,
    analystEstimatesZh: estimatesZh,
    reactions,
    filings,
    factsDraft,
    factsZh,
    baseline,
    scenariosEn,
    scenariosZh,
    moatEn,
    moatZh,
    catalystsEn,
    catalystsZh,
    sentiment,
    filingEn,
    filingZh,
    technicalLevels: profile.technicalLevels,
  };
}

// --- Write Artifacts to Disk (Staging Directory) ---

export async function writePipelineArtifacts(
  stagingDir: string,
  bundle: PipelineDataBundle,
  options?: {
    overwriteFacts?: boolean;
    overwriteAll?: boolean;
  }
): Promise<string[]> {
  const absDir = path.resolve(stagingDir);
  if (!fs.existsSync(absDir)) {
    fs.mkdirSync(absDir, { recursive: true });
  }

  const writtenFiles: string[] = [];

  // Helper to conditionally write file
  const writeJson = (
    fileName: string,
    data: unknown,
    alwaysOverwrite = false
  ) => {
    const filePath = path.join(absDir, fileName);
    if (!fs.existsSync(filePath) || alwaysOverwrite || options?.overwriteAll) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      writtenFiles.push(filePath);
    }
  };

  // 1. Analyst Estimates (EN & ZH) - always refreshed from live feeds
  writeJson("analyst-estimates.json", bundle.analystEstimatesEn, true);
  writeJson("analyst-estimates_zh.json", bundle.analystEstimatesZh, true);

  // 2. Fundamental Profile - always refreshed
  writeJson("fundamental_profile.json", bundle.profile, true);

  // 3. Reactions - always refreshed
  writeJson("reactions.json", bundle.reactions, true);

  // 4. SEC Filings List - always refreshed
  writeJson("sec-filings.json", bundle.filings, true);

  // 5. Facts Draft - always refreshed
  writeJson("facts.draft.json", bundle.factsDraft, true);

  // 6. Facts (EN & ZH) - written if missing or overwriteFacts / overwriteAll
  writeJson("facts.json", bundle.factsDraft, options?.overwriteFacts);
  writeJson("facts_zh.json", bundle.factsZh, options?.overwriteFacts);

  // 7. Stress Baseline - written if missing or overwriteAll
  writeJson("stress-baseline.json", bundle.baseline);

  // 8. Scenarios (EN & ZH) - written if missing or overwriteAll
  writeJson("scenarios.json", bundle.scenariosEn);
  writeJson("scenarios_zh.json", bundle.scenariosZh);

  // 9. Moat & Competitors (EN & ZH) - written if missing or overwriteAll
  writeJson("moat-competitors.json", bundle.moatEn);
  writeJson("moat-competitors_zh.json", bundle.moatZh);

  // 10. Catalysts (EN & ZH) - written if missing or overwriteAll
  writeJson("catalysts.json", bundle.catalystsEn);
  writeJson("catalysts_zh.json", bundle.catalystsZh);

  // 11. Earnings Sentiment - written if missing or overwriteAll
  writeJson("earnings-sentiment.json", bundle.sentiment);

  // 12. Filing Extracts (EN & ZH) - written if missing or overwriteAll
  writeJson("filing-extracts.json", bundle.filingEn);
  writeJson("filing-extracts_zh.json", bundle.filingZh);

  return writtenFiles;
}
