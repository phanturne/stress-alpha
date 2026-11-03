"use client";

import { useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  fetchReportData,
  fetchNews,
  fetchRevisions,
} from "@/hooks/useReportData";

/**
 * Pre-warms TanStack Query cache and Next.js page route chunks on hover or focus.
 * Includes a hover-intent debounce (200ms) to prevent network and database egress
 * saturation when scrolling or skimming across rows in the screener table.
 */
export function useReportPrefetch() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const prefetchReport = useCallback(
    (slug: string, immediate = false) => {
      if (!slug || typeof window === "undefined") return;

      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }

      const execute = () => {
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

        // 3. Prefetch ticker news & revisions only on explicit/immediate intent
        if (immediate && ticker) {
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
      };

      if (immediate) {
        execute();
      } else {
        hoverTimerRef.current = setTimeout(execute, 200);
      }
    },
    [queryClient, router]
  );

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  return { prefetchReport };
}
