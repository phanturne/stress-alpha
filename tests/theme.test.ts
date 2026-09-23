import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { THEME_STORAGE_KEY } from "@/context/ThemeContext";
import { getTranslations } from "@/lib/i18n";

describe("Global Theme Architecture (Cyber Obsidian & Institutional Light)", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key]);
    global.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      },
      length: 0,
      key: () => null,
    } as unknown as Storage;
  });

  afterEach(() => {
    Object.keys(store).forEach((key) => delete store[key]);
  });

  it("exports canonical theme storage key", () => {
    expect(THEME_STORAGE_KEY).toBe("stress_alpha_theme");
  });

  it("provides comprehensive localized theme translations for EN and ZH", () => {
    const en = getTranslations("en").header;
    const zh = getTranslations("zh").header;

    expect(en.theme).toBe("Visual Theme");
    expect(en.themeCyber).toBe("Cyber Obsidian");
    expect(en.themeLight).toBe("Institutional Light");
    expect(en.themeCyberShort).toBe("Cyber");
    expect(en.themeLightShort).toBe("Light");
    expect(en.toggleTheme).toContain("Cyber Obsidian");

    expect(zh.theme).toBe("视觉主题");
    expect(zh.themeCyber).toBe("黑曜赛博");
    expect(zh.themeLight).toBe("浅色明亮");
    expect(zh.themeCyberShort).toBe("黑曜");
    expect(zh.themeLightShort).toBe("浅色");
    expect(zh.toggleTheme).toContain("黑曜赛博");
  });

  it("supports persisting and reading theme in localStorage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    localStorage.setItem(THEME_STORAGE_KEY, "cyber");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("cyber");
  });
});
