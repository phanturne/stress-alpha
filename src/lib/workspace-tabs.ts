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
  "technicals",
  "valuation",
  "estimates",
  "news",
] as const;

export type WorkspaceTabId = (typeof WORKSPACE_TAB_IDS)[number];

export interface WorkspaceTabDescriptor {
  id: WorkspaceTabId;
  shortcut: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export function getWorkspaceTabs(
  t: Translations,
  _reportData: ReportData | null,
  _marketEventsCount: number,
  _isZh: boolean
): WorkspaceTabDescriptor[] {
  return [
    {
      id: "technicals",
      shortcut: "1",
      label: t.tabs.technicals,
      shortLabel: t.tabs.shortTechnicals,
      icon: CandlestickChart,
    },
    {
      id: "valuation",
      shortcut: "2",
      label: t.tabs.valuation,
      shortLabel: t.tabs.shortValuation,
      icon: TrendingUp,
    },
    {
      id: "estimates",
      shortcut: "3",
      label: t.tabs.estimates,
      shortLabel: t.tabs.shortEstimates,
      icon: Target,
    },
    {
      id: "news",
      shortcut: "4",
      label: t.tabs.news,
      shortLabel: t.tabs.shortNews,
      icon: Radio,
    },
  ];
}
