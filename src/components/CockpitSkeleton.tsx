"use client";

import React from "react";
import { Skeleton } from "./ui/Skeleton";

export const CockpitSkeleton: React.FC = () => {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-5 lg:flex-row lg:items-stretch xl:gap-6">
      {/* Left Sticky Cockpit Column (~400px responsive) */}
      <aside className="custom-scrollbar flex h-full min-h-0 w-full shrink-0 flex-col gap-4 lg:w-[380px] lg:overflow-y-auto lg:pr-1.5 xl:w-[415px] 2xl:w-[440px]">
        {/* Card 1: Header, Presets & Live P&L Strip */}
        <div className="glass-panel flex flex-col gap-3.5 rounded-2xl border border-white/[0.08] p-4 shadow-xl sm:p-4.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-1.5">
            <Skeleton className="h-7 rounded-lg" />
            <Skeleton className="h-7 rounded-lg" />
            <Skeleton className="h-7 rounded-lg" />
          </div>

          {/* Stressed Valuation Display */}
          <div className="rounded-xl border border-white/[0.06] bg-surface-0/60 p-3.5">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
            {/* Price Meter Bar */}
            <div className="mt-3 space-y-1.5">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            </div>
          </div>

          {/* P&L Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-white/[0.04] bg-surface-0/40 p-2.5"
              >
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="mt-1.5 h-4 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Interactive Parameter Sliders */}
        <div className="glass-panel flex flex-col gap-3 rounded-2xl border border-white/[0.08] p-4 shadow-xl sm:p-4.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-6 w-12 rounded-md" />
              <Skeleton className="h-6 w-12 rounded-md" />
            </div>
          </div>

          {/* 3 Slider Rows */}
          <div className="space-y-4 pt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-2 w-8" />
                  <Skeleton className="h-2 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Downside Guardrails */}
        <div className="glass-panel flex flex-col gap-3 rounded-2xl border border-white/[0.08] p-4 shadow-xl sm:p-4.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/[0.04] bg-surface-0/40 p-2.5">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="mt-1.5 h-4 w-14" />
            </div>
            <div className="rounded-lg border border-white/[0.04] bg-surface-0/40 p-2.5">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="mt-1.5 h-4 w-14" />
            </div>
          </div>
        </div>
      </aside>

      {/* Right Tabbed Workspace Skeleton */}
      <div className="custom-scrollbar flex w-full min-w-0 flex-1 flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1.5">
        {/* Tab Ribbon Skeleton */}
        <div className="custom-scrollbar flex items-center gap-1 overflow-x-auto lg:rounded-2xl lg:border lg:border-white/[0.08] lg:bg-surface-1/90 lg:p-1.5">
          {[
            { w: "w-16 xl:w-20", c: "w-4" },
            { w: "w-16 xl:w-20", c: "w-4" },
            { w: "w-12 xl:w-16", c: "w-4" },
            { w: "w-16 xl:w-20", c: "w-4" },
            { w: "w-16 xl:w-18", c: "w-4" },
            { w: "w-12 xl:w-16", c: "w-4" },
            { w: "w-12 xl:w-16", c: "w-4" },
          ].map((tab, idx) => (
            <div
              key={idx}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 xl:px-2.5 xl:py-2 ${
                idx === 0
                  ? "border border-accent/20 bg-accent/[0.07]"
                  : "border border-transparent bg-surface-1/40"
              }`}
            >
              <Skeleton className="size-3.5 rounded" />
              <Skeleton className={`h-3 ${tab.w}`} />
              <Skeleton className={`h-3.5 ${tab.c} rounded-full`} />
            </div>
          ))}
        </div>

        {/* Tab Workspace Contents Skeleton */}
        <div className="space-y-4">
          {/* 4 Scenario Cards Grid */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="glass-panel flex flex-col justify-between rounded-xl border border-white/[0.08] p-4 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-4 w-10 rounded-full" />
                  </div>
                  <Skeleton className="mt-3 h-7 w-24" />
                  <Skeleton className="mt-1 h-3.5 w-16" />
                </div>
                <div className="mt-4 border-t border-white/[0.06] pt-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3.5 w-12 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Valuation Waterfall / Sensitivity Matrix Card */}
          <div className="glass-panel rounded-xl border border-white/[0.08] p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>

            {/* Matrix Table Skeleton */}
            <div className="mt-4 space-y-2.5">
              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((col) => (
                  <Skeleton key={col} className="h-6 rounded bg-white/[0.04]" />
                ))}
              </div>
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((col) => (
                    <Skeleton
                      key={col}
                      className="h-8 rounded bg-white/[0.03]"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
