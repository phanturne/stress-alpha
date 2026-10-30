"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import type { Locale } from "@/lib/i18n";
import { ExternalLink } from "lucide-react";

interface TradingViewChartProps {
  ticker: string;
  locale?: Locale;
  className?: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  ticker,
  locale = "en",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Clean ticker symbol (BRK.B or BRK-B handling)
  const cleanTicker = ticker ? ticker.toUpperCase().replace("-", ".") : "SPY";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget on remount / ticker change / theme change
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.width = "100%";
    widgetDiv.style.height = "100%";
    widgetDiv.style.minHeight = "560px";
    container.appendChild(widgetDiv);

    // In unit test environments (HappyDOM / JSDOM), external script loading is disabled
    if (process.env.NODE_ENV === "test") {
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      width: "100%",
      height: "100%",
      symbol: cleanTicker,
      interval: "D",
      timezone: "exchange",
      theme: theme === "light" ? "light" : "dark",
      style: "1",
      locale: locale === "zh" ? "zh_CN" : "en",
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      details: false,
      hotlist: false,
      studies: ["STD;SMA"],
      support_host: "https://www.tradingview.com",
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [cleanTicker, theme, locale]);

  return (
    <div className={`relative flex flex-col gap-2 ${className}`}>
      {/* Ensure injected TradingView iframe expands to 100% of container height instead of browser 150px default */}
      <style>{`
        .tradingview-widget-container,
        .tradingview-widget-container__widget,
        .tradingview-widget-container iframe {
          width: 100% !important;
          height: 100% !important;
          min-height: 560px !important;
        }
      `}</style>
      <div
        className="tradingview-widget-container relative w-full overflow-hidden rounded-xl border border-border bg-surface-1/90 shadow-inner"
        ref={containerRef}
        style={{ height: "560px", minHeight: "560px" }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: "100%", width: "100%", minHeight: "560px" }}
        />
      </div>

      {/* External TradingView Link Footer */}
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
        <span className="font-mono text-[10px] text-slate-400">
          TradingView Real-Time Telemetry · {cleanTicker}
        </span>
        <a
          href={`https://www.tradingview.com/symbols/${cleanTicker}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono transition-colors hover:text-accent"
        >
          <span>TradingView</span>
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
};
