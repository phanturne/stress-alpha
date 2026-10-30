import {
  TrendingUp,
  CandlestickChart,
  Target,
  ShieldCheck,
  Layers,
  Sparkles,
  Radio,
  FileSearch,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { Translations } from "@/lib/i18n";
import type { ReportData } from "@/lib/schemas";

export const WORKSPACE_TAB_IDS = [
  "valuation",
  "technicals",
  "estimates",
  "moat",
  "segments",
  "catalysts",
  "news",
  "audit",
  "report",
] as const;

export type WorkspaceTabId = (typeof WORKSPACE_TAB_IDS)[number];

export interface WorkspaceTabDescriptor {
  id: WorkspaceTabId;
  shortcut: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  count?: number;
}

export function getWorkspaceTabs(
  t: Translations,
  reportData: ReportData | null,
  marketEventsCount: number,
  isZh: boolean
): WorkspaceTabDescriptor[] {
  const displayFacts =
    isZh && reportData?.factsZh ? reportData.factsZh : reportData?.facts;
  const displayCatalysts =
    isZh && reportData?.catalystsZh
      ? reportData.catalystsZh
      : reportData?.catalysts;
  const displayScenarios =
    isZh && reportData?.scenariosZh
      ? reportData.scenariosZh
      : reportData?.scenarios;
  const displayMoat =
    isZh && reportData?.moatZh ? reportData.moatZh : reportData?.moat;
  const displayEstimates =
    isZh && reportData?.estimatesZh
      ? reportData.estimatesZh
      : reportData?.estimates;
  const displayFiling =
    isZh && reportData?.filingZh ? reportData.filingZh : reportData?.filing;
  const displayReactions =
    isZh && reportData?.reactionsZh
      ? reportData.reactionsZh
      : reportData?.reactions;

  return [
    {
      id: "valuation",
      shortcut: "1",
      label: t.tabs.valuation,
      shortLabel: t.tabs.shortValuation,
      icon: TrendingUp,
      count: displayScenarios?.scenarios.length,
    },
    {
      id: "technicals",
      shortcut: "2",
      label: t.tabs.technicals,
      shortLabel: t.tabs.shortTechnicals,
      icon: CandlestickChart,
      count: reportData?.technicalLevels?.levels?.length,
    },
    {
      id: "estimates",
      shortcut: "3",
      label: t.tabs.estimates || "Estimates",
      shortLabel: t.tabs.shortEstimates,
      icon: Target,
      count: displayEstimates?.estimates?.length,
    },
    {
      id: "moat",
      shortcut: "4",
      label: t.tabs.moat,
      shortLabel: t.tabs.shortMoat,
      icon: ShieldCheck,
      count: displayMoat?.competitors?.length,
    },
    {
      id: "segments",
      shortcut: "5",
      label: t.tabs.segments,
      shortLabel: t.tabs.shortSegments,
      icon: Layers,
      count: displayFacts?.segments.length,
    },
    {
      id: "catalysts",
      shortcut: "6",
      label: t.tabs.catalysts,
      shortLabel: t.tabs.shortCatalysts,
      icon: Sparkles,
      count: displayCatalysts?.catalysts?.length,
    },
    {
      id: "news",
      shortcut: "7",
      label: t.tabs.news,
      shortLabel: t.tabs.shortNews,
      icon: Radio,
      count: marketEventsCount,
    },
    {
      id: "audit",
      shortcut: "8",
      label: t.tabs.audit,
      shortLabel: t.tabs.shortAudit,
      icon: FileSearch,
      count:
        (displayFiling?.newRiskFactors?.length ?? 0) +
        (displayReactions?.events?.length ?? 0),
    },
    {
      id: "report",
      shortcut: "9",
      label: t.tabs.report,
      shortLabel: t.tabs.shortReport,
      icon: FileText,
    },
  ];
}
