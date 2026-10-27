import type { ReportData } from "@/lib/schemas";
import type { Locale } from "@/lib/i18n";

export function getLocalizedArtifacts(
  reportData: ReportData | null,
  locale: Locale
) {
  const isZh = locale === "zh";
  return {
    isZh,
    facts: isZh && reportData?.factsZh ? reportData.factsZh : reportData?.facts,
    catalysts:
      isZh && reportData?.catalystsZh
        ? reportData.catalystsZh
        : reportData?.catalysts,
    scenarios:
      isZh && reportData?.scenariosZh
        ? reportData.scenariosZh
        : reportData?.scenarios,
    sentiment:
      isZh && reportData?.sentimentZh
        ? reportData.sentimentZh
        : reportData?.sentiment,
    filing:
      isZh && reportData?.filingZh ? reportData.filingZh : reportData?.filing,
    reactions:
      isZh && reportData?.reactionsZh
        ? reportData.reactionsZh
        : reportData?.reactions,
    moat: isZh && reportData?.moatZh ? reportData.moatZh : reportData?.moat,
    estimates:
      isZh && reportData?.estimatesZh
        ? reportData.estimatesZh
        : reportData?.estimates,
  };
}
