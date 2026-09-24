"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SocialCard } from "@/components/social-card/SocialCard";
import type { ReportData } from "@/lib/schemas";
import { computeValuation, computeStressedValuation } from "@/lib/valuation";
import type {
  CardAspectRatio,
  CardTemplate,
  CardTheme,
} from "@/lib/social-card";
import type { Locale } from "@/lib/i18n";

function CardPreviewContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("report") || "NVDA-Q2-2027-analysis";
  const template = (searchParams.get("template") as CardTemplate) || "earnings";
  const aspectRatio =
    (searchParams.get("aspectRatio") as CardAspectRatio) || "landscape";
  const theme = (searchParams.get("theme") as CardTheme) || "cyber";
  const locale = (searchParams.get("locale") as Locale) || "en";

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reports/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ReportData) => setReportData(data))
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) {
    return <div className="p-8 font-mono text-rose-500">Error: {error}</div>;
  }

  if (!reportData) {
    return (
      <div className="p-8 font-mono text-slate-400">
        Loading report {slug}...
      </div>
    );
  }

  const valuation = computeValuation({
    facts: reportData.facts,
    scenarios: reportData.scenarios,
    baseline: reportData.baseline,
    moat: reportData.moat,
    estimates: reportData.estimates,
  });

  if (!reportData.baseline) {
    return (
      <div className="p-8 font-mono text-rose-500">
        Report has no baseline model
      </div>
    );
  }

  const stressResult = computeStressedValuation(
    reportData.baseline,
    reportData.facts.currentPrice,
    {}
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div id="card-capture-target">
        <SocialCard
          facts={reportData.facts}
          valuation={valuation}
          stressResult={stressResult}
          reportData={reportData}
          template={template}
          aspectRatio={aspectRatio}
          theme={theme}
          locale={locale}
          customNote={`${reportData.facts.company} delivers strong ${reportData.facts.quarter} results with audited execution and asymmetric risk/reward.`}
          showWatermark={true}
        />
      </div>
    </div>
  );
}

export default function CardPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-slate-400">
          Loading card preview...
        </div>
      }
    >
      <CardPreviewContent />
    </Suspense>
  );
}
