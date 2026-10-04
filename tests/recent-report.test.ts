import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  LAST_REPORT_STORAGE_KEY,
  LAST_REPORT_EVENT,
  getStoredLastReport,
  setStoredLastReport,
  clearStoredLastReport,
} from "@/lib/recent-report";
import { getTranslations } from "@/lib/i18n";

describe("Recent Report Persistence & Navigation Tracking", () => {
  const store: Record<string, string> = {};
  const originalWindow = global.window;

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

    const eventListeners: Record<string, EventListener[]> = {};

    global.window = {
      addEventListener: vi.fn((event: string, cb: EventListener) => {
        if (!eventListeners[event]) eventListeners[event] = [];
        eventListeners[event].push(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: EventListener) => {
        if (eventListeners[event]) {
          eventListeners[event] = eventListeners[event].filter((l) => l !== cb);
        }
      }),
      dispatchEvent: vi.fn((event: Event) => {
        const listeners = eventListeners[event.type] || [];
        for (const l of listeners) {
          l(event);
        }
        return true;
      }),
    } as unknown as Window & typeof globalThis;

    if (typeof global.CustomEvent === "undefined") {
      class CustomEventMock<T = unknown> extends Event {
        detail: T;
        constructor(type: string, params?: { detail?: T }) {
          super(type);
          this.detail = params?.detail as T;
        }
      }
      global.CustomEvent = CustomEventMock as unknown as typeof CustomEvent;
    }
  });

  afterEach(() => {
    global.window = originalWindow;
    Object.keys(store).forEach((key) => delete store[key]);
    vi.restoreAllMocks();
  });

  it("exports canonical storage key and event name", () => {
    expect(LAST_REPORT_STORAGE_KEY).toBe("stress_alpha_last_report");
    expect(LAST_REPORT_EVENT).toBe("stress_alpha_last_report_updated");
  });

  it("returns null when no report has been visited", () => {
    expect(getStoredLastReport()).toBeNull();
  });

  it("persists and retrieves last visited report as structured JSON", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    setStoredLastReport("NVDA-2025Q4", "NVDA");

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const result = getStoredLastReport();
    expect(result).not.toBeNull();
    expect(result?.slug).toBe("NVDA-2025Q4");
    expect(result?.ticker).toBe("NVDA");
  });

  it("gracefully derives uppercase ticker if ticker not provided or raw string stored", () => {
    setStoredLastReport("aapl-2024q4", "");

    const result = getStoredLastReport();
    expect(result?.slug).toBe("aapl-2024q4");
    expect(result?.ticker).toBe("AAPL");
  });

  it("handles legacy plain string in localStorage", () => {
    store[LAST_REPORT_STORAGE_KEY] = "MSFT-2024Q3";

    const result = getStoredLastReport();
    expect(result?.slug).toBe("MSFT-2024Q3");
    expect(result?.ticker).toBe("MSFT");
  });

  it("clears stored report cleanly", () => {
    setStoredLastReport("NVDA-2025Q4", "NVDA");
    expect(getStoredLastReport()).not.toBeNull();

    clearStoredLastReport();
    expect(getStoredLastReport()).toBeNull();
  });

  it("handles invalid JSON or storage exceptions gracefully without crashing", () => {
    store[LAST_REPORT_STORAGE_KEY] = "{invalid-json";
    expect(getStoredLastReport()).toBeNull();

    // Simulating localStorage throw
    global.localStorage.getItem = () => {
      throw new Error("QuotaExceeded");
    };
    expect(getStoredLastReport()).toBeNull();
  });

  it("provides pre-localized model navigation tooltips and shortcuts in EN and ZH", () => {
    const en = getTranslations("en");
    const zh = getTranslations("zh");

    // Header tooltip
    expect(en.header.modelNavTooltip("NVDA")).toBe("Return to NVDA Model (M)");
    expect(en.header.modelNavTooltip()).toBe("Valuation Model (M)");
    expect(zh.header.modelNavTooltip("NVDA")).toBe("返回 NVDA 估值模型 (M)");
    expect(zh.header.modelNavTooltip()).toBe("估值模型 (M)");

    // Shortcuts modal label
    expect(en.shortcuts.returnToModel).toBe("Return to Model (M)");
    expect(zh.shortcuts.returnToModel).toBe("返回估值模型 (M)");
  });
});
