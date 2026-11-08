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
] as const;

export type WorkspaceTabId = (typeof WORKSPACE_TAB_IDS)[number];

/**
 * Normalizes any tab identifier into a canonical WorkspaceTabId.
 * Obsolete or unknown tab strings (such as "notes" or "news") safely fall back to "technicals".
 */
export function normalizeWorkspaceTabId(
  tab: string | undefined | null
): WorkspaceTabId {
  if (!tab) return "technicals";
  if (WORKSPACE_TAB_IDS.includes(tab as WorkspaceTabId)) {
    return tab as WorkspaceTabId;
  }
  // Support legacy sub-tab routes
  if (
    tab === "scenarios" ||
    tab === "sensitivity" ||
    tab === "segments" ||
    tab === "catalysts"
  ) {
    return "valuation";
  }
  if (tab === "moat" || tab === "audit" || tab === "tone" || tab === "filing") {
    return "estimates";
  }
  return "technicals";
}

export interface WorkspaceTabDescriptor {
  id: WorkspaceTabId;
  shortcut: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export function getWorkspaceTabs(
  t: Translations,
  _reportData: ReportData | null = null,
  _marketEventsCount = 0,
  _isZh = false
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
  ];
}
