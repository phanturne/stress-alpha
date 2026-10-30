/**
 * Deterministic Technical Support & Resistance (S/R) Engine
 *
 * Implements classical pivot point mathematics, simple moving averages (50, 200 SMA),
 * 52-week boundaries, distance telemetry, and fundamental confluence detection.
 *
 * Adheres strictly to AGENTS.md:
 * - 100% deterministic pure TypeScript arithmetic (zero LLM math).
 * - Pre-localized confluence messaging via centralized i18n dictionary.
 */

import { round2 } from "./valuation";
import { getTranslations, type Locale } from "./i18n";
import type {
  TechnicalLevelsPayload,
  TechnicalLevelItem,
  PriceCorridorTier,
  InstitutionalCorridors,
} from "./schemas";

export interface YahooQuoteLike {
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

export interface DailyBar {
  date?: string | Date;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
}

export interface ComputeTechnicalLevelsOptions {
  historicalBars?: DailyBar[];
  existingLevels?: TechnicalLevelsPayload;
}

export interface ConfluenceSignal {
  technicalId: string;
  technicalLabel: string;
  technicalPrice: number;
  fundamentalRegime: "panic" | "bear" | "base" | "bull";
  fundamentalLabel: string;
  fundamentalPrice: number;
  divergencePct: number; // e.g. 1.8 (%)
  description: string; // Pre-localized human-readable description
}

/**
 * Clusters levels within a relative threshold (default 0.85% / 0.0085).
 * Modifies items in-place or returns clustered levels with `zoneRange` and `clusterCount`.
 */
export function clusterTechnicalLevels(
  levels: TechnicalLevelItem[],
  thresholdPct: number = 0.85
): TechnicalLevelItem[] {
  if (levels.length === 0) return [];

  // Sort descending by price to evaluate clusters
  const sorted = [...levels].sort((a, b) => b.price - a.price);

  // Group adjacent levels within threshold: |a.price - b.price| / min(a.price, b.price) <= thresholdPct / 100
  // Or relative to the cluster anchor
  const clusters: TechnicalLevelItem[][] = [];
  let currentCluster: TechnicalLevelItem[] = [];

  for (const item of sorted) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
    } else {
      const clusterMin = Math.min(...currentCluster.map((c) => c.price));
      const clusterMax = Math.max(...currentCluster.map((c) => c.price));
      const distFromMin = Math.abs(item.price - clusterMin) / (clusterMin || 1);
      const distFromMax = Math.abs(item.price - clusterMax) / (clusterMax || 1);

      // If within threshold of cluster boundary
      if (
        distFromMin <= thresholdPct / 100 ||
        distFromMax <= thresholdPct / 100
      ) {
        currentCluster.push(item);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
      }
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Tag items with zoneRange and clusterCount if cluster has >= 2 items
  for (const cluster of clusters) {
    if (cluster.length >= 2) {
      const minP = round2(Math.min(...cluster.map((c) => c.price)));
      const maxP = round2(Math.max(...cluster.map((c) => c.price)));
      const count = cluster.length;
      for (const item of cluster) {
        item.zoneRange = [minP, maxP];
        item.clusterCount = count;
      }
    }
  }

  return sorted;
}

/**
 * Computes Volume Point of Control (POC) by dividing price range into 40 buckets
 * and finding the price bucket with the highest accumulated volume.
 */
export function computeVolumePoc(bars: DailyBar[]): number | undefined {
  const validBars = bars.filter(
    (b) =>
      typeof b.high === "number" &&
      typeof b.low === "number" &&
      typeof b.close === "number" &&
      typeof b.volume === "number" &&
      b.volume > 0 &&
      b.high > 0 &&
      b.low > 0
  );
  if (validBars.length < 5) return undefined;

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  for (const b of validBars) {
    if ((b.low as number) < minPrice) minPrice = b.low as number;
    if ((b.high as number) > maxPrice) maxPrice = b.high as number;
  }

  if (maxPrice <= minPrice || !isFinite(minPrice) || !isFinite(maxPrice)) {
    return undefined;
  }

  const BUCKETS = 40;
  const bucketSize = (maxPrice - minPrice) / BUCKETS;
  const bucketVolumes = new Float64Array(BUCKETS);

  for (const b of validBars) {
    const typicalPrice =
      ((b.high as number) + (b.low as number) + (b.close as number)) / 3;
    const bucketIdx = Math.min(
      Math.floor((typicalPrice - minPrice) / bucketSize),
      BUCKETS - 1
    );
    if (bucketIdx >= 0) {
      bucketVolumes[bucketIdx] += b.volume as number;
    }
  }

  let maxVol = -1;
  let maxIdx = 0;
  for (let i = 0; i < BUCKETS; i++) {
    if (bucketVolumes[i] > maxVol) {
      maxVol = bucketVolumes[i];
      maxIdx = i;
    }
  }

  const pocPrice = minPrice + (maxIdx + 0.5) * bucketSize;
  return round2(pocPrice);
}

/**
 * Computes Anchored VWAP starting from a specific index in daily bars array.
 * Typical Price = (High + Low + Close) / 3
 * Cumulative (Typical Price * Volume) / Cumulative Volume
 */
export function computeAnchoredVwap(
  bars: DailyBar[],
  startIndex: number
): number | undefined {
  if (startIndex < 0 || startIndex >= bars.length) return undefined;

  let cumPv = 0;
  let cumVol = 0;

  for (let i = startIndex; i < bars.length; i++) {
    const b = bars[i];
    if (
      typeof b.high === "number" &&
      typeof b.low === "number" &&
      typeof b.close === "number" &&
      typeof b.volume === "number" &&
      b.volume > 0
    ) {
      const typical = (b.high + b.low + b.close) / 3;
      cumPv += typical * b.volume;
      cumVol += b.volume;
    }
  }

  if (cumVol <= 0) return undefined;
  return round2(cumPv / cumVol);
}

/**
 * Finds 5-bar swing fractals (Williams fractals: bar i has higher high than 2 bars before and 2 bars after).
 * Returns the most recent significant swing high and swing low.
 */
export function findSwingFractals(bars: DailyBar[]): {
  swingHigh?: number;
  swingLow?: number;
} {
  const validBars = bars.filter(
    (b) =>
      typeof b.high === "number" &&
      typeof b.low === "number" &&
      b.high > 0 &&
      b.low > 0
  );
  if (validBars.length < 5) return {};

  let latestSwingHigh: number | undefined;
  let latestSwingLow: number | undefined;

  // Scan backwards from recent to older (excluding the most recent 2 bars which can't be confirmed 5-bar fractals yet)
  for (let i = validBars.length - 3; i >= 2; i--) {
    const cur = validBars[i];
    const curH = cur.high as number;
    const curL = cur.low as number;

    if (!latestSwingHigh) {
      if (
        curH > (validBars[i - 1].high as number) &&
        curH > (validBars[i - 2].high as number) &&
        curH > (validBars[i + 1].high as number) &&
        curH > (validBars[i + 2].high as number)
      ) {
        latestSwingHigh = round2(curH);
      }
    }

    if (!latestSwingLow) {
      if (
        curL < (validBars[i - 1].low as number) &&
        curL < (validBars[i - 2].low as number) &&
        curL < (validBars[i + 1].low as number) &&
        curL < (validBars[i + 2].low as number)
      ) {
        latestSwingLow = round2(curL);
      }
    }

    if (latestSwingHigh && latestSwingLow) break;
  }

  return { swingHigh: latestSwingHigh, swingLow: latestSwingLow };
}

/**
 * Computes deterministic technical support & resistance levels from market quote parameters
 * and optional historical daily bars.
 */
export function computeTechnicalLevels(
  quoteData: YahooQuoteLike,
  currentPrice?: number,
  options?: ComputeTechnicalLevelsOptions
): TechnicalLevelsPayload {
  const price = round2(
    currentPrice !== undefined && currentPrice > 0
      ? currentPrice
      : (quoteData.regularMarketPrice ?? 0)
  );

  const levels: TechnicalLevelItem[] = [];

  const resolveType = (
    lvlPrice: number
  ): "support" | "resistance" | "pivot" => {
    if (price <= 0) return "pivot";
    if (lvlPrice < price) return "support";
    if (lvlPrice > price) return "resistance";
    return "pivot";
  };

  let sma50: number | undefined;
  if (
    typeof quoteData.fiftyDayAverage === "number" &&
    quoteData.fiftyDayAverage > 0
  ) {
    sma50 = round2(quoteData.fiftyDayAverage);
    const deltaPct = price > 0 ? round2(((sma50 - price) / price) * 100) : 0;
    levels.push({
      id: "sma50",
      label: "50-Day SMA",
      price: sma50,
      deltaPct,
      type: sma50 < price ? "support" : sma50 > price ? "resistance" : "pivot",
      importance: "intermediate",
    });
  }

  let sma200: number | undefined;
  if (
    typeof quoteData.twoHundredDayAverage === "number" &&
    quoteData.twoHundredDayAverage > 0
  ) {
    sma200 = round2(quoteData.twoHundredDayAverage);
    const deltaPct = price > 0 ? round2(((sma200 - price) / price) * 100) : 0;
    levels.push({
      id: "sma200",
      label: "200-Day SMA",
      price: sma200,
      deltaPct,
      type:
        sma200 < price ? "support" : sma200 > price ? "resistance" : "pivot",
      importance: "major",
    });
  }

  let high52: number | undefined;
  if (
    typeof quoteData.fiftyTwoWeekHigh === "number" &&
    quoteData.fiftyTwoWeekHigh > 0
  ) {
    high52 = round2(quoteData.fiftyTwoWeekHigh);
    const deltaPct = price > 0 ? round2(((high52 - price) / price) * 100) : 0;
    levels.push({
      id: "high52",
      label: "52-Week High",
      price: high52,
      deltaPct,
      type: high52 < price ? "support" : "resistance",
      importance: "major",
    });
  }

  let low52: number | undefined;
  if (
    typeof quoteData.fiftyTwoWeekLow === "number" &&
    quoteData.fiftyTwoWeekLow > 0
  ) {
    low52 = round2(quoteData.fiftyTwoWeekLow);
    const deltaPct = price > 0 ? round2(((low52 - price) / price) * 100) : 0;
    levels.push({
      id: "low52",
      label: "52-Week Low",
      price: low52,
      deltaPct,
      type: "support",
      importance: "major",
    });
  }

  // Classical Pivot Points (Floor trader pivots)
  // Requires Day High (H), Day Low (L), and Previous Close (C)
  let pivotP: number | undefined;
  let support1: number | undefined;
  let resistance1: number | undefined;
  let support2: number | undefined;
  let resistance2: number | undefined;
  let support3: number | undefined;
  let resistance3: number | undefined;

  const H = quoteData.regularMarketDayHigh;
  const L = quoteData.regularMarketDayLow;
  // Use session price if available as the session close for (H, L); otherwise fallback to previous close
  const C =
    price > 0
      ? price
      : typeof quoteData.regularMarketPreviousClose === "number" &&
          quoteData.regularMarketPreviousClose > 0
        ? quoteData.regularMarketPreviousClose
        : undefined;

  if (
    typeof H === "number" &&
    H > 0 &&
    typeof L === "number" &&
    L > 0 &&
    typeof C === "number" &&
    C > 0
  ) {
    // 1. Classical Pivot: P = (H + L + C) / 3
    pivotP = round2((H + L + C) / 3);
    const pDelta = price > 0 ? round2(((pivotP - price) / price) * 100) : 0;
    levels.push({
      id: "pivot_p",
      label: "Classical Pivot (P)",
      price: pivotP,
      deltaPct: pDelta,
      type: resolveType(pivotP),
      importance: "intermediate",
    });

    // 2. First Tier: R1 = 2P - L, S1 = 2P - H
    resistance1 = round2(2 * pivotP - L);
    const r1Delta =
      price > 0 ? round2(((resistance1 - price) / price) * 100) : 0;
    levels.push({
      id: "pivot_r1",
      label: "Pivot Resistance 1 (R1)",
      price: resistance1,
      deltaPct: r1Delta,
      type: resolveType(resistance1),
      importance: "intermediate",
    });

    support1 = round2(2 * pivotP - H);
    const s1Delta = price > 0 ? round2(((support1 - price) / price) * 100) : 0;
    levels.push({
      id: "pivot_s1",
      label: "Pivot Support 1 (S1)",
      price: support1,
      deltaPct: s1Delta,
      type: resolveType(support1),
      importance: "intermediate",
    });

    // 3. Second Tier: R2 = P + (H - L), S2 = P - (H - L)
    resistance2 = round2(pivotP + (H - L));
    const r2Delta =
      price > 0 ? round2(((resistance2 - price) / price) * 100) : 0;
    levels.push({
      id: "pivot_r2",
      label: "Pivot Resistance 2 (R2)",
      price: resistance2,
      deltaPct: r2Delta,
      type: resolveType(resistance2),
      importance: "minor",
    });

    support2 = round2(pivotP - (H - L));
    const s2Delta = price > 0 ? round2(((support2 - price) / price) * 100) : 0;
    levels.push({
      id: "pivot_s2",
      label: "Pivot Support 2 (S2)",
      price: support2,
      deltaPct: s2Delta,
      type: resolveType(support2),
      importance: "minor",
    });

    // 4. Third Tier: Classical Pivot Extensions
    // S3 = L - 2(H - P), R3 = H + 2(P - L)
    resistance3 = round2(H + 2 * (pivotP - L));
    const r3Delta =
      price > 0 ? round2(((resistance3 - price) / price) * 100) : 0;
    levels.push({
      id: "pivot_r3",
      label: "Pivot Resistance 3 (R3)",
      price: resistance3,
      deltaPct: r3Delta,
      type: resolveType(resistance3),
      importance: "minor",
    });

    support3 = round2(L - 2 * (H - pivotP));
    const s3Delta = price > 0 ? round2(((support3 - price) / price) * 100) : 0;
    levels.push({
      id: "pivot_s3",
      label: "Pivot Support 3 (S3)",
      price: support3,
      deltaPct: s3Delta,
      type: resolveType(support3),
      importance: "minor",
    });
  }

  // Unfilled Gap Detector: When stock has a >= 3% gap between regularMarketPreviousClose and current session price
  let gapFillTarget: number | undefined;
  let gapDayBoundary: number | undefined;
  const prevClose = quoteData.regularMarketPreviousClose;
  if (typeof prevClose === "number" && prevClose > 0 && price > 0) {
    const gapPct = Math.abs(price - prevClose) / prevClose;
    if (gapPct >= 0.03) {
      gapFillTarget = round2(prevClose);
      const gapDelta = round2(((gapFillTarget - price) / price) * 100);
      levels.push({
        id: "gap_fill",
        label: "Gap Fill Target (Prior Close)",
        price: gapFillTarget,
        deltaPct: gapDelta,
        type: resolveType(gapFillTarget),
        importance: "major",
      });

      // Gap Day Boundary at Day Low (if gapping up) or Day High (if gapping down)
      if (price > prevClose && typeof L === "number" && L > 0) {
        gapDayBoundary = round2(L);
      } else if (price < prevClose && typeof H === "number" && H > 0) {
        gapDayBoundary = round2(H);
      }

      if (gapDayBoundary) {
        const boundaryDelta = round2(((gapDayBoundary - price) / price) * 100);
        levels.push({
          id: "gap_boundary",
          label: "Gap Day Boundary",
          price: gapDayBoundary,
          deltaPct: boundaryDelta,
          type: resolveType(gapDayBoundary),
          importance: "intermediate",
        });
      }
    }
  }

  // Historical OHLCV Analysis (Layer 2)
  let volumePoc: number | undefined;
  let avwap52High: number | undefined;
  let avwapMaxVolume: number | undefined;

  const bars = options?.historicalBars;
  if (bars && bars.length >= 5) {
    // 1-Year Volume Profile POC
    volumePoc = computeVolumePoc(bars);
    if (volumePoc) {
      const pocDelta =
        price > 0 ? round2(((volumePoc - price) / price) * 100) : 0;
      levels.push({
        id: "volume_poc",
        label: "1-Year Volume POC",
        price: volumePoc,
        deltaPct: pocDelta,
        type: resolveType(volumePoc),
        importance: "major",
      });
    }

    // Anchored VWAPs
    let highBarIdx = -1;
    let maxHigh = -Infinity;
    let maxVolBarIdx = -1;
    let maxVolume = -Infinity;

    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      if (typeof b.high === "number" && b.high > maxHigh) {
        maxHigh = b.high;
        highBarIdx = i;
      }
      if (typeof b.volume === "number" && b.volume > maxVolume) {
        maxVolume = b.volume;
        maxVolBarIdx = i;
      }
    }

    if (highBarIdx >= 0) {
      avwap52High = computeAnchoredVwap(bars, highBarIdx);
      if (avwap52High) {
        const avwapDelta =
          price > 0 ? round2(((avwap52High - price) / price) * 100) : 0;
        levels.push({
          id: "avwap_high",
          label: "Anchored VWAP (52W High)",
          price: avwap52High,
          deltaPct: avwapDelta,
          type: resolveType(avwap52High),
          importance: "intermediate",
        });
      }
    }

    if (maxVolBarIdx >= 0 && maxVolBarIdx !== highBarIdx) {
      avwapMaxVolume = computeAnchoredVwap(bars, maxVolBarIdx);
      if (avwapMaxVolume) {
        const avwapVolDelta =
          price > 0 ? round2(((avwapMaxVolume - price) / price) * 100) : 0;
        levels.push({
          id: "avwap_volume",
          label: "Anchored VWAP (Max Volume)",
          price: avwapMaxVolume,
          deltaPct: avwapVolDelta,
          type: resolveType(avwapMaxVolume),
          importance: "intermediate",
        });
      }
    }

    // Fractal Swing Shelves
    const fractals = findSwingFractals(bars);
    if (fractals.swingHigh) {
      const shDelta =
        price > 0 ? round2(((fractals.swingHigh - price) / price) * 100) : 0;
      levels.push({
        id: "swing_high",
        label: "Fractal Swing High",
        price: fractals.swingHigh,
        deltaPct: shDelta,
        type: resolveType(fractals.swingHigh),
        importance: "minor",
      });
    }

    if (fractals.swingLow) {
      const slDelta =
        price > 0 ? round2(((fractals.swingLow - price) / price) * 100) : 0;
      levels.push({
        id: "swing_low",
        label: "Fractal Swing Low",
        price: fractals.swingLow,
        deltaPct: slDelta,
        type: resolveType(fractals.swingLow),
        importance: "minor",
      });
    }
  } else if (options?.existingLevels) {
    // Preserve existing historical levels if not re-fetching bars
    const prev = options.existingLevels;
    volumePoc = prev.volumePoc;
    avwap52High = prev.avwap52High;
    avwapMaxVolume = prev.avwapMaxVolume;

    const historicalIds = [
      "volume_poc",
      "avwap_high",
      "avwap_volume",
      "swing_high",
      "swing_low",
    ];
    for (const prevLvl of prev.levels) {
      if (historicalIds.includes(prevLvl.id)) {
        const delta =
          price > 0
            ? round2(((prevLvl.price - price) / price) * 100)
            : prevLvl.deltaPct;
        levels.push({
          ...prevLvl,
          deltaPct: delta,
          type: resolveType(prevLvl.price),
        });
      }
    }
  }

