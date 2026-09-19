"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  X,
  Download,
  Copy,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  Link2,
} from "lucide-react";
import type { Facts, Valuation, StressResult, ReportData } from "@/lib/schemas";
import type { StressTestParams } from "@/lib/valuation";
import { getTranslations, type Locale } from "@/lib/i18n";
import {
  type CardTemplate,
  type CardSection,
  type CardAspectRatio,
  type CardTheme,
  CARD_DIMENSIONS,
  THEME_CONFIGS,
  TEMPLATE_SECTION_PRESETS,
  generateSocialPostText,
  downloadDataUrl,
  exportSocialCardAsPng,
  copySocialCardImageToClipboard,
} from "@/lib/social-card";
import { SocialCard } from "./SocialCard";

export interface SocialCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  facts?: Facts;
  valuation?: Valuation;
  stressResult?: StressResult;
  reportData?: ReportData;
  stressParams?: StressTestParams;
  locale?: Locale;
  onShowToast?: (msg: string) => void;
}

export const SocialCardModal: React.FC<SocialCardModalProps> = ({
  isOpen,
  onClose,
  facts,
  valuation,
  stressResult,
  reportData,
  stressParams,
  locale: initialLocale = "en",
  onShowToast,
}) => {
  const [template, setTemplate] = useState<CardTemplate>("valuation");
  const [selectedSections, setSelectedSections] = useState<CardSection[]>(
    TEMPLATE_SECTION_PRESETS.valuation
  );
  const [aspectRatio, setAspectRatio] = useState<CardAspectRatio>("landscape");
  const [theme, setTheme] = useState<CardTheme>("cyber");
  const [selectedLocale, setSelectedLocale] = useState<Locale | null>(null);
  const [userNote, setUserNote] = useState<string | null>(null);
  const [includeStressShocks, setIncludeStressShocks] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [isTextCopied, setIsTextCopied] = useState<boolean>(false);
  const [isLinkCopied, setIsLinkCopied] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(0.65);

  const cardRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Active scenario URL
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  // Active locale: user selection or default to initial
  const cardLocale = selectedLocale ?? initialLocale;
  const t = getTranslations(cardLocale).socialCard;

  // Compute smart default note if user hasn't typed a custom note
  const defaultNote = facts
    ? t.controls.defaultNote(facts.company, facts.quarter)
    : "";
  const customNote = userNote !== null ? userNote : defaultNote;

  // Calculate applied shocks summary
  const appliedShocks = stressParams?.driverShocks ?? {};
  const grossMarginDeltaBps = stressParams?.grossMarginBpsDelta ?? 0;
  const fixedOpexShiftPct = stressParams?.fixedOpexShiftPct ?? 0;

  const appliedShocksSummary = useMemo(() => {
    const parts: string[] = [];
    if (stressParams?.driverShocks) {
      for (const [key, val] of Object.entries(stressParams.driverShocks)) {
        if (Math.abs(val) > 0.001) {
          parts.push(`${key}: ${val > 0 ? "+" : ""}${val}%`);
        }
      }
    }
    if (grossMarginDeltaBps !== 0) {
      parts.push(
        `GM: ${grossMarginDeltaBps > 0 ? "+" : ""}${grossMarginDeltaBps}bps`
      );
    }
    if (fixedOpexShiftPct !== 0) {
      parts.push(
        `Opex: ${fixedOpexShiftPct > 0 ? "+" : ""}${fixedOpexShiftPct}%`
      );
    }
    return parts.join(", ");
  }, [stressParams, grossMarginDeltaBps, fixedOpexShiftPct]);

  // Adjust preview scaling to fit container nicely
  useEffect(() => {
    const updateScale = () => {
      if (!previewContainerRef.current) return;
      const containerWidth = previewContainerRef.current.clientWidth - 48; // padding
      const containerHeight = previewContainerRef.current.clientHeight - 48;
      const dim = CARD_DIMENSIONS[aspectRatio];

      const scaleW = containerWidth / dim.width;
      const scaleH = containerHeight / dim.height;
      const calculatedScale = Math.min(scaleW, scaleH, 0.85);
      setPreviewScale(Math.max(0.25, Math.min(1, calculatedScale)));
    };

    if (isOpen) {
      updateScale();
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }
  }, [isOpen, aspectRatio]);

  // Handle Download PNG
  const handleDownloadPng = async () => {
    if (!cardRef.current || !facts) return;
    setIsExporting(true);
    try {
      const dataUrl = await exportSocialCardAsPng(cardRef.current, {
        pixelRatio: 2,
      });
      const filename = `${facts.ticker.toUpperCase()}_${template}_${aspectRatio}_stress_alpha.png`;
      downloadDataUrl(dataUrl, filename);
      onShowToast?.(
        t.actions.downloadSuccessToast ?? "Card image downloaded successfully!"
      );
    } catch (err) {
      console.error("Export error:", err);
      onShowToast?.(t.actions.exportError);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!cardRef.current || !facts) return;
    setIsCopying(true);
    try {
      await copySocialCardImageToClipboard(cardRef.current, { pixelRatio: 2 });
      onShowToast?.(t.actions.copiedToast);
    } catch (err) {
      console.error("Copy image error:", err);
      // Fallback: try download or toast
      onShowToast?.(t.actions.clipboardError);
    } finally {
      setIsCopying(false);
    }
  };

  // Handle Copy Post Text
  const handleCopyPostText = () => {
    if (!facts || !stressResult) return;
    const postText = generateSocialPostText({
      facts,
      valuation,
      stressResult,
      locale: cardLocale,
      customNote,
      appliedShocksSummary: includeStressShocks
        ? appliedShocksSummary
        : undefined,
    });

    navigator.clipboard
      .writeText(postText)
      .then(() => {
        setIsTextCopied(true);
        setTimeout(() => setIsTextCopied(false), 2000);
        onShowToast?.(t.actions.textCopiedToast);
      })
      .catch(() => prompt("Copy social post text:", postText));
  };

  // Handle Copy Scenario Link
  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
        onShowToast?.(t.actions.linkCopiedToast);
      })
      .catch(() => prompt("Copy scenario link:", url));
  };

  // Select a preset template which sets the sections to the preset's defaults
  const handleSelectPreset = useCallback((preset: CardTemplate) => {
    setTemplate(preset);
    setSelectedSections(TEMPLATE_SECTION_PRESETS[preset]);
  }, []);

  // Toggle an individual section on/off (switches to "custom" mode)
  const handleToggleSection = useCallback((section: CardSection) => {
    setSelectedSections((prev) => {
      const next = prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section];
      return next;
    });
  }, []);

  // All available sections in display order
  const ALL_SECTIONS: CardSection[] = [
    "valuationHero",
    "regimes",
    "earnings",
    "segments",
    "moat",
    "catalysts",
    "snowflake",
  ];

  if (!isOpen || !facts || !stressResult) return null;

  const currentDim = CARD_DIMENSIONS[aspectRatio];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Main Modal Window */}
      <div className="glass-panel relative flex size-full max-h-[92vh] max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/[0.12] bg-surface-1 shadow-2xl animate-in zoom-in-95">
        {/* Top Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-accent/40 bg-accent/10 text-accent shadow-glow">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                {t.modalTitle}
              </h2>
              <p className="text-xs text-slate-400">{t.modalSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Language Toggle inside modal */}
            <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-0/80 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedLocale("en")}
                className={`rounded px-2 py-1 font-bold transition-colors ${
                  cardLocale === "en"
                    ? "bg-accent font-extrabold text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setSelectedLocale("zh")}
                className={`rounded px-2 py-1 font-bold transition-colors ${
                  cardLocale === "zh"
                    ? "bg-accent font-extrabold text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                中文
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-xl border border-white/[0.08] bg-surface-2 text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
              title={t.actions.close}
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2 Columns (Left: Live Preview Canvas, Right: Controls & Actions) */}
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Left: Preview Canvas Area */}
          <div
            ref={previewContainerRef}
            className="custom-scrollbar relative flex flex-1 items-center justify-center overflow-auto bg-surface-0/90 p-4 sm:p-6"
          >
            {/* Subtle Canvas Background Pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Scaling Wrapper for Pixel-Perfect Card Rendering */}
            <div
              style={{
                width: `${currentDim.width * previewScale}px`,
                height: `${currentDim.height * previewScale}px`,
                position: "relative",
                transition: "width 0.2s ease, height 0.2s ease",
              }}
              className="shrink-0 drop-shadow-2xl"
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                }}
              >
                <SocialCard
                  ref={cardRef}
                  facts={facts}
                  valuation={valuation}
                  stressResult={stressResult}
                  reportData={reportData}
                  template={template}
                  selectedSections={selectedSections}
                  aspectRatio={aspectRatio}
                  theme={theme}
                  locale={cardLocale}
                  customNote={customNote}
                  includeStressShocks={includeStressShocks}
                  showWatermark={showWatermark}
                  appliedShocks={appliedShocks}
                  grossMarginDeltaBps={grossMarginDeltaBps}
                  fixedOpexShiftPct={fixedOpexShiftPct}
                />
              </div>
            </div>

            {/* Float Zoom Pill at bottom-left of preview */}
            <div className="glass-panel-subtle absolute bottom-4 left-4 flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-400 shadow-md">
              <span>
                {Math.round(previewScale * 100)}% {t.controls.previewScale}
              </span>
              <button
                type="button"
                onClick={() => setPreviewScale((p) => Math.max(0.3, p - 0.1))}
                className="hover:text-white"
                title="Zoom Out"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setPreviewScale((p) => Math.min(1.0, p + 0.1))}
                className="hover:text-white"
                title="Zoom In"
              >
                +
              </button>
            </div>
          </div>

          {/* Right: Controls & Customization Sidebar */}
          <div className="custom-scrollbar flex w-full shrink-0 flex-col justify-between overflow-y-auto border-t border-white/[0.08] bg-surface-1 p-5 sm:p-6 lg:w-[420px] lg:border-l lg:border-t-0 xl:w-[460px]">
            <div className="flex flex-col gap-5">
              {/* Scenario Link Sharing Box */}
              <div className="rounded-2xl border border-white/[0.08] bg-surface-0/70 p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                    <Link2 className="size-3.5 text-accent" />
                    <span>{t.controls.scenarioLinkLabel}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {t.controls.liveStressParams}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 overflow-hidden rounded-xl border border-white/[0.06] bg-surface-2/80 px-3 py-2 font-mono text-xs text-slate-300">
                    <span className="truncate text-slate-400">
                      {currentUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/15 px-3 py-2 text-xs font-bold text-accent shadow-sm transition-all hover:bg-accent/25 hover:text-white active:scale-95"
                  >
                    {isLinkCopied ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                        <span className="text-emerald-400">
                          {t.actions.copied}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>{t.actions.copyLink}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 1. Quick Preset Buttons */}
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t.presets.label}
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(
                    [
                      "valuation",
                      "earnings",
                      "thesis",
                      "summary",
                      "snowflake",
                    ] as CardTemplate[]
                  ).map((preset) => {
                    const presetSections = TEMPLATE_SECTION_PRESETS[preset];
                    const isActive =
                      presetSections.length === selectedSections.length &&
                      presetSections.every((s) => selectedSections.includes(s));
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all ${
                          isActive
                            ? "border-accent bg-accent/15 text-accent ring-1 ring-accent/30"
                            : "border-white/[0.08] bg-surface-2/70 text-slate-400 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        {t.templates[preset]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Section Multi-Select Checkboxes */}
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t.controls.sectionsLabel}
                </label>
                <div className="mt-2 flex flex-col gap-1.5">
                  {ALL_SECTIONS.map((section) => {
                    const isChecked = selectedSections.includes(section);
                    return (
                      <label
                        key={section}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 transition-all ${
                          isChecked
                            ? "border-accent/40 bg-accent/10"
                            : "border-white/[0.06] bg-surface-2/50 hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSection(section)}
                          className="size-3.5 rounded border-slate-600 bg-surface-2 text-accent focus:ring-accent"
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs font-bold ${isChecked ? "text-white" : "text-slate-400"}`}
                          >
                            {t.sections[section]}
                          </div>
                          <div className="truncate text-[10px] text-slate-500">
                            {
                              t.sections[
                                `${section}Desc` as keyof typeof t.sections
                              ]
                            }
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 2. Format / Aspect Ratio Selector */}
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t.controls.formatLabel}
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("landscape")}
                    className={`rounded-xl border p-2 text-center transition-all ${
                      aspectRatio === "landscape"
                        ? "border-accent bg-accent/15 font-bold text-accent shadow-sm"
                        : "border-white/[0.08] bg-surface-2/70 text-slate-300 hover:border-slate-500 hover:text-white"
                    }`}
                  >
                    <div className="font-mono font-bold">16:9</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      X / LinkedIn
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio("square")}
                    className={`rounded-xl border p-2 text-center transition-all ${
                      aspectRatio === "square"
                        ? "border-accent bg-accent/15 font-bold text-accent shadow-sm"
                        : "border-white/[0.08] bg-surface-2/70 text-slate-300 hover:border-slate-500 hover:text-white"
                    }`}
                  >
                    <div className="font-mono font-bold">1:1</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      Instagram / Feed
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio("portrait")}
                    className={`rounded-xl border p-2 text-center transition-all ${
                      aspectRatio === "portrait"
                        ? "border-accent bg-accent/15 font-bold text-accent shadow-sm"
                        : "border-white/[0.08] bg-surface-2/70 text-slate-300 hover:border-slate-500 hover:text-white"
                    }`}
                  >
                    <div className="font-mono font-bold">4:5</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      Mobile / Stories
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Color Theme Selector */}
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t.controls.themeLabel}
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {(["cyber", "navy", "emerald", "crimson"] as CardTheme[]).map(
                    (thm) => {
                      const cfg = THEME_CONFIGS[thm];
                      const isSelected = theme === thm;
                      return (
                        <button
                          key={thm}
                          type="button"
                          onClick={() => setTheme(thm)}
                          className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                            isSelected
                              ? "border-accent bg-accent/15 font-bold text-white shadow-sm ring-1 ring-accent/30"
                              : "border-white/[0.08] bg-surface-2/70 text-slate-300 hover:border-slate-500 hover:text-white"
                          }`}
                        >
                          <div
                            className="size-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ background: cfg.accentColor }}
                          />
                          <span className="truncate">
                            {cfg.name[cardLocale]}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* 4. Custom Analyst Takeaway / Note */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                    {t.controls.customNote}
                  </label>
                  <button
                    type="button"
                    onClick={() => setUserNote("")}
                    className="text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    {t.controls.clear}
                  </button>
                </div>
                <textarea
                  value={customNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder={t.controls.customNotePlaceholder}
                  rows={2}
                  maxLength={160}
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-surface-0/90 p-3 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <div className="mt-1 text-right font-mono text-[10px] text-slate-500">
                  {customNote.length}/160
                </div>
              </div>

              {/* 5. Toggles */}
              <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-surface-0/60 p-3 text-xs">
                {/* Include Stressed Parameters */}
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-slate-300">
                    {t.controls.includeStress}
                  </span>
                  <input
                    type="checkbox"
                    checked={includeStressShocks}
                    onChange={(e) => setIncludeStressShocks(e.target.checked)}
                    className="size-4 rounded border-slate-700 bg-surface-2 text-accent focus:ring-accent"
                  />
                </label>

                {/* Show Watermark */}
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-slate-300">
                    {t.controls.includeWatermark}
                  </span>
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="size-4 rounded border-slate-700 bg-surface-2 text-accent focus:ring-accent"
                  />
                </label>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5 pt-4">
              <div className="grid grid-cols-2 gap-2">
                {/* Download PNG Button */}
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{t.actions.generating}</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-4" />
                      <span>{t.actions.downloadPng}</span>
                    </>
                  )}
                </button>

                {/* Copy Image Button */}
                <button
                  type="button"
                  onClick={handleCopyImage}
                  disabled={isCopying}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-surface-2 px-4 py-3 text-xs font-bold text-white shadow-md transition-all hover:border-accent/40 hover:bg-surface-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {isCopying ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-accent" />
                      <span>{t.actions.copying}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4 text-accent" />
                      <span>{t.actions.copyImage}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Copy Ready-to-Tweet Text Button */}
              <button
                type="button"
                onClick={handleCopyPostText}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-surface-0/90 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:border-slate-500 hover:text-white"
              >
                {isTextCopied ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    <span className="text-emerald-400">
                      {t.actions.textCopiedToast}
                    </span>
                  </>
                ) : (
                  <>
                    <FileText className="size-3.5 text-slate-400" />
                    <span>{t.actions.copyText}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
