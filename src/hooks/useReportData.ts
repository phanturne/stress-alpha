"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  ReportData,
  MarketEvent,
  UpstreamDependency,
  ValuationRevision,
} from "@/lib/schemas";
import type { ReportSummary } from "@/app/api/reports/route";
import { setStoredLastReport } from "@/lib/recent-report";

export async function fetchReportsList(): Promise<ReportSummary[]> {
  const res = await fetch("/api/reports");
  if (!res.ok) {
    throw new Error(`Failed to fetch reports: ${res.statusText}`);
  }
  const data = await res.json();
  return data.reports || [];
}

export async function fetchReportData(slug: string): Promise<ReportData> {
  const res = await fetch(`/api/reports/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch report: ${slug}`);
  }
  const data: ReportData = await res.json();
  return data;
}

export async function fetchNews(ticker: string): Promise<{
  events: MarketEvent[];
  upstreamDependencies: UpstreamDependency[];
}> {
  const res = await fetch(`/api/news?ticker=${encodeURIComponent(ticker)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch news for ${ticker}`);
  }
  const data = await res.json();
  return {
    events: data.events || [],
    upstreamDependencies: data.upstreamDependencies || [],
  };
}

export async function fetchRevisions(
  ticker: string
): Promise<{ revisions: ValuationRevision[] }> {
  const res = await fetch(
    `/api/revisions?ticker=${encodeURIComponent(ticker)}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch revisions for ${ticker}`);
  }
  const data = await res.json();
  return {
    revisions: data.revisions || [],
  };
}

export interface UseReportDataOptions {
  currentSlug: string | null;
  onReportLoaded?: (report: ReportData) => void;
  onError?: (err: Error) => void;
}

export function useReportData({
  currentSlug,
  onReportLoaded,
  onError,
}: UseReportDataOptions) {
  // Query 1: Universal reports list
  const reportsQuery = useQuery({
    queryKey: ["reports"],
    queryFn: fetchReportsList,
    staleTime: 1000 * 60 * 5,
  });

  // Query 2: Active report by slug
  const reportQuery = useQuery({
    queryKey: ["report", currentSlug],
    queryFn: () => (currentSlug ? fetchReportData(currentSlug) : null),
    enabled: Boolean(currentSlug),
    staleTime: 1000 * 60 * 5,
  });

  // Local mutable report override for interactive scenario & catalyst audits
  const [localReportOverride, setLocalReportOverride] = useState<{
    slug: string;
    data: ReportData;
  } | null>(null);

  const reportData =
    localReportOverride && localReportOverride.slug === currentSlug
      ? localReportOverride.data
      : (reportQuery.data ?? null);

  const setReportData = useCallback(
    (data: ReportData | null) => {
      if (data && currentSlug) {
        setLocalReportOverride({ slug: currentSlug, data });
      } else {
        setLocalReportOverride(null);
      }
    },
    [currentSlug]
  );

  // Synchronize stored recent report and notify caller
  useEffect(() => {
    if (reportQuery.data && currentSlug) {
      if (reportQuery.data.facts?.ticker) {
        setStoredLastReport(currentSlug, reportQuery.data.facts.ticker);
      }
      if (onReportLoaded) {
        onReportLoaded(reportQuery.data);
      }
    }
  }, [reportQuery.data, currentSlug, onReportLoaded]);

  // Handle report fetch errors
  useEffect(() => {
    if (reportQuery.error && onError) {
      onError(reportQuery.error as Error);
    }
  }, [reportQuery.error, onError]);

  const activeTicker =
    reportData?.facts?.ticker ||
    reportQuery.data?.facts?.ticker ||
    (currentSlug ? currentSlug.split("-")[0]?.toUpperCase() : undefined);

  // Query 3: Market news & upstream dependencies for active ticker
  const newsQuery = useQuery({
    queryKey: ["news", activeTicker],
    queryFn: () =>
      activeTicker
        ? fetchNews(activeTicker)
        : Promise.resolve({ events: [], upstreamDependencies: [] }),
    enabled: Boolean(activeTicker),
    staleTime: 1000 * 60 * 5,
  });

  // Query 4: Valuation revisions history for active ticker
  const revisionsQuery = useQuery({
    queryKey: ["revisions", activeTicker],
    queryFn: () =>
      activeTicker
        ? fetchRevisions(activeTicker)
        : Promise.resolve({ revisions: [] }),
    enabled: Boolean(activeTicker),
    staleTime: 1000 * 60 * 5,
  });

  const isReportLoading = Boolean(currentSlug) && reportQuery.isLoading;

  return {
    reports: reportsQuery.data ?? [],
    isReportsLoading: reportsQuery.isLoading,
    reportData,
    setReportData,
    rawReportData: reportQuery.data,
    isReportLoading,
    marketEvents: newsQuery.data?.events ?? [],
    upstreamDependencies: newsQuery.data?.upstreamDependencies ?? [],
    valuationRevisions: revisionsQuery.data?.revisions ?? [],
    isNewsLoading:
      (newsQuery.isLoading || revisionsQuery.isLoading) &&
      Boolean(activeTicker),
    refetchReports: reportsQuery.refetch,
    refetchReport: reportQuery.refetch,
  };
}
