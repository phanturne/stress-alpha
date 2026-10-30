import { describe, it, expect } from "vitest";
import {
  computeTechnicalLevels,
  findConfluenceSignals,
  synthesizePriceCorridors,
  type YahooQuoteLike,
} from "@/lib/technical";

describe("Deterministic Technical S/R Engine", () => {
  describe("computeTechnicalLevels", () => {
    it("computes classical pivot points and levels accurately", () => {
      const quote: YahooQuoteLike = {
        regularMarketPrice: 145,
        regularMarketDayHigh: 150,
        regularMarketDayLow: 140,
        regularMarketPreviousClose: 145,
        fiftyDayAverage: 142,
        twoHundredDayAverage: 130,
        fiftyTwoWeekHigh: 160,
        fiftyTwoWeekLow: 120,
      };

      const result = computeTechnicalLevels(quote, 145);

      expect(result.currentPrice).toBe(145);
      expect(result.pivotP).toBe(145);
      expect(result.resistance1).toBe(150); // 2*145 - 140
      expect(result.support1).toBe(140); // 2*145 - 150
      expect(result.resistance2).toBe(155); // 145 + (150 - 140)
      expect(result.support2).toBe(135); // 145 - (150 - 140)
      expect(result.resistance3).toBe(160); // H + 2(P - L) = 150 + 2*(145 - 140) = 160
      expect(result.support3).toBe(130); // L - 2(H - P) = 140 - 2*(150 - 145) = 130

      expect(result.sma50).toBe(142);
      expect(result.sma200).toBe(130);
      expect(result.high52).toBe(160);
      expect(result.low52).toBe(120);

      // Verify distance percentages
      const r1 = result.levels.find((l) => l.id === "pivot_r1");
      expect(r1).toBeDefined();
      expect(r1?.price).toBe(150);
      expect(r1?.deltaPct).toBe(3.45); // (150 - 145) / 145 * 100 = 3.448... -> 3.45
      expect(r1?.type).toBe("resistance");

      const s1 = result.levels.find((l) => l.id === "pivot_s1");
      expect(s1).toBeDefined();
      expect(s1?.price).toBe(140);
      expect(s1?.deltaPct).toBe(-3.45); // (140 - 145) / 145 * 100 = -3.448... -> -3.45
      expect(s1?.type).toBe("support");

      const p = result.levels.find((l) => l.id === "pivot_p");
      expect(p).toBeDefined();
      expect(p?.deltaPct).toBe(0);
      expect(p?.type).toBe("pivot");

      // Verify SMA types relative to current price
      const sma50Item = result.levels.find((l) => l.id === "sma50");
      expect(sma50Item?.type).toBe("support"); // 142 < 145

      const sma200Item = result.levels.find((l) => l.id === "sma200");
      expect(sma200Item?.type).toBe("support"); // 130 < 145
      expect(sma200Item?.importance).toBe("major");

      const high52Item = result.levels.find((l) => l.id === "high52");
      expect(high52Item?.type).toBe("resistance"); // 160 > 145
      expect(high52Item?.importance).toBe("major");
    });

    it("labels moving averages as resistance when above current price", () => {
      const quote: YahooQuoteLike = {
        regularMarketPrice: 100,
        fiftyDayAverage: 110,
        twoHundredDayAverage: 125,
      };

      const result = computeTechnicalLevels(quote, 100);
      const sma50 = result.levels.find((l) => l.id === "sma50");
      const sma200 = result.levels.find((l) => l.id === "sma200");

      expect(sma50?.type).toBe("resistance");
      expect(sma50?.deltaPct).toBe(10);
      expect(sma200?.type).toBe("resistance");
      expect(sma200?.deltaPct).toBe(25);
    });

    it("gracefully omits pivot points if daily H/L/C are missing", () => {
      const quote: YahooQuoteLike = {
        regularMarketPrice: 200,
        fiftyDayAverage: 195,
        twoHundredDayAverage: 180,
      };

      const result = computeTechnicalLevels(quote, 200);

      expect(result.pivotP).toBeUndefined();
      expect(result.support1).toBeUndefined();
      expect(result.resistance1).toBeUndefined();
      expect(result.sma50).toBe(195);
      expect(result.sma200).toBe(180);
      expect(result.levels.some((l) => l.id.startsWith("pivot"))).toBe(false);
    });

    it("sorts levels strictly descending by price", () => {
      const quote: YahooQuoteLike = {
        regularMarketPrice: 150,
        regularMarketDayHigh: 155,
        regularMarketDayLow: 145,
        regularMarketPreviousClose: 148,
        fiftyDayAverage: 140,
        twoHundredDayAverage: 130,
        fiftyTwoWeekHigh: 175,
        fiftyTwoWeekLow: 110,
      };

      const result = computeTechnicalLevels(quote, 150);

      for (let i = 0; i < result.levels.length - 1; i++) {
        expect(result.levels[i].price).toBeGreaterThanOrEqual(
          result.levels[i + 1].price
        );
      }
    });

    it("detects unfilled gap when price gaps >= 3% from previous close", () => {
      const quote: YahooQuoteLike = {
        regularMarketPrice: 110,
        regularMarketPreviousClose: 100, // +10% gap up
        regularMarketDayHigh: 112,
        regularMarketDayLow: 108,
      };

      const result = computeTechnicalLevels(quote, 110);

      expect(result.gapFillTarget).toBe(100);
      expect(result.gapDayBoundary).toBe(108); // day low on gap up

      const gapFill = result.levels.find((l) => l.id === "gap_fill");
      expect(gapFill).toBeDefined();
      expect(gapFill?.price).toBe(100);
      expect(gapFill?.type).toBe("support"); // 100 < 110
      expect(gapFill?.importance).toBe("major");

      const gapBoundary = result.levels.find((l) => l.id === "gap_boundary");
      expect(gapBoundary).toBeDefined();
      expect(gapBoundary?.price).toBe(108);
      expect(gapBoundary?.type).toBe("support");
    });

    it("clusters levels within <= 0.85% into zones", () => {
      const quote: YahooQuoteLike = {
        regularMarketPrice: 350,
        fiftyDayAverage: 340.29,
        twoHundredDayAverage: 340.94, // difference is 0.65 / 340.29 = 0.19% <= 0.85%
      };

      const result = computeTechnicalLevels(quote, 350);

      const sma50 = result.levels.find((l) => l.id === "sma50");
      const sma200 = result.levels.find((l) => l.id === "sma200");

      expect(sma50?.zoneRange).toBeDefined();
      expect(sma200?.zoneRange).toBeDefined();
      expect(sma50?.zoneRange).toEqual([340.29, 340.94]);
      expect(sma200?.zoneRange).toEqual([340.29, 340.94]);
      expect(sma50?.clusterCount).toBe(2);
      expect(sma200?.clusterCount).toBe(2);
    });

    it("computes 1-year Volume POC and Anchored VWAP from historical bars", () => {
      const bars = [
        { high: 100, low: 90, close: 95, volume: 1000 },
        { high: 105, low: 95, close: 102, volume: 1200 },
        { high: 110, low: 100, close: 108, volume: 1500 },
        { high: 120, low: 110, close: 115, volume: 5000 }, // Max volume bar
        { high: 130, low: 115, close: 125, volume: 2000 }, // 52W High bar
        { high: 125, low: 110, close: 118, volume: 1800 },
        { high: 122, low: 112, close: 116, volume: 1600 },
        { high: 124, low: 114, close: 120, volume: 1400 },
      ];

      const quote: YahooQuoteLike = {
        regularMarketPrice: 120,
      };

      const result = computeTechnicalLevels(quote, 120, {
        historicalBars: bars,
      });

      expect(result.volumePoc).toBeDefined();
      expect(typeof result.volumePoc).toBe("number");
      expect(result.avwap52High).toBeDefined();
      expect(result.avwapMaxVolume).toBeDefined();

      const pocLvl = result.levels.find((l) => l.id === "volume_poc");
      expect(pocLvl).toBeDefined();
      expect(pocLvl?.importance).toBe("major");

      const avwapHigh = result.levels.find((l) => l.id === "avwap_high");
      expect(avwapHigh).toBeDefined();
    });

    it("preserves existing historical levels if historical bars not passed", () => {
      const existing = computeTechnicalLevels(
        { regularMarketPrice: 100 },
        100,
        {
          historicalBars: [
            { high: 100, low: 90, close: 95, volume: 1000 },
            { high: 105, low: 95, close: 102, volume: 1200 },
            { high: 110, low: 100, close: 108, volume: 1500 },
            { high: 120, low: 110, close: 115, volume: 5000 },
            { high: 130, low: 115, close: 125, volume: 2000 },
          ],
        }
      );

      expect(existing.volumePoc).toBeDefined();

      // Simulate subsequent sync with new price but no historical bars
      const updated = computeTechnicalLevels({ regularMarketPrice: 105 }, 105, {
        existingLevels: existing,
      });

      expect(updated.volumePoc).toBe(existing.volumePoc);
      const updatedPocLvl = updated.levels.find((l) => l.id === "volume_poc");
      expect(updatedPocLvl).toBeDefined();
      expect(updatedPocLvl?.price).toBe(existing.volumePoc);
    });
  });

  describe("findConfluenceSignals", () => {
    it("detects confluence within +/- 2.5% of fundamental regime targets", () => {
      const quote: YahooQuoteLike = {
        regularMarketPrice: 200,
        twoHundredDayAverage: 205, // 205 is within 2.5% of base 208: |205 - 208| / 208 = 1.44%
        fiftyDayAverage: 240, // 240 is far from everything
        fiftyTwoWeekLow: 151, // 151 is within 2.5% of panic 150: |151 - 150| / 150 = 0.67%
      };

      const payload = computeTechnicalLevels(quote, 200);

      const signalsEn = findConfluenceSignals(
        payload,
        {
          panic: 150,
          bear: 180,
          base: 208,
          bull: 260,
        },
        "en"
      );

      expect(signalsEn.length).toBe(2);

      // Tightest confluence first (151 vs 150 -> 0.67% vs 205 vs 208 -> 1.44%)
      expect(signalsEn[0].technicalId).toBe("low52");
      expect(signalsEn[0].fundamentalRegime).toBe("panic");
      expect(signalsEn[0].divergencePct).toBe(0.67);
      expect(signalsEn[0].description).toContain("52-Week Low");
      expect(signalsEn[0].description).toContain("Panic");

      expect(signalsEn[1].technicalId).toBe("sma200");
      expect(signalsEn[1].fundamentalRegime).toBe("base");
      expect(signalsEn[1].divergencePct).toBe(1.44);
      expect(signalsEn[1].description).toContain("200-Day SMA");
      expect(signalsEn[1].description).toContain("Base");

      // Verify Chinese pre-localization
      const signalsZh = findConfluenceSignals(
        payload,
        {
          panic: 150,
          bear: 180,
          base: 208,
          bull: 260,
        },
        "zh"
      );

      expect(signalsZh.length).toBe(2);
      expect(signalsZh[0].description).toContain("52周低点");
      expect(signalsZh[0].description).toContain("共振");
    });

    it("returns empty array when no technical levels are within 2.5%", () => {
      const quote: YahooQuoteLike = {
        regularMarketPrice: 100,
        twoHundredDayAverage: 80,
        fiftyDayAverage: 90,
      };

      const payload = computeTechnicalLevels(quote, 100);

      const signals = findConfluenceSignals(
        payload,
        {
          panic: 60,
          bear: 70,
          base: 120,
          bull: 150,
        },
        "en"
      );

      expect(signals).toEqual([]);
    });
  });

  describe("synthesizePriceCorridors", () => {
    it("synthesizes 3 institutional support and 3 resistance corridors for gap-down scenario", () => {
      const quote: YahooQuoteLike = {
        regularMarketPrice: 283.82,
        regularMarketDayHigh: 288.33,
        regularMarketDayLow: 280.36,
        regularMarketPreviousClose: 324.89,
        fiftyDayAverage: 340.29,
        twoHundredDayAverage: 340.94,
        fiftyTwoWeekHigh: 408.61,
        fiftyTwoWeekLow: 270.7,
      };

      const payload = computeTechnicalLevels(quote, 283.82, {
        existingLevels: {
          asOf: new Date().toISOString(),
          currentPrice: 283.82,
          volumePoc: 317.24,
          levels: [
            {
              id: "volume_poc",
              label: "1-Year Volume POC",
              price: 317.24,
              deltaPct: 11.78,
              type: "resistance",
              importance: "major",
            },
            {
              id: "swing_low",
              label: "Fractal Swing Low",
              price: 316.6,
              deltaPct: 11.55,
              type: "resistance",
              importance: "minor",
            },
          ],
        },
      });

      const corridorsEn = synthesizePriceCorridors(payload, 283.82, "en");

      // Exactly 3 supports and 3 resistances
      expect(corridorsEn.supports.length).toBe(3);
      expect(corridorsEn.resistances.length).toBe(3);

      // Support Tiers
      const [s1, s2, s3] = corridorsEn.supports;
      expect(s1.id).toBe("s1");
      expect(s1.tierNumber).toBe(1);
      expect(s1.tierTitle).toBe("Immediate Shelf");
      expect(s1.range[1]).toBeGreaterThanOrEqual(280);

      expect(s2.id).toBe("s2");
      expect(s2.tierNumber).toBe(2);
      expect(s2.tierTitle).toBe("Cycle Bedrock Floor");
      expect(s2.range[0]).toBe(270.7); // 52W Low

      expect(s3.id).toBe("s3");
      expect(s3.tierNumber).toBe(3);
      expect(s3.tierTitle).toBe("Downside Breakdown Extension");
      expect(s3.range[0]).toBeLessThan(270.7); // Measured move target

      // Resistance Tiers
      const [r1, r2, r3] = corridorsEn.resistances;
      expect(r1.id).toBe("r1");
      expect(r1.tierNumber).toBe(1);
      expect(r1.tierTitle).toBe("Immediate Ceiling");
      expect(r1.range[1]).toBe(288.33); // Gap day high

      expect(r2.id).toBe("r2");
      expect(r2.tierNumber).toBe(2);
      expect(r2.tierTitle).toBe("Trapped Supply & Gap Top");
      expect(r2.range[1]).toBe(324.89); // Gap fill target

      expect(r3.id).toBe("r3");
      expect(r3.tierNumber).toBe(3);
      expect(r3.tierTitle).toBe("Major Trend Confluence");
      expect(r3.range[0]).toBe(340.29); // 50 SMA
      expect(r3.range[1]).toBe(340.94); // 200 SMA

      // Verify Chinese pre-localization
      const corridorsZh = synthesizePriceCorridors(payload, 283.82, "zh");
      expect(corridorsZh.supports[0].tierTitle).toBe("即时支撑平台");
      expect(corridorsZh.supports[1].tierTitle).toBe("周期底部基石");
      expect(corridorsZh.supports[2].tierTitle).toBe("破位测算下限");
      expect(corridorsZh.resistances[0].tierTitle).toBe("即时反弹压制");
      expect(corridorsZh.resistances[1].tierTitle).toBe("筹码套牢峰与缺口上沿");
      expect(corridorsZh.resistances[2].tierTitle).toBe("主线均线死叉压力区");
    });
  });
});
