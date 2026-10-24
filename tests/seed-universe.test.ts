import { describe, it, expect } from "vitest";
import {
  normalizeTicker,
  combineConstituents,
  type UniverseConstituent,
} from "../scripts/seed_universe";

describe("Universe Seeder & Index Ingestion Engine", () => {
  it("normalizes symbols with dots to hyphens", () => {
    expect(normalizeTicker("brk.b")).toBe("BRK-B");
    expect(normalizeTicker("BF.B")).toBe("BF-B");
    expect(normalizeTicker("aapl")).toBe("AAPL");
    expect(normalizeTicker("  msft  ")).toBe("MSFT");
  });

  it("combines and deduplicates constituents across S&P 500 and NASDAQ-100", () => {
    const sp500: UniverseConstituent[] = [
      {
        ticker: "AAPL",
        company: "Apple Inc.",
        sector: "Technology",
        indices: ["S&P 500"],
      },
      {
        ticker: "JPM",
        company: "JPMorgan Chase",
        sector: "Financials",
        indices: ["S&P 500"],
      },
    ];

    const nasdaq100: UniverseConstituent[] = [
      {
        ticker: "AAPL",
        company: "Apple Inc.",
        sector: "Technology",
        indices: ["NASDAQ-100"],
      },
      {
        ticker: "PDD",
        company: "PDD Holdings",
        sector: "Consumer Discretionary",
        indices: ["NASDAQ-100"],
      },
    ];

    const combined = combineConstituents(sp500, nasdaq100);

    expect(combined.size).toBe(3);

    const aapl = combined.get("AAPL")!;
    expect(aapl.indices).toEqual(["S&P 500", "NASDAQ-100"]);

    const jpm = combined.get("JPM")!;
    expect(jpm.indices).toEqual(["S&P 500"]);

    const pdd = combined.get("PDD")!;
    expect(pdd.indices).toEqual(["NASDAQ-100"]);
  });
});
