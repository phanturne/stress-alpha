import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatPercent, formatBillions } from "@/lib/utils";
import { getTranslations } from "@/lib/i18n";

describe("Formatting & Class Utilities", () => {
  describe("cn (tailwind merge + clsx)", () => {
    it("merges standard class strings", () => {
      expect(cn("px-2", "py-1")).toBe("px-2 py-1");
    });

    it("handles conditional classes and falsy values", () => {
      const condition = false;
      expect(cn("base-class", condition && "hidden", null, undefined)).toBe(
        "base-class"
      );
    });

    it("resolves conflicting tailwind classes cleanly", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });
  });

  describe("formatCurrency", () => {
    it("formats currency with default 2 decimals", () => {
      expect(formatCurrency(128.5)).toBe("$128.50");
      expect(formatCurrency(1000)).toBe("$1,000.00");
    });

    it("formats currency with custom decimals", () => {
      expect(formatCurrency(128.5, 0)).toBe("$129");
      expect(formatCurrency(128.5, 1)).toBe("$128.5");
    });
  });

  describe("formatPercent", () => {
    it("formats positive percentages with plus sign by default", () => {
      expect(formatPercent(15.25)).toBe("+15.3%");
    });

    it("formats negative percentages with minus sign", () => {
      expect(formatPercent(-8.4)).toBe("-8.4%");
    });

    it("formats zero without sign", () => {
      expect(formatPercent(0)).toBe("0.0%");
    });

    it("respects includeSign = false", () => {
      expect(formatPercent(15.25, false)).toBe("15.3%");
    });
  });

  describe("formatBillions", () => {
    it("formats amounts in billions with 1 decimal default", () => {
      expect(formatBillions(30.04)).toBe("$30.0B");
      expect(formatBillions(125.46)).toBe("$125.5B");
    });

    it("formats amounts with custom decimals", () => {
      expect(formatBillions(30.04, 2)).toBe("$30.04B");
      expect(formatBillions(30.04, 0)).toBe("$30B");
    });
  });
});

describe("i18n Translation Dictionary", () => {
  it("returns English translations by default", () => {
    const t = getTranslations("en");
    expect(t.header.cockpit).toBe("Cockpit");
    expect(t.header.memo).toBe("Memo");
  });

  it("returns Chinese translations when requested", () => {
    const t = getTranslations("zh");
    expect(t.header.cockpit).toBe("驾驶舱");
    expect(t.header.memo).toBe("备忘录");
  });

  it("falls back to English for unknown locales", () => {
    const t = getTranslations("fr" as any);
    expect(t.header.cockpit).toBe("Cockpit");
  });
});
