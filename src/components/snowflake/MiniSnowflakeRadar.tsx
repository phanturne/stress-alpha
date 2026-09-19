"use client";

import React from "react";
import type { SnowflakeAxisId } from "@/lib/snowflake";

export interface MiniSnowflakeRadarProps {
  score?: number;
  tier?: "exceptional" | "strong" | "balanced" | "cautious";
  pillars?: {
    valuation: number;
    future: number;
    earnings: number;
    moat: number;
    resilience: number;
  };
  size?: number;
  className?: string;
}

const AXIS_CONFIGS: { id: SnowflakeAxisId; angleDeg: number }[] = [
  { id: "valuation", angleDeg: -90 }, // Top
  { id: "future", angleDeg: -18 }, // Top-Right
  { id: "earnings", angleDeg: 54 }, // Bottom-Right
  { id: "moat", angleDeg: 126 }, // Bottom-Left
  { id: "resilience", angleDeg: 198 }, // Top-Left
];

export const MiniSnowflakeRadar: React.FC<MiniSnowflakeRadarProps> = ({
  score = 0,
  tier,
  pillars,
  size = 36,
  className = "",
}) => {
  const effectiveTier =
    tier ??
    (score >= 24
      ? "exceptional"
      : score >= 18
        ? "strong"
        : score >= 12
          ? "balanced"
          : "cautious");

  const tierColor = (() => {
    switch (effectiveTier) {
      case "exceptional":
        return {
          stroke: "#10b981",
          fill: "rgba(16, 185, 129, 0.38)",
          glow: "rgba(16, 185, 129, 0.3)",
        };
      case "strong":
        return {
          stroke: "#06b6d4",
          fill: "rgba(6, 182, 212, 0.38)",
          glow: "rgba(6, 182, 212, 0.3)",
        };
      case "balanced":
        return {
          stroke: "#f59e0b",
          fill: "rgba(245, 158, 11, 0.38)",
          glow: "rgba(245, 158, 11, 0.3)",
        };
      case "cautious":
      default:
        return {
          stroke: "#f43f5e",
          fill: "rgba(244, 63, 94, 0.38)",
          glow: "rgba(244, 63, 94, 0.3)",
        };
    }
  })();

  const cx = 20;
  const cy = 20;
  const radius = 16;

  // Concentric guideline rings
  const ringRatios = [0.35, 0.7, 1.0];

  // Calculate polygon vertices
  const points = AXIS_CONFIGS.map((axis) => {
    const rawScore = pillars ? (pillars[axis.id] ?? 0) : (score / 30) * 6;
    const ratio = Math.max(0.18, Math.min(1.0, rawScore / 6));
    const r = radius * ratio;
    const rad = (axis.angleDeg * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    return { x, y };
  });

  const pointsString = points
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={`shrink-0 overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <filter
          id={`mini-glow-${effectiveTier}`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="1.5"
            floodColor={tierColor.glow}
          />
        </filter>
      </defs>

      {/* Subtle Background Guideline Circles */}
      {ringRatios.map((ratio, idx) => (
        <circle
          key={idx}
          cx={cx}
          cy={cy}
          r={radius * ratio}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={idx === 2 ? 0.8 : 0.5}
          strokeDasharray={idx < 2 ? "1.5 1.5" : undefined}
        />
      ))}

      {/* 5 Axis Rays */}
      {AXIS_CONFIGS.map((axis) => {
        const rad = (axis.angleDeg * Math.PI) / 180;
        const outerX = cx + radius * Math.cos(rad);
        const outerY = cy + radius * Math.sin(rad);
        return (
          <line
            key={axis.id}
            x1={cx}
            y1={cy}
            x2={outerX}
            y2={outerY}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="0.6"
          />
        );
      })}

      {/* Filled Polygon Snowflake */}
      <polygon
        points={pointsString}
        fill={tierColor.fill}
        stroke={tierColor.stroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
        filter={`url(#mini-glow-${effectiveTier})`}
      />

      {/* Vertex Dots */}
      {points.map((p, idx) => (
        <circle key={idx} cx={p.x} cy={p.y} r="1.2" fill={tierColor.stroke} />
      ))}

      {/* Center Origin Dot */}
      <circle cx={cx} cy={cy} r="0.8" fill="rgba(255, 255, 255, 0.3)" />
    </svg>
  );
};