  // Deduplicate levels by id
  const seenIds = new Set<string>();
  const uniqueLevels: TechnicalLevelItem[] = [];
  for (const lvl of levels) {
    if (!seenIds.has(lvl.id)) {
      seenIds.add(lvl.id);
      uniqueLevels.push(lvl);
    }
  }

  // Apply Smart Clustering (levels within <= 0.85% grouped with zoneRange)
  const clusteredLevels = clusterTechnicalLevels(uniqueLevels, 0.85);

  return {
    asOf: new Date().toISOString(),
    currentPrice: price,
    sma50,
    sma200,
    high52,
    low52,
    pivotP,
    support1,
    resistance1,
    support2,
    resistance2,
    support3,
    resistance3,
    volumePoc,
    avwap52High,
    avwapMaxVolume,
    gapFillTarget,
    gapDayBoundary,
    levels: clusteredLevels,
  };
}

/**
 * Detects confluence zones where key technical levels align within +/- 2.5% of fundamental regime targets.
 */
export function findConfluenceSignals(
  payload: TechnicalLevelsPayload,
  valuation: {
    panic?: number;
    bear?: number;
    base?: number;
    bull?: number;
  },
  locale: Locale = "en"
): ConfluenceSignal[] {
  if (!payload || !payload.levels || payload.levels.length === 0) {
    return [];
  }

  const t = getTranslations(locale);
  const signals: ConfluenceSignal[] = [];

  const fundamentalRegimes: {
    id: "panic" | "bear" | "base" | "bull";
    price?: number;
  }[] = [
    { id: "panic", price: valuation.panic },
    { id: "bear", price: valuation.bear },
    { id: "base", price: valuation.base },
    { id: "bull", price: valuation.bull },
  ];

  // Inspect key levels (major and intermediate importance)
  const candidateLevels = payload.levels.filter(
    (lvl) => lvl.importance === "major" || lvl.importance === "intermediate"
  );

  for (const lvl of candidateLevels) {
    if (lvl.price <= 0) continue;

    for (const reg of fundamentalRegimes) {
      if (typeof reg.price !== "number" || reg.price <= 0) continue;

      const diff = Math.abs(lvl.price - reg.price);
      const diffPct = round2((diff / reg.price) * 100);

      // Confluence condition: within +/- 2.5%
      if (diffPct <= 2.5) {
        const regimeLabel = t.cockpit.regimes[reg.id] ?? reg.id;
        const techLabel =
          t.technicalLevels.levelNames[
            lvl.id as keyof typeof t.technicalLevels.levelNames
          ] ?? lvl.label;

        const description = t.technicalLevels.confluenceDesc(
          techLabel,
          `$${lvl.price.toFixed(2)}`,
          regimeLabel,
          `$${reg.price.toFixed(2)}`,
          diffPct.toFixed(1)
        );

        signals.push({
          technicalId: lvl.id,
          technicalLabel: techLabel,
          technicalPrice: lvl.price,
          fundamentalRegime: reg.id,
          fundamentalLabel: regimeLabel,
          fundamentalPrice: round2(reg.price),
          divergencePct: diffPct,
          description,
        });
      }
    }
  }

  // Sort by divergence ascending (tightest confluence first)
  signals.sort((a, b) => a.divergencePct - b.divergencePct);

  return signals;
}

