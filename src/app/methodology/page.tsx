"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Layers,
  Scale,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  SlidersHorizontal,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Code2,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";

// GitHub SVG Icon
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
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "stress_alpha_locale"
      ) as Locale | null;
      if (saved === "en" || saved === "zh") {
        Promise.resolve().then(() => {
          setLocale(saved);
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    try {
      localStorage.setItem("stress_alpha_locale", newLocale);
    } catch {
      // ignore
    }
  };

  const isZh = locale === "zh";

  return (
    <div className="min-h-screen bg-background text-slate-100 selection:bg-accent/20 selection:text-accent">
      {/* Sticky Header Navigation */}
      <header className="glass-panel sticky top-0 z-40 flex w-full items-center justify-between gap-4 border-b border-white/[0.08] px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-1 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            <span>{isZh ? "返回驾驶舱" : "Back to Cockpit"}</span>
          </Link>

          <div className="hidden h-4 w-px bg-white/[0.08] sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg border border-accent/40 bg-accent/20 font-mono text-xs font-black text-accent">
              Sα
            </div>
            <span className="hidden text-sm font-bold tracking-tight text-white sm:inline">
              Stress<span className="text-accent">Alpha</span>
            </span>
            <span className="rounded border border-white/[0.08] bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-slate-400">
              {isZh ? "模型算法原理" : "METHODOLOGY"}
            </span>
          </div>
        </div>

        {/* Right controls: Language & GitHub Button */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle */}
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-1/90 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => toggleLocale("en")}
              className={`rounded px-2.5 py-1 font-bold transition-all ${
                locale === "en"
                  ? "bg-accent font-extrabold text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => toggleLocale("zh")}
              className={`rounded px-2.5 py-1 font-bold transition-all ${
                locale === "zh"
                  ? "bg-accent font-extrabold text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              中文
            </button>
          </div>

          {/* GitHub Repository Link Button */}
          <a
            href="https://github.com/phanturne/stress-alpha"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/[0.12] bg-surface-2 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:border-accent/60 hover:bg-surface-3 hover:text-accent"
            title="View StressAlpha repository on GitHub"
          >
            <GithubIcon className="size-4" />
            <span className="hidden sm:inline">GitHub</span>
            <ExternalLink className="size-3 text-slate-400" />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        {/* Hero Title Section */}
        <div className="border-b border-white/[0.08] pb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <Calculator className="size-3.5" />
            <span>
              {isZh
                ? "数理内核与决策逻辑"
                : "Mathematical Engine & Valuation Logic"}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            {isZh
              ? "StressAlpha 财务与压力估值模型计算原理"
              : "Deterministic Valuation & Stress Simulation Methodology"}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
            {isZh
              ? "不同于传统大模型的黑盒幻觉推测，StressAlpha 将 LLM 严密限制在上游财报事实抽取与情景锚定阶段，所有 P&L 传导、经营杠杆、核心经营 EPS 与加权估值均由客户端纯确定性算术引擎毫秒级实时计算。"
              : "Unlike black-box AI financial chatbots, StressAlpha confines LLMs exclusively to structured artifact extraction and risk disclosure audits. All P&L flow-through calculations, operating leverage, EPS normalization, and scenario valuation trees are executed by a client-side deterministic arithmetic engine in sub-milliseconds."}
          </p>

          {/* Quick Anchor Navigation */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <a
              href="#revenue-shock"
              className="rounded-lg border border-white/[0.08] bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
            >
              1. {isZh ? "上游需求扰动传导" : "Upstream Shocks"}
            </a>
            <a
              href="#operating-leverage"
              className="rounded-lg border border-white/[0.08] bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
            >
              2. {isZh ? "经营杠杆与固定成本" : "Operating Leverage"}
            </a>
            <a
              href="#income-guardrail"
              className="rounded-lg border border-white/[0.08] bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
            >
              3. {isZh ? "收益质量与核心EPS" : "Clean Operating EPS"}
            </a>
            <a
              href="#valuation-regimes"
              className="rounded-lg border border-white/[0.08] bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
            >
              4. {isZh ? "估值谱系与风险不对称" : "Valuation Regimes"}
            </a>
            <a
              href="#base-vs-wfv"
              className="rounded-lg border border-white/[0.08] bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
            >
              5. {isZh ? "基准公允价 vs 加权公允价" : "Base FV vs. WFV"}
            </a>
            <a
              href="#economic-moat"
              className="rounded-lg border border-white/[0.08] bg-surface-1 px-2.5 py-1 text-slate-300 transition-colors hover:border-accent hover:text-accent"
            >
              6. {isZh ? "五维经济护城河评级" : "Economic Moat"}
            </a>
          </div>
        </div>

        {/* Content Body Sections */}
        <div className="mt-10 space-y-12">
          {/* SECTION 1: Upstream Demand Shocks & Revenue Flow-Through */}
          <section id="revenue-shock" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-accent">
              <SlidersHorizontal className="size-5" />
              <h2 className="text-lg font-bold text-white sm:text-xl">
                1.{" "}
                {isZh
                  ? "上游需求扰动传导模型"
                  : "Upstream Demand Shock Flow-Through"}
              </h2>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
              {isZh
                ? "大型科技巨头（如英伟达、亚马逊）的营收极度依赖上游资本开支或终端市场预算。模型为每一个上游宏观驱动因子（如云厂商AI资本开支、CoWoS先进封装良率、企业IT预算）配置了业务暴露比例（Exposure）与传导弹性系数（Elasticity）。"
                : "Hyper-growth tech enterprises are tethered to upstream capital spending or enterprise budget trends. StressAlpha pairs each upstream macroeconomic driver (e.g. Big-4 Hyperscaler CapEx, CoWoS packaging yield, enterprise IT budgets) with an Exposure share and an Elasticity coefficient."}
            </p>

            {/* Formula Card */}
            <div className="glass-panel overflow-hidden rounded-xl border border-white/[0.1] bg-surface-1/90 p-4 font-mono text-xs text-slate-200 shadow-inner">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-accent">
                {isZh ? "数学公式" : "FORMULA"}
              </div>
              <div className="font-semibold text-white sm:text-sm">
                Stressed_Revenue = Base_Revenue × [ 1 + ∑ (Shock_i × Exposure_i
                × Elasticity_i) ]
              </div>
              <div className="mt-3 grid grid-cols-1 gap-1 text-[11px] text-slate-400 sm:grid-cols-3">
                <div>
                  <span className="text-accent">Shock_i:</span>{" "}
                  {isZh ? "滑块扰动幅度 (%)" : "Perturbation (%)"}
                </div>
                <div>
                  <span className="text-accent">Exposure_i:</span>{" "}
                  {isZh ? "业务营收占比 [0, 1]" : "Revenue exposure [0, 1]"}
                </div>
                <div>
                  <span className="text-accent">Elasticity_i:</span>{" "}
                  {isZh ? "传导弹性系数" : "Sensitivity multiplier"}
                </div>
              </div>
            </div>

            {/* Worked Example */}
            <div className="rounded-xl border border-white/[0.06] bg-surface-0/60 p-4 text-xs text-slate-300">
              <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-white">
                <Sparkles className="size-3.5 text-amber-400" />
                <span>
                  {isZh
                    ? "以 NVIDIA (NVDA Q2 2027) 为例"
                    : "Example: NVIDIA (NVDA Q2 2027)"}
                </span>
              </div>
              <p className="leading-relaxed text-slate-400">
                {isZh ? (
                  <>
                    NVDA 数据中心营收暴露度为 <strong>85%</strong>{" "}
                    (0.85)，对四大云厂商 AI 资本开支的弹性为{" "}
                    <strong>1.15</strong>。若云厂商削减 AI 资本开支{" "}
                    <strong>-15%</strong>：<br />
                    传导冲击 = -15% × 0.85 × 1.15 = <strong>-14.66%</strong>。
                    <br />
                    经测试年度营收 = $30.04B × (1 - 14.66%) ={" "}
                    <strong>$25.63B</strong>。
                  </>
                ) : (
                  <>
                    NVDA Data Center revenue represents <strong>85%</strong> of
                    sales (0.85 exposure) with an elasticity of{" "}
                    <strong>1.15</strong>. If cloud hyperscalers cut AI CapEx by{" "}
                    <strong>-15%</strong>:<br />
                    Net Shock = -15% × 0.85 × 1.15 = <strong>-14.66%</strong>.
                    <br />
                    Stressed Revenue = $30.04B × (1 - 14.66%) ={" "}
                    <strong>$25.63B</strong>.
                  </>
                )}
              </p>
            </div>
          </section>

          {/* SECTION 2: Operating Leverage & Cost Structure */}
          <section id="operating-leverage" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-accent">
              <Layers className="size-5" />
              <h2 className="text-lg font-bold text-white sm:text-xl">
                2.{" "}
                {isZh
                  ? "经营杠杆与固定/变动成本分拆"
                  : "Operating Leverage & Cost Structure"}
              </h2>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
              {isZh
                ? "当营收下滑时，固定开支（研发折旧、数据中心租金、固定薪酬）并不会同比例减少，这导致利润率呈现非线性的剧烈下挫（经营杠杆效应）。StressAlpha 将营业费用（OpEx）拆分为变动成本与刚性固定成本，并允许在毛利率基点（Bps）和固定支出变动（%）上施加压力。"
                : "When top-line sales decline, fixed overhead (R&D amortization, data center leases, base compensation) does not scale down linearly. This triggers an amplified collapse in operating profit (operating leverage). StressAlpha decomposes costs into variable COGS and rigid fixed OpEx, enabling independent margin stress tests."}
            </p>

            {/* Formula Card */}
            <div className="glass-panel space-y-2 overflow-hidden rounded-xl border border-white/[0.1] bg-surface-1/90 p-4 font-mono text-xs text-slate-200 shadow-inner">
              <div className="text-[11px] font-bold uppercase tracking-wider text-accent">
                {isZh ? "数学公式" : "FORMULAS"}
              </div>
              <div className="text-white">
                Stressed_Gross_Margin = Base_Gross_Margin + (ΔGross_Margin_Bps /
                10,000)
              </div>
              <div className="text-white">
                Stressed_Gross_Profit = Stressed_Revenue × Stressed_Gross_Margin
              </div>
              <div className="text-white">
                Stressed_Fixed_OpEx = Base_Fixed_OpEx × (1 + ΔFixed_OpEx_Pct /
                100)
              </div>
              <div className="pt-1 font-semibold text-emerald-400 sm:text-sm">
                Stressed_Operating_Income = Stressed_Gross_Profit -
                Stressed_Fixed_OpEx
              </div>
            </div>
          </section>

          {/* SECTION 3: Income Quality Guardrail & Clean Operating EPS */}
          <section id="income-guardrail" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-accent">
              <ShieldCheck className="size-5" />
              <h2 className="text-lg font-bold text-white sm:text-xl">
                3.{" "}
                {isZh
                  ? "收益质量防线与核心经营 EPS 净化"
                  : "Income Quality Guardrail & Clean Operating EPS"}
              </h2>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
              {isZh
                ? "GAAP 会计准则下的财报净利润经常包含巨额的非经常性纸面公允价值重估收益或投资浮盈。如果直接采用 GAAP EPS 进行估值倍数测算，将严重扭曲真实价值。"
                : "Headline GAAP diluted earnings are frequently distorted by non-operating mark-to-market revaluations, litigation settlements, or paper investment marks. Valuing a company on contaminated headline EPS produces severe mispricings."}
            </p>

            {/* The Amazon Case Study Alert */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="size-4" />
                <span>
                  {isZh
                    ? "经典案例：亚马逊 (AMZN Q2 2026) 投资公允价值失真"
                    : "Case Study: Amazon (AMZN Q2 2026) ASU 2016-01 Distortion"}
                </span>
              </div>
              <p className="mt-2 leading-relaxed text-slate-300">
                {isZh ? (
                  <>
                    亚马逊 Q2 2026 财报 GAAP 稀释每股收益达到{" "}
                    <strong>$5.49</strong>
                    ，大幅超出市场预期。然而审计发现，其中包含对 Anthropic
                    股权投资按 ASU 2016-01 准则确认的{" "}
                    <strong>$53.4B 非经营性未实现纸面浮盈</strong>。<br />
                    StressAlpha
                    的收益质量引擎自动扣除该一次性收益，还原出亚马逊真实的持续经营核心
                    EPS 仅为 <strong>$1.26</strong>
                    ，为投资者规避了虚高估值陷阱。
                  </>
                ) : (
                  <>
                    Amazon reported headline GAAP diluted EPS of{" "}
                    <strong>$5.49</strong>, seemingly crushing consensus.
                    However, forensic analysis reveals a{" "}
                    <strong>$53.4B unrealized paper mark</strong> on its
                    Anthropic investment under ASU 2016-01.
                    <br />
                    StressAlpha&apos;s guardrail automatically isolates and
                    strips this one-time non-operating distortion, revealing
                    Amazon&apos;s true sustainable operating EPS was{" "}
                    <strong>$1.26</strong>.
                  </>
                )}
              </p>
            </div>

            {/* Formula Card */}
            <div className="glass-panel overflow-hidden rounded-xl border border-white/[0.1] bg-surface-1/90 p-4 font-mono text-xs text-slate-200 shadow-inner">
              <div className="font-semibold text-white sm:text-sm">
                Clean_Operating_EPS = [ Reported_Net_Income - NonOperating_Gains
                × (1 - Tax_Rate) ] / Diluted_Shares
              </div>
            </div>
          </section>

          {/* SECTION 4: Valuation Regimes & Outcome Bands */}
          <section id="valuation-regimes" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-accent">
              <Scale className="size-5" />
              <h2 className="text-lg font-bold text-white sm:text-xl">
                4.{" "}
                {isZh
                  ? "动态估值谱系与风险收益不对称性"
                  : "Valuation Outcome Regimes & Risk Asymmetry"}
              </h2>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
              {isZh
                ? "投资决策不是预测一个孤立的价格点，而是评估不同市场情境下的盈亏不对称性。系统将经受压力测试后的预期 EPS 映射到三个市场周期估值倍数中："
                : "Institutional equity investing is not about predicting a single target point; it is about quantifying risk/reward asymmetry across multiple market regimes:"}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="glass-panel rounded-xl border-l-2 border-emerald-400 p-3.5">
                <div className="text-xs font-bold text-emerald-400">
                  🐂 {isZh ? "乐观周期 (Bull Regime)" : "Bull Regime"}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isZh
                    ? "企业业绩加速增长，估值倍数大幅扩张 (P/E Expansion)。"
                    : "Accelerating growth with multiple expansion."}
                </p>
                <div className="mt-2 font-mono text-xs font-semibold text-white">
                  Target = Stressed_EPS × Multiple_Bull
                </div>
              </div>

              <div className="glass-panel rounded-xl border-l-2 border-sky-400 p-3.5">
                <div className="text-xs font-bold text-sky-400">
                  ⚖️ {isZh ? "基准周期 (Base Regime)" : "Base Regime"}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isZh
                    ? "管理层正常兑现前瞻指引，市场维持历史平均估值倍数。"
                    : "Execution on baseline guidance at normalized historical P/E."}
                </p>
                <div className="mt-2 font-mono text-xs font-semibold text-white">
                  Target = Stressed_EPS × Multiple_Base
                </div>
              </div>

              <div className="glass-panel rounded-xl border-l-2 border-rose-400 p-3.5">
                <div className="text-xs font-bold text-rose-400">
                  🚨 {isZh ? "恐慌底线 (Panic Floor)" : "Panic Floor"}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isZh
                    ? "宏观衰退与需求冰封，估值压缩至历史周期极值底部。"
                    : "Macro recession and multiple compression to cycle trough."}
                </p>
                <div className="mt-2 font-mono text-xs font-semibold text-white">
                  Target = Stressed_EPS × Multiple_Panic
                </div>
              </div>
            </div>

            {/* Asymmetry Ratio Card */}
            <div className="glass-panel rounded-xl border border-white/[0.08] p-4">
              <div className="text-xs font-bold text-white sm:text-sm">
                {isZh
                  ? "风险收益不对称比率 (Risk/Reward Asymmetry Skew)"
                  : "Risk/Reward Asymmetry Skew Ratio"}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {isZh
                  ? "衡量向上乐观空间与向下极端恐慌回撤的倍数关系。比率大于 2.0x 意味着潜在收益显著高于下行风险，具备极高配置安全边际。"
                  : "Measures the ratio of upside gain potential in the Bull regime versus drawdown exposure to the Panic Floor. A skew above 2.0x indicates an institutional margin of safety."}
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
              <h2 className="text-lg font-bold text-white sm:text-xl">
                5.{" "}
                {isZh
                  ? "基准公允价 vs 加权公允价 (WFV)"
                  : "Base Fair Value vs. Weighted Fair Value (WFV)"}
              </h2>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
              {isZh
                ? "这是全景筛选器（Screener）与估值树中最核心的两个指标："
                : "These are the two anchor valuation figures featured in the Universe Screener and Cockpit:"}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="glass-panel rounded-xl border border-white/[0.08] p-4">
                <div className="flex items-center justify-between text-xs font-bold text-white sm:text-sm">
                  <span>
                    {isZh ? "基准公允价 (Base Fair Value)" : "Base Fair Value"}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    单点基准
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {isZh
                    ? "若公司如期兑现官方前瞻业绩指引，且市场估值倍数维持中枢水平时的合理股价。"
                    : "The implied share price under the single most likely baseline scenario (management guidance execution)."}
                </p>
                <div className="mt-3 rounded bg-surface-0/60 p-2 font-mono text-xs font-semibold text-sky-400">
                  Base_FV = Forward_EPS_Base × Multiple_Base
                </div>
              </div>

              <div className="glass-panel rounded-xl border border-white/[0.08] p-4">
                <div className="flex items-center justify-between text-xs font-bold text-white sm:text-sm">
                  <span>
                    {isZh
                      ? "加权公允价 (Weighted Fair Value)"
                      : "Weighted Fair Value (WFV)"}
                  </span>
                  <span className="font-mono text-[11px] text-accent">
                    期望概率全景
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {isZh
                    ? "综合考虑乐观浪潮与悲观下行的全状态概率加权期望值 (Expected Payoff)。"
                    : "The probability-weighted expected payoff integrating Bull, Base, and Bear scenario distributions."}
                </p>
                <div className="mt-3 rounded bg-surface-0/60 p-2 font-mono text-xs font-semibold text-emerald-400">
                  WFV = ∑ [ Probability_j × (Forward_EPS_j × Multiple_j) ]
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {isZh
                ? "💡 当公司面临极大的正向期权收益（如英伟达受 AI 算力指数级爆发驱动）时，加权公允价会因乐观端的大幅拉动而高于基准公允价；反之，若公司面临严重债务违约或行业被颠覆风险，加权公允价将低于基准公允价。"
                : "💡 When an enterprise possesses positive skew (e.g. NVIDIA's open-ended AI compute tailwind), the Weighted Fair Value exceeds Base Fair Value because the massive Bull upside pulls the probability distribution up."}
            </p>
          </section>

          {/* SECTION 6: Economic Moat Framework */}
          <section id="economic-moat" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5 text-accent">
              <ShieldCheck className="size-5" />
              <h2 className="text-lg font-bold text-white sm:text-xl">
                6.{" "}
                {isZh
                  ? "五维经济护城河评级体系"
                  : "5-Pillar Economic Moat Framework"}
              </h2>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
              {isZh
                ? "纯财务数据只能反映过去一个季度的结果，唯有经济护城河才能决定高超额利润（ROIC > WACC）的持久性。StressAlpha 遵循晨星（Morningstar）与巴菲特护城河标准，从五个维度量化评估竞争壁垒与其演进趋势："
                : "Financial figures only record backward-looking quarterly performance. Economic moats determine how long a firm can defend excess returns (ROIC > WACC). StressAlpha evaluates moats across five institutional pillars:"}
            </p>

            <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-5">
              <div className="glass-panel rounded-xl p-3">
                <div className="font-bold text-white">
                  1. {isZh ? "无形资产" : "Intangible Assets"}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isZh
                    ? "专利微架构、品牌定价权、独家许可"
                    : "Patents, proprietary tech, brands."}
                </p>
              </div>
              <div className="glass-panel rounded-xl p-3">
                <div className="font-bold text-white">
                  2. {isZh ? "转换成本" : "Switching Costs"}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isZh
                    ? "CUDA生态绑定、企业核心业务深度嵌合"
                    : "Developer lock-in, deep integrations."}
                </p>
              </div>
              <div className="glass-panel rounded-xl p-3">
                <div className="font-bold text-white">
                  3. {isZh ? "成本优势" : "Cost Advantage"}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isZh
                    ? "台积电先进制程采购规模、独占良率"
                    : "Purchasing scale, superior unit economics."}
                </p>
              </div>
              <div className="glass-panel rounded-xl p-3">
                <div className="font-bold text-white">
                  4. {isZh ? "网络效应" : "Network Effects"}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isZh
                    ? "开发者-云厂商双向增强飞轮"
                    : "Two-sided developer & hardware flywheels."}
                </p>
              </div>
              <div className="glass-panel rounded-xl p-3">
                <div className="font-bold text-white">
                  5. {isZh ? "有效规模" : "Efficient Scale"}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isZh
                    ? "百亿研发开支筑起自然垄断护城河"
                    : "Capital intensity deterring new entrants."}
                </p>
              </div>
            </div>
          </section>

          {/* GitHub CTA Banner */}
          <div className="glass-panel relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-tr from-accent/10 via-surface-1 to-surface-2 p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GithubIcon className="size-5 text-accent" />
                  <h3 className="text-base font-bold text-white sm:text-lg">
                    {isZh
                      ? "探索开源代码与 AI Skill 流水线"
                      : "Explore the Open-Source Codebase & AI Skills"}
                  </h3>
                </div>
                <p className="max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                  {isZh
                    ? "StressAlpha 包含完整的 Next.js 16 仪表盘、确定性估值引擎、In-Memory 测试套件以及自动化 AI 技能脚本。"
                    : "StressAlpha is fully open-source with Next.js 16, deterministic arithmetic modules, in-memory test suites, and automated earnings analysis CLI scripts."}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href="/"
                  className="rounded-lg border border-white/[0.1] bg-surface-2 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-surface-3 hover:text-white"
                >
                  {isZh ? "返回驾驶舱" : "Open Cockpit"}
                </Link>

                <a
                  href="https://github.com/phanturne/stress-alpha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover active:scale-95"
                >
                  <GithubIcon className="size-4" />
                  <span>{isZh ? "访问 GitHub 仓库" : "View on GitHub"}</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
