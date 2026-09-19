import { describe, it, expect } from "vitest";
import {
  generateSocialPostText,
  CARD_DIMENSIONS,
  THEME_CONFIGS,
  TEMPLATE_SECTION_PRESETS,
  CARD_SECTIONS,
  findMatchingPreset,
  type CardAspectRatio,
  type CardTheme,
  type CardSection,
} from "@/lib/social-card";
import { getTranslations } from "@/lib/i18n";
import type { Facts, Valuation, StressResult } from "@/lib/schemas";

describe("Social Media Card Feature", () => {
  const mockFacts: Facts = {
    ticker: "SNDK",
    company: "SanDisk Corporation",
    quarter: "Q4 2026",
    reportDate: "2026-08-05",
    revenueBillions: 8.97,
    revenueGrowthPct: 371.6,
    operatingIncomeBillions: 7.82,
    operatingMarginPct: 87.18,
    epsReported: 43.97,
    epsConsensus: 33.28,
    epsOperating: 39.25,
    segments: [
      {
        name: "Client SSD",
        revenueBillions: 4.12,
        growthPct: 350.0,
      },
    ],
    oneTimeItems: [],
    currentPrice: 1743.53,
    marketCapBillions: 255.29,
    trailingEps: 73.76,
    forwardEpsConsensus: 165.0,
    sources: [],
  };

  const mockValuation: Valuation = {
    ticker: "SNDK",
    currentPrice: 1743.53,
    weightedFairValue: 2309.25,
    upsidePct: 32.45,
    consensusTarget: 2125.09,
    verdictVsConsensus: "Above consensus by 8.67%",
    scenarioResults: [],
    sensitivity: [],
  };

  const mockStressResult: StressResult = {
    stressRevenueBillions: 42,
    stressGrossProfitBillions: 35.53,
    stressOperatingIncomeBillions: 32.33,
    stressNetIncomeBillions: 27.16,
    stressEps: 185.52,
    valuationBands: {
      bull: {
        regime: "bull",
        label: "Bull Regime (18x P/E)",
        multiple: 18,
        targetPrice: 3339.36,
        deltaFromCurrentPct: 91.53,
      },
      base: {
        regime: "base",
        label: "Base Regime (14x P/E)",
        multiple: 14,
        targetPrice: 2597.28,
        deltaFromCurrentPct: 48.97,
      },
      panic: {
        regime: "panic",
        label: "Panic Floor (7x P/E)",
        multiple: 7,
        targetPrice: 1298.64,
        deltaFromCurrentPct: -25.52,
      },
    },
    asymmetry: {
      downsideToBasePct: 48.97,
      downsideToPanicPct: -25.52,
      upsideToBullPct: 91.53,
      marketPricedInMultiple: 9.4,
      riskRewardRatio: 3.59,
    },
    driverShocksApplied: {},
    grossMarginBpsDeltaApplied: 0,
    fixedOpexShiftPctApplied: 0,
  };

  describe("Card Dimensions & Layout Specifications", () => {
    it("defines 16:9 Landscape for Twitter/X and LinkedIn feed", () => {
      const landscape = CARD_DIMENSIONS.landscape;
      expect(landscape.width).toBe(1200);
      expect(landscape.height).toBe(675);
      expect(landscape.aspectRatio).toBe("16:9");
    });

    it("defines 1:1 Square for Instagram and cross-platform feeds", () => {
      const square = CARD_DIMENSIONS.square;
      expect(square.width).toBe(1080);
      expect(square.height).toBe(1080);
      expect(square.aspectRatio).toBe("1:1");
    });

    it("defines 4:5 Portrait for mobile feeds and stories", () => {
      const portrait = CARD_DIMENSIONS.portrait;
      expect(portrait.width).toBe(1080);
      expect(portrait.height).toBe(1350);
      expect(portrait.aspectRatio).toBe("4:5");
    });
  });

  describe("Theme Configurations", () => {
    const themeKeys: CardTheme[] = ["cyber", "navy", "emerald", "crimson"];

    themeKeys.forEach((key) => {
      it(`provides complete configuration for theme: ${key}`, () => {
        const theme = THEME_CONFIGS[key];
        expect(theme.id).toBe(key);
        expect(theme.name.en).toBeTruthy();
        expect(theme.name.zh).toBeTruthy();
        expect(theme.bgGradient).toContain("linear-gradient");
        expect(theme.cardBg).toBeTruthy();
        expect(theme.borderColor).toBeTruthy();
        expect(theme.accentColor).toBeTruthy();
        expect(theme.accentGlow).toBeTruthy();
        expect(theme.textColor).toBeTruthy();
      });
    });
  });

  describe("Social Post Text Generator", () => {
    it("generates structured English social post text with ticker, fair value, and regimes", () => {
      const text = generateSocialPostText({
        facts: mockFacts,
        valuation: mockValuation,
        stressResult: mockStressResult,
        locale: "en",
        customNote: "Historic 87% margins create massive operating leverage.",
      });

      expect(text).toContain("$SNDK");
      expect(text).toContain("SanDisk Corporation");
      expect(text).toContain(
        "Weighted Fair Value: $2,309.25 (+32.5% from $1,743.53)"
      );
      expect(text).toContain("Bull (18x P/E): $3,339.36 (+91.5%)");
      expect(text).toContain("Base (14x P/E): $2,597.28 (+49.0%)");
      expect(text).toContain("Panic Floor (7x P/E): $1,298.64 (-25.5%)");
      expect(text).toContain(
        "Historic 87% margins create massive operating leverage."
      );
      expect(text).toContain("#SNDK");
      expect(text).toContain("#StressAlpha");
    });

    it("generates structured Chinese social post text with Chinese localization", () => {
      const text = generateSocialPostText({
        facts: mockFacts,
        valuation: mockValuation,
        stressResult: mockStressResult,
        locale: "zh",
        customNote:
          "专有 BiCS8 晶圆成本优势与云厂商 AI 闪存架构升级形成双重催化。",
      });

      expect(text).toContain("$SNDK");
      expect(text).toContain("压力测试估值研报 (Q4 2026)");
      expect(text).toContain(
        "加权公允价值: $2,309.25 (现价 $1,743.53 · 估值空间 +32.5%)"
      );
      expect(text).toContain("乐观情景 (18x P/E): $3,339.36 (+91.5%)");
      expect(text).toContain("恐慌底线 (7x P/E): $1,298.64 (-25.5%)");
      expect(text).toContain(
        "专有 BiCS8 晶圆成本优势与云厂商 AI 闪存架构升级形成双重催化。"
      );
      expect(text).toContain("#美股");
      expect(text).toContain("#股票估值");
    });

    it("includes custom applied shock parameters in post text when provided", () => {
      const text = generateSocialPostText({
        facts: mockFacts,
        valuation: mockValuation,
        stressResult: mockStressResult,
        locale: "en",
        appliedShocksSummary: "NAND ASP: -15%, GM: -100bps",
      });

      expect(text).toContain(
        "⚠️ Custom Stress Shocks: NAND ASP: -15%, GM: -100bps"
      );
    });
  });

  describe("i18n Translations Completeness", () => {
    it("has complete socialCard translation entries in English", () => {
      const t = getTranslations("en");
      expect(t.header.share).toBe("Share");
      expect(t.header.shareTooltip).toContain("Share analysis");
      expect(t.shortcuts.exportCard).toContain("Export");
      expect(t.socialCard.modalTitle).toBe("Share Analysis & Export Cards");
      expect(t.socialCard.controls.scenarioLinkLabel).toBe(
        "Interactive Scenario Link"
      );
      expect(t.socialCard.templates.valuation).toBeTruthy();
      expect(t.socialCard.templates.earnings).toBeTruthy();
      expect(t.socialCard.templates.thesis).toBeTruthy();
      expect(t.socialCard.templates.summary).toBeTruthy();
      expect(t.socialCard.aspectRatios.landscape).toContain("16:9");
      expect(t.socialCard.actions.downloadPng).toBe("Download PNG");
      expect(t.socialCard.actions.copyImage).toBe("Copy Image");
      expect(t.socialCard.actions.copyText).toBe("Copy Post Text");
      expect(t.socialCard.actions.copyLink).toBe("Copy Link");
    });

    it("has complete socialCard translation entries in Chinese", () => {
      const t = getTranslations("zh");
      expect(t.header.share).toBe("分享");
      expect(t.header.shareTooltip).toContain("分享研报与导出社媒卡片");
      expect(t.shortcuts.exportCard).toContain("导出");
      expect(t.socialCard.modalTitle).toBe("分享研报与导出社媒卡片");
      expect(t.socialCard.controls.scenarioLinkLabel).toBe(
        "交互式情景推演链接"
      );
      expect(t.socialCard.templates.valuation).toBe("估值与压力测试");
      expect(t.socialCard.templates.earnings).toBe("财报业绩快报");
      expect(t.socialCard.templates.thesis).toBe("投资逻辑与催化剂");
      expect(t.socialCard.templates.summary).toBe("高管全景速览");
      expect(t.socialCard.aspectRatios.landscape).toContain("16:9");
      expect(t.socialCard.actions.downloadPng).toBe("下载高清图片");
      expect(t.socialCard.actions.copyImage).toBe("复制图片到剪贴板");
      expect(t.socialCard.actions.copyText).toBe("复制社媒文案");
      expect(t.socialCard.actions.copyLink).toBe("复制链接");
    });
  });

  describe("Composable Card Sections", () => {
    it("defines default section presets for all standard templates", () => {
      expect(TEMPLATE_SECTION_PRESETS.valuation).toEqual([
        "valuationHero",
        "regimes",
      ]);
      expect(TEMPLATE_SECTION_PRESETS.earnings).toEqual([
        "earnings",
        "segments",
      ]);
      expect(TEMPLATE_SECTION_PRESETS.thesis).toEqual(["moat", "catalysts"]);
      expect(TEMPLATE_SECTION_PRESETS.summary).toEqual([
        "valuationHero",
        "earnings",
        "moat",
      ]);
      expect(TEMPLATE_SECTION_PRESETS.snowflake).toEqual(["snowflake"]);
    });

    it("has bilingual translations for all composable sections", () => {
      const allSections = CARD_SECTIONS;
      const en = getTranslations("en").socialCard;
      const zh = getTranslations("zh").socialCard;

      for (const s of allSections) {
        expect(en.sections[s]).toBeTruthy();
        expect(zh.sections[s]).toBeTruthy();
      }
    });

    it("orders CARD_SECTIONS in canonical hierarchy", () => {
      expect(CARD_SECTIONS).toEqual([
        "valuationHero",
        "regimes",
        "earnings",
        "segments",
        "moat",
        "catalysts",
        "snowflake",
      ]);
    });

    it("matches presets regardless of section order", () => {
      // Summary preset (even in reverse or shuffled order)
      expect(findMatchingPreset(["moat", "valuationHero", "earnings"])).toBe(
        "summary"
      );
      expect(findMatchingPreset(["valuationHero", "earnings", "moat"])).toBe(
        "summary"
      );

      // Valuation preset
      expect(findMatchingPreset(["regimes", "valuationHero"])).toBe(
        "valuation"
      );

      // Thesis preset
      expect(findMatchingPreset(["catalysts", "moat"])).toBe("thesis");

      // Earnings preset
      expect(findMatchingPreset(["segments", "earnings"])).toBe("earnings");

      // Snowflake preset
      expect(findMatchingPreset(["snowflake"])).toBe("snowflake");

      // Custom non-preset combinations return null
      expect(findMatchingPreset(["valuationHero", "moat"])).toBeNull();
      expect(
        findMatchingPreset(["valuationHero", "regimes", "snowflake"])
      ).toBeNull();
      expect(findMatchingPreset([])).toBeNull();
    });
  });
});
