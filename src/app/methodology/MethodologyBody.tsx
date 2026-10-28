import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Calculator,
  Layers,
  Scale,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import { getTranslations, type Locale } from "@/lib/i18n";

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

export function MethodologyBody({ locale }: { locale: Locale }) {
  const t = getTranslations(locale);
  const tm = t.methodologyPage;

  return (
    <>
      {/* Hero Title Section */}
      <div className="border-b border-border/60 pb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          <Calculator className="size-3.5" />
          <span>{tm.badge}</span>
        </div>

        <h1 className="mt-4 text-balance text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          {tm.title}
        </h1>

        <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
          {tm.subtitle}
        </p>

        {/* Quick Anchor Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          <a
            href="#revenue-shock"
            className="rounded-lg border border-border bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            {tm.nav.demand}
          </a>
          <a
            href="#operating-leverage"
            className="rounded-lg border border-border bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            {tm.nav.operatingLeverage}
          </a>
          <a
            href="#income-guardrail"
            className="rounded-lg border border-border bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            {tm.nav.earningsQuality}
          </a>
          <a
            href="#valuation-regimes"
            className="rounded-lg border border-border bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            {tm.nav.scenarioTargets}
          </a>
          <a
            href="#base-vs-wfv"
            className="rounded-lg border border-border bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            {tm.nav.baseVsWfv}
          </a>
          <a
            href="#economic-moat"
            className="rounded-lg border border-border bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            {tm.nav.moat}
          </a>
          <a
            href="#qpce-calibration"
            className="rounded-lg border border-border bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            {tm.nav.calibration}
          </a>
        </div>
      </div>

      {/* Content Body Sections */}
      <div className="mt-10 space-y-12">
        {/* SECTION 1: Upstream Demand Shocks & Revenue Flow-Through */}
        <section id="revenue-shock" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <SlidersHorizontal className="size-5" />
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              {tm.section1.title}
            </h2>
          </div>

          <p className="max-w-prose text-pretty text-xs leading-relaxed text-slate-300 sm:text-sm">
            {tm.section1.desc}
          </p>

          {/* Formula Card */}
          <div className="glass-panel shadow-xs overflow-hidden rounded-xl border border-border bg-surface-1/90 p-4 font-mono text-xs text-slate-200">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">
              {tm.section1.formulaLabel}
            </div>
            <div className="font-semibold text-foreground sm:text-sm">
              {tm.section1.formula}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-slate-400 sm:grid-cols-3">
              <div>
                <span className="text-accent">Shock_i:</span>{" "}
                {tm.section1.shockLabel}
              </div>
              <div>
                <span className="text-accent">Exposure_i:</span>{" "}
                {tm.section1.exposureLabel}
              </div>
              <div>
                <span className="text-accent">Elasticity_i:</span>{" "}
                {tm.section1.elasticityLabel}
              </div>
            </div>
          </div>

          {/* Worked Example */}
          <div className="rounded-xl border border-border bg-surface-0/60 p-4 text-xs text-slate-300">
            <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-foreground">
              <Calculator className="size-3.5 text-accent" />
              <span>{tm.section1.exampleTitle}</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              {tm.section1.exampleExposure}
              <br />
              <strong>{tm.section1.exampleNetShock}</strong>
              <br />
              <strong>{tm.section1.exampleStressedRev}</strong>
            </p>
          </div>
        </section>

        {/* SECTION 2: Operating Leverage & Cost Structure */}
        <section id="operating-leverage" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <Layers className="size-5" />
            <h2 className="text-lg font-bold text-white sm:text-xl">
              {tm.section2.title}
            </h2>
          </div>

          <p className="max-w-prose text-pretty text-xs leading-relaxed text-slate-300 sm:text-sm">
            {tm.section2.desc}
          </p>

          {/* Formula Card */}
          <div className="glass-panel shadow-xs space-y-2 overflow-hidden rounded-xl border border-border bg-surface-1/90 p-4 font-mono text-xs text-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-accent">
              {tm.section2.formulaLabel}
            </div>
            <div className="text-foreground">
              Stressed_Gross_Margin = Base_Gross_Margin + (ΔGross_Margin_Bps /
              10,000)
            </div>
            <div className="text-foreground">
              Stressed_Gross_Profit = Stressed_Revenue × Stressed_Gross_Margin
            </div>
            <div className="text-foreground">
              Stressed_Fixed_OpEx = Base_Fixed_OpEx × (1 + ΔFixed_OpEx_Pct /
              100)
            </div>
            <div className="text-foreground">
              Stressed_Operating_Income = Stressed_Gross_Profit -
              Stressed_Fixed_OpEx
            </div>
            <div className="text-foreground">
              Free_Cash_Flow = Stressed_Operating_Income × (1 - Tax_Rate) +
              D&amp;A - CapEx
            </div>
            <div className="pt-1 font-semibold text-emerald-400 sm:text-sm">
              FCF_Conversion_% = (Free_Cash_Flow / Stressed_Net_Income) × 100
              &nbsp;|&nbsp; FCF_Yield_% = (FCF_Per_Share / Current_Price) × 100
            </div>
          </div>
        </section>

        {/* SECTION 3: Income Quality Guardrail & Clean Operating EPS */}
        <section id="income-guardrail" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <ShieldCheck className="size-5" />
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              {tm.section3.title}
            </h2>
          </div>

          <p className="max-w-prose text-pretty text-xs leading-relaxed text-slate-300 sm:text-sm">
            {tm.section3.desc}
          </p>

          {/* The Amazon Case Study Alert */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="size-4" />
              <span>{tm.section3.caseStudyTitle}</span>
            </div>
            <p className="mt-2 max-w-[58ch] text-pretty leading-relaxed text-slate-300">
              {tm.section3.caseStudyText}
            </p>
          </div>

          {/* Formula Card */}
          <div className="glass-panel shadow-xs overflow-hidden rounded-xl border border-border bg-surface-1/90 p-4 font-mono text-xs text-slate-200">
            <div className="font-semibold text-foreground sm:text-sm">
              Clean_Operating_EPS = [ Reported_Net_Income - NonOperating_Gains ×
              (1 - Tax_Rate) ] / Diluted_Shares
            </div>
          </div>
        </section>

        {/* SECTION 4: Valuation Regimes & Outcome Bands */}
        <section id="valuation-regimes" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <Scale className="size-5" />
            <h2 className="text-lg font-bold text-white sm:text-xl">
              {tm.section4.title}
            </h2>
          </div>

          <p className="max-w-prose text-pretty text-xs leading-relaxed text-slate-300 sm:text-sm">
            {tm.section4.desc}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="glass-panel shadow-xs rounded-xl border border-border p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span>{tm.section4.bullTitle}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {tm.section4.bullDesc}
              </p>
              <div className="mt-2 font-mono text-xs font-semibold text-foreground">
                Target = Stressed_EPS × Multiple_Bull
              </div>
            </div>

            <div className="glass-panel shadow-xs rounded-xl border border-border p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                <span className="size-2 rounded-full bg-sky-400" />
                <span>{tm.section4.baseTitle}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {tm.section4.baseDesc}
              </p>
              <div className="mt-2 font-mono text-xs font-semibold text-foreground">
                Target = Stressed_EPS × Multiple_Base
              </div>
            </div>

            <div className="glass-panel shadow-xs rounded-xl border border-border p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <span className="size-2 rounded-full bg-rose-400" />
                <span>{tm.section4.panicTitle}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {tm.section4.panicDesc}
              </p>
              <div className="mt-2 font-mono text-xs font-semibold text-foreground">
                Target = Stressed_EPS × Multiple_Panic
              </div>
            </div>
          </div>

          {/* Asymmetry Ratio Card */}
          <div className="glass-panel shadow-xs rounded-xl border border-border p-4">
            <div className="text-xs font-bold text-foreground sm:text-sm">
              {tm.section4.asymmetryTitle}
            </div>
            <p className="mt-1 max-w-prose text-pretty text-xs text-slate-400">
              {tm.section4.asymmetryDesc}
            </p>
            <div className="mt-3 font-mono text-xs font-bold text-accent">
              Asymmetry_Skew = | Upside_to_Bull_% | / | Downside_to_Panic_% |
            </div>
          </div>
        </section>

        {/* SECTION 5: Base Fair Value vs Weighted Fair Value */}
        <section id="base-vs-wfv" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <TrendingUp className="size-5" />
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              {tm.section5.title}
            </h2>
          </div>

          <p className="max-w-prose text-pretty text-xs leading-relaxed text-slate-300 sm:text-sm">
            {tm.section5.desc}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="glass-panel shadow-xs rounded-xl border border-border p-4">
              <div className="flex items-center justify-between text-xs font-bold text-foreground sm:text-sm">
                <span>{tm.section5.baseTitle}</span>
                <span className="font-mono text-xs text-slate-400">
                  {tm.section5.baseBadge}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {tm.section5.baseDesc}
              </p>
              <div className="mt-3 rounded bg-surface-0/60 p-2 font-mono text-xs font-semibold text-sky-400">
                Base_FV = Forward_EPS_Base × Multiple_Base
              </div>
            </div>

            <div className="glass-panel shadow-xs rounded-xl border border-border p-4">
              <div className="flex items-center justify-between text-xs font-bold text-foreground sm:text-sm">
                <span>{tm.section5.wfvTitle}</span>
                <span className="font-mono text-xs text-accent">
                  {tm.section5.wfvBadge}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {tm.section5.wfvDesc}
              </p>
              <div className="mt-3 rounded bg-surface-0/60 p-2 font-mono text-xs font-semibold text-emerald-400">
                WFV = ∑ [ Probability_j × (Forward_EPS_j × Multiple_j) ]
              </div>
            </div>
          </div>

          <p className="max-w-prose text-pretty text-xs text-slate-400">
            {tm.section5.callout}
          </p>
        </section>

        {/* SECTION 6: Economic Moat Framework */}
        <section id="economic-moat" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <ShieldCheck className="size-5" />
            <h2 className="text-lg font-bold text-white sm:text-xl">
              {tm.section6.title}
            </h2>
          </div>

          <p className="max-w-prose text-pretty text-xs leading-relaxed text-slate-300 sm:text-sm">
            {tm.section6.desc}
          </p>

          <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-5">
            <div className="glass-panel rounded-xl p-3">
              <div className="font-bold text-white">{tm.section6.p1Title}</div>
              <p className="mt-1 text-xs text-slate-400">
                {tm.section6.p1Desc}
              </p>
            </div>
            <div className="glass-panel rounded-xl p-3">
              <div className="font-bold text-white">{tm.section6.p2Title}</div>
              <p className="mt-1 text-xs text-slate-400">
                {tm.section6.p2Desc}
              </p>
            </div>
            <div className="glass-panel rounded-xl p-3">
              <div className="font-bold text-white">{tm.section6.p3Title}</div>
              <p className="mt-1 text-xs text-slate-400">
                {tm.section6.p3Desc}
              </p>
            </div>
            <div className="glass-panel rounded-xl p-3">
              <div className="font-bold text-white">{tm.section6.p4Title}</div>
              <p className="mt-1 text-xs text-slate-400">
                {tm.section6.p4Desc}
              </p>
            </div>
            <div className="glass-panel rounded-xl p-3">
              <div className="font-bold text-white">{tm.section6.p5Title}</div>
              <p className="mt-1 text-xs text-slate-400">
                {tm.section6.p5Desc}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7: Deterministic Scenario Calibration Matrix */}
        <section id="qpce-calibration" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <Calculator className="size-5" />
            <h2 className="text-lg font-bold text-white sm:text-xl">
              {tm.section7.title}
            </h2>
          </div>

          <p className="max-w-prose text-pretty text-xs leading-relaxed text-slate-300 sm:text-sm">
            {tm.section7.desc}
          </p>

          {/* Formula Card */}
          <div className="glass-panel shadow-xs space-y-2 overflow-hidden rounded-xl border border-border bg-surface-1/90 p-4 font-mono text-xs text-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-accent">
              {tm.section7.formulaLabel}
            </div>
            <div className="text-foreground">
              z_i = ln(p_i^prior) + Δz_i^governance + Δz_i^moat + Δz_i^consensus
              + Δz_i^market
            </div>
            <div className="text-foreground">
              p_i^* = exp(z_i / T) / ∑ exp(z_j / T) &nbsp;&nbsp;&nbsp; (T = 1.0)
            </div>
            <div className="pt-1 font-semibold text-emerald-400 sm:text-sm">
              p_i = clamp(p_i^*, 0.05, 0.85) &nbsp; s.t. &nbsp; ∑ p_i ≡ 1.000
            </div>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="glass-panel shadow-xs rounded-xl border border-border p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <span className="size-2 rounded-full bg-rose-400" />
                <span>{tm.section7.p1Title}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {tm.section7.p1Desc}
              </p>
            </div>

            <div className="glass-panel shadow-xs rounded-xl border border-border p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <span className="size-2 rounded-full bg-amber-400" />
                <span>{tm.section7.p2Title}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {tm.section7.p2Desc}
              </p>
            </div>

            <div className="glass-panel shadow-xs rounded-xl border border-border p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                <span className="size-2 rounded-full bg-sky-400" />
                <span>{tm.section7.p3Title}</span>
              </div>
              <p className="mt-1 text-pretty text-xs leading-relaxed text-slate-400">
                {tm.section7.p3Desc}
              </p>
            </div>

            <div className="glass-panel shadow-xs rounded-xl border border-border p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span>{tm.section7.p4Title}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {tm.section7.p4Desc}
              </p>
            </div>
          </div>

          {/* Case Study Alert */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertTriangle className="size-4" />
              <span>{tm.section7.caseStudyTitle}</span>
            </div>
            <p className="mt-2 max-w-[58ch] text-pretty leading-relaxed text-slate-300">
              {tm.section7.caseStudyText}
            </p>
          </div>

          {/* Institutional Interview Guidance & Methodology Alignment Box */}
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-sky-300">
              <BookOpen className="size-4" />
              <span>{tm.section7.interviewTitle}</span>
            </div>
            <p className="mt-2 max-w-[58ch] text-pretty leading-relaxed text-slate-300">
              <strong>{tm.section7.interviewWhyTitle}</strong>{" "}
              {tm.section7.interviewWhyText}
              <br />
              <strong>{tm.section7.interviewRoadmapTitle}</strong>{" "}
              {tm.section7.interviewRoadmapText}
            </p>
          </div>
        </section>

        {/* GitHub CTA Banner */}
        <div className="glass-panel relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-tr from-accent/10 via-surface-1 to-surface-2 p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GithubIcon className="size-5 text-accent" />
                <h3 className="text-base font-bold text-white sm:text-lg">
                  {tm.cta.title}
                </h3>
              </div>
              <p className="max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                {tm.cta.desc}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/"
                className="shadow-xs rounded-lg border border-border bg-surface-2 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-surface-3 hover:text-foreground"
              >
                {tm.cta.backBtn}
              </Link>

              <a
                href="https://github.com/phanturne/stress-alpha"
                target="_blank"
                rel="noopener noreferrer"
                className="shadow-xs flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:bg-accent-hover active:scale-95"
              >
                <GithubIcon className="size-4" />
                <span>{tm.cta.githubBtn}</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
