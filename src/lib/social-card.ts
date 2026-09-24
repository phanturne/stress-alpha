import type {
  Facts,
  Valuation,
  StressResult,
  Scenario,
  ReportData,
} from "./schemas";
import type { Locale } from "./i18n";
import { formatCurrency, formatPercent } from "./utils";

export type CardTemplate =
  "valuation" | "earnings" | "thesis" | "summary" | "snowflake";

export type CardSection =
  | "valuationHero"
  | "regimes"
  | "earnings"
  | "segments"
  | "moat"
  | "catalysts"
  | "snowflake";

/** Canonical display and layout ordering for card sections */
export const CARD_SECTIONS: CardSection[] = [
  "valuationHero",
  "regimes",
  "earnings",
  "segments",
  "moat",
  "catalysts",
  "snowflake",
];

/** Default section presets for each legacy card template */
export const TEMPLATE_SECTION_PRESETS: Record<CardTemplate, CardSection[]> = {
  valuation: ["valuationHero", "regimes"],
  earnings: ["earnings", "segments"],
  thesis: ["moat", "catalysts"],
  summary: ["valuationHero", "earnings", "moat"],
  snowflake: ["snowflake"],
};

/**
 * Resolves a matching preset template name if the provided sections match any standard preset.
 * Works regardless of section array ordering.
 */
export function findMatchingPreset(
  sections: CardSection[]
): CardTemplate | null {
  for (const [preset, presetSections] of Object.entries(
    TEMPLATE_SECTION_PRESETS
  ) as [CardTemplate, CardSection[]][]) {
    if (
      presetSections.length === sections.length &&
      presetSections.every((s) => sections.includes(s))
    ) {
      return preset;
    }
  }
  return null;
}

/**
 * Determines whether a section has adequate audited data to display for a specific report/ticker.
 * Prevents cut off or empty sections from displaying when a ticker lacks certain data fields.
 */
export function isSectionAvailableForReport(
  section: CardSection,
  facts?: Facts,
  reportData?: ReportData
): boolean {
  if (!facts) return true;
  switch (section) {
    case "valuationHero":
    case "regimes":
    case "earnings":
    case "snowflake":
      return true;
    case "segments":
      return Boolean(facts.segments && facts.segments.length > 0);
    case "moat":
      return Boolean(
        reportData?.moat?.overallMoatRating ||
        (reportData?.moat?.moatSources &&
          reportData.moat.moatSources.length > 0) ||
        reportData?.moatZh?.overallMoatRating ||
        (reportData?.moatZh?.moatSources &&
          reportData.moatZh.moatSources.length > 0)
      );
    case "catalysts":
      return Boolean(
        (reportData?.catalysts?.catalysts &&
          reportData.catalysts.catalysts.length > 0) ||
        (reportData?.catalystsZh?.catalysts &&
          reportData.catalystsZh.catalysts.length > 0)
      );
    default:
      return true;
  }
}

export type CardAspectRatio = "landscape" | "square" | "portrait";
export type CardTheme = "cyber" | "navy" | "emerald" | "crimson";

export interface CardDimensions {
  width: number;
  height: number;
  aspectRatio: string;
  cssAspectRatio: string;
}

export const CARD_DIMENSIONS: Record<CardAspectRatio, CardDimensions> = {
  landscape: {
    width: 1200,
    height: 675,
    aspectRatio: "16:9",
    cssAspectRatio: "1200 / 675",
  },
  square: {
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    cssAspectRatio: "1 / 1",
  },
  portrait: {
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    cssAspectRatio: "1080 / 1350",
  },
};

export interface ThemeConfig {
  id: CardTheme;
  name: { en: string; zh: string };
  bgGradient: string;
  cardBg: string;
  borderColor: string;
  accentColor: string;
  accentGlow: string;
  textColor: string;
  mutedTextColor: string;
}

