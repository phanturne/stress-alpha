import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/revalidate/route";
import { getReportRepository } from "@/lib/repository";
import * as nextCache from "next/cache";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

describe("POST/GET /api/revalidate (On-Demand Cache Invalidation)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects unauthorized requests with 401 when REVALIDATION_SECRET is set and token is missing", async () => {
    process.env.REVALIDATION_SECRET = "test-secret-123";

    const request = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
    expect(nextCache.revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects unauthorized requests with 401 when token is incorrect", async () => {
    process.env.REVALIDATION_SECRET = "test-secret-123";

    const request = new NextRequest(
      "http://localhost:3000/api/revalidate?secret=wrong-secret",
      {
        method: "POST",
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("accepts valid token via query parameter and purges caches", async () => {
    process.env.REVALIDATION_SECRET = "test-secret-123";
    const repo = getReportRepository();
    const clearCacheSpy = vi.spyOn(repo, "clearCache");

    const request = new NextRequest(
      "http://localhost:3000/api/revalidate?secret=test-secret-123",
      {
        method: "POST",
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.revalidated).toBe(true);
    expect(body.tag).toBe("reports");
    expect(nextCache.revalidateTag).toHaveBeenCalledWith("reports", "max");
    expect(nextCache.revalidatePath).toHaveBeenCalledWith("/api/reports");
    expect(clearCacheSpy).toHaveBeenCalled();
  });

  it("accepts valid token via Bearer Authorization header and purges slug path", async () => {
    process.env.CRON_SECRET = "cron-secret-456";
    const repo = getReportRepository();
    const clearCacheSpy = vi.spyOn(repo, "clearCache");

    const request = new NextRequest(
      "http://localhost:3000/api/revalidate?slug=NVDA-Q4-2025-earnings",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer cron-secret-456",
        },
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.revalidated).toBe(true);
    expect(body.slug).toBe("NVDA-Q4-2025-earnings");
    expect(nextCache.revalidatePath).toHaveBeenCalledWith(
      "/api/reports/NVDA-Q4-2025-earnings"
    );
    expect(clearCacheSpy).toHaveBeenCalled();
  });

  it("supports GET request with secret parameter", async () => {
    process.env.REVALIDATION_SECRET = "test-secret-123";

    const request = new NextRequest(
      "http://localhost:3000/api/revalidate?secret=test-secret-123",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.revalidated).toBe(true);
  });
});
