"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Search,
  TrendingUp,
  Shield,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  RotateCcw,
  Star,
  LayoutGrid,
  Table,
  Cpu,
  Globe,
  ShoppingBag,
  Landmark,
  Activity,
  Boxes,
  Apple,
  Flame,
  Zap,
  Building2,
  Layers,
  X,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from "lucide-react";
import { Skeleton } from "./ui/Skeleton";
import { MiniSnowflakeRadar } from "./snowflake/MiniSnowflakeRadar";
import type { ReportSummary } from "@/app/api/reports/route";
import {
  formatCurrency,
  formatPercent,
  getReportRecencyWeight,
  compareReportsByRecency,
  deduplicateReportsToLatest,
} from "@/lib/utils";

export {
  getReportRecencyWeight,
  compareReportsByRecency,
  deduplicateReportsToLatest,
};
import { getTranslations, type Locale } from "@/lib/i18n";
import { useWatchlist } from "@/lib/watchlist";
import { useReportPrefetch } from "@/hooks/useReportPrefetch";
import {
  GICS_SECTORS,
  getTickerSectorId,
  getSectorName,
  getSectorShortName,
  getSectorDefinition,
} from "@/lib/sectors";

export const SCREENER_PAGE_SIZE = 50;

export function formatMarketCap(cap?: number): string {
  if (!cap || isNaN(cap) || cap <= 0) return "—";
  // Support both raw dollar amounts (>= 1e6) and database billions notation (< 1e6)
  const capB = cap >= 1e6 ? cap / 1e9 : cap;
  if (capB >= 1000) return `$${(capB / 1000).toFixed(2)}T`;
  if (capB >= 1) return `$${capB.toFixed(1)}B`;
  if (capB >= 0.001) return `$${(capB * 1000).toFixed(0)}M`;
  return `$${capB.toFixed(2)}B`;
}

export function renderSectorIcon(iconName: string, className = "size-3.5") {
  switch (iconName) {
    case "Cpu":
      return <Cpu className={className} />;
    case "Globe":
      return <Globe className={className} />;
    case "ShoppingBag":
      return <ShoppingBag className={className} />;
    case "Landmark":
      return <Landmark className={className} />;
    case "Activity":
      return <Activity className={className} />;
    case "Boxes":
      return <Boxes className={className} />;
    case "Apple":
      return <Apple className={className} />;
    case "Flame":
      return <Flame className={className} />;
    case "Zap":
      return <Zap className={className} />;
    case "Building2":
      return <Building2 className={className} />;
    case "Layers":
    default:
      return <Layers className={className} />;
  }
}

interface FilterDropdownOption<T extends string> {
  id: T;
  label: string;
  shortLabel?: string;
  count?: number;
  icon?: React.ReactNode;
  title?: string;
}

interface FilterDropdownProps<T extends string> {
  label: string;
  value: T;
  defaultValue: T;
  options: FilterDropdownOption<T>[];
  onChange: (value: T) => void;
  icon?: React.ReactNode;
  activeColorClass?: string;
  align?: "left" | "right";
}

