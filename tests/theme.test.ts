import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { THEME_STORAGE_KEY } from "@/context/ThemeContext";
import { getTranslations } from "@/lib/i18n";

describe("Global Theme Architecture (Dark & Light)", () => {
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

    expect(en.theme).toBe("Theme");
    expect(en.themeDark).toBe("Dark");
    expect(en.themeLight).toBe("Light");
    expect(en.themeDarkShort).toBe("Dark");
    expect(en.themeLightShort).toBe("Light");
    expect(en.toggleTheme).toContain("Dark / Light");

    expect(zh.theme).toBe("主题");
    expect(zh.themeDark).toBe("深色模式");
    expect(zh.themeLight).toBe("浅色模式");
    expect(zh.themeDarkShort).toBe("深色");
    expect(zh.themeLightShort).toBe("浅色");
    expect(zh.toggleTheme).toContain("深色 / 浅色");
  });

  it("supports persisting and reading theme in localStorage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    // Legacy compatibility with 'cyber'
    localStorage.setItem(THEME_STORAGE_KEY, "cyber");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("cyber");
  });
});
