"use client";

import React, { useState, useMemo } from "react";
import {
  GICS_SECTORS,
  SP500_SECTOR_CONSTITUENTS,
  type SectorAggregatedStats,
  type HeatmapConstituent,
} from "@/lib/sectors";
import { squarify, type TreemapRect } from "@/lib/treemap";
import type { ReportSummary } from "@/app/api/reports/route";
import type { Locale } from "@/lib/i18n";

interface SP500TreemapProps {
  sectorStats: SectorAggregatedStats[];
  latestReports: ReportSummary[];
  onSelectReport: (slug: string, mode?: "cockpit" | "memo") => void;
  onPrefetchReport?: (slug: string) => void;
  locale?: Locale;
}

interface SectorNode {
  id: string;
  value: number; // weightPct
  name: string;
  etf: string;
  changePct: number;
}

interface StockNode {
  id: string;
  ticker: string;
  name: string;
  value: number;
  changePct: number;
  report?: ReportSummary;
  sectorId: string;
}

function getFillColor(changePct: number): { fill: string; text: string } {
  if (changePct <= -3.0) {
    return { fill: "#881337", text: "#ffe4e6" }; // Rose 900
  }
  if (changePct <= -1.5) {
    return { fill: "#9f1239", text: "#fff1f2" }; // Rose 800
  }
  if (changePct < 0) {
    return { fill: "#4c0519", text: "#fecdd3" }; // Rose 950
  }
  if (changePct >= 3.0) {
    return { fill: "#047857", text: "#ecfdf5" }; // Emerald 700
  }
  if (changePct >= 1.5) {
    return { fill: "#065f46", text: "#d1fae5" }; // Emerald 800
  }
  return { fill: "#022c22", text: "#a7f3d0" }; // Emerald 950
}