function FilterDropdown<T extends string>({
  label,
  value,
  defaultValue,
  options,
  onChange,
  icon,
  activeColorClass = "border-accent/50 bg-accent/15 text-accent ring-1 ring-accent/30",
  align = "left",
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const isActive = value !== defaultValue;
  const activeOption = options.find((opt) => opt.id === value) || options[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`shadow-xs inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
          isActive
            ? `${activeColorClass} font-semibold`
            : "border-border bg-surface-1/80 text-slate-300 hover:border-slate-500 hover:bg-surface-2 hover:text-foreground"
        }`}
        title={`${label}: ${activeOption?.label || value}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {isActive ? (
          <span className="flex items-center gap-1">
            <span className="font-semibold text-slate-400">{label}:</span>
            <span className="max-w-[100px] truncate text-foreground sm:max-w-[120px]">
              {activeOption?.shortLabel || activeOption?.label || value}
            </span>
          </span>
        ) : (
          <span>{label}</span>
        )}
        {isActive ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange(defaultValue);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onChange(defaultValue);
              }
            }}
            className="ml-0.5 rounded p-0.5 text-slate-400 hover:bg-surface-3 hover:text-foreground"
            title="Reset"
            aria-label="Reset"
          >
            <X className="size-3" />
          </span>
        ) : (
          <ChevronDown
            className={`size-3 shrink-0 text-slate-400 transition-transform duration-150 ${
              isOpen ? "rotate-180 text-foreground" : ""
            }`}
          />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`glass-panel absolute z-50 mt-1.5 min-w-[190px] max-w-[260px] rounded-xl border border-border bg-surface-1/95 p-1 shadow-lg backdrop-blur-xl duration-150 animate-in fade-in zoom-in-95 ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            <div className="no-scrollbar max-h-60 space-y-0.5 overflow-y-auto py-0.5">
              {options.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    title={opt.title}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-accent/15 font-semibold text-accent"
                        : "text-slate-300 hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2 truncate">
                      {opt.icon && (
                        <span className="shrink-0 text-slate-400">
                          {opt.icon}
                        </span>
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {opt.count !== undefined && (
                        <span
                          className={`py-0.2 rounded-full px-1.5 font-mono text-[10px] ${
                            isSelected
                              ? "bg-accent/30 font-bold text-accent"
                              : "bg-surface-3 text-slate-400"
                          }`}
                        >
                          {opt.count}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="size-3.5 shrink-0 text-accent" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface ScreenerViewProps {
  reports: ReportSummary[];
  onSelectReport: (slug: string, mode?: "cockpit" | "memo") => void;
  locale?: Locale;
  isLoading?: boolean;
  initialWatchlistOnly?: boolean;
  onWatchlistFilterChange?: (watchlistOnly: boolean) => void;
  initialSector?: string;
  initialCap?: string;
}

export type MarketCapFilter = "all" | "mega" | "large" | "mid" | "small";
export type MoatFilter = "all" | "wide" | "narrow" | "none";
export type UpsideFilter =
  "all" | "undervalued" | "high-upside" | "deep-value" | "overvalued";
export type SnowflakeFilter = "all" | "exceptional" | "investment-grade";
export type SortField =
  | "upside"
  | "baseUpside"
  | "analystTarget"
  | "price"
  | "marketCap"
  | "opMargin"
  | "revGrowth"
  | "ticker"
  | "snowflake"
  | "moat"
  | "sector";
export type SortDirection = "asc" | "desc";

const SKELETON_ROWS = [
  {
    tickerW: "w-14",
    nameW: "w-32",
    sectorW: "w-14",
    moatW: "w-16",
    snowflakeW: "w-12",
    targetW: "w-14",
    baseW: "w-14",
    wfvW: "w-16",
    marginW: "w-12",
    growthW: "w-12",
  },
  {
    tickerW: "w-12",
    nameW: "w-40",
    sectorW: "w-16",
    moatW: "w-14",
    snowflakeW: "w-12",
    targetW: "w-16",
    baseW: "w-16",
    wfvW: "w-14",
    marginW: "w-10",
    growthW: "w-14",
  },
  {
    tickerW: "w-16",
    nameW: "w-28",
    sectorW: "w-14",
    moatW: "w-16",
    snowflakeW: "w-12",
    targetW: "w-12",
    baseW: "w-14",
    wfvW: "w-16",
    marginW: "w-14",
    growthW: "w-12",
  },
  {
    tickerW: "w-14",
    nameW: "w-36",
    sectorW: "w-16",
    moatW: "w-14",
    snowflakeW: "w-12",
    targetW: "w-14",
    baseW: "w-12",
    wfvW: "w-14",
    marginW: "w-12",
    growthW: "w-10",
  },
  {
    tickerW: "w-12",
    nameW: "w-24",
    sectorW: "w-14",
    moatW: "w-16",
    snowflakeW: "w-12",
    targetW: "w-16",
    baseW: "w-16",
    wfvW: "w-16",
    marginW: "w-10",
    growthW: "w-14",
  },
  {
    tickerW: "w-16",
    nameW: "w-32",
    sectorW: "w-16",
    moatW: "w-16",
    snowflakeW: "w-12",
    targetW: "w-14",
    baseW: "w-14",
    wfvW: "w-14",
    marginW: "w-12",
    growthW: "w-12",
  },
  {
    tickerW: "w-14",
    nameW: "w-36",
    sectorW: "w-14",
    moatW: "w-14",
    snowflakeW: "w-12",
    targetW: "w-12",
    baseW: "w-12",
    wfvW: "w-16",
    marginW: "w-14",
    growthW: "w-10",
  },
  {
    tickerW: "w-12",
    nameW: "w-28",
    sectorW: "w-16",
    moatW: "w-16",
    snowflakeW: "w-12",
    targetW: "w-16",
    baseW: "w-14",
    wfvW: "w-14",
    marginW: "w-10",
    growthW: "w-12",
  },
];

export interface ScreenerItemProps {
  report: ReportSummary;
  isFav: boolean;
  onToggleFav: (tickerOrSlug: string) => void;
  onSelectReport: (slug: string, mode?: "cockpit" | "memo") => void;
  onPrefetch: (slug: string) => void;
  ts: ReturnType<typeof getTranslations>["screener"];
  tHeader: ReturnType<typeof getTranslations>["header"];
  locale?: Locale;
}

export const ScreenerTableRow = React.memo(function ScreenerTableRow({
  report,
  isFav,
  onToggleFav,
  onSelectReport,
  onPrefetch,
  ts,
  tHeader,
  locale = "en",
}: ScreenerItemProps) {
  const upside = report.upsidePct ?? 0;
  const isPositive = upside >= 0;
  const price = report.currentPrice ?? 0;
  const wfv = report.weightedFairValue ?? 0;
  const baseFv = report.baseFairValue ?? 0;
  const baseUpside = report.baseUpsidePct ?? 0;
  const bear = report.bearFairValue ?? null;
  const bull = report.bullFairValue ?? null;
  const hasRange = price > 0 && bear !== null && bull !== null && bull > bear;

  const sectorId = getTickerSectorId(report.ticker, report.sector);
  const sectorDef = getSectorDefinition(sectorId);
  const sectorShortName = getSectorShortName(sectorId, locale);

  const rangeSpan = hasRange ? Math.max(bull - bear, 1) : 1;
  const pricePos = hasRange
    ? Math.min(100, Math.max(0, ((price - bear) / rangeSpan) * 100))
    : 0;
  const basePos = hasRange
    ? Math.min(100, Math.max(0, ((baseFv - bear) / rangeSpan) * 100))
    : 0;

  return (
    <tr
      className="cv-table-row group cursor-pointer transition-colors hover:bg-surface-2/70"
      onClick={() => onSelectReport(report.slug, "cockpit")}
      onMouseEnter={() => onPrefetch(report.slug)}
      onFocus={() => onPrefetch(report.slug)}
    >
      {/* Watchlist Star Toggle */}
      <td
        className="sticky left-0 z-10 w-10 border-b border-border/40 bg-surface-1 py-2.5 pl-3 pr-1 text-center group-hover:bg-surface-2/90"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(report.ticker || report.slug);
          }}
          className="group/star inline-flex items-center justify-center rounded p-1 transition-transform hover:scale-125 active:scale-95"
          title={isFav ? tHeader.removeFromWatchlist : tHeader.addToWatchlist}
          aria-label={
            isFav ? tHeader.removeFromWatchlist : tHeader.addToWatchlist
          }
        >
          <Star
            className={`size-4 transition-colors ${
              isFav
                ? "fill-amber-400 text-amber-400"
                : "text-slate-600 hover:text-amber-400"
            }`}
          />
        </button>
      </td>

      {/* Ticker & Company */}
      <td className="sticky left-10 z-10 border-b border-r border-border/40 bg-surface-1 py-2.5 pl-2 pr-3 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.25)] group-hover:bg-surface-2/90">
        <div className="flex items-center gap-2">
          <span className="shadow-xs hidden size-6 shrink-0 items-center justify-center rounded border border-border bg-surface-1 font-mono text-[11px] font-black tracking-tight text-foreground group-hover:border-accent/50 group-hover:text-accent sm:flex">
            {report.ticker || report.slug.split("-")[0]}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground group-hover:text-accent">
                {report.ticker || report.slug}
              </span>
              {report.quarter && (
                <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-400">
                  {report.quarter}
                </span>
              )}
            </div>
            <p className="max-w-[100px] truncate text-[11px] text-slate-400 sm:max-w-[125px] xl:max-w-[150px]">
              {report.company || report.slug}
            </p>
          </div>
        </div>
      </td>

      {/* Sector */}
      <td className="whitespace-nowrap border-b border-border/40 p-2.5">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/80 px-2 py-0.5 text-[11px] font-medium text-slate-300"
          title={getSectorName(sectorId, locale)}
        >
          {renderSectorIcon(
            sectorDef?.iconName || "Layers",
            "size-3 text-slate-400"
          )}
          <span>{sectorShortName}</span>
        </span>
      </td>

      {/* Economic Moat */}
      <td className="whitespace-nowrap border-b border-border/40 p-2.5">
        {report.moatRating ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                report.moatRating.toLowerCase() === "wide"
                  ? "border border-indigo-500/30 bg-indigo-500/15 text-indigo-300"
                  : "border border-sky-500/30 bg-sky-500/10 text-sky-300"
              }`}
            >
              <Shield className="size-2.5" />
              {report.moatRating}
            </span>
            {report.moatTrend && (
              <span
                className={`hidden font-mono text-[11px] font-bold sm:inline ${
                  report.moatTrend === "Widening"
                    ? "text-emerald-400"
                    : report.moatTrend === "Narrowing"
                      ? "text-rose-400"
                      : "text-slate-400"
                }`}
                title={`${report.moatTrend} Moat Trend`}
              >
                {report.moatTrend === "Widening"
                  ? "↗"
                  : report.moatTrend === "Narrowing"
                    ? "↘"
                    : "→"}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )}
      </td>

      {/* Snowflake Fundamental Radar & Score */}
      <td className="whitespace-nowrap border-b border-border/40 p-2.5">
        {report.snowflakeScore !== undefined ? (
          <div
            className="flex items-center gap-2"
            title={
              report.snowflakePillars
                ? `${report.snowflakeScore}/30 5-Pillar Snowflake Audit\n• Valuation: ${report.snowflakePillars.valuation}/6\n• Future Growth: ${report.snowflakePillars.future}/6\n• Earnings Quality: ${report.snowflakePillars.earnings}/6\n• Economic Moat: ${report.snowflakePillars.moat}/6\n• Resilience Floor: ${report.snowflakePillars.resilience}/6`
                : `${report.snowflakeScore}/30 Snowflake Radar`
            }
          >
            <MiniSnowflakeRadar
              score={report.snowflakeScore}
              tier={report.snowflakeTier}
              pillars={report.snowflakePillars}
              size={28}
            />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-0.5">
                <span className="font-mono text-xs font-bold text-foreground">
                  {report.snowflakeScore}
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  /30
                </span>
              </div>
              <span
                className={`font-mono text-[11px] font-bold uppercase tracking-wider ${
                  report.snowflakeScore >= 24
                    ? "text-emerald-600 dark:text-emerald-400"
                    : report.snowflakeScore >= 18
                      ? "text-sky-600 dark:text-cyan-400"
                      : report.snowflakeScore >= 12
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {report.snowflakeTier ?? "balanced"}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )}
      </td>

      {/* Current Stock Price & Market Cap */}
      <td className="whitespace-nowrap border-b border-border/40 p-2.5 text-right font-mono text-xs tabular-nums sm:text-sm">
        <div className="font-semibold text-foreground">
          {price > 0 ? formatCurrency(price) : "—"}
        </div>
        {report.marketCap && report.marketCap > 0 ? (
          <div
            className="text-[10px] font-normal text-slate-400"
            title={`${ts.colMarketCap}: ${formatMarketCap(report.marketCap)}`}
          >
            {formatMarketCap(report.marketCap)}
          </div>
        ) : null}
      </td>

      {/* Analyst Consensus Target */}
      <td className="whitespace-nowrap border-b border-border/40 p-2.5 text-right font-mono">
        {report.analystTarget && report.analystTarget > 0 ? (
          <div
            title={
              report.analystCount
                ? `${report.analystCount} ${ts.analystsLabel}${
                    report.analystRating ? ` · ${report.analystRating}` : ""
                  }`
                : undefined
            }
          >
            <div className="font-mono text-xs font-medium tabular-nums text-slate-200 sm:text-sm">
              {formatCurrency(report.analystTarget)}
            </div>
            <div className="flex items-center justify-end gap-1 font-mono text-[11px] tabular-nums">
              {report.analystUpsidePct !== undefined && (
                <span
                  className={
                    report.analystUpsidePct >= 0
                      ? "font-medium text-emerald-400"
                      : "font-medium text-rose-400"
                  }
                >
                  {report.analystUpsidePct >= 0 ? "+" : ""}
                  {report.analystUpsidePct.toFixed(1)}%
                </span>
              )}
              {report.analystRating && (
                <span className="hidden text-[11px] text-slate-400 2xl:inline">
                  • {report.analystRating}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>

      {/* Base Fair Value & Upside */}
      <td className="whitespace-nowrap border-b border-border/40 p-2.5 text-right font-mono">
        {baseFv > 0 ? (
          <div>
            <div className="font-mono text-xs font-medium tabular-nums text-slate-200 sm:text-sm">
              {formatCurrency(baseFv)}
            </div>
            <div
              className={`font-mono text-[11px] font-medium tabular-nums ${
                baseUpside >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {baseUpside >= 0 ? "+" : ""}
              {baseUpside.toFixed(1)}%
            </div>
          </div>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>

      {/* Weighted Fair Value & Upside */}
      <td className="whitespace-nowrap border-b border-border/40 px-3 py-2.5 text-right font-mono">
        {wfv > 0 ? (
          <div>
            <div className="font-mono text-xs font-bold tabular-nums text-foreground sm:text-sm">
              {formatCurrency(wfv)}
            </div>
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                isPositive
                  ? "border border-green-500/30 bg-green-500/10 text-green-400"
                  : "border border-rose-500/30 bg-rose-500/10 text-rose-400"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="size-2.5" />
              ) : (
                <ArrowDownRight className="size-2.5" />
              )}
              {isPositive ? "+" : ""}
              {upside.toFixed(1)}%
            </span>
          </div>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>

      {/* Stress Range Bar */}
      <td
        className="min-w-[125px] max-w-[160px] border-b border-border/40 px-2.5 py-2.5"
        title={
          hasRange
            ? `${report.ticker || report.company} ${ts.colValuationRange}:\n• ${ts.bearLabel}: ${formatCurrency(bear!)}\n• ${ts.currentPriceLabel}: ${formatCurrency(price)}\n• ${ts.baseLabel}: ${formatCurrency(baseFv)}\n• ${ts.bullLabel}: ${formatCurrency(bull!)}`
            : undefined
        }
      >
        {hasRange ? (
          <div className="space-y-1">
            <div className="relative h-1.5 w-full rounded-full bg-surface-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/30 via-slate-500/20 to-emerald-500/30" />
              <div
                style={{ left: `${basePos}%` }}
                className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300 bg-sky-400 shadow-sm"
                title={`${ts.colBaseFairValue}: ${formatCurrency(baseFv)}`}
              />
              <div
                style={{ left: `${pricePos}%` }}
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-accent shadow ring-2 ring-accent/30"
                title={`${ts.currentPriceLabel}: ${formatCurrency(price)}`}
              />
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-slate-400">
              <span title={`${ts.bearLabel}: ${formatCurrency(bear!)}`}>
                ${Math.round(bear!)}
              </span>
              <span
                className="flex items-center gap-1 font-mono text-[11px] text-slate-400"
                title={`${ts.colBaseFairValue}: ${formatCurrency(baseFv)}`}
              >
                <span className="size-1.5 rounded-full bg-sky-400" />$
                {Math.round(baseFv)}
              </span>
              <span title={`${ts.bullLabel}: ${formatCurrency(bull!)}`}>
                ${Math.round(bull!)}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>

      {/* Operating Margin */}
      <td className="whitespace-nowrap border-b border-border/40 p-2.5 text-right font-mono text-xs tabular-nums text-slate-300 sm:text-sm">
        {report.operatingMarginPct !== undefined ? (
          <span>{report.operatingMarginPct.toFixed(1)}%</span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>

      {/* Revenue Growth */}
      <td className="whitespace-nowrap border-b border-border/40 py-2.5 pl-2 pr-3 text-right font-mono text-xs tabular-nums sm:text-sm">
        {report.revenueGrowthPct !== undefined ? (
          <span
            className={
              report.revenueGrowthPct >= 0 ? "text-slate-200" : "text-rose-400"
            }
          >
            {report.revenueGrowthPct >= 0 ? "+" : ""}
            {report.revenueGrowthPct.toFixed(1)}%
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>
    </tr>
  );
});

export const ScreenerCard = React.memo(function ScreenerCard({
  report,
  isFav,
  onToggleFav,
  onSelectReport,
  onPrefetch,
  ts,
  tHeader,
  locale = "en",
}: ScreenerItemProps) {
  const upside = report.upsidePct ?? 0;
  const isPositive = upside >= 0;
  const price = report.currentPrice ?? 0;
  const wfv = report.weightedFairValue ?? 0;
  const baseFv = report.baseFairValue ?? 0;
  const baseUpside = report.baseUpsidePct ?? 0;
  const bear = report.bearFairValue ?? null;
  const bull = report.bullFairValue ?? null;
  const hasRange = price > 0 && bear !== null && bull !== null && bull > bear;

  const sectorId = getTickerSectorId(report.ticker, report.sector);
  const sectorDef = getSectorDefinition(sectorId);
  const sectorShortName = getSectorShortName(sectorId, locale);

  const rangeSpan = hasRange ? Math.max(bull - bear, 1) : 1;
  const pricePos = hasRange
    ? Math.min(100, Math.max(0, ((price - bear) / rangeSpan) * 100))
    : 0;
  const basePos = hasRange
    ? Math.min(100, Math.max(0, ((baseFv - bear) / rangeSpan) * 100))
    : 0;

  return (
    <div
      onClick={() => onSelectReport(report.slug, "cockpit")}
      onMouseEnter={() => onPrefetch(report.slug)}
      onFocus={() => onPrefetch(report.slug)}
      className="glass-panel cv-grid-card group relative flex cursor-pointer flex-col justify-between rounded-xl p-4 transition-[border-color,background-color] duration-150 hover:border-accent/40 hover:bg-surface-2/60 active:scale-[0.99]"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFav(report.ticker || report.slug);
              }}
              className="-ml-1 shrink-0 p-1 text-slate-400 transition-colors hover:text-amber-400"
              title={
                isFav ? tHeader.removeFromWatchlist : tHeader.addToWatchlist
              }
              aria-label={
                isFav ? tHeader.removeFromWatchlist : tHeader.addToWatchlist
              }
            >
              <Star
                className={`size-4 ${
                  isFav
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-600 group-hover:text-slate-400"
                }`}
              />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-base font-black tracking-tight text-foreground group-hover:text-accent">
                  {report.ticker || report.slug.split("-")[0]}
                </span>
                {report.quarter && (
                  <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-400">
                    {report.quarter}
                  </span>
                )}
              </div>
              <p className="max-w-[150px] truncate text-xs text-slate-400 sm:max-w-[180px]">
                {report.company || report.slug}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-0/80 px-2 py-0.5 text-[11px] font-medium text-slate-300"
              title={getSectorName(sectorId, locale)}
            >
              {renderSectorIcon(
                sectorDef?.iconName || "Layers",
                "size-2.5 text-slate-400"
              )}
              <span>{sectorShortName}</span>
            </span>
            {report.moatRating && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  report.moatRating.toLowerCase() === "wide"
                    ? "border border-indigo-500/30 bg-indigo-500/15 text-indigo-300"
                    : "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                }`}
                title={ts.colMoatTooltip}
              >
                <Shield className="size-2.5" />
                <span>{report.moatRating}</span>
                {report.moatTrend && (
                  <span
                    className="font-mono text-[11px]"
                    title={`${report.moatTrend} Moat Trend`}
                  >
                    {report.moatTrend === "Widening"
                      ? "↗"
                      : report.moatTrend === "Narrowing"
                        ? "↘"
                        : "→"}
                  </span>
                )}
              </span>
            )}
            {report.snowflakeScore !== undefined && (
              <div
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-0/60 px-1.5 py-1"
                title={ts.colSnowflakeTooltip}
              >
                <MiniSnowflakeRadar
                  score={report.snowflakeScore}
                  tier={report.snowflakeTier}
                  pillars={report.snowflakePillars}
                  size={22}
                />
                <span className="font-mono text-xs font-bold text-foreground">
                  {report.snowflakeScore}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-lg border border-border bg-surface-0/60 p-2.5">
          <div title={ts.colPriceTooltip}>
            <div className="text-[11px] font-medium text-slate-400">
              {ts.colPrice}
            </div>
            <div className="font-mono text-xs font-bold text-slate-200">
              {price > 0 ? formatCurrency(price) : "—"}
            </div>
          </div>
          <div title={ts.colBaseFairValueTooltip}>
            <div className="text-[11px] font-medium text-slate-400">
              {ts.colBaseFairValue}
            </div>
            <div className="font-mono text-xs font-semibold text-slate-300">
              {baseFv > 0 ? formatCurrency(baseFv) : "—"}
            </div>
            {baseFv > 0 && (
              <div
                className={`font-mono text-[11px] ${
                  baseUpside >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {baseUpside >= 0 ? "+" : ""}
                {baseUpside.toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-right" title={ts.colWeightedFairValueTooltip}>
            <div className="text-[11px] font-bold text-accent">
              {ts.colWeightedFairValue}
            </div>
            <div className="font-mono text-xs font-extrabold text-foreground">
              {wfv > 0 ? formatCurrency(wfv) : "—"}
            </div>
            {wfv > 0 && (
              <div
                className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-mono text-[11px] font-bold ${
                  isPositive ? "text-green-400" : "text-rose-400"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="size-2.5" />
                ) : (
                  <ArrowDownRight className="size-2.5" />
                )}
                {isPositive ? "+" : ""}
                {upside.toFixed(1)}%
              </div>
            )}
          </div>
        </div>

        {hasRange && (
          <div className="mt-3 space-y-1">
            <div className="relative h-1.5 w-full rounded-full bg-surface-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/30 via-slate-500/20 to-emerald-500/30" />
              <div
                style={{ left: `${basePos}%` }}
                className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300 bg-sky-400 shadow-sm"
                title={`${ts.colBaseFairValue}: ${formatCurrency(baseFv)}`}
              />
              <div
                style={{ left: `${pricePos}%` }}
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-accent shadow ring-2 ring-accent/30"
                title={`${ts.currentPriceLabel}: ${formatCurrency(price)}`}
              />
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-slate-400">
              <span>${Math.round(bear!)}</span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="size-1.5 rounded-full bg-sky-400" />$
                {Math.round(baseFv)}
              </span>
              <span>${Math.round(bull!)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-[11px]">
        <div className="flex items-center gap-2.5 font-mono text-[11px] text-slate-400">
          {report.marketCap && report.marketCap > 0 && (
            <span>
              Cap:{" "}
              <strong className="font-bold text-slate-200">
                {formatMarketCap(report.marketCap)}
              </strong>
            </span>
          )}
          {report.operatingMarginPct !== undefined && (
            <span>
              OpM:{" "}
              <strong className="font-bold text-slate-200">
                {report.operatingMarginPct.toFixed(0)}%
              </strong>
            </span>
          )}
          {report.analystTarget && report.analystTarget > 0 && (
            <span>
              Target:{" "}
              <strong className="font-bold text-slate-200">
                ${Math.round(report.analystTarget)}
              </strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectReport(report.slug, "memo");
            }}
            className="rounded px-2 py-1 text-[11px] font-semibold text-slate-400 transition-colors hover:bg-surface-3 hover:text-white"
          >
            {ts.openMemo}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectReport(report.slug, "cockpit");
            }}
            className="rounded border border-accent/30 bg-accent/15 px-2 py-1 text-[11px] font-bold text-accent transition-colors hover:bg-accent/25"
          >
            {ts.openCockpit}
          </button>
        </div>
      </div>
    </div>
  );
});

export const ScreenerView: React.FC<ScreenerViewProps> = React.memo(
  function ScreenerView({
    reports,
    onSelectReport,
    locale = "en",
    isLoading = false,
    initialWatchlistOnly = false,
    onWatchlistFilterChange,
    initialSector,
    initialCap,
  }: ScreenerViewProps) {
    const t = useMemo(() => getTranslations(locale), [locale]);
    const ts = useMemo(() => t.screener, [t]);
    const tHeader = useMemo(() => t.header, [t]);
    const { prefetchReport } = useReportPrefetch();

    const {
      isFavorite,
      toggleFavorite,
      count: watchlistCount,
    } = useWatchlist();
    const handleToggleFav = useCallback(
      (tickerOrSlug: string) => toggleFavorite(tickerOrSlug),
      [toggleFavorite]
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [watchlistOnly, setWatchlistOnly] =
      useState<boolean>(initialWatchlistOnly);
    const [prevInitialWatchlist, setPrevInitialWatchlist] =
      useState<boolean>(initialWatchlistOnly);

    if (prevInitialWatchlist !== initialWatchlistOnly) {
      setPrevInitialWatchlist(initialWatchlistOnly);
      setWatchlistOnly(initialWatchlistOnly);
    }

    const handleToggleWatchlistOnly = (val: boolean) => {
      setWatchlistOnly(val);
      onWatchlistFilterChange?.(val);
    };

    const [selectedSector, setSelectedSector] = useState<string>(() => {
      if (initialSector) return initialSector;
      if (typeof window !== "undefined") {
        try {
          const params = new URLSearchParams(window.location.search);
          const s = params.get("sector");
          if (s) return s;
        } catch {}
      }
      return "all";
    });
    const [marketCapFilter, setMarketCapFilter] = useState<MarketCapFilter>(
      () => {
        if (
          initialCap &&
          ["mega", "large", "mid", "small"].includes(initialCap)
        ) {
          return initialCap as MarketCapFilter;
        }
        if (typeof window !== "undefined") {
          try {
            const params = new URLSearchParams(window.location.search);
            const c = params.get("cap");
            if (c && ["mega", "large", "mid", "small"].includes(c)) {
              return c as MarketCapFilter;
            }
          } catch {}
        }
        return "all";
      }
    );
    const [moatFilter, setMoatFilter] = useState<MoatFilter>("all");
    const [upsideFilter, setUpsideFilter] = useState<UpsideFilter>("all");
    const [snowflakeFilter, setSnowflakeFilter] =
      useState<SnowflakeFilter>("all");
    const [sortField, setSortField] = useState<SortField>("upside");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [viewMode, setViewMode] = useState<"cards" | "table">("table");

    // Restore saved viewMode preference on client mount to prevent SSR hydration mismatch
    useEffect(() => {
      try {
        const saved = localStorage.getItem("stress_alpha_screener_view_mode");
        if (saved === "cards" || saved === "table") {
          Promise.resolve().then(() => setViewMode(saved));
        } else if (window.innerWidth < 768) {
          Promise.resolve().then(() => setViewMode("cards"));
        }
      } catch {}
    }, []);

    const handleSetViewMode = (mode: "cards" | "table") => {
      setViewMode(mode);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("stress_alpha_screener_view_mode", mode);
        } catch {}
      }
    };

    const hasActiveFilters = Boolean(
      searchQuery ||
      selectedSector !== "all" ||
      marketCapFilter !== "all" ||
      moatFilter !== "all" ||
      upsideFilter !== "all" ||
      snowflakeFilter !== "all" ||
      watchlistOnly
    );

    const handleResetFilters = () => {
      setSearchQuery("");
      setSelectedSector("all");
      setMarketCapFilter("all");
      setMoatFilter("all");
      setUpsideFilter("all");
      setSnowflakeFilter("all");
      handleToggleWatchlistOnly(false);
    };

    // Group reports by unique ticker symbol, selecting the latest report as default primary
    const uniqueReports = useMemo(
      () => deduplicateReportsToLatest(reports),
      [reports]
    );

    // Dynamic sector counts scoped to watchlist (if active)
    const sectorCounts = useMemo(() => {
      const baseList = watchlistOnly
        ? uniqueReports.filter((r) => isFavorite(r.ticker || r.slug))
        : uniqueReports;

      const counts: Record<string, number> = { all: baseList.length };
      for (const r of baseList) {
        const secId = getTickerSectorId(r.ticker, r.sector);
        counts[secId] = (counts[secId] || 0) + 1;
      }
      return counts;
    }, [uniqueReports, watchlistOnly, isFavorite]);

    // Dynamic market cap tier counts scoped to watchlist (if active)
    const marketCapCounts = useMemo(() => {
      const baseList = watchlistOnly
        ? uniqueReports.filter((r) => isFavorite(r.ticker || r.slug))
        : uniqueReports;

      const counts = {
        all: baseList.length,
        mega: 0,
        large: 0,
        mid: 0,
        small: 0,
      };
      for (const r of baseList) {
        const cap = r.marketCap;
        if (!cap || isNaN(cap) || cap <= 0) continue;
        const capB = cap >= 1e6 ? cap / 1e9 : cap;
        if (capB >= 200) counts.mega++;
        else if (capB >= 10) counts.large++;
        else if (capB >= 2) counts.mid++;
        else counts.small++;
      }
      return counts;
    }, [uniqueReports, watchlistOnly, isFavorite]);

    // Summary statistics (dynamically scoped to watchlist when watchlistOnly is active)
    const stats = useMemo(() => {
      const baseList = watchlistOnly
        ? uniqueReports.filter((r) => isFavorite(r.ticker || r.slug))
        : uniqueReports;

      if (baseList.length === 0) {
        return {
          count: 0,
          avgUpside: 0,
          topPick: null as ReportSummary | null,
          wideMoatCount: 0,
        };
      }

      const validUpsides = baseList
        .map((r) => r.upsidePct)
        .filter((u): u is number => typeof u === "number" && !isNaN(u));
      const avgUpside =
        validUpsides.length > 0
          ? validUpsides.reduce((a, b) => a + b, 0) / validUpsides.length
          : 0;

      let topPick: ReportSummary | null = null;
      let maxUpside = -Infinity;
      let wideMoatCount = 0;

      for (const r of baseList) {
        if (typeof r.upsidePct === "number" && r.upsidePct > maxUpside) {
          maxUpside = r.upsidePct;
          topPick = r;
        }
        if (r.moatRating?.toLowerCase() === "wide") {
          wideMoatCount += 1;
        }
      }

      return {
        count: baseList.length,
        avgUpside,
        topPick,
        wideMoatCount,
      };
    }, [uniqueReports, watchlistOnly, isFavorite]);

    const isWatchlistEmpty = watchlistOnly && stats.count === 0 && !isLoading;

    // Filter and sort reports
    const filteredReports = useMemo(() => {
      return uniqueReports
        .filter((r) => {
          // Watchlist filter
          if (watchlistOnly) {
            const symbol = r.ticker || r.slug;
            if (!isFavorite(symbol)) return false;
          }

          // Sector filter
          if (selectedSector !== "all") {
            const secId = getTickerSectorId(r.ticker, r.sector);
            if (secId !== selectedSector) return false;
          }

          // Market Cap filter
          if (marketCapFilter !== "all") {
            const cap = r.marketCap ?? 0;
            if (cap <= 0) return false;
            const capB = cap >= 1e6 ? cap / 1e9 : cap;
            if (marketCapFilter === "mega" && capB < 200) return false;
            if (marketCapFilter === "large" && (capB < 10 || capB >= 200))
              return false;
            if (marketCapFilter === "mid" && (capB < 2 || capB >= 10))
              return false;
            if (marketCapFilter === "small" && (capB <= 0 || capB >= 2))
              return false;
          }

          // Text search: matches ticker, company, slug, or sector name
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchTicker = r.ticker?.toLowerCase().includes(q);
            const matchCompany = r.company?.toLowerCase().includes(q);
            const matchSlug = r.slug?.toLowerCase().includes(q);
            const secId = getTickerSectorId(r.ticker, r.sector);
            const secDef = getSectorDefinition(secId);
            const matchSector =
              secDef &&
              (secDef.nameEn.toLowerCase().includes(q) ||
                secDef.nameZh.toLowerCase().includes(q) ||
                (secDef.shortNameEn &&
                  secDef.shortNameEn.toLowerCase().includes(q)) ||
                (secDef.shortNameZh &&
                  secDef.shortNameZh.toLowerCase().includes(q)));
            if (!matchTicker && !matchCompany && !matchSlug && !matchSector)
              return false;
          }

          // Moat filter
          if (moatFilter !== "all") {
            const moat = r.moatRating?.toLowerCase() ?? "";
            if (moatFilter === "wide" && moat !== "wide") return false;
            if (moatFilter === "narrow" && moat !== "narrow") return false;
            if (moatFilter === "none" && moat !== "none" && moat !== "")
              return false;
          }

          // Upside filter
          if (upsideFilter === "undervalued") {
            if ((r.upsidePct ?? 0) <= 0) return false;
          } else if (upsideFilter === "high-upside") {
            if ((r.upsidePct ?? 0) < 20) return false;
          } else if (upsideFilter === "deep-value") {
            if ((r.upsidePct ?? 0) < 30) return false;
          } else if (upsideFilter === "overvalued") {
            if ((r.upsidePct ?? 0) >= 0) return false;
          }

          // Snowflake Quality filter
          if (snowflakeFilter === "exceptional") {
            if ((r.snowflakeScore ?? 0) < 24) return false;
          } else if (snowflakeFilter === "investment-grade") {
            if ((r.snowflakeScore ?? 0) < 18) return false;
          }

          return true;
        })
        .sort((a, b) => {
          let valA: number | string = 0;
          let valB: number | string = 0;

          switch (sortField) {
            case "upside":
              valA = a.upsidePct ?? -999;
              valB = b.upsidePct ?? -999;
              break;
            case "baseUpside":
              valA = a.baseUpsidePct ?? -999;
              valB = b.baseUpsidePct ?? -999;
              break;
            case "price":
              valA = a.currentPrice ?? 0;
              valB = b.currentPrice ?? 0;
              break;
            case "marketCap":
              valA = a.marketCap ?? 0;
              valB = b.marketCap ?? 0;
              break;
            case "sector": {
              const secA = getSectorShortName(
                getTickerSectorId(a.ticker, a.sector),
                locale
              );
              const secB = getSectorShortName(
                getTickerSectorId(b.ticker, b.sector),
                locale
              );
              valA = secA;
              valB = secB;
              break;
            }
            case "analystTarget":
              valA =
                a.analystUpsidePct ??
                (a.analystTarget && a.currentPrice && a.currentPrice > 0
                  ? ((a.analystTarget - a.currentPrice) / a.currentPrice) * 100
                  : -999);
              valB =
                b.analystUpsidePct ??
                (b.analystTarget && b.currentPrice && b.currentPrice > 0
                  ? ((b.analystTarget - b.currentPrice) / b.currentPrice) * 100
                  : -999);
              break;
            case "opMargin":
              valA = a.operatingMarginPct ?? -999;
              valB = b.operatingMarginPct ?? -999;
              break;
            case "revGrowth":
              valA = a.revenueGrowthPct ?? -999;
              valB = b.revenueGrowthPct ?? -999;
              break;
            case "ticker":
              valA = a.ticker || a.slug;
              valB = b.ticker || b.slug;
              break;
            case "snowflake":
              valA = a.snowflakeScore ?? -1;
              valB = b.snowflakeScore ?? -1;
              break;
            case "moat": {
              const moatRank = (r?: string) => {
                const m = r?.toLowerCase();
                if (m === "wide") return 2;
                if (m === "narrow") return 1;
                return 0;
              };
              valA = moatRank(a.moatRating);
              valB = moatRank(b.moatRating);
              break;
            }
          }

          if (typeof valA === "string" && typeof valB === "string") {
            return sortDirection === "asc"
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA);
          }

          return sortDirection === "asc"
            ? (valA as number) - (valB as number)
            : (valB as number) - (valA as number);
        });
    }, [
      uniqueReports,
      searchQuery,
      watchlistOnly,
      isFavorite,
      selectedSector,
      marketCapFilter,
      moatFilter,
      upsideFilter,
      snowflakeFilter,
      sortField,
      sortDirection,
      locale,
    ]);

    const handleSort = (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection(
          field === "ticker" || field === "sector" ? "asc" : "desc"
        );
      }
    };

    // Progressive rendering batch size for cards view (mobile)
    const [visibleCount, setVisibleCount] = useState(SCREENER_PAGE_SIZE);
    const observerTargetRef = useRef<HTMLDivElement | null>(null);

    // Virtual windowing for table view (desktop): renders ~30 rows in DOM at any scroll position
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const [tableScrollTop, setTableScrollTop] = useState(0);
    const [tableContainerHeight, setTableContainerHeight] = useState(550);
    const tableRafRef = useRef<number | null>(null);

    // Track table container viewport height via ResizeObserver
    useEffect(() => {
      const el = tableContainerRef.current;
      if (!el) return;
      setTableContainerHeight(el.clientHeight || 550);
      const ro = new ResizeObserver((entries) => {
        if (entries[0]) {
          setTableContainerHeight(entries[0].contentRect.height || 550);
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [viewMode]);

    const handleTableScroll = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (tableRafRef.current) cancelAnimationFrame(tableRafRef.current);
        tableRafRef.current = requestAnimationFrame(() => {
          setTableScrollTop(target.scrollTop);
        });
      },
      []
    );

    // Reset visible count and table scroll when filters or sorting change
    const filterKey = `${searchQuery}|${selectedSector}|${marketCapFilter}|${moatFilter}|${upsideFilter}|${snowflakeFilter}|${sortField}|${sortDirection}|${watchlistOnly}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (prevFilterKey !== filterKey) {
      setPrevFilterKey(filterKey);
      setVisibleCount(SCREENER_PAGE_SIZE);
      setTableScrollTop(0);
    }

    useEffect(() => {
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    }, [filterKey]);

    const displayedReports = useMemo(() => {
      return filteredReports.slice(0, visibleCount);
    }, [filteredReports, visibleCount]);

    // Table virtual slice calculation (fixed 67px row height with 12 overscan rows)
    const ROW_HEIGHT = 67;
    const OVERSCAN = 12;
    const totalTableRows = filteredReports.length;

    const tableStartIndex = Math.max(
      0,
      Math.floor(tableScrollTop / ROW_HEIGHT) - OVERSCAN
    );
    const tableEndIndex = Math.min(
      totalTableRows,
      Math.ceil((tableScrollTop + tableContainerHeight) / ROW_HEIGHT) + OVERSCAN
    );

    const virtualTableRows = useMemo(() => {
      return filteredReports.slice(tableStartIndex, tableEndIndex);
    }, [filteredReports, tableStartIndex, tableEndIndex]);

    const topTableSpacerHeight = tableStartIndex * ROW_HEIGHT;
    const bottomTableSpacerHeight = Math.max(
      0,
      (totalTableRows - tableEndIndex) * ROW_HEIGHT
    );

    const handleLoadAll = useCallback(() => {
      setVisibleCount(filteredReports.length);
    }, [filteredReports.length]);

    useEffect(() => {
      const el = observerTargetRef.current;
      if (!el || visibleCount >= filteredReports.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setVisibleCount((prev) =>
              Math.min(prev + SCREENER_PAGE_SIZE, filteredReports.length)
            );
          }
        },
        { rootMargin: "400px" }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [visibleCount, filteredReports.length]);

    const renderSortIcon = (field: SortField) => {
      if (sortField === field) {
        return sortDirection === "asc" ? (
          <ArrowUp className="size-3 shrink-0 text-accent" />
        ) : (
          <ArrowDown className="size-3 shrink-0 text-accent" />
        );
      }
      return (
        <ArrowUpDown className="size-3 shrink-0 text-slate-400 opacity-40 transition-opacity group-hover/th:opacity-100" />
      );
    };

    const renderCardsView = () => {
      if (isLoading) {
        return (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-panel space-y-3.5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-8 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-0/60 p-2.5">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        );
      }

      if (filteredReports.length === 0) {
        return (
          <div className="glass-panel rounded-xl px-4 py-16 text-center text-slate-400">
            {watchlistOnly ? (
              <div className="flex flex-col items-center gap-2">
                <Star className="size-6 text-amber-400" />
                <h3 className="text-base font-bold text-foreground">
                  {ts.watchlistEmptyTitle}
                </h3>
                <p className="mx-auto max-w-sm text-pretty text-xs leading-relaxed text-slate-400">
                  {ts.watchlistEmptyDesc}
                </p>
                <button
                  type="button"
                  onClick={() => handleToggleWatchlistOnly(false)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/15 px-3.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/25"
                >
                  {ts.viewAllReports}
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">{ts.noResults}</p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-3 rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs text-accent hover:bg-surface-2"
                >
                  {ts.resetFilters}
                </button>
              </>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {displayedReports.map((report) => (
              <ScreenerCard
                key={report.slug}
                report={report}
                isFav={isFavorite(report.ticker || report.slug)}
                onToggleFav={handleToggleFav}
                onSelectReport={onSelectReport}
                onPrefetch={prefetchReport}
                ts={ts}
                tHeader={tHeader}
                locale={locale}
              />
            ))}
          </div>

          {visibleCount < filteredReports.length && (
            <div
              ref={observerTargetRef}
              className="flex items-center justify-center gap-3 py-4"
            >
              <span className="font-mono text-xs tabular-nums text-slate-400">
                {ts.resultsCount(
                  displayedReports.length,
                  filteredReports.length
                )}
              </span>
              <button
                type="button"
                onClick={handleLoadAll}
                className="rounded-lg border border-border bg-surface-2 px-3 py-1 font-mono text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-surface-3"
              >
                {ts.loadAll(filteredReports.length)}
              </button>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="mx-auto w-full max-w-[1520px] space-y-6 px-3 py-4 sm:p-6">
        {/* Header Banner */}
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2.5">
              <BarChart3 className="size-5 text-accent" />
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {ts.title}
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              {ts.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <Skeleton className="h-6 w-24 rounded-md" />
            ) : !isWatchlistEmpty ? (
              <span className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-xs font-semibold text-accent">
                {stats.count} {ts.statsCoverage}
              </span>
            ) : null}
          </div>
        </div>

        {/* KPI Telemetry Strip */}
        {!isWatchlistEmpty && (
          <div className="glass-panel shadow-xs grid grid-cols-2 divide-y divide-border/60 overflow-hidden rounded-xl border border-border bg-surface-1/90 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {/* Coverage Count */}
            <div className="p-3.5 sm:p-4">
              <div className="text-slate-400">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {ts.statsCoverage}
                </span>
              </div>
              {isLoading ? (
                <>
                  <Skeleton className="mt-3 h-8 w-16" />
                  <Skeleton className="mt-2 h-3.5 w-24" />
                </>
              ) : (
                <>
                  <div className="mt-2 font-mono text-2xl font-black text-foreground sm:text-3xl">
                    {stats.count}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {`${stats.wideMoatCount} ${ts.wideMoat}`}
                  </p>
                </>
              )}
            </div>

            {/* Avg Upside */}
            <div className="p-3.5 sm:p-4">
              <div className="text-slate-400">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {ts.statsAvgUpside}
                </span>
              </div>
              {isLoading ? (
                <>
                  <Skeleton className="mt-3 h-8 w-24" />
                  <Skeleton className="mt-2 h-3.5 w-32" />
                </>
              ) : (
                <>
                  <div
                    className={`mt-2 font-mono text-2xl font-black sm:text-3xl ${
                      stats.avgUpside >= 0
                        ? "text-fintech-green"
                        : "text-fintech-red"
                    }`}
                  >
                    {stats.avgUpside >= 0 ? "+" : ""}
                    {stats.avgUpside.toFixed(1)}%
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {ts.statsAvgUpsideSub}
                  </p>
                </>
              )}
            </div>

            {/* Highest Upside Pick */}
            <div
              className={`p-3.5 sm:p-4 ${
                stats.topPick && !isLoading
                  ? "cursor-pointer transition-colors hover:bg-surface-2/40"
                  : ""
              }`}
              onClick={() =>
                !isLoading &&
                stats.topPick &&
                onSelectReport(stats.topPick.slug, "cockpit")
              }
              onMouseEnter={() => {
                if (stats.topPick && !isLoading) {
                  prefetchReport(stats.topPick.slug);
                }
              }}
              title={
                stats.topPick && !isLoading
                  ? ts.openCockpitTooltip(
                      stats.topPick.ticker || stats.topPick.slug
                    )
                  : undefined
              }
            >
              <div className="text-slate-400">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {ts.statsTopPick}
                </span>
              </div>
              {isLoading ? (
                <>
                  <Skeleton className="mt-3 h-8 w-28" />
                  <Skeleton className="mt-2 h-3.5 w-24" />
                </>
              ) : (
                <>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-black text-foreground sm:text-3xl">
                      {stats.topPick?.ticker || "—"}
                    </span>
                    {stats.topPick?.upsidePct !== undefined && (
                      <span
                        className={`font-mono text-sm font-bold ${
                          stats.topPick.upsidePct >= 0
                            ? "text-fintech-green"
                            : "text-fintech-red"
                        }`}
                      >
                        {stats.topPick.upsidePct >= 0 ? "+" : ""}
                        {stats.topPick.upsidePct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-400">
                    {stats.topPick?.company || "—"}
                  </p>
                </>
              )}
            </div>

            {/* Wide Moat Share */}
            <div className="p-3.5 sm:p-4">
              <div className="text-slate-400">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {ts.statsWideMoat}
                </span>
              </div>
              {isLoading ? (
                <>
                  <Skeleton className="mt-3 h-8 w-16" />
                  <Skeleton className="mt-2 h-3.5 w-24" />
                </>
              ) : (
                <>
                  <div className="mt-2 font-mono text-2xl font-black text-foreground sm:text-3xl">
                    {stats.count > 0
                      ? `${Math.round((stats.wideMoatCount / stats.count) * 100)}%`
                      : "0%"}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {ts.statsWideMoatSub(stats.wideMoatCount, stats.count)}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Screener Controls Cockpit Panel */}
        {!isWatchlistEmpty && (
          <div className="glass-panel rounded-xl border border-border p-2 sm:p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-2.5">
              {/* Left: Search Bar + Watchlist Filter */}
              <div className="flex min-w-[200px] max-w-xs flex-1 items-center gap-1.5 sm:max-w-sm sm:gap-2">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={ts.searchPlaceholder}
                    className="w-full rounded-lg border border-border bg-surface-0/80 py-1.5 pl-9 pr-8 text-xs text-foreground placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Watchlist Filter Pill */}
                {(watchlistCount > 0 || watchlistOnly) && (
                  <button
                    type="button"
                    onClick={() => handleToggleWatchlistOnly(!watchlistOnly)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      watchlistOnly
                        ? "shadow-xs border-amber-500/50 bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                        : "border-border bg-surface-0/60 text-slate-400 hover:border-slate-500 hover:text-foreground"
                    }`}
                    title={ts.filterWatchlist}
                  >
                    <Star
                      className={`size-3.5 ${
                        watchlistOnly
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-400"
                      }`}
                    />
                    <span className="hidden md:inline">
                      {ts.filterWatchlist}
                    </span>
                    {watchlistCount > 0 && (
                      <span
                        className={`py-0.2 rounded-full px-1.5 font-mono text-[10px] ${
                          watchlistOnly
                            ? "bg-amber-400 font-bold text-slate-950"
                            : "bg-surface-3 text-slate-400"
                        }`}
                      >
                        {watchlistCount}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Center: The 4 Orthogonal Filter Dropdowns (Sector + Moat + Upside + Quality) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Sector Dropdown */}
                <FilterDropdown
                  label={ts.sector}
                  value={selectedSector}
                  defaultValue="all"
                  icon={<Layers className="size-3.5 text-accent" />}
                  options={[
                    {
                      id: "all",
                      label: ts.allSectors,
                      count: sectorCounts.all ?? 0,
                      icon: <Layers className="size-3.5" />,
                    },
                    ...GICS_SECTORS.map((def) => ({
                      id: def.id,
                      label: getSectorShortName(def.id, locale),
                      count: sectorCounts[def.id] || 0,
                      icon: renderSectorIcon(def.iconName, "size-3.5"),
                      title: ts.filterSectorTooltip(
                        getSectorName(def.id, locale)
                      ),
                    })),
                  ]}
                  onChange={setSelectedSector}
                  align="left"
                />

                {/* Market Cap Dropdown */}
                <FilterDropdown
                  label={ts.filterMarketCap}
                  value={marketCapFilter}
                  defaultValue="all"
                  icon={<BarChart3 className="size-3.5 text-sky-400" />}
                  activeColorClass="border-sky-500/50 bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30"
                  options={[
                    {
                      id: "all",
                      label: ts.allMarketCaps,
                      count: marketCapCounts.all,
                    },
                    {
                      id: "mega",
                      label: ts.marketCapMega,
                      shortLabel: "Mega",
                      count: marketCapCounts.mega,
                      title: ts.marketCapMegaTooltip,
                    },
                    {
                      id: "large",
                      label: ts.marketCapLarge,
                      shortLabel: "Large",
                      count: marketCapCounts.large,
                      title: ts.marketCapLargeTooltip,
                    },
                    {
                      id: "mid",
                      label: ts.marketCapMid,
                      shortLabel: "Mid",
                      count: marketCapCounts.mid,
                      title: ts.marketCapMidTooltip,
                    },
                    {
                      id: "small",
                      label: ts.marketCapSmall,
                      shortLabel: "Small",
                      count: marketCapCounts.small,
                      title: ts.marketCapSmallTooltip,
                    },
                  ]}
                  onChange={setMarketCapFilter}
                  align="left"
                />

                {/* Moat Dropdown */}
                <FilterDropdown
                  label={ts.colMoat}
                  value={moatFilter}
                  defaultValue="all"
                  icon={<Shield className="size-3.5 text-purple-400" />}
                  activeColorClass="border-purple-500/50 bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30"
                  options={[
                    {
                      id: "all",
                      label: ts.allMoats,
                      title: ts.allMoatsTooltip,
                    },
                    {
                      id: "wide",
                      label: ts.wideMoat,
                      icon: <Shield className="size-3 text-purple-400" />,
                      title: ts.wideMoatTooltip,
                    },
                    {
                      id: "narrow",
                      label: ts.narrowMoat,
                      icon: <Shield className="size-3 text-sky-400" />,
                      title: ts.narrowMoatTooltip,
                    },
                    {
                      id: "none",
                      label: ts.moatNone,
                      title: ts.moatNoneTooltip,
                    },
                  ]}
                  onChange={setMoatFilter}
                  align="left"
                />

                {/* Valuation Dropdown */}
                <FilterDropdown
                  label={ts.filterUpside}
                  value={upsideFilter}
                  defaultValue="all"
                  icon={<TrendingUp className="size-3.5 text-emerald-400" />}
                  activeColorClass="border-emerald-500/50 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                  options={[
                    {
                      id: "all",
                      label: ts.filterAll,
                      title: ts.filterAllTooltip,
                    },
                    {
                      id: "undervalued",
                      label: ts.filterUndervalued,
                      shortLabel: ">0%",
                      icon: <TrendingUp className="size-3 text-green-400" />,
                      title: ts.filterUndervaluedTooltip,
                    },
                    {
                      id: "high-upside",
                      label: ts.filterHighUpside,
                      shortLabel: ">20%",
                      icon: <TrendingUp className="size-3 text-emerald-400" />,
                      title: ts.filterHighUpsideTooltip,
                    },
                    {
                      id: "deep-value",
                      label: ts.filterDeepValue,
                      shortLabel: ">30%",
                      icon: <Sparkles className="size-3 text-amber-400" />,
                      title: ts.filterDeepValueTooltip,
                    },
                    {
                      id: "overvalued",
                      label: ts.filterOvervalued,
                      shortLabel: "<0%",
                      icon: (
                        <TrendingUp className="size-3 rotate-180 text-rose-400" />
                      ),
                      title: ts.filterOvervaluedTooltip,
                    },
                  ]}
                  onChange={setUpsideFilter}
                  align="right"
                />

                {/* Quality / Snowflake Dropdown */}
                <FilterDropdown
                  label={ts.filterQuality}
                  value={snowflakeFilter}
                  defaultValue="all"
                  icon={<CheckCircle2 className="size-3.5 text-cyan-400" />}
                  activeColorClass="border-cyan-500/50 bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                  options={[
                    { id: "all", label: ts.allQuality },
                    {
                      id: "exceptional",
                      label: ts.snowflakeExceptional,
                      shortLabel: "24+",
                      icon: <Sparkles className="size-3 text-cyan-400" />,
                      title: ts.snowflakeExceptionalTooltip,
                    },
                    {
                      id: "investment-grade",
                      label: ts.snowflakeInvestGrade,
                      shortLabel: "18+",
                      icon: <CheckCircle2 className="size-3 text-sky-400" />,
                      title: ts.snowflakeInvestGradeTooltip,
                    },
                  ]}
                  onChange={setSnowflakeFilter}
                  align="right"
                />
              </div>

              {/* Right: View Mode Toggle + Results Count + Reset */}
              <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
                {/* View Mode Toggle: Cards vs Table */}
                <div className="flex items-center rounded-lg border border-border bg-surface-0/60 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("cards")}
                    className={`flex items-center gap-1.5 rounded px-2 py-1 font-semibold transition-colors ${
                      viewMode === "cards"
                        ? "bg-accent/20 font-bold text-accent"
                        : "text-slate-400 hover:text-foreground"
                    }`}
                    title={ts.viewCards}
                  >
                    <LayoutGrid className="size-3.5" />
                    <span className="hidden lg:inline">{ts.viewCards}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("table")}
                    className={`flex items-center gap-1.5 rounded px-2 py-1 font-semibold transition-colors ${
                      viewMode === "table"
                        ? "bg-accent/20 font-bold text-accent"
                        : "text-slate-400 hover:text-foreground"
                    }`}
                    title={ts.viewTable}
                  >
                    <Table className="size-3.5" />
                    <span className="hidden lg:inline">{ts.viewTable}</span>
                  </button>
                </div>

                <div className="hidden h-4 w-px bg-border/60 sm:block" />

                {/* Results count & Reset */}
                <div className="flex items-center gap-2">
                  <span
                    className="cursor-help whitespace-nowrap font-mono text-xs tabular-nums text-slate-400 hover:text-slate-200"
                    title={ts.resultsCountTooltip(
                      filteredReports.length,
                      uniqueReports.length
                    )}
                  >
                    {ts.resultsCount(
                      filteredReports.length,
                      uniqueReports.length
                    )}
                  </span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/15 px-2 py-1 font-mono text-xs font-semibold text-accent transition-all hover:border-accent/50 hover:bg-accent/25"
                      title={ts.resetFiltersTooltip}
                      aria-label={ts.resetFiltersTooltip}
                    >
                      <RotateCcw className="size-3" />
                      <span>{ts.resetFilters}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content: Cards or Table */}
        {isWatchlistEmpty ? (
          <div className="glass-panel shadow-xs mx-auto my-8 flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-border p-8 text-center sm:p-12">
            <div className="shadow-xs flex size-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <Star className="size-6 fill-amber-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-mono text-lg font-bold text-foreground sm:text-xl">
                {ts.watchlistEmptyTitle}
              </h3>
              <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-400 sm:text-sm">
                {ts.watchlistEmptyDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleWatchlistOnly(false)}
              className="shadow-xs mt-2 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-950 transition-all hover:bg-accent-hover active:scale-[0.98]"
            >
              {ts.viewAllReports}
            </button>
          </div>
        ) : viewMode === "cards" ? (
          renderCardsView()
        ) : (
          <div className="glass-panel overflow-hidden rounded-xl border border-border">
            <div
              ref={tableContainerRef}
              onScroll={handleTableScroll}
              onWheel={(e) => {
                if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY))
                  return;
                const el = e.currentTarget;
                if (el.scrollWidth <= el.clientWidth) return;
                const atVerticalTop = el.scrollTop <= 0 && e.deltaY < 0;
                const atVerticalBottom =
                  el.scrollTop + el.clientHeight >= el.scrollHeight - 1 &&
                  e.deltaY > 0;
                if (atVerticalTop || atVerticalBottom) {
                  el.scrollLeft += e.deltaY;
                }
              }}
              tabIndex={0}
              role="region"
              aria-label="Stock Screener Table"
              className="custom-scrollbar max-h-[calc(100vh-14.5rem)] min-h-[460px] overflow-auto outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
            >
              <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-left text-xs sm:text-sm">
                <thead className="shadow-xs sticky top-0 z-20">
                  <tr className="border-b border-border bg-surface-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {/* Watchlist Star */}
                    <th
                      className="sticky left-0 top-0 z-30 w-10 whitespace-nowrap border-b border-border bg-surface-2 py-3 pl-3 pr-1 text-center"
                      title={ts.colFavorite}
                    >
                      <Star className="mx-auto size-3.5 text-slate-400" />
                    </th>

                    {/* Ticker & Company */}
                    <th
                      onClick={() => handleSort("ticker")}
                      className="group/th sticky left-10 top-0 z-30 cursor-pointer whitespace-nowrap border-b border-r border-border/40 bg-surface-2 py-3 pl-2 pr-3 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.25)] transition-colors hover:text-foreground"
                      title={ts.colTickerTooltip}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{ts.colTicker}</span>
                        {renderSortIcon("ticker")}
                      </div>
                      <div className="pointer-events-none absolute left-2 top-full z-50 mt-1 hidden w-56 whitespace-normal rounded-lg border border-border bg-surface-1/95 p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal text-slate-200 shadow-md backdrop-blur-md group-hover/th:block">
                        <div className="font-semibold text-foreground">
                          {ts.colTicker}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                          {ts.colTickerTooltip}
                        </p>
                      </div>
                    </th>

                    {/* Sector */}
                    <th
                      onClick={() => handleSort("sector")}
                      className="group/th sticky top-0 z-20 cursor-pointer whitespace-nowrap border-b border-border bg-surface-2 px-2.5 py-3 transition-colors hover:text-foreground"
                      title={ts.colSectorTooltip}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{ts.colSector}</span>
                        {renderSortIcon("sector")}
                      </div>
                      <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-56 whitespace-normal rounded-lg border border-border bg-surface-1/95 p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal text-slate-200 shadow-md backdrop-blur-md group-hover/th:block">
                        <div className="font-semibold text-foreground">
                          {ts.colSector}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                          {ts.colSectorTooltip}
                        </p>
                      </div>
                    </th>

                    {/* Moat */}
                    <th
                      onClick={() => handleSort("moat")}
                      className="group/th sticky top-0 z-20 cursor-pointer whitespace-nowrap border-b border-border bg-surface-2 px-2.5 py-3 transition-colors hover:text-foreground"
                      title={ts.colMoatTooltip}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{ts.colMoat}</span>
                        {renderSortIcon("moat")}
                      </div>
                      <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-56 whitespace-normal rounded-lg border border-border bg-surface-1/95 p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal text-slate-200 shadow-md backdrop-blur-md group-hover/th:block">
                        <div className="font-semibold text-foreground">
                          {ts.colMoat}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                          {ts.colMoatTooltip}
                        </p>
                      </div>
                    </th>

                    {/* Snowflake 30-Point Audit Radar */}
                    <th
                      onClick={() => handleSort("snowflake")}
                      className="group/th sticky top-0 z-20 cursor-pointer whitespace-nowrap border-b border-border bg-surface-2 px-2.5 py-3 transition-colors hover:text-foreground"
                      title={ts.colSnowflakeTooltip}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{ts.colSnowflake}</span>
                        {renderSortIcon("snowflake")}
                      </div>
                      <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-60 whitespace-normal rounded-lg border border-border bg-surface-1/95 p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal text-slate-200 shadow-md backdrop-blur-md group-hover/th:block">
                        <div className="font-semibold text-foreground">
                          {ts.colSnowflake}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                          {ts.colSnowflakeTooltip}
                        </p>
                      </div>
                    </th>

                    {/* Price */}
                    <th
                      onClick={() => handleSort("price")}
                      className="group/th sticky top-0 z-20 cursor-pointer whitespace-nowrap border-b border-border bg-surface-2 px-2.5 py-3 text-right transition-colors hover:text-foreground"
                      title={ts.colPriceTooltip}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{ts.colPrice}</span>
                        {renderSortIcon("price")}
                      </div>
                      <div className="pointer-events-none absolute right-0 top-full z-50 mt-1 hidden w-52 whitespace-normal rounded-lg border border-border bg-surface-1/95 p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal text-slate-200 shadow-md backdrop-blur-md group-hover/th:block">
                        <div className="font-semibold text-foreground">
                          {ts.colPrice}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                          {ts.colPriceTooltip}
                        </p>
                      </div>
                    </th>

                    {/* Analyst Consensus Target */}
                    <th
                      onClick={() => handleSort("analystTarget")}
                      className="group/th sticky top-0 z-20 cursor-pointer whitespace-nowrap border-b border-border bg-surface-2 px-2.5 py-3 text-right transition-colors hover:text-foreground"
                      title={ts.colAnalystTargetTooltip}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{ts.colAnalystTarget}</span>
                        {renderSortIcon("analystTarget")}
                      </div>
                      <div className="pointer-events-none absolute right-0 top-full z-50 mt-1 hidden w-60 whitespace-normal rounded-lg border border-border bg-surface-1/95 p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal text-slate-200 shadow-md backdrop-blur-md group-hover/th:block">
                        <div className="font-semibold text-foreground">
                          {ts.colAnalystTarget}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                          {ts.colAnalystTargetTooltip}
                        </p>
                      </div>
                    </th>

                    {/* Base Fair Value */}
                    <th
                      onClick={() => handleSort("baseUpside")}
                      className="group/th sticky top-0 z-20 cursor-pointer whitespace-nowrap border-b border-border bg-surface-2 px-2.5 py-3 text-right transition-colors hover:text-foreground"
                      title={ts.colBaseFairValueTooltip}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{ts.colBaseFairValue}</span>
                        {renderSortIcon("baseUpside")}
                      </div>
                      <div className="pointer-events-none absolute right-0 top-full z-50 mt-1 hidden w-60 whitespace-normal rounded-lg border border-border bg-surface-1/95 p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal text-slate-200 shadow-md backdrop-blur-md group-hover/th:block">
                        <div className="font-semibold text-foreground">
                          {ts.colBaseFairValue}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                          {ts.colBaseFairValueTooltip}
                        </p>
                      </div>
                    </th>

                    {/* Weighted Fair Value & Upside */}
                    <th
                      onClick={() => handleSort("upside")}
                      className="group/th sticky top-0 z-20 cursor-pointer whitespace-nowrap border-b border-border bg-surface-2 p-3 text-right transition-colors hover:text-foreground"
                      title={ts.colWeightedFairValueTooltip}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{ts.colWeightedFairValue}</span>
                        {renderSortIcon("upside")}
                      </div>
                      <div className="pointer-events-none absolute right-0 top-full z-50 mt-1 hidden w-64 whitespace-normal rounded-lg border border-border bg-surface-1/95 p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal text-slate-200 shadow-md backdrop-blur-md group-hover/th:block">
                        <div className="font-semibold text-foreground">
                          {ts.colWeightedFairValue}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                          {ts.colWeightedFairValueTooltip}
                        </p>
                      </div>
                    </th>

                    {/* Valuation Spectrum / Stress Range */}
                    <th
                      className="group/th sticky top-0 z-20 min-w-[125px] max-w-[160px] whitespace-nowrap border-b border-border bg-surface-2 px-2.5 py-3"
                      title={ts.rangeTooltip}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{ts.colValuationRange}</span>
                        <span className="hidden font-mono text-[11px] font-normal lowercase tracking-normal text-slate-400 2xl:inline">
                          {ts.rangeBearBullHint}
                        </span>
                      </div>
                      <div className="pointer-events-none absolute right-0 top-full z-50 mt-1 hidden w-60 whitespace-normal rounded-lg border border-border bg-surface-1/95 p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal text-slate-200 shadow-md backdrop-blur-md group-hover/th:block">
                        <div className="font-semibold text-foreground">
                          {ts.colValuationRange}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                          {ts.rangeTooltip}
                        </p>
                      </div>
                    </th>

                    {/* Operating Margin */}
                    <th
                      onClick={() => handleSort("opMargin")}
                      className="group/th sticky top-0 z-20 cursor-pointer whitespace-nowrap border-b border-border bg-surface-2 px-2.5 py-3 text-right transition-colors hover:text-foreground"
                      title={ts.colOperatingMarginTooltip}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{ts.colOperatingMargin}</span>
                        {renderSortIcon("opMargin")}
                      </div>
                      <div className="pointer-events-none absolute right-0 top-full z-50 mt-1 hidden w-56 whitespace-normal rounded-lg border border-border bg-surface-1/95 p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal text-slate-200 shadow-md backdrop-blur-md group-hover/th:block">
                        <div className="font-semibold text-foreground">
                          {ts.colOperatingMargin}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                          {ts.colOperatingMarginTooltip}
                        </p>
                      </div>
                    </th>

                    {/* Revenue Growth */}
                    <th
                      onClick={() => handleSort("revGrowth")}
                      className="group/th sticky top-0 z-20 cursor-pointer whitespace-nowrap border-b border-border bg-surface-2 py-3 pl-2 pr-3 text-right transition-colors hover:text-foreground"
                      title={ts.colRevenueGrowthTooltip}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{ts.colRevenueGrowth}</span>
                        {renderSortIcon("revGrowth")}
                      </div>
                      <div className="pointer-events-none absolute right-2 top-full z-50 mt-1 hidden w-56 whitespace-normal rounded-lg border border-border bg-surface-1/95 p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal text-slate-200 shadow-md backdrop-blur-md group-hover/th:block">
                        <div className="font-semibold text-foreground">
                          {ts.colRevenueGrowth}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                          {ts.colRevenueGrowthTooltip}
                        </p>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <>
                      {SKELETON_ROWS.map((row, idx) => (
                        <tr key={`skeleton-${idx}`} className="group">
                          {/* Watchlist Star Skeleton */}
                          <td className="sticky left-0 z-10 w-10 border-b border-border/40 bg-surface-1 py-2.5 pl-3 pr-1 text-center">
                            <Skeleton className="mx-auto size-4 rounded" />
                          </td>

                          {/* Ticker & Company */}
                          <td className="sticky left-10 z-10 border-b border-r border-border/40 bg-surface-1 py-2.5 pl-2 pr-3 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.25)]">
                            <div className="flex items-center gap-2.5">
                              <Skeleton className="size-7 shrink-0 rounded-lg" />
                              <div className="space-y-1.5">
                                <Skeleton className={`h-3.5 ${row.tickerW}`} />
                                <Skeleton className={`h-2.5 ${row.nameW}`} />
                              </div>
                            </div>
                          </td>

                          {/* Sector Skeleton */}
                          <td className="whitespace-nowrap border-b border-border/40 p-2.5">
                            <Skeleton
                              className={`h-5 ${row.sectorW || "w-14"} rounded-full`}
                            />
                          </td>

                          {/* Moat */}
                          <td className="whitespace-nowrap border-b border-border/40 p-2.5">
                            <Skeleton
                              className={`h-5 ${row.moatW} rounded-full`}
                            />
                          </td>

                          {/* Snowflake */}
                          <td className="whitespace-nowrap border-b border-border/40 p-2.5">
                            <div className="flex items-center gap-2">
                              <Skeleton className="size-7 shrink-0 rounded-full" />
                              <div className="space-y-1">
                                <Skeleton className="h-3 w-8" />
                                <Skeleton className="h-2 w-10" />
                              </div>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="whitespace-nowrap border-b border-border/40 p-2.5 text-right">
                            <Skeleton className="ml-auto h-4 w-14" />
                          </td>

                          {/* Analyst Target */}
                          <td className="whitespace-nowrap border-b border-border/40 p-2.5 text-right">
                            <Skeleton
                              className={`ml-auto h-4 ${row.targetW}`}
                            />
                          </td>

                          {/* Base Fair Value */}
                          <td className="whitespace-nowrap border-b border-border/40 p-2.5 text-right">
                            <Skeleton className={`ml-auto h-4 ${row.baseW}`} />
                          </td>

                          {/* Weighted Fair Value & Upside */}
                          <td className="whitespace-nowrap border-b border-border/40 px-3 py-2.5 text-right">
                            <div className="ml-auto space-y-1">
                              <Skeleton className={`ml-auto h-4 ${row.wfvW}`} />
                              <Skeleton className="ml-auto h-3 w-12 rounded-full" />
                            </div>
                          </td>

                          {/* Valuation Spectrum / Stress Range */}
                          <td className="min-w-[125px] max-w-[160px] border-b border-border/40 px-2.5 py-2.5">
                            <div className="space-y-1.5">
                              <div className="flex justify-between">
                                <Skeleton className="h-2 w-8" />
                                <Skeleton className="h-2 w-8" />
                              </div>
                              <Skeleton className="h-1.5 w-full rounded-full" />
                            </div>
                          </td>

                          {/* Operating Margin */}
                          <td className="whitespace-nowrap border-b border-border/40 p-2.5 text-right">
                            <Skeleton
                              className={`ml-auto h-4 ${row.marginW}`}
                            />
                          </td>

                          {/* Revenue Growth */}
                          <td className="whitespace-nowrap border-b border-border/40 py-2.5 pl-2 pr-3 text-right">
                            <Skeleton
                              className={`ml-auto h-4 ${row.growthW}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="border-b border-border/40 bg-surface-1 px-4 py-16 text-center text-slate-400"
                      >
                        {watchlistOnly ? (
                          <div className="flex flex-col items-center gap-2">
                            <Star className="size-6 text-amber-400" />
                            <h3 className="text-base font-bold text-foreground">
                              {ts.watchlistEmptyTitle}
                            </h3>
                            <p className="mx-auto max-w-sm text-pretty text-xs leading-relaxed text-slate-400">
                              {ts.watchlistEmptyDesc}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleToggleWatchlistOnly(false)}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/15 px-3.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/25"
                            >
                              {ts.viewAllReports}
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium">
                              {ts.noResults}
                            </p>
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="mt-3 rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs text-accent hover:bg-surface-2"
                            >
                              {ts.resetFilters}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {topTableSpacerHeight > 0 && (
                        <tr
                          style={{ height: topTableSpacerHeight }}
                          aria-hidden="true"
                        >
                          <td colSpan={12} className="border-0 p-0" />
                        </tr>
                      )}
                      {virtualTableRows.map((report) => (
                        <ScreenerTableRow
                          key={report.slug}
                          report={report}
                          isFav={isFavorite(report.ticker || report.slug)}
                          onToggleFav={handleToggleFav}
                          onSelectReport={onSelectReport}
                          onPrefetch={prefetchReport}
                          ts={ts}
                          tHeader={tHeader}
                          locale={locale}
                        />
                      ))}
                      {bottomTableSpacerHeight > 0 && (
                        <tr
                          style={{ height: bottomTableSpacerHeight }}
                          aria-hidden="true"
                        >
                          <td colSpan={12} className="border-0 p-0" />
                        </tr>
                      )}
                      <tr>
                        <td
                          colSpan={12}
                          className="border-b border-border/40 bg-surface-1/90 py-3 text-center text-xs text-slate-400"
                        >
                          <span className="font-mono text-xs tabular-nums text-slate-400">
                            {ts.resultsCount(
                              filteredReports.length,
                              filteredReports.length
                            )}
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }
);
