import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getTranslations } from "@/lib/i18n";
import { MethodologyLanguageToggle } from "./MethodologyLanguageToggle";
import { MethodologyBody } from "./MethodologyBody";

export const metadata: Metadata = {
  title: "Methodology & Calculations — StressAlpha",
  description:
    "Deterministic arithmetic engine, quantitative valuation models, scenario calibration matrix, and income quality guardrails.",
};

function GithubIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function MethodologyPage() {
  const tEn = getTranslations("en");
  const tZh = getTranslations("zh");

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20 selection:text-accent">
      <header className="glass-header sticky top-0 z-40 flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span className="methodology-en-inline">
              {tEn.methodologyPage.backToModel}
            </span>
            <span className="methodology-zh-inline">
              {tZh.methodologyPage.backToModel}
            </span>
          </Link>

          <div className="hidden h-4 w-px bg-border sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg border border-accent/40 bg-accent/20 font-mono text-xs font-black text-accent">
              Sα
            </div>
            <span className="hidden text-sm font-bold tracking-tight text-foreground sm:inline">
              Stress<span className="text-accent">Alpha</span>
            </span>
            <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase text-slate-400">
              <span className="methodology-en-inline">
                {tEn.methodologyPage.engineTag}
              </span>
              <span className="methodology-zh-inline">
                {tZh.methodologyPage.engineTag}
              </span>
            </span>
          </div>
        </div>

        {/* Right controls: Language & GitHub Button */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle Client Component */}
          <MethodologyLanguageToggle />

          {/* GitHub Repository Link Button */}
          <a
            href="https://github.com/phanturne/stress-alpha"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-all hover:border-accent/60 hover:bg-surface-3 hover:text-accent"
            title="View StressAlpha repository on GitHub"
          >
            <GithubIcon className="size-4" />
            <span className="hidden sm:inline">GitHub</span>
            <ExternalLink className="size-3 text-slate-400" />
          </a>
        </div>
      </header>

      {/* Main Container: Statically Prerendered Bilingual SSR Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="methodology-en-block">
          <MethodologyBody locale="en" />
        </div>
        <div className="methodology-zh-block">
          <MethodologyBody locale="zh" />
        </div>
      </main>
    </div>
  );
}
