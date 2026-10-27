import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  resilientFetch,
  parseRetryAfterHeader,
} from "@/lib/services/http-client";

describe("Resilient HTTP Client (resilientFetch)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("parseRetryAfterHeader", () => {
    it("parses integer seconds correctly", () => {
      const delay = parseRetryAfterHeader("3", 10_000, 500);
      expect(delay).toBe(3000);
    });

    it("respects maxDelayMs ceiling on integer seconds", () => {
      const delay = parseRetryAfterHeader("60", 5000, 500);
      expect(delay).toBe(5000);
    });

    it("respects baseDelayMs floor on integer seconds", () => {
      const delay = parseRetryAfterHeader("0", 5000, 500);
      expect(delay).toBe(500);
    });

    it("parses IMF-fixdate correctly", () => {
      const futureDate = new Date(Date.now() + 4000).toUTCString();
      const delay = parseRetryAfterHeader(futureDate, 10_000, 500);
      expect(delay).toBeGreaterThan(2000);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it("returns null for missing or invalid header", () => {
      expect(parseRetryAfterHeader(null, 10_000, 500)).toBeNull();
      expect(parseRetryAfterHeader(undefined, 10_000, 500)).toBeNull();
      expect(parseRetryAfterHeader("invalid-date", 10_000, 500)).toBeNull();
    });
  });

  describe("Retry and Transient Error Handling", () => {
    it("returns successful response immediately without retrying", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
      global.fetch = mockFetch;

      const res = await resilientFetch("https://api.example.com/test");
      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("retries on transient 500/503 errors and succeeds", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(new Response("Service Unavailable", { status: 503 }))
        .mockResolvedValueOnce(new Response("Internal Error", { status: 500 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true }), { status: 200 })
        );
      global.fetch = mockFetch;

      const res = await resilientFetch("https://api.example.com/data", undefined, {
        baseDelayMs: 5,
        maxRetries: 3,
      });

      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("handles HTTP 429 and parses Retry-After header", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response("Too Many Requests", {
            status: 429,
            headers: { "Retry-After": "1" },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ recovered: true }), { status: 200 })
        );
      global.fetch = mockFetch;

      const res = await resilientFetch("https://api.example.com/data", undefined, {
        baseDelayMs: 5,
        maxDelayMs: 50,
      });

      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("returns last response when retries are exhausted", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response("Bad Gateway", { status: 502 })
      );
      global.fetch = mockFetch;

      const res = await resilientFetch("https://api.example.com/data", undefined, {
        baseDelayMs: 5,
        maxRetries: 2,
      });

      expect(res.status).toBe(502);
      expect(mockFetch).toHaveBeenCalledTimes(3); // attempt 0, 1, 2
    });

    it("retries on network TypeError and eventually succeeds", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      global.fetch = mockFetch;

      const res = await resilientFetch("https://api.example.com/data", undefined, {
        baseDelayMs: 5,
        maxRetries: 2,
      });

      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("throws when network errors exhaust all retry attempts", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError("Network down"));
      global.fetch = mockFetch;

      await expect(
        resilientFetch("https://api.example.com/data", undefined, {
          baseDelayMs: 5,
          maxRetries: 2,
        })
      ).rejects.toThrow("Network down");

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
