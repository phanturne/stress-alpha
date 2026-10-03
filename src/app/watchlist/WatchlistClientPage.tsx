"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { WatchlistView } from "@/components/WatchlistView";
import type { ReportSummary } from "@/lib/repository";
import { getTranslations, type Locale } from "@/lib/i18n";
import { Keyboard, X } from "lucide-react";

interface WatchlistClientPageProps {
  initialReports?: ReportSummary[];
}

export function WatchlistClientPage({
  initialReports = [],
}: WatchlistClientPageProps) {
  const router = useRouter();
  const [reports, setReports] = useState<ReportSummary[]>(initialReports);
  const [isLoading, setIsLoading] = useState<boolean>(
    initialReports.length === 0
  );
  const [locale, setLocale] = useState<Locale>("en");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Restore saved language preference on mount
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(
        "stress_alpha_locale"
      ) as Locale | null;
      if (savedLocale === "en" || savedLocale === "zh") {
        Promise.resolve().then(() => {
          setLocale(savedLocale);
        });
      }
    } catch (e) {
      console.warn("Could not load locale preference:", e);
    }
  }, []);

  const handleToggleLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    try {
      localStorage.setItem("stress_alpha_locale", newLocale);
    } catch (e) {
      console.warn("Could not save locale preference:", e);
    }
  }, []);

  // Fetch from API only if server-side reports were not populated
  useEffect(() => {
    if (initialReports.length > 0) return;
    let ignore = false;
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.reports) {
          setReports(data.reports);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load reports for watchlist:", err);
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [initialReports.length]);

  // Navigate to report cockpit/memo when a report is selected
  const handleSelectReport = useCallback(
    (slug: string, mode?: "cockpit" | "memo") => {
      const targetMode = mode === "memo" ? "&mode=memo" : "";
      router.push(`/?report=${encodeURIComponent(slug)}${targetMode}`);
    },
    [router]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept browser-native shortcuts (Cmd+R, Ctrl+R, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        handleToggleLocale(locale === "zh" ? "en" : "zh");
        return;
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        router.push("/screener");
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        if (isShortcutsOpen) {
          e.preventDefault();
          setIsShortcutsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [locale, isShortcutsOpen, handleToggleLocale, router]);

  const t = getTranslations(locale);

  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-100">
      {/* Top Navigation */}
      <Header
        currentSlug={null}
        onSelectReport={handleSelectReport}
        viewMode="watchlist"
        onViewModeChange={(mode) => {
          if (mode === "screener") {
            router.push("/screener");
          } else if (mode === "cockpit" || mode === "memo") {
            router.push("/");
          }
        }}
        onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
        locale={locale}
        onToggleLocale={handleToggleLocale}
      />

      {/* Main Watchlist View */}
      <main className="mx-auto w-full min-w-0 max-w-[1680px] flex-1 p-3 sm:p-5 md:p-6">
        <WatchlistView
          reports={reports}
          onSelectReport={handleSelectReport}
          locale={locale}
          isLoading={isLoading}
        />
      </main>

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/[0.12] p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2 text-white">
                <Keyboard className="size-5 text-accent" />
                <h3 className="font-mono text-base font-bold">
                  {t.header.shortcuts}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-surface-2 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">{t.header.language}</span>
                <kbd className="rounded border border-white/[0.1] bg-surface-2 px-2 py-0.5 text-white shadow">
                  L
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">{t.header.screener}</span>
                <kbd className="rounded border border-white/[0.1] bg-surface-2 px-2 py-0.5 text-white shadow">
                  S
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">{t.header.shortcuts}</span>
                <kbd className="rounded border border-white/[0.1] bg-surface-2 px-2 py-0.5 text-white shadow">
                  ?
                </kbd>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="rounded-xl bg-accent px-4 py-2 font-mono text-xs font-bold text-slate-950 transition-colors hover:bg-accent/90"
              >
                {t.shortcuts.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