export const THEME_CONFIGS: Record<CardTheme, ThemeConfig> = {
  cyber: {
    id: "cyber",
    name: { en: "Cyber Obsidian", zh: "黑曜赛博 (经典)" },
    bgGradient:
      "linear-gradient(135deg, #07090e 0%, #0d131f 50%, #050810 100%)",
    cardBg: "rgba(19, 25, 34, 0.82)",
    borderColor: "rgba(56, 189, 248, 0.22)",
    accentColor: "#38bdf8",
    accentGlow: "rgba(56, 189, 248, 0.25)",
    textColor: "#f8fafc",
    mutedTextColor: "#94a3b8",
  },
  navy: {
    id: "navy",
    name: { en: "Wall Street Midnight", zh: "华尔街午夜蓝" },
    bgGradient:
      "linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e1b4b 100%)",
    cardBg: "rgba(15, 23, 42, 0.85)",
    borderColor: "rgba(96, 165, 250, 0.25)",
    accentColor: "#60a5fa",
    accentGlow: "rgba(96, 165, 250, 0.25)",
    textColor: "#f8fafc",
    mutedTextColor: "#94a3b8",
  },
  emerald: {
    id: "emerald",
    name: { en: "Emerald Alpha", zh: "翡翠超额 Alpha" },
    bgGradient:
      "linear-gradient(135deg, #021a12 0%, #062e21 55%, #021a12 100%)",
    cardBg: "rgba(6, 46, 33, 0.8)",
    borderColor: "rgba(52, 211, 153, 0.3)",
    accentColor: "#34d399",
    accentGlow: "rgba(52, 211, 153, 0.25)",
    textColor: "#f8fafc",
    mutedTextColor: "#a7f3d0",
  },
  crimson: {
    id: "crimson",
    name: { en: "Crimson Stress Alert", zh: "绯红极端压力" },
    bgGradient:
      "linear-gradient(135deg, #18080c 0%, #2b0f16 60%, #120508 100%)",
    cardBg: "rgba(43, 15, 22, 0.85)",
    borderColor: "rgba(244, 63, 94, 0.3)",
    accentColor: "#f43f5e",
    accentGlow: "rgba(244, 63, 94, 0.25)",
    textColor: "#f8fafc",
    mutedTextColor: "#fecdd3",
  },
};

export interface GeneratePostTextOptions {
  facts: Facts;
  valuation?: Valuation;
  stressResult: StressResult;
  locale?: Locale;
  customNote?: string;
  appliedShocksSummary?: string;
}

/**
 * Generates an engaging, formatted social media post text (for X/Twitter, LinkedIn, WeChat, etc.)
 */
