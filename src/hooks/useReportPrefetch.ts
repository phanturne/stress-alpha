"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  fetchReportData,
  fetchNews,
  fetchRevisions,
} from "@/hooks/useReportData";

/**
 * Pre-warms TanStack Query cache and Next.js page route chunks on hover or focus.
 * Ensures zero-latency navigation when user clicks from Screener, Watchlist, or Report dropdowns.
 */
export function useReportPrefetch() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const prefetchReport = useCallback(
    (slug: string) => {
      if (!slug || typeof window === "undefined") return;
      const ticker = slug.split("-")[0]?.toUpperCase();

      // 1. Prefetch Next.js page route component bundle
      try {
        router.prefetch(`/?report=${encodeURIComponent(slug)}`);
      } catch {
        // Ignore prefetch errors in unsupported environments
      }

      // 2. Prefetch active report data
      queryClient.prefetchQuery({
        queryKey: ["report", slug],
        queryFn: () => fetchReportData(slug),
        staleTime: 1000 * 60 * 5,
      });

      // 3. Prefetch ticker news & revisions in parallel
      if (ticker) {
        queryClient.prefetchQuery({
          queryKey: ["news", ticker],
          queryFn: () => fetchNews(ticker),
          staleTime: 1000 * 60 * 5,
        });
        queryClient.prefetchQuery({
          queryKey: ["revisions", ticker],
          queryFn: () => fetchRevisions(ticker),
          staleTime: 1000 * 60 * 5,
        });
      }
    },
    [queryClient, router]
  );

  return { prefetchReport };
}
