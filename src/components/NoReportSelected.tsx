"use client";

import React from "react";
import { FolderOpen } from "lucide-react";
import { getTranslations, type Locale } from "@/lib/i18n";

export interface NoReportSelectedProps {
  onOpenScreener: () => void;
  locale: Locale;
}

export function NoReportSelected({
  onOpenScreener,
  locale,
}: NoReportSelectedProps) {
  const t = getTranslations(locale);

  return (
    <div className="glass-panel shadow-xs relative mx-auto my-16 flex max-w-xl flex-col items-center gap-5 overflow-hidden rounded-3xl border border-border p-8 text-center sm:p-10">
      <div className="pointer-events-none absolute -left-24 -top-24 size-48 rounded-full bg-accent/10 blur-3xl" />
      <div className="flex size-14 items-center justify-center rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/20 to-sky-500/10 text-accent shadow-lg shadow-accent/10">
        <FolderOpen className="size-7" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          {t.page.noReportSelected}
        </h2>
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-400">
          {t.page.noReportDesc}
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenScreener}
        className="rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] hover:bg-accent-hover hover:shadow-accent/40 active:scale-[0.98]"
      >
        {t.header.screener}
      </button>
    </div>
  );
}