export function SP500Treemap({
  sectorStats,
  latestReports,
  onSelectReport,
  onPrefetchReport,
  locale = "en",
}: SP500TreemapProps) {
  const [hoveredStock, setHoveredStock] = useState<{
    ticker: string;
    name: string;
    changePct: number;
    report?: ReportSummary;
    clientX: number;
    clientY: number;
  } | null>(null);

  const WIDTH = 1000;
  const HEIGHT = 540;

  // Level 1: Squarify the canvas across the 11 GICS Sectors
  const sectorRects = useMemo(() => {
    const sectorItems: SectorNode[] = GICS_SECTORS.map((sec) => {
      const stat = sectorStats.find((s) => s.sector.id === sec.id);
      return {
        id: sec.id,
        value: sec.weightPct,
        name: locale === "zh" ? sec.nameZh : sec.nameEn,
        etf: sec.etf,
        changePct: stat?.changePct ?? 0,
      };
    });

    return squarify(sectorItems, { x: 0, y: 0, w: WIDTH, h: HEIGHT });
  }, [sectorStats, locale]);

  // Level 2: Inside each Sector bounding box, squarify its constituent stocks
  const stockTiles = useMemo(() => {
    const tiles: Array<{
      sector: TreemapRect<SectorNode>;
      rect: TreemapRect<StockNode>;
    }> = [];

    const reportsByTicker = new Map<string, ReportSummary>();
    for (const r of latestReports) {
      const sym = (r.ticker || r.slug.split("-")[0]).toUpperCase();
      reportsByTicker.set(sym, r);
    }

    for (const secRect of sectorRects) {
      const sectorId = secRect.item.id;
      const rawConstituents: HeatmapConstituent[] =
        SP500_SECTOR_CONSTITUENTS[sectorId] || [];

      if (rawConstituents.length === 0) continue;

      // Header height for sector name & ETF return %
      const headerH = 20;
      const innerX = secRect.x + 1.5;
      const innerY = secRect.y + headerH + 1;
      const innerW = Math.max(0, secRect.w - 3);
      const innerH = Math.max(0, secRect.h - headerH - 3);

      if (innerW <= 10 || innerH <= 10) continue;

      const stockNodes: StockNode[] = rawConstituents.map((c) => {
        const report = reportsByTicker.get(c.ticker.toUpperCase());
        const etfChange = secRect.item.changePct;
        const changePct =
          report?.priceChangePct ?? (etfChange !== 0 ? etfChange : 0);

        return {
          id: `${sectorId}-${c.ticker}`,
          ticker: c.ticker,
          name: c.name,
          value: c.weight,
          changePct,
          report,
          sectorId,
        };
      });

      const rects = squarify(stockNodes, {
        x: innerX,
        y: innerY,
        w: innerW,
        h: innerH,
      });

      for (const r of rects) {
        tiles.push({ sector: secRect, rect: r });
      }
    }

    return tiles;
  }, [sectorRects, latestReports]);

  return (
    <div className="relative w-full select-none overflow-hidden rounded-xl border border-border/80 bg-surface-0 shadow-inner">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
      >
        {/* Level 1: Sector Clusters Backgrounds & Headers */}
        {sectorRects.map((sec) => {
          const isPos = sec.item.changePct >= 0;
          return (
            <g key={sec.item.id}>
              {/* Outer Sector Border & Background Container */}
              <rect
                x={sec.x + 0.5}
                y={sec.y + 0.5}
                width={Math.max(0, sec.w - 1)}
                height={Math.max(0, sec.h - 1)}
                fill="#0b0f19"
                stroke="#1e293b"
                strokeWidth={1}
                strokeOpacity={0.6}
                rx={3}
              />

              {/* Sector Header Band */}
              {sec.w >= 60 && sec.h >= 35 && (
                <g>
                  <rect
                    x={sec.x + 1}
                    y={sec.y + 1}
                    width={Math.max(0, sec.w - 2)}
                    height={19}
                    fill="#111827"
                    fillOpacity={0.85}
                  />
                  <text
                    x={sec.x + 6}
                    y={sec.y + 13.5}
                    fill="#94a3b8"
                    fontSize={sec.w < 120 ? "9" : "10"}
                    fontWeight="bold"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {sec.w < 100
                      ? sec.item.etf
                      : sec.w < 150
                        ? sec.item.name.slice(0, 12)
                        : sec.item.name}
                  </text>
                  <text
                    x={sec.x + sec.w - 6}
                    y={sec.y + 13.5}
                    textAnchor="end"
                    fill={isPos ? "#34d399" : "#f87171"}
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {isPos ? "+" : ""}
                    {sec.item.changePct.toFixed(2)}%
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Level 2: Constituent Stock Tiles (Tiled seamlessly with zero gaps) */}
        {stockTiles.map(({ rect: r }) => {
          const { item: stock, x, y, w, h } = r;
          const isCovered = Boolean(stock.report);
          const colors = getFillColor(stock.changePct);
          const isPos = stock.changePct >= 0;

          // Padding inside cell
          const pad = 0.75;
          const cellW = Math.max(0, w - pad * 2);
          const cellH = Math.max(0, h - pad * 2);

          const isSmall = cellW < 38 || cellH < 26;
          const isMedium = cellW >= 60 && cellH >= 40;

          return (
            <g
              key={stock.id}
              className={`${isCovered ? "cursor-pointer" : "cursor-default"}`}
              onClick={() => {
                if (stock.report) {
                  onSelectReport(stock.report.slug, "cockpit");
                }
              }}
              onMouseEnter={(e) => {
                if (stock.report && onPrefetchReport) {
                  onPrefetchReport(stock.report.slug);
                }
                const svgRect =
                  e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                if (svgRect) {
                  setHoveredStock({
                    ticker: stock.ticker,
                    name: stock.name,
                    changePct: stock.changePct,
                    report: stock.report,
                    clientX: e.clientX,
                    clientY: e.clientY,
                  });
                }
              }}
              onMouseMove={(e) => {
                setHoveredStock((prev) =>
                  prev
                    ? { ...prev, clientX: e.clientX, clientY: e.clientY }
                    : null
                );
              }}
              onMouseLeave={() => setHoveredStock(null)}
            >
              {/* Tile Rectangle */}
              <rect
                x={x + pad}
                y={y + pad}
                width={cellW}
                height={cellH}
                fill={colors.fill}
                stroke="#07090e"
                strokeWidth={1}
                rx={1.5}
                className="transition-colors hover:brightness-125"
              />

              {/* Ticker & Return Label */}
              {cellW >= 24 && cellH >= 18 && (
                <text
                  x={x + cellW / 2 + pad}
                  y={
                    isSmall
                      ? y + cellH / 2 + pad + 3.5
                      : y + cellH / 2 + pad - 2
                  }
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={isSmall ? "9" : isMedium ? "12" : "10"}
                  fontWeight="bold"
                  fontFamily="monospace"
                  letterSpacing="-0.02em"
                >
                  {stock.ticker}
                </text>
              )}

              {/* % Return (shown if tile is tall enough) */}
              {!isSmall && cellH >= 30 && (
                <text
                  x={x + cellW / 2 + pad}
                  y={y + cellH / 2 + pad + 10}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize={isMedium ? "10" : "8.5"}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {isPos ? "+" : ""}
                  {stock.changePct.toFixed(2)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredStock && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-border bg-surface-1/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-md"
          style={{
            left: `${hoveredStock.clientX + 14}px`,
            top: `${hoveredStock.clientY + 14}px`,
          }}
        >
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <span className="font-mono text-sm text-accent">
              {hoveredStock.ticker}
            </span>
            <span className="text-slate-400">·</span>
            <span>{hoveredStock.name}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 font-mono">
            <span className="text-slate-400">Day Return:</span>
            <span
              className={`font-bold ${
                hoveredStock.changePct >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {hoveredStock.changePct >= 0 ? "+" : ""}
              {hoveredStock.changePct.toFixed(2)}%
            </span>
          </div>
          {hoveredStock.report && (
            <div className="mt-1.5 border-t border-border/50 pt-1.5">
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-slate-400">WFV Upside:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{hoveredStock.report.upsidePct?.toFixed(1) || "0"}%
                </span>
              </div>
              <div className="mt-1 font-sans text-[10px] text-accent">
                Click to launch interactive Cockpit model
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
