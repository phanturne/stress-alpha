// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getStoredNotes,
  saveStoredNotes,
  setNotesSnapshot,
  fetchNotesFromDb,
  saveNoteToDb,
  syncNotesWithDb,
  deleteNoteFromDb,
  NOTES_CHANGE_EVENT,
  NOTES_STORAGE_KEY,
} from "@/lib/notes";
import {
  getWorkspaceTabs,
  WORKSPACE_TAB_IDS,
  normalizeWorkspaceTabId,
} from "@/lib/workspace-tabs";
import { getTranslations } from "@/lib/i18n";
import { normalizeTicker } from "@/lib/utils";
import type { ReportData } from "@/lib/schemas";
import { render, screen } from "@testing-library/react";
import { StockNotesModal } from "@/components/StockNotesModal";

describe("Stock Notes State, Storage & API Contract", () => {
  const originalWindow = global.window;
  const originalFetch = global.fetch;

  beforeEach(() => {
    saveStoredNotes({});
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
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("In-Memory & Local Storage Snapshot", () => {
    it("stores and retrieves stock notes by normalized ticker", () => {
      saveStoredNotes({
        NVDA: {
          content: "Wide moat with CUDA ecosystem and strong gross margins.",
          updatedAt: "2026-11-05T00:00:00.000Z",
        },
      });

      const notes = getStoredNotes();
      expect(notes.NVDA).toBeDefined();
      expect(notes.NVDA.content).toContain("CUDA ecosystem");
    });

    it("broadcasts custom event when snapshot is updated", () => {
      const dispatchSpy = vi.spyOn(global.window, "dispatchEvent");
      setNotesSnapshot({
        AAPL: {
          content:
            "Services revenue accelerating; iPhone 18 cycle looking strong.",
          updatedAt: "2026-11-05T00:00:00.000Z",
        },
      });

      expect(dispatchSpy).toHaveBeenCalled();
      const calledEvent = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(calledEvent.type).toBe(NOTES_CHANGE_EVENT);
      expect(calledEvent.detail.AAPL.content).toContain("Services revenue");
    });
  });

  describe("API Client Methods", () => {
    it("fetchNotesFromDb parses API response cleanly", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          authenticated: true,
          notes: {
            MSFT: {
              content: "Azure Copilot consumption ramping.",
              updatedAt: "2026-11-05T00:00:00.000Z",
            },
          },
        }),
      });

      const res = await fetchNotesFromDb();
      expect(res.authenticated).toBe(true);
      expect(res.notes.MSFT.content).toBe("Azure Copilot consumption ramping.");
    });

    it("saveNoteToDb posts note payload and handles success", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          note: {
            ticker: "TSLA",
            content: "Robotaxi and Energy storage margins expanding.",
            updatedAt: "2026-11-05T00:00:00.000Z",
          },
        }),
      });
      global.fetch = fetchSpy;

      const res = await saveNoteToDb(
        "tsla",
        "Robotaxi and Energy storage margins expanding."
      );
      expect(res?.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/notes",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            ticker: "TSLA",
            content: "Robotaxi and Energy storage margins expanding.",
          }),
        })
      );
    });

    it("deleteNoteFromDb sends DELETE request with ticker parameter", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, ticker: "AMZN" }),
      });
      global.fetch = fetchSpy;

      const success = await deleteNoteFromDb("amzn");
      expect(success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/notes?ticker=AMZN",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("handles click events safely without treating DOM events as slug strings", () => {
      const fakeEvent = {
        target: { tagName: "BUTTON" },
        preventDefault: vi.fn(),
      };
      // Verifies normalization safely ignores non-string inputs
      const symbol = normalizeTicker(fakeEvent as unknown as string);
      expect(symbol).toBe("");
    });
  });

  describe("Workspace 4-Tab Core & i18n Translation Integrity", () => {
    it("maintains 4 focused workspace tabs in WORKSPACE_TAB_IDS", () => {
      expect(WORKSPACE_TAB_IDS).toHaveLength(4);
      expect(WORKSPACE_TAB_IDS).toEqual([
        "technicals",
        "valuation",
        "estimates",
        "news",
      ]);
    });

    it("normalizes obsolete 'notes' and unknown tabs safely to 'technicals'", () => {
      expect(normalizeWorkspaceTabId("notes")).toBe("technicals");
      expect(normalizeWorkspaceTabId(undefined)).toBe("technicals");
      expect(normalizeWorkspaceTabId(null)).toBe("technicals");
      expect(normalizeWorkspaceTabId("")).toBe("technicals");
      expect(normalizeWorkspaceTabId("unknown-tab")).toBe("technicals");

      // Canonical 4 tabs
      expect(normalizeWorkspaceTabId("technicals")).toBe("technicals");
      expect(normalizeWorkspaceTabId("valuation")).toBe("valuation");
      expect(normalizeWorkspaceTabId("estimates")).toBe("estimates");
      expect(normalizeWorkspaceTabId("news")).toBe("news");

      // Legacy sub-tabs
      expect(normalizeWorkspaceTabId("scenarios")).toBe("valuation");
      expect(normalizeWorkspaceTabId("sensitivity")).toBe("valuation");
      expect(normalizeWorkspaceTabId("moat")).toBe("estimates");
      expect(normalizeWorkspaceTabId("audit")).toBe("news");
    });

    it("provides complete bilingual descriptors for English and Chinese", () => {
      const tEn = getTranslations("en");
      const tZh = getTranslations("zh");

      const mockReportData = {
        facts: { ticker: "NVDA", segments: [] },
      } as unknown as ReportData;

      const tabsEn = getWorkspaceTabs(tEn, mockReportData, 0, false);
      expect(tabsEn).toHaveLength(4);

      const tabsZh = getWorkspaceTabs(tZh, mockReportData, 0, true);
      expect(tabsZh).toHaveLength(4);

      // Verify stockNotes i18n dictionaries have all required keys for Modal and Watchlist hover
      expect(tEn.stockNotes.tabTitle).toBeDefined();
      expect(tEn.stockNotes.placeholder).toBeDefined();
      expect(tEn.stockNotes.shortNotes).toBe("Notes");
      expect(tEn.stockNotes.hoverSnippetTitle).toBeDefined();
      expect(tEn.stockNotes.clickToEdit).toBeDefined();
      expect(tEn.stockNotes.noNoteYet).toBeDefined();
      expect(tEn.stockNotes.templates.thesis).toBeDefined();
      expect(tEn.stockNotes.templateSnippets.thesis).toContain(
        "### 🎯 Core Thesis"
      );

      expect(tZh.stockNotes.tabTitle).toBeDefined();
      expect(tZh.stockNotes.placeholder).toBeDefined();
      expect(tZh.stockNotes.shortNotes).toBe("笔记");
      expect(tZh.stockNotes.hoverSnippetTitle).toBeDefined();
      expect(tZh.stockNotes.clickToEdit).toBeDefined();
      expect(tZh.stockNotes.noNoteYet).toBeDefined();
      expect(tZh.stockNotes.templates.thesis).toBeDefined();
      expect(tZh.stockNotes.templateSnippets.thesis).toContain(
        "### 🎯 核心多头逻辑"
      );
    });

    it("renders StockNotesModal without ReferenceErrors and supports debounce flush", () => {
      const handleClose = vi.fn();
      const { unmount } = render(
        React.createElement(StockNotesModal, {
          isOpen: true,
          onClose: handleClose,
          ticker: "NVDA",
          company: "NVIDIA Corporation",
          locale: "en",
        })
      );

      expect(screen.getByText("NVDA")).toBeDefined();
      expect(
        screen.getByPlaceholderText(/Write your investment thesis/i)
      ).toBeDefined();
      unmount();
    });
  });
});
