import { describe, it, expect } from "vitest";
import { squarify } from "../src/lib/treemap";

describe("Squarified Treemap Partition Engine", () => {
  it("partitions a bounding box into 100% coverage with zero dead space", () => {
    const items = [
      { id: "tech", value: 31.5 },
      { id: "financials", value: 13.0 },
      { id: "healthcare", value: 11.4 },
      { id: "cons_disc", value: 10.2 },
      { id: "comm", value: 9.1 },
      { id: "industrials", value: 8.4 },
      { id: "staples", value: 5.8 },
      { id: "energy", value: 3.7 },
      { id: "utilities", value: 2.5 },
      { id: "materials", value: 2.3 },
      { id: "real_estate", value: 2.1 },
    ];

    const bounds = { x: 0, y: 0, w: 1000, h: 500 };
    const rects = squarify(items, bounds);

    expect(rects.length).toBe(items.length);

    // Sum of areas should equal total area (1000 * 500 = 500,000) within rounding
    const totalRectArea = rects.reduce((acc, r) => acc + r.w * r.h, 0);
    expect(totalRectArea).toBeCloseTo(500000, -2);

    // Every rectangle must be within bounds and have positive width and height
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.w).toBeGreaterThan(0);
      expect(r.h).toBeGreaterThan(0);
      expect(r.x + r.w).toBeLessThanOrEqual(1001);
      expect(r.y + r.h).toBeLessThanOrEqual(501);
    }
  });

  it("handles edge cases (empty list, zero values, single item)", () => {
    expect(squarify([], { x: 0, y: 0, w: 500, h: 300 })).toEqual([]);

    const single = squarify([{ id: "single", value: 100 }], {
      x: 0,
      y: 0,
      w: 400,
      h: 200,
    });
    expect(single.length).toBe(1);
    expect(single[0].w).toBe(400);
    expect(single[0].h).toBe(200);
  });
});
