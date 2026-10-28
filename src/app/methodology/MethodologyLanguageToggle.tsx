"use client";

import React, { useState, useEffect } from "react";
import type { Locale } from "@/lib/i18n";

export function MethodologyLanguageToggle() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "stress_alpha_locale"
      ) as Locale | null;
      if (saved === "en" || saved === "zh") {
        document.documentElement.setAttribute("data-methodology-locale", saved);
        Promise.resolve().then(() => {
          setLocale(saved);
        });
      } else {
        document.documentElement.setAttribute("data-methodology-locale", "en");
      }
    } catch {
      // Fallback for strict browser security/incognito
      document.documentElement.setAttribute("data-methodology-locale", "en");
    }
  }, []);

  const toggleLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    try {
      localStorage.setItem("stress_alpha_locale", newLocale);
      document.documentElement.setAttribute(
        "data-methodology-locale",
        newLocale
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center rounded-lg border border-border bg-surface-1/90 p-0.5 text-xs">
      <button
        type="button"
        onClick={() => toggleLocale("en")}
        className={`rounded px-2.5 py-1 font-bold transition-all ${
          locale === "en"
            ? "bg-accent font-extrabold text-slate-950 shadow-sm"
            : "text-slate-400 hover:text-foreground"
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
            : "text-slate-400 hover:text-foreground"
        }`}
      >
        中文
      </button>
    </div>
  );
}
