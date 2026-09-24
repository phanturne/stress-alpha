"use client";

import React, { useMemo, useState } from "react";
import type {
  SnowflakeAxisId,
  SnowflakePillar,
  SnowflakeScoreResult,
} from "@/lib/snowflake";
import type { Locale } from "@/lib/i18n";

export interface SnowflakeRadarProps {
  scoreResult: SnowflakeScoreResult;
  size?: "sm" | "md" | "lg" | "card";
  interactive?: boolean;
  activePillar?: SnowflakeAxisId | null;
  onSelectPillar?: (id: SnowflakeAxisId) => void;
  locale?: Locale;
  showLabels?: boolean;
  className?: string;
  maxWidth?: number | string;
}

const AXIS_CONFIGS: {
  id: SnowflakeAxisId;
  angleDeg: number; // degrees from top (-90 is top)
  textAnchor: "middle" | "start" | "end";
  dx: number;
  dy: number;
}[] = [
  { id: "valuation", angleDeg: -90, textAnchor: "middle", dx: 0, dy: -12 },
  { id: "future", angleDeg: -18, textAnchor: "start", dx: 12, dy: 4 },
  { id: "earnings", angleDeg: 54, textAnchor: "start", dx: 10, dy: 14 },
  { id: "moat", angleDeg: 126, textAnchor: "end", dx: -10, dy: 14 },
  { id: "resilience", angleDeg: 198, textAnchor: "end", dx: -12, dy: 4 },
];