export function generateSocialPostText(
  options: GeneratePostTextOptions
): string {
  const {
    facts,
    valuation,
    stressResult,
    locale = "en",
    customNote,
    appliedShocksSummary,
  } = options;
  const isZh = locale === "zh";

  const ticker = facts.ticker.toUpperCase();
  const currentPrice = facts.currentPrice;
  const weightedFairValue = valuation?.weightedFairValue ?? currentPrice;
  const upsidePct = valuation?.upsidePct ?? 0;
  const asymmetry = stressResult.asymmetry;
  const bands = stressResult.valuationBands;

  const upsideStr = formatPercent(upsidePct);
  const priceStr = formatCurrency(currentPrice);
  const fairValueStr = formatCurrency(weightedFairValue);
  const ratioStr = asymmetry.riskRewardRatio
    ? `${asymmetry.riskRewardRatio.toFixed(1)}x`
    : "N/A";

  if (isZh) {
    const lines = [
      `📊 $${ticker} 压力测试估值研报 (${facts.quarter}) · ${facts.company}`,
      ``,
      `🎯 加权公允价值: ${fairValueStr} (现价 ${priceStr} · 估值空间 ${upsideStr})`,
      `⚖️ 风险收益不对称比: ${ratioStr} · 恐慌底线跌幅: ${formatPercent(asymmetry.downsideToPanicPct)}`,
      ``,
      `📈 压力估值谱系:`,
      `• 乐观情景 (${bands.bull.multiple}x P/E): ${formatCurrency(bands.bull.targetPrice)} (${formatPercent(bands.bull.deltaFromCurrentPct)})`,
      `• 基准情景 (${bands.base.multiple}x P/E): ${formatCurrency(bands.base.targetPrice)} (${formatPercent(bands.base.deltaFromCurrentPct)})`,
      `• 恐慌底线 (${bands.panic.multiple}x P/E): ${formatCurrency(bands.panic.targetPrice)} (${formatPercent(bands.panic.deltaFromCurrentPct)})`,
    ];

    if (appliedShocksSummary) {
      lines.push(``, `⚠️ 施加极端冲击参数: ${appliedShocksSummary}`);
    }

    if (customNote && customNote.trim()) {
      lines.push(``, `💡 核心观点: ${customNote.trim()}`);
    }

    lines.push(
      ``,
      `🔗 交互推演: https://stressalpha.vercel.app/${ticker.toLowerCase()} (StressAlpha 权益估值与极端承压测试引擎)`,
      `#美股 #股票估值 #${ticker} #财报分析 #价值投资 #压力测试`
    );

    return lines.join("\n");
  }

  // English post
  const lines = [
    `📊 $${ticker} StressAlpha Valuation & Earnings Audit (${facts.quarter}) — ${facts.company}`,
    ``,
    `🎯 Weighted Fair Value: ${fairValueStr} (${upsideStr} from ${priceStr})`,
    `⚖️ Risk/Reward Asymmetry: ${ratioStr} Skew · Downside to Panic Floor: ${formatPercent(asymmetry.downsideToPanicPct)}`,
    ``,
    `📈 Valuation Regimes Spectrum:`,
    `• Bull (${bands.bull.multiple}x P/E): ${formatCurrency(bands.bull.targetPrice)} (${formatPercent(bands.bull.deltaFromCurrentPct)})`,
    `• Base (${bands.base.multiple}x P/E): ${formatCurrency(bands.base.targetPrice)} (${formatPercent(bands.base.deltaFromCurrentPct)})`,
    `• Panic Floor (${bands.panic.multiple}x P/E): ${formatCurrency(bands.panic.targetPrice)} (${formatPercent(bands.panic.deltaFromCurrentPct)})`,
  ];

  if (appliedShocksSummary) {
    lines.push(``, `⚠️ Custom Stress Shocks: ${appliedShocksSummary}`);
  }

  if (customNote && customNote.trim()) {
    lines.push(``, `💡 Key Takeaway: ${customNote.trim()}`);
  }

  lines.push(
    ``,
    `Interactive institutional scenario simulation: https://stressalpha.vercel.app/${ticker.toLowerCase()} via StressAlpha`,
    `#${ticker} #stocks #earnings #investing #valuation #StressAlpha`
  );

  return lines.join("\n");
}

/**
 * Downloads an image Data URL as a file on the client
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports a DOM node to high-res PNG data URL using html-to-image
 */
export async function exportSocialCardAsPng(
  element: HTMLElement,
  options?: { pixelRatio?: number }
): Promise<string> {
  const { toPng } = await import("html-to-image");
  const pixelRatio = options?.pixelRatio ?? 2;

  const dataUrl = await toPng(element, {
    pixelRatio,
    cacheBust: true,
    skipFonts: true,
    filter: (node) => {
      if (node instanceof HTMLElement && node.classList.contains("no-export")) {
        return false;
      }
      return true;
    },
  });

  return dataUrl;
}

/**
 * Copies a DOM node as an image blob directly to the user's system clipboard
 */
export async function copySocialCardImageToClipboard(
  element: HTMLElement,
  options?: { pixelRatio?: number }
): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    typeof ClipboardItem === "undefined"
  ) {
    throw new Error(
      "System Clipboard API for images is not supported in this browser."
    );
  }

  const { toBlob } = await import("html-to-image");
  const pixelRatio = options?.pixelRatio ?? 2;

  const blob = await toBlob(element, {
    pixelRatio,
    cacheBust: true,
    skipFonts: true,
    filter: (node) => {
      if (node instanceof HTMLElement && node.classList.contains("no-export")) {
        return false;
      }
      return true;
    },
  });

  if (!blob) {
    throw new Error("Failed to render card image blob");
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": blob,
    }),
  ]);

  return true;
}
