"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Share2,
  SlidersHorizontal,
  Globe,
  BookOpen,
  ExternalLink,
  Settings,
  Keyboard,
  ArrowUpRight,
  LogIn,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  BarChart3,
  Calendar,
} from "lucide-react";
import { AUTH_REQUIRED_EVENT } from "@/lib/watchlist";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "@/context/ThemeContext";
import { AuthModal } from "./AuthModal";

function GithubIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}
import { ReportSelector } from "./ReportSelector";
import { QuarterSwitcher } from "./QuarterSwitcher";
import type { ReportSummary } from "@/app/api/reports/route";
import { getTranslations, type Locale } from "@/lib/i18n";
import type { Facts, Valuation } from "@/lib/schemas";

interface HeaderProps {
  facts?: Facts;
  valuation?: Valuation;
  currentSlug?: string | null;
  reports?: ReportSummary[];
  onSelectReport: (slug: string) => void;
  viewMode: "cockpit" | "memo" | "screener";
  onViewModeChange: (mode: "cockpit" | "memo" | "screener") => void;
  onOpenShortcutsModal?: () => void;
  onShare?: () => void;
  onOpenSnowflake?: () => void;
  locale?: Locale;
  onToggleLocale?: (l: Locale) => void;
}

export const Header: React.FC<HeaderProps> = ({
  facts,
  valuation: _valuation,
  currentSlug,
  reports = [],
  onSelectReport,
  viewMode,
  onViewModeChange,
  onOpenShortcutsModal,
  onShare,
  onOpenSnowflake: _onOpenSnowflake,
  locale = "zh",
  onToggleLocale = () => {},
}) => {
  const translations = getTranslations(locale);
  const t = translations.header;
  const tAuth = translations.auth;
  const { data: session } = useSession();
  const { theme, setTheme, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const currentTicker = facts?.ticker;
  const siblingReports = React.useMemo(() => {
    if (!reports || reports.length === 0) return [];
    if (currentTicker) {
      return reports
        .filter((r) => r.ticker === currentTicker)
        .sort(
          (a, b) =>
            (b.reportDate || "").localeCompare(a.reportDate || "") ||
            b.slug.localeCompare(a.slug)
        );
    }
    if (currentSlug) {
      return reports.filter((r) => r.slug === currentSlug);
    }
    return [];
  }, [reports, currentTicker, currentSlug]);

  useEffect(() => {
    const handleAuthRequired = () => {
      setIsAuthModalOpen(true);
    };
    window.addEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
    return () => {
      window.removeEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
    };
  }, []);

  return (
    <header className="glass-header sticky top-0 z-40 flex h-14 w-full flex-nowrap items-center justify-between gap-2 px-3 transition-all duration-200 sm:gap-4 sm:px-6">
      {/* Left: Brand Identity & Active Workspace */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Clickable Brand Logo -> Returns to Home (Screener) */}
        <button
          type="button"
          onClick={() => onViewModeChange("screener")}
          className="group flex items-center gap-2 text-left transition-opacity hover:opacity-90"
          title={`StressAlpha Home — ${t.screener}`}
        >
          <div className="flex size-8 items-center justify-center rounded-xl border border-accent/40 bg-gradient-to-tr from-accent/20 to-sky-500/20 text-accent shadow-glow transition-transform group-hover:scale-105">
            <span className="font-mono text-sm font-extrabold tracking-tighter">
              S<span className="text-white">α</span>
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white transition-colors group-hover:text-accent">
                Stress<span className="text-accent">Alpha</span>
              </span>
              <span className="hidden rounded border border-white/[0.08] bg-surface-2/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-slate-400 md:inline">
                {t.engineTag}
              </span>
            </div>
          </div>
        </button>

        <div className="mx-0.5 hidden h-4 w-px bg-white/[0.08] sm:block" />

        {/* Direct Report Selection from database */}
        <ReportSelector
          currentSlug={currentSlug ?? null}
          reports={reports}
          onSelectReport={(slug) => {
            onViewModeChange("cockpit");
            onSelectReport(slug);
          }}
          locale={locale}
          onOpenScreener={() => onViewModeChange("screener")}
        />

        {/* Quarter Switcher for the active ticker */}
        {viewMode !== "screener" && facts?.quarter && (
          <div className="hidden sm:block">
            <QuarterSwitcher
              currentSlug={currentSlug ?? null}
              currentQuarter={facts.quarter}
              currentDate={facts.reportDate}
              ticker={facts.ticker}
              siblingReports={siblingReports}
              onSelectReport={(slug) => {
                onViewModeChange("cockpit");
                onSelectReport(slug);
              }}
              locale={locale}
            />
          </div>
        )}
      </div>

      {/* Right Desktop: View Modes, Share, and Settings & Resources Menu */}
      <div className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap sm:gap-2 md:flex">
        {/* View Mode Switcher: Cockpit & Memo available only when a report is selected */}
        {viewMode !== "screener" && (
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-1/90 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onViewModeChange("cockpit")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                viewMode === "cockpit"
                  ? "bg-surface-3 font-semibold text-accent shadow-sm ring-1 ring-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
              title={t.cockpit}
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">{t.cockpit}</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("memo")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                viewMode === "memo"
                  ? "bg-surface-3 font-semibold text-accent shadow-sm ring-1 ring-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
              title={t.memo}
            >
              <FileText className="size-3.5" />
              <span className="hidden sm:inline">{t.memo}</span>
            </button>
          </div>
        )}

        {/* Unified Share & Export Button - available when a report is selected */}
        {onShare && viewMode !== "screener" && facts && (
          <button
            type="button"
            onClick={onShare}
            className="group flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-bold text-accent shadow-sm transition-all hover:border-accent/60 hover:bg-accent/20 hover:text-white sm:px-3"
            title={t.shareTooltip}
          >
            <Share2 className="size-3.5 text-accent transition-transform duration-200 group-hover:scale-110" />
            <span className="hidden sm:inline">{t.share}</span>
          </button>
        )}

        {/* Quick Theme Toggle Button (Moon: Cyber Obsidian / Sun: Institutional Light) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-surface-1/90 text-slate-400 shadow-sm transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-accent"
          title={t.toggleTheme}
          aria-label={t.toggleTheme}
        >
          {theme === "light" ? (
            <Sun className="size-3.5 text-amber-500 transition-transform duration-200 hover:rotate-45" />
          ) : (
            <Moon className="size-3.5 text-sky-400 transition-transform duration-200 hover:-rotate-12" />
          )}
        </button>

        {/* GitHub Repository Icon Button */}
        <a
          href="https://github.com/phanturne/stress-alpha"
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-surface-1/90 text-slate-400 shadow-sm transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-white"
          title={t.github}
          aria-label={t.github}
        >
          <GithubIcon className="size-3.5" />
        </a>

        {/* Settings & Resources Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-surface-1/90 shadow-sm transition-all hover:border-accent/40 hover:bg-surface-2 ${
              isSettingsOpen
                ? "border-accent/40 bg-surface-2 text-accent ring-1 ring-accent/30"
                : "text-slate-400 hover:text-white"
            }`}
            title={t.settings}
            aria-label={t.settings}
          >
            <Settings
              className={`size-3.5 transition-transform duration-200 ${
                isSettingsOpen ? "rotate-45 text-accent" : ""
              }`}
            />
          </button>

          {isSettingsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSettingsOpen(false)}
              />
              <div className="glass-panel absolute right-0 top-full z-50 mt-2 w-72 divide-y divide-white/[0.06] rounded-xl border border-white/[0.1] bg-surface-1/95 p-1.5 shadow-2xl backdrop-blur-xl duration-150 animate-in fade-in zoom-in-95">
                {/* Language Switcher Row */}
                <div className="flex items-center justify-between px-2.5 py-2 text-xs">
                  <div className="flex items-center gap-2 font-medium text-slate-300">
                    <Globe className="size-3.5 text-accent" />
                    <span>{t.language}</span>
                  </div>
                  <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-0/80 p-0.5">
                    <button
                      type="button"
                      onClick={() => onToggleLocale("en")}
                      className={`rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
                        locale === "en"
                          ? "bg-accent font-extrabold text-slate-950 shadow-sm shadow-accent/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleLocale("zh")}
                      className={`rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
                        locale === "zh"
                          ? "bg-accent font-extrabold text-slate-950 shadow-sm shadow-accent/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      中文
                    </button>
                  </div>
                </div>

                {/* Visual Theme Switcher Row */}
                <div className="flex items-center justify-between px-2.5 py-2 text-xs">
                  <div className="flex items-center gap-2 font-medium text-slate-300">
                    {theme === "light" ? (
                      <Sun className="size-3.5 text-amber-500" />
                    ) : (
                      <Moon className="size-3.5 text-accent" />
                    )}
                    <span>{t.theme}</span>
                  </div>
                  <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-0/80 p-0.5">
                    <button
                      type="button"
                      onClick={() => setTheme("cyber")}
                      className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
                        theme === "cyber"
                          ? "bg-accent font-extrabold text-slate-950 shadow-sm shadow-accent/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title={t.themeCyber}
                    >
                      <Moon className="size-3" />
                      <span>{t.themeCyberShort}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all ${
                        theme === "light"
                          ? "bg-accent font-extrabold text-slate-950 shadow-sm shadow-accent/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title={t.themeLight}
                    >
                      <Sun className="size-3" />
                      <span>{t.themeLightShort}</span>
                    </button>
                  </div>
                </div>

                {/* Navigation Links: Methodology & Hotkeys */}
                <div className="py-1">
                  <Link
                    href="/methodology"
                    onClick={() => setIsSettingsOpen(false)}
                    className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-surface-2 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-3.5 text-slate-400" />
                      <span>{t.methodology}</span>
                    </div>
                    <ArrowUpRight className="size-3 text-slate-500" />
                  </Link>

                  {onOpenShortcutsModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenShortcutsModal();
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-surface-2 hover:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <Keyboard className="size-3.5 text-slate-400" />
                        <span>{t.shortcuts}</span>
                      </div>
                      <kbd className="rounded border border-white/[0.1] bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                        ?
                      </kbd>
                    </button>
                  )}
                </div>

                {/* Secondary External GitHub Link */}
                <div className="pt-1">
                  <a
                    href="https://github.com/phanturne/stress-alpha"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-surface-2 hover:text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <GithubIcon className="size-3.5 text-slate-400" />
                      <span>{t.github}</span>
                    </div>
                    <ExternalLink className="size-3 text-slate-500" />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile / Authentication Menu */}
        {session?.user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold shadow-sm transition-all sm:gap-2 sm:px-2.5 ${
                isUserMenuOpen
                  ? "border-accent/40 bg-surface-2 text-accent ring-1 ring-accent/30"
                  : "border-white/[0.08] bg-surface-1/90 text-slate-300 hover:border-white/20 hover:bg-surface-2 hover:text-white"
              }`}
              title={tAuth.accountMenu}
              aria-label={tAuth.accountMenu}
            >
              <div className="flex size-5 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
                {session.user.name
                  ? session.user.name.charAt(0).toUpperCase()
                  : "A"}
              </div>
              <span className="hidden max-w-[80px] truncate sm:inline md:max-w-[120px]">
                {session.user.name || tAuth.profile}
              </span>
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="glass-panel absolute right-0 top-full z-50 mt-2 w-56 divide-y divide-white/[0.06] rounded-xl border border-white/[0.1] bg-surface-1/95 p-1.5 shadow-2xl backdrop-blur-xl duration-150 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-2">
                    <div className="truncate text-xs font-bold text-white">
                      {session.user.name || tAuth.profile}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                      {session.user.email}
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await signOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                    >
                      <LogOut className="size-3.5 text-rose-400" />
                      <span>{tAuth.signOut}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-1/90 px-2.5 py-1.5 text-xs font-medium text-slate-300 shadow-sm transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-white"
            title={tAuth.signIn}
          >
            <LogIn className="size-3.5 text-accent" />
            <span className="hidden sm:inline">{tAuth.signIn}</span>
          </button>
        )}
      </div>

      {/* Right Mobile: Quick Actions & Hamburger Menu */}
      <div className="flex shrink-0 items-center gap-1.5 md:hidden">
        {/* Quick Share (when a report is open) */}
        {onShare && viewMode !== "screener" && facts && (
          <button
            type="button"
            onClick={onShare}
            className="flex size-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent shadow-sm transition-all hover:bg-accent/20"
            title={t.shareTooltip}
            aria-label={t.share}
          >
            <Share2 className="size-3.5" />
          </button>
        )}

        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-surface-1/90 text-slate-400 shadow-sm transition-all hover:border-accent/40 hover:bg-surface-2 hover:text-accent"
          title={t.toggleTheme}
          aria-label={t.toggleTheme}
        >
          {theme === "light" ? (
            <Sun className="size-3.5 text-amber-500" />
          ) : (
            <Moon className="size-3.5 text-sky-400" />
          )}
        </button>

        {/* Hamburger Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex size-8 items-center justify-center rounded-lg border shadow-sm transition-all ${
            isMobileMenuOpen
              ? "border-accent/50 bg-accent/15 text-accent ring-1 ring-accent/30"
              : "border-white/[0.08] bg-surface-1/90 text-slate-300 hover:border-accent/40 hover:bg-surface-2"
          }`}
          title={isMobileMenuOpen ? t.closeMenu : t.mobileMenu}
          aria-label={isMobileMenuOpen ? t.closeMenu : t.mobileMenu}
        >
          {isMobileMenuOpen ? (
            <X className="size-4" />
          ) : (
            <Menu className="size-4" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="glass-panel bg-surface-1/98 relative z-10 flex h-full w-full max-w-xs flex-col divide-y divide-white/[0.08] overflow-y-auto p-4 shadow-2xl backdrop-blur-2xl duration-200 animate-in slide-in-from-right">
            {/* Drawer Top Bar */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg border border-accent/40 bg-accent/15 font-mono text-xs font-black text-accent">
                  S<span className="text-white">α</span>
                </div>
                <span className="font-mono text-sm font-bold text-white">
                  Stress<span className="text-accent">Alpha</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-surface-2 text-slate-400 hover:text-white"
                aria-label={t.closeMenu}
              >
                <X className="size-4" />
              </button>
            </div>

            {/* User Profile / Auth Section */}
            <div className="py-3">
              {session?.user ? (
                <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-surface-0/60 p-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/20 font-mono text-xs font-bold text-accent">
                      {session.user.name
                        ? session.user.name.charAt(0).toUpperCase()
                        : "A"}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-white">
                        {session.user.name || tAuth.profile}
                      </div>
                      <div className="truncate font-mono text-[10px] text-slate-400">
                        {session.user.email}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await signOut();
                    }}
                    className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10"
                    title={tAuth.signOut}
                  >
                    <LogOut className="size-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 py-2.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20"
                >
                  <LogIn className="size-4" />
                  <span>{tAuth.signIn}</span>
                </button>
              )}
            </div>

            {/* Navigation Workspaces */}
            <div className="py-3">
              <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t.navigation}
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onViewModeChange("screener");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    viewMode === "screener"
                      ? "border border-accent/30 bg-accent/15 text-accent shadow-sm"
                      : "text-slate-300 hover:bg-surface-2"
                  }`}
                >
                  <BarChart3 className="size-4 text-accent" />
                  <span>{t.screener}</span>
                </button>

                {currentSlug && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onViewModeChange("cockpit");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        viewMode === "cockpit"
                          ? "border border-accent/30 bg-accent/15 text-accent shadow-sm"
                          : "text-slate-300 hover:bg-surface-2"
                      }`}
                    >
                      <SlidersHorizontal className="size-4 text-accent" />
                      <span>{t.cockpit}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onViewModeChange("memo");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        viewMode === "memo"
                          ? "border border-accent/30 bg-accent/15 text-accent shadow-sm"
                          : "text-slate-300 hover:bg-surface-2"
                      }`}
                    >
                      <FileText className="size-4 text-accent" />
                      <span>{t.memo}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Historical Quarters (Mobile Drawer) */}
            {viewMode !== "screener" && siblingReports.length > 1 && (
              <div className="py-3">
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3 text-accent" />
                    {t.quarterHistory}
                  </span>
                  <span className="font-mono text-accent">{facts?.ticker}</span>
                </div>
                <div className="max-h-36 space-y-1 overflow-y-auto">
                  {siblingReports.map((r, idx) => {
                    const isSelected = r.slug === currentSlug;
                    const isLatest = idx === 0;
                    return (
                      <button
                        key={r.slug}
                        type="button"
                        onClick={() => {
                          onViewModeChange("cockpit");
                          onSelectReport(r.slug);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                          isSelected
                            ? "bg-accent/15 font-bold text-accent"
                            : "text-slate-300 hover:bg-surface-2"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono">
                            {r.quarter || r.slug}
                          </span>
                          <span
                            className={`py-0.2 rounded px-1 font-mono text-[9px] font-bold ${
                              isLatest
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {isLatest ? t.latestBadge : t.historicalBadge}
                          </span>
                        </div>
                        {r.weightedFairValue ? (
                          <span className="font-mono text-[11px] text-slate-400">
                            ${r.weightedFairValue}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Share CTA (Mobile) */}
            {onShare && viewMode !== "screener" && facts && (
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onShare();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/15 py-2 text-xs font-bold text-accent transition-colors hover:bg-accent/25"
                >
                  <Share2 className="size-3.5" />
                  <span>{t.share}</span>
                </button>
              </div>
            )}

            {/* Language & Theme Controls */}
            <div className="space-y-3 py-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Globe className="size-3.5 text-accent" />
                  <span>{t.language}</span>
                </div>
                <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-0/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => onToggleLocale("en")}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                      locale === "en"
                        ? "bg-accent font-extrabold text-slate-950"
                        : "text-slate-400"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleLocale("zh")}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                      locale === "zh"
                        ? "bg-accent font-extrabold text-slate-950"
                        : "text-slate-400"
                    }`}
                  >
                    中文
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  {theme === "light" ? (
                    <Sun className="size-3.5 text-amber-500" />
                  ) : (
                    <Moon className="size-3.5 text-accent" />
                  )}
                  <span>{t.theme}</span>
                </div>
                <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-0/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => setTheme("cyber")}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${
                      theme === "cyber"
                        ? "bg-accent font-extrabold text-slate-950"
                        : "text-slate-400"
                    }`}
                  >
                    <Moon className="size-3" />
                    <span>{t.themeCyberShort}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${
                      theme === "light"
                        ? "bg-accent font-extrabold text-slate-950"
                        : "text-slate-400"
                    }`}
                  >
                    <Sun className="size-3" />
                    <span>{t.themeLightShort}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Links Section */}
            <div className="space-y-1 py-3">
              <Link
                href="/methodology"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-surface-2 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="size-3.5 text-slate-400" />
                  <span>{t.methodology}</span>
                </div>
                <ArrowUpRight className="size-3 text-slate-500" />
              </Link>
              {onOpenShortcutsModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenShortcutsModal();
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-surface-2 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Keyboard className="size-3.5 text-slate-400" />
                    <span>{t.shortcuts}</span>
                  </div>
                  <kbd className="rounded border border-white/[0.1] bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    ?
                  </kbd>
                </button>
              )}
              <a
                href="https://github.com/phanturne/stress-alpha"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-surface-2 hover:text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <GithubIcon className="size-3.5 text-slate-400" />
                  <span>{t.github}</span>
                </div>
                <ExternalLink className="size-3 text-slate-500" />
              </a>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        locale={locale}
      />
    </header>
  );
};