export const SnowflakeRadar: React.FC<SnowflakeRadarProps> = ({
  scoreResult,
  size = "md",
  interactive = true,
  activePillar,
  onSelectPillar,
  locale = "en",
  showLabels = true,
  className = "",
  maxWidth,
}) => {
  const [hoveredPillar, setHoveredPillar] = useState<SnowflakeAxisId | null>(
    null
  );

  // Dimension settings per size
  const dims = useMemo(() => {
    switch (size) {
      case "sm":
        return {
          viewBox: 240,
          cx: 120,
          cy: 120,
          radius: 72,
          labelOffset: 24,
          fontSize: 9,
        };
      case "lg":
        return {
          viewBox: 380,
          cx: 190,
          cy: 190,
          radius: 125,
          labelOffset: 34,
          fontSize: 11,
        };
      case "card":
        return {
          viewBox: 340,
          cx: 170,
          cy: 170,
          radius: 118,
          labelOffset: 25,
          fontSize: 10,
        };
      case "md":
      default:
        return {
          viewBox: 290,
          cx: 145,
          cy: 145,
          radius: 92,
          labelOffset: 28,
          fontSize: 10,
        };
    }
  }, [size]);

  const { viewBox, cx, cy, radius, labelOffset, fontSize } = dims;

  // Concentric 6 rings
  const rings = [1, 2, 3, 4, 5, 6];

  // Dynamic Theme Color based on Score Tier
  const tierColor = useMemo(() => {
    switch (scoreResult.ratingTier) {
      case "exceptional":
        return {
          stroke: "#10b981",
          fill: "rgba(16, 185, 129, 0.28)",
          glow: "rgba(16, 185, 129, 0.45)",
        };
      case "strong":
        return {
          stroke: "#06b6d4",
          fill: "rgba(6, 182, 212, 0.28)",
          glow: "rgba(6, 182, 212, 0.45)",
        };
      case "balanced":
        return {
          stroke: "#f59e0b",
          fill: "rgba(245, 158, 11, 0.28)",
          glow: "rgba(245, 158, 11, 0.45)",
        };
      case "cautious":
      default:
        return {
          stroke: "#f43f5e",
          fill: "rgba(244, 63, 94, 0.28)",
          glow: "rgba(244, 63, 94, 0.45)",
        };
    }
  }, [scoreResult.ratingTier]);

  // Compute 5 axis vertices based on score (0 to 6)
  const vertices = useMemo(() => {
    return AXIS_CONFIGS.map((cfg) => {
      const pillar = scoreResult.pillars[cfg.id];
      const score = pillar ? pillar.score : 0;
      // Minimum radius factor so 0-score doesn't completely collapse to center
      const rRatio = Math.max(0.12, score / 6);
      const r = radius * rRatio;
      const rad = (cfg.angleDeg * Math.PI) / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);

      // Outer boundary endpoint for axis line
      const outerX = cx + radius * Math.cos(rad);
      const outerY = cy + radius * Math.sin(rad);

      // Label coordinate
      const labelR = radius + labelOffset;
      const labelX = cx + labelR * Math.cos(rad) + cfg.dx;
      const labelY = cy + labelR * Math.sin(rad) + cfg.dy;

      return {
        id: cfg.id,
        pillar,
        score,
        x,
        y,
        outerX,
        outerY,
        labelX,
        labelY,
        dx: cfg.dx,
        dy: cfg.dy,
        angleDeg: cfg.angleDeg,
        textAnchor: cfg.textAnchor,
      };
    });
  }, [scoreResult, radius, cx, cy, labelOffset]);

  const polygonPoints = useMemo(() => {
    return vertices.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(" ");
  }, [vertices]);

  const selectedOrHovered = hoveredPillar ?? activePillar;

  return (
    <div
      className={`relative flex select-none flex-col items-center ${className}`}
    >
      <svg
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        className="h-auto w-full overflow-visible transition-transform duration-300"
        style={{ maxWidth: maxWidth !== undefined ? maxWidth : viewBox }}
      >
        <defs>
          {/* Radial polygon fill gradient */}
          <radialGradient
            id={`snowflake-grad-${size}`}
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop offset="0%" stopColor={tierColor.stroke} stopOpacity="0.45" />
            <stop
              offset="70%"
              stopColor={tierColor.stroke}
              stopOpacity="0.22"
            />
            <stop
              offset="100%"
              stopColor={tierColor.stroke}
              stopOpacity="0.08"
            />
          </radialGradient>

          {/* Glowing Drop Shadow Filter */}
          <filter
            id={`snowflake-glow-${size}`}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circular guide rings (1 to 6) */}
        <g className="snowflake-rings opacity-75">
          {rings.map((ring) => {
            const r = (radius * ring) / 6;
            const isOuter = ring === 6;
            return (
              <circle
                key={ring}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={
                  isOuter
                    ? "rgba(255, 255, 255, 0.22)"
                    : "rgba(255, 255, 255, 0.08)"
                }
                strokeWidth={isOuter ? "1.25" : "0.75"}
                strokeDasharray={isOuter ? undefined : "3 3"}
              />
            );
          })}
        </g>

        {/* 5 Radial Axis Lines */}
        <g className="snowflake-axes">
          {vertices.map((v) => {
            const isCurrent = selectedOrHovered === v.id;
            return (
              <line
                key={v.id}
                x1={cx}
                y1={cy}
                x2={v.outerX}
                y2={v.outerY}
                stroke={
                  isCurrent ? v.pillar.color : "rgba(255, 255, 255, 0.16)"
                }
                strokeWidth={isCurrent ? "1.5" : "0.75"}
                className="transition-colors duration-200"
              />
            );
          })}
        </g>

        {/* The Snowflake Polygon Area */}
        <polygon
          points={polygonPoints}
          fill={`url(#snowflake-grad-${size})`}
          stroke={tierColor.stroke}
          strokeWidth="2.2"
          strokeLinejoin="round"
          filter={`url(#snowflake-glow-${size})`}
          className="transition-all duration-300 ease-out"
        />

        {/* Center Target Indicator */}
        <circle
          cx={cx}
          cy={cy}
          r={size === "sm" ? 14 : 18}
          className="fill-surface-0/90 stroke-white/20"
          strokeWidth="1"
        />
        <text
          cx={cx}
          cy={cy - 2}
          x={cx}
          y={cy - 1}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none fill-white font-mono text-[11px] font-black text-white sm:text-xs"
        >
          {scoreResult.totalScore}
        </text>
        <text
          cx={cx}
          cy={cy + 9}
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none fill-slate-400 font-mono text-[8px] font-semibold text-slate-400"
        >
          /30
        </text>

        {/* 5 Vertices (Interactive Click & Hover Points) */}
        <g className="snowflake-vertices">
          {vertices.map((v) => {
            const isCurrent = selectedOrHovered === v.id;
            return (
              <g
                key={v.id}
                className={interactive ? "group cursor-pointer" : ""}
                onMouseEnter={() => interactive && setHoveredPillar(v.id)}
                onMouseLeave={() => interactive && setHoveredPillar(null)}
                onClick={() => interactive && onSelectPillar?.(v.id)}
              >
                {/* Hit area */}
                <circle cx={v.x} cy={v.y} r={14} fill="transparent" />

                {/* Outer halo when selected */}
                {isCurrent && (
                  <circle
                    cx={v.x}
                    cy={v.y}
                    r={8}
                    fill={v.pillar.color}
                    fillOpacity="0.25"
                    className="animate-pulse"
                  />
                )}

                {/* Main vertex point */}
                <circle
                  cx={v.x}
                  cy={v.y}
                  r={isCurrent ? 5 : 3.5}
                  fill={v.pillar.color}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
              </g>
            );
          })}
        </g>

        {/* Perimeter Axis Labels */}
        {showLabels && (
          <g className="snowflake-labels">
            {vertices.map((v) => {
              const isCurrent = selectedOrHovered === v.id;
              const labelText = v.pillar.shortLabel;
              return (
                <g
                  key={`label-${v.id}`}
                  className={interactive ? "group cursor-pointer" : ""}
                  onMouseEnter={() => interactive && setHoveredPillar(v.id)}
                  onMouseLeave={() => interactive && setHoveredPillar(null)}
                  onClick={() => interactive && onSelectPillar?.(v.id)}
                >
                  {/* Label Text */}
                  <text
                    x={v.labelX}
                    y={v.labelY}
                    textAnchor={v.textAnchor}
                    dominantBaseline="central"
                    className={`font-mono font-bold uppercase tracking-wider transition-all duration-200 ${
                      isCurrent
                        ? "fill-white text-[11px] font-extrabold"
                        : "fill-slate-400 text-[10px] group-hover:fill-slate-200"
                    }`}
                    style={{ fontSize: isCurrent ? fontSize + 1 : fontSize }}
                  >
                    {labelText}
                  </text>

                  {/* Score indicator (e.g. 5/6) */}
                  <text
                    x={v.labelX}
                    y={v.labelY + (v.dy < 0 ? -11 : 12)}
                    textAnchor={v.textAnchor}
                    dominantBaseline="central"
                    className={`font-mono text-[9px] transition-colors duration-200 ${
                      isCurrent ? "font-bold" : "fill-slate-500 text-slate-500"
                    }`}
                    style={{
                      fill: isCurrent ? v.pillar.color : undefined,
                    }}
                  >
                    {v.score}/6
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Hover Info Tooltip (Inline under chart if size is small/medium and not handled externally) */}
      {interactive && selectedOrHovered && (
        <div className="mt-2 text-center transition-all duration-200 animate-in fade-in">
          <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-white">
            <span
              className="inline-block size-2 rounded-full shadow-sm"
              style={{
                backgroundColor: scoreResult.pillars[selectedOrHovered].color,
              }}
            />
            <span>{scoreResult.pillars[selectedOrHovered].label}</span>
            <span
              className="py-0.2 rounded px-1.5 font-mono text-[11px] font-bold"
              style={{
                color: scoreResult.pillars[selectedOrHovered].color,
                backgroundColor: `${scoreResult.pillars[selectedOrHovered].color}1a`,
              }}
            >
              {scoreResult.pillars[selectedOrHovered].score} / 6
            </span>
          </div>
          <p className="mt-0.5 max-w-[280px] text-[11px] leading-snug text-slate-400">
            {scoreResult.pillars[selectedOrHovered].summary}
          </p>
        </div>
      )}
    </div>
  );
};
