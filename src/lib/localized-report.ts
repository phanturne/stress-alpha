import type { ReportData } from "@/lib/schemas";
import type { Locale } from "@/lib/i18n";

export function getLocalizedArtifacts(
  reportData: ReportData | null,
  locale: Locale
) {
  const isZh = locale === "zh";

  const facts =
    isZh && reportData?.facts && reportData?.factsZh
      ? {
          ...reportData.facts,
          company: reportData.factsZh.company || reportData.facts.company,
          accountingFlags:
            reportData.factsZh.accountingFlags ??
            reportData.facts.accountingFlags,
          segments: reportData.facts.segments.map((seg, i) => ({
            ...seg,
            name: reportData.factsZh?.segments?.[i]?.name || seg.name,
          })),
          oneTimeItems: (reportData.facts.oneTimeItems ?? []).map((item, i) => {
            const zhItem = reportData.factsZh?.oneTimeItems?.[i];
            return {
              ...item,
              description: zhItem?.description || item.description,
              note: zhItem?.note ?? item.note,
            };
          }),
        }
      : reportData?.facts;

  const catalysts =
    isZh && reportData?.catalysts && reportData?.catalystsZh
      ? {
          ...reportData.catalysts,
          catalysts: reportData.catalysts.catalysts.map((cat, i) => {
            const zhCat =
              reportData.catalystsZh?.catalysts?.[i] ??
              reportData.catalystsZh?.catalysts?.find((c) => c.id === cat.id);
            return {
              ...cat,
              id: cat.id,
              direction: cat.direction,
              probability: cat.probability,
              horizon: cat.horizon,
              title: zhCat?.title || cat.title,
              description: zhCat?.description || cat.description,
              probabilityAnchor:
                zhCat?.probabilityAnchor || cat.probabilityAnchor,
              evidence: zhCat?.evidence?.length ? zhCat.evidence : cat.evidence,
            };
          }),
        }
      : isZh && reportData?.catalystsZh
        ? reportData.catalystsZh
        : reportData?.catalysts;

  const scenarios =
    isZh && reportData?.scenarios && reportData?.scenariosZh
      ? {
          ...reportData.scenarios,
          currentPrice: reportData.scenarios.currentPrice,
          consensusTarget: reportData.scenarios.consensusTarget,
          scenarios: reportData.scenarios.scenarios.map((scen, i) => {
            const zhScen = reportData.scenariosZh?.scenarios?.[i] as
              (typeof scen & { calibrations?: unknown }) | undefined;
            return {
              ...scen,
              forwardEps: scen.forwardEps,
              multiple: scen.multiple,
              probability: scen.probability,
              calibratedProbability: scen.calibratedProbability,
              rawProbability: scen.rawProbability,
              name: zhScen?.name || scen.name,
              assumptions: zhScen?.assumptions?.length
                ? zhScen.assumptions
                : scen.assumptions,
              keyDrivers: zhScen?.keyDrivers?.length
                ? zhScen.keyDrivers
                : scen.keyDrivers,
              ...(zhScen?.calibrations !== undefined
                ? { calibrations: zhScen.calibrations }
                : {}),
            };
          }),
        }
      : reportData?.scenarios;

  const moat =
    isZh && reportData?.moat && reportData?.moatZh
      ? {
          ...reportData.moat,
          overallMoatRating: reportData.moat.overallMoatRating,
          moatTrend: reportData.moat.moatTrend,
          competitiveDynamicsSummary:
            reportData.moatZh.competitiveDynamicsSummary ||
            reportData.moat.competitiveDynamicsSummary,
          moatSources: reportData.moat.moatSources.map((src, i) => ({
            ...src,
            source: src.source,
            strength: src.strength,
            durabilityYears: src.durabilityYears,
            description:
              reportData.moatZh?.moatSources?.[i]?.description ||
              src.description,
          })),
          competitors: (reportData.moat.competitors ?? []).map((comp, i) => {
            const zhComp =
              reportData.moatZh?.competitors?.find(
                (c) => c.ticker?.toUpperCase() === comp.ticker?.toUpperCase()
              ) ?? reportData.moatZh?.competitors?.[i];
            return {
              ...comp,
              ticker: comp.ticker,
              marketCapBillions: comp.marketCapBillions,
              revenueBillions: comp.revenueBillions,
              revenueGrowthPct: comp.revenueGrowthPct,
              grossMarginPct: comp.grossMarginPct,
              operatingMarginPct: comp.operatingMarginPct,
              forwardPe: comp.forwardPe,
              marketSharePct: comp.marketSharePct,
              pricingPower: comp.pricingPower,
              name: zhComp?.name || comp.name,
              productComparison:
                zhComp?.productComparison || comp.productComparison,
              keyAdvantageOrVulnerability:
                zhComp?.keyAdvantageOrVulnerability ||
                comp.keyAdvantageOrVulnerability,
            };
          }),
        }
      : isZh && reportData?.moatZh
        ? reportData.moatZh
        : reportData?.moat;

  const estimates =
    isZh && reportData?.estimates && reportData?.estimatesZh
      ? {
          ...reportData.estimates,
          consensus: {
            ...reportData.estimates.consensus,
            consensus:
              reportData.estimatesZh.consensus?.consensus ||
              reportData.estimates.consensus.consensus,
          },
          priceTargets: reportData.estimates.priceTargets,
          synthesisNarrative:
            reportData.estimatesZh.synthesisNarrative ||
            reportData.estimates.synthesisNarrative,
          estimates: (reportData.estimates.estimates ?? []).map((est, i) => {
            const zhEst = reportData.estimatesZh?.estimates?.[i];
            return {
              ...est,
              firm: est.firm,
              rating: zhEst?.rating || est.rating,
              priceTarget: est.priceTarget,
              priorPriceTarget: est.priorPriceTarget,
              upsidePct: est.upsidePct,
              date: est.date,
              action: zhEst?.action ?? est.action,
              analyst: zhEst?.analyst ?? est.analyst,
              notes: zhEst?.notes ?? est.notes,
            };
          }),
        }
      : isZh && reportData?.estimatesZh
        ? reportData.estimatesZh
        : reportData?.estimates;

  const reactions =
    isZh && reportData?.reactions && reportData?.reactionsZh
      ? {
          ...reportData.reactions,
          conditionalFraming:
            reportData.reactionsZh.conditionalFraming ||
            reportData.reactions.conditionalFraming,
          events: reportData.reactions.events.map((ev, i) => {
            const zhEv =
              reportData.reactionsZh?.events?.find((e) => e.date === ev.date) ??
              reportData.reactionsZh?.events?.[i];
            return {
              ...ev,
              date: ev.date,
              priceMovePct: ev.priceMovePct,
              event: zhEv?.event || ev.event,
              context: zhEv?.context || ev.context,
            };
          }),
        }
      : reportData?.reactions;

  return {
    isZh,
    facts,
    catalysts,
    scenarios,
    sentiment:
      isZh && reportData?.sentimentZh?.managementTone
        ? reportData.sentimentZh
        : reportData?.sentiment,
    filing:
      isZh && reportData?.filingZh ? reportData.filingZh : reportData?.filing,
    reactions,
    moat,
    estimates,
  };
}