/**
 * Synthesizes raw technical levels, moving averages, volume nodes, gaps, and extremes
 * into a clean, 3-tier institutional price corridor hierarchy:
 * - Tier 1: Immediate Reaction Corridor (S1 / R1)
 * - Tier 2: Structural / Trapped Supply Corridor (S2 / R2)
 * - Tier 3: Macro Regime / Breakdown Extension (S3 / R3)
 */
export function synthesizePriceCorridors(
  payload: TechnicalLevelsPayload,
  activePrice: number,
  locale: Locale = "en"
): InstitutionalCorridors {
  const t = getTranslations(locale).technicalLevels.corridors;
  const supports: PriceCorridorTier[] = [];
  const resistances: PriceCorridorTier[] = [];

  const P = activePrice > 0 ? activePrice : payload.currentPrice;
  if (P <= 0 || !payload.levels || payload.levels.length === 0) {
    return { supports: [], resistances: [] };
  }

  // Helper to calculate signed delta %
  const calcDelta = (priceVal: number) => round2(((priceVal - P) / P) * 100);

  // -------------------------------------------------------------
  // SUPPORT TIERS (S1, S2, S3)
  // -------------------------------------------------------------
  const allSupports = payload.levels
    .filter((l) => l.price < P)
    .sort((a, b) => b.price - a.price);

  // 1. S1: Immediate Support Floor
  // Priority: Day Low (gap boundary if below price) + S1 Pivot
  let s1Range: [number, number];
  let s1Low = 0;
  let s1High = 0;

  const candS1 =
    payload.support1 && payload.support1 < P ? payload.support1 : undefined;
  const candBoundary =
    payload.gapDayBoundary && payload.gapDayBoundary < P
      ? payload.gapDayBoundary
      : undefined;

  if (candS1 && candBoundary) {
    s1Low = round2(Math.min(candS1, candBoundary));
    s1High = round2(Math.max(candS1, candBoundary));
    s1Range = [s1Low, s1High];
  } else if (candS1) {
    s1Low = round2(candS1 * 0.998);
    s1High = round2(candS1 * 1.001);
    s1Range = [s1Low, s1High];
  } else if (allSupports.length > 0) {
    const top = allSupports[0];
    const topMin = top.zoneRange ? top.zoneRange[0] : top.price;
    const topMax = top.zoneRange ? top.zoneRange[1] : top.price;
    s1Low = topMin;
    s1High = topMax;
    s1Range = [topMin, topMax];
  } else {
    s1Low = round2(P * 0.98);
    s1High = round2(P * 0.99);
    s1Range = [s1Low, s1High];
  }

  const s1Anchor = round2((s1Range[0] + s1Range[1]) / 2);
  supports.push({
    id: "s1",
    tierNumber: 1,
    type: "support",
    tierTitle: t.s1Title,
    range: s1Range,
    anchorPrice: s1Anchor,
    deltaPct: calcDelta(s1Anchor),
    rationale: t.s1Desc(
      `$${s1Range[0].toFixed(2)}`,
      `$${s1Range[1].toFixed(2)}`
    ),
  });

  // 2. S2: Structural Bedrock / Major Pivot Floor
  // Check if 52-Week Low is nearby (e.g. within -12% of price)
  const is52LowNearby =
    payload.low52 && payload.low52 < P && (P - payload.low52) / P <= 0.12;

  let s2Range: [number, number];
  let s2Title: string;
  let s2Rationale: string;

  if (is52LowNearby && payload.low52) {
    const s3Cand =
      payload.support3 && payload.support3 < P
        ? payload.support3
        : payload.low52;
    const low = round2(Math.min(payload.low52, s3Cand));
    const high = round2(Math.max(payload.low52, s3Cand));
    s2Range = [low, high];
    s2Title = t.s2Bedrock;
    s2Rationale = t.s2BedrockDesc(`$${low.toFixed(2)}`, `$${high.toFixed(2)}`);
  } else {
    // Look for 200 SMA below price, or S2 pivot, or Volume POC
    const s2Cand =
      payload.support2 && payload.support2 < P ? payload.support2 : undefined;
    const sma200Below =
      payload.sma200 && payload.sma200 < P ? payload.sma200 : undefined;
    const pocBelow =
      payload.volumePoc && payload.volumePoc < P
        ? payload.volumePoc
        : undefined;

    const structuralAnchor =
      sma200Below ??
      pocBelow ??
      s2Cand ??
      (allSupports[1]?.price || round2(P * 0.94));
    const low = round2(structuralAnchor * 0.995);
    const high = round2(structuralAnchor * 1.005);
    s2Range = [low, high];
    s2Title = t.s2Structural;
    s2Rationale = t.s2StructuralDesc(
      `$${low.toFixed(2)}`,
      `$${high.toFixed(2)}`
    );
  }

  const s2Anchor = round2((s2Range[0] + s2Range[1]) / 2);
  supports.push({
    id: "s2",
    tierNumber: 2,
    type: "support",
    tierTitle: s2Title,
    range: s2Range,
    anchorPrice: s2Anchor,
    deltaPct: calcDelta(s2Anchor),
    rationale: s2Rationale,
  });

  // 3. S3: Downside Extension / Macro Boundary
  let s3Range: [number, number];
  let s3Title: string;
  let s3Rationale: string;

  if (is52LowNearby && payload.low52) {
    // Measured move breakdown target if 52-week low fails
    const swingDist = Math.max(s1Range[1] - payload.low52, P * 0.05);
    const measuredTarget = round2(payload.low52 - swingDist);
    const low = round2(Math.floor((measuredTarget * 0.99) / 5) * 5); // neat institutional round zone
    const high = round2(low + 5);
    s3Range = [low, high];
    s3Title = t.s3Breakdown;
    s3Rationale = t.s3BreakdownDesc(
      `$${low.toFixed(2)}`,
      `$${high.toFixed(2)}`
    );
  } else if (payload.low52 && payload.low52 < P) {
    const low = round2(payload.low52);
    const high = round2(payload.low52 * 1.01);
    s3Range = [low, high];
    s3Title = t.s3Macro;
    s3Rationale = t.s3MacroDesc(`$${low.toFixed(2)}`, `$${high.toFixed(2)}`);
  } else {
    const low = round2(P * 0.88);
    const high = round2(P * 0.9);
    s3Range = [low, high];
    s3Title = t.s3Macro;
    s3Rationale = t.s3MacroDesc(`$${low.toFixed(2)}`, `$${high.toFixed(2)}`);
  }

  const s3Anchor = round2((s3Range[0] + s3Range[1]) / 2);
  supports.push({
    id: "s3",
    tierNumber: 3,
    type: "support",
    tierTitle: s3Title,
    range: s3Range,
    anchorPrice: s3Anchor,
    deltaPct: calcDelta(s3Anchor),
    rationale: s3Rationale,
  });

  // -------------------------------------------------------------
  // RESISTANCE TIERS (R1, R2, R3)
  // -------------------------------------------------------------
  const allResistances = payload.levels
    .filter((l) => l.price > P)
    .sort((a, b) => a.price - b.price);

  // 1. R1: Immediate Ceiling
  // Day high (or gap day boundary) + R1 Pivot
  const candR1 =
    payload.resistance1 && payload.resistance1 > P
      ? payload.resistance1
      : undefined;
  const candRBoundary =
    payload.gapDayBoundary && payload.gapDayBoundary > P
      ? payload.gapDayBoundary
      : undefined;

  let r1Range: [number, number];
  if (candR1 && candRBoundary) {
    const low = round2(Math.min(candR1, candRBoundary));
    const high = round2(Math.max(candR1, candRBoundary));
    r1Range = [low, high];
  } else if (candR1) {
    r1Range = [round2(candR1 * 0.998), round2(candR1 * 1.005)];
  } else if (allResistances.length > 0) {
    const first = allResistances[0];
    const low = first.zoneRange ? first.zoneRange[0] : first.price;
    const high = first.zoneRange ? first.zoneRange[1] : first.price;
    r1Range = [low, high];
  } else {
    r1Range = [round2(P * 1.01), round2(P * 1.025)];
  }

  const r1Anchor = round2((r1Range[0] + r1Range[1]) / 2);
  resistances.push({
    id: "r1",
    tierNumber: 1,
    type: "resistance",
    tierTitle: t.r1Title,
    range: r1Range,
    anchorPrice: r1Anchor,
    deltaPct: calcDelta(r1Anchor),
    rationale: t.r1Desc(
      `$${r1Range[0].toFixed(2)}`,
      `$${r1Range[1].toFixed(2)}`
    ),
  });

  // 2. R2: Structural Resistance / Trapped Supply
  // Check if an unfilled gap target or Volume POC exists above price
  const hasGapAbove = payload.gapFillTarget && payload.gapFillTarget > P;
  let r2Range: [number, number];
  let r2Title: string;
  let r2Rationale: string;

  if (hasGapAbove && payload.gapFillTarget) {
    // Gap Top + Volume POC / Structural Shelf
    const poc =
      payload.volumePoc && payload.volumePoc > P
        ? payload.volumePoc
        : undefined;
    const swingLowLvl = payload.levels.find(
      (l) =>
        l.id === "swing_low" && l.price > P && l.price < payload.gapFillTarget!
    );
    const shelfPrice =
      swingLowLvl?.price ?? poc ?? round2(payload.gapFillTarget * 0.96);
    const low = round2(Math.min(shelfPrice, payload.gapFillTarget));
    const high = round2(Math.max(shelfPrice, payload.gapFillTarget));
    r2Range = [low, high];
    r2Title = t.r2Gap;
    r2Rationale = t.r2GapDesc(`$${low.toFixed(2)}`, `$${high.toFixed(2)}`);
  } else {
    // Structural volume POC or R2 / R3 pivot
    const poc =
      payload.volumePoc && payload.volumePoc > P
        ? payload.volumePoc
        : undefined;
    const r2Cand =
      payload.resistance2 && payload.resistance2 > P
        ? payload.resistance2
        : undefined;
    const mid = poc ?? r2Cand ?? (allResistances[1]?.price || round2(P * 1.06));
    const low = round2(mid * 0.995);
    const high = round2(mid * 1.01);
    r2Range = [low, high];
    r2Title = t.r2Structural;
    r2Rationale = t.r2StructuralDesc(
      `$${low.toFixed(2)}`,
      `$${high.toFixed(2)}`
    );
  }

  const r2Anchor = round2((r2Range[0] + r2Range[1]) / 2);
  resistances.push({
    id: "r2",
    tierNumber: 2,
    type: "resistance",
    tierTitle: r2Title,
    range: r2Range,
    anchorPrice: r2Anchor,
    deltaPct: calcDelta(r2Anchor),
    rationale: r2Rationale,
  });

  // 3. R3: Major Trend Confluence / Macro Ceiling
  // Check if 50 SMA and 200 SMA are both above price
  const hasSmaConfluenceAbove =
    payload.sma50 && payload.sma200 && payload.sma50 > P && payload.sma200 > P;

  let r3Range: [number, number];
  let r3Title: string;
  let r3Rationale: string;

  if (hasSmaConfluenceAbove && payload.sma50 && payload.sma200) {
    const low = round2(Math.min(payload.sma50, payload.sma200));
    const high = round2(Math.max(payload.sma50, payload.sma200));
    r3Range = [low, high];
    r3Title = t.r3Sma;
    r3Rationale = t.r3SmaDesc(`$${low.toFixed(2)}`, `$${high.toFixed(2)}`);
  } else if (payload.high52 && payload.high52 > P) {
    const high = round2(payload.high52);
    const low = round2(payload.high52 * 0.99);
    r3Range = [low, high];
    r3Title = t.r3High;
    r3Rationale = t.r3HighDesc(`$${low.toFixed(2)}`, `$${high.toFixed(2)}`);
  } else {
    const low = round2(P * 1.15);
    const high = round2(P * 1.2);
    r3Range = [low, high];
    r3Title = t.r3High;
    r3Rationale = t.r3HighDesc(`$${low.toFixed(2)}`, `$${high.toFixed(2)}`);
  }

  const r3Anchor = round2((r3Range[0] + r3Range[1]) / 2);
  resistances.push({
    id: "r3",
    tierNumber: 3,
    type: "resistance",
    tierTitle: r3Title,
    range: r3Range,
    anchorPrice: r3Anchor,
    deltaPct: calcDelta(r3Anchor),
    rationale: r3Rationale,
  });

  return { supports, resistances };
}
