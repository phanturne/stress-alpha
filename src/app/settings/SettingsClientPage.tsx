"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Shield,
  ShieldCheck,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  LogIn,
  Globe,
  Moon,
  Sun,
  Palette,
  Sliders,
  TrendingUp,
  Database,
  Lock,
  BookOpen,
  ExternalLink,
  Keyboard,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Trash2,
  X,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "@/context/ThemeContext";
import { getTranslations, type Locale } from "@/lib/i18n";
import { useRecentReport } from "@/lib/recent-report";
import type { ReportSummary } from "@/app/api/reports/route";

interface SettingsClientPageProps {
  initialReports?: ReportSummary[];
}

type SettingsSection =
  "account" | "appearance" | "valuation" | "privacy" | "system";

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "••••••••";
  const [name, domain] = email.split("@");
  if (name.length <= 2) {
    return `${name.charAt(0)}***@${domain}`;
  }
  return `${name.slice(0, 2)}***@${domain}`;
}

export function SettingsClientPage({
  initialReports = [],
}: SettingsClientPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { recentReport } = useRecentReport();

  const [reports, setReports] = useState<ReportSummary[]>(initialReports);
  const [locale, setLocale] = useState<Locale>("en");
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("account");
  const [showRawEmail, setShowRawEmail] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Fetch reports if not provided server-side
  useEffect(() => {
    if (initialReports.length > 0) return;
    let ignore = false;
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.reports) {
          setReports(data.reports);
        }
      })
      .catch((err) => {
        console.error("Failed to load reports for settings:", err);
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

  const t = getTranslations(locale);
  const tSet = t.settingsPage;
  const tAcc = tSet.account;
  const tApp = tSet.appearance;
  const tVal = tSet.valuation;
  const tPriv = tSet.privacy;
  const tSys = tSet.system;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  const handleClearCache = useCallback(() => {
    try {
      localStorage.removeItem("stress_alpha_recent_report");
      showToast(tPriv.clearCacheSuccess);
    } catch (e) {
      console.error("Failed to clear local cache:", e);
    }
  }, [tPriv.clearCacheSuccess, showToast]);

  const sectionsList = useMemo(
    () => [
      {
        id: "account" as const,
        label: tSet.tabAccount,
        icon: User,
      },
      {
        id: "appearance" as const,
        label: tSet.tabAppearance,
        icon: Palette,
      },
      {
        id: "valuation" as const,
        label: tSet.tabValuation,
        icon: Sliders,
      },
      {
        id: "privacy" as const,
        label: tSet.tabPrivacy,
        icon: ShieldCheck,
      },
      {
        id: "system" as const,
        label: tSet.tabSystem,
        icon: Info,
      },
    ],
    [tSet]
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-100 selection:bg-accent/20 selection:text-accent">
      {/* Top Application Header */}
      <Header
        currentSlug={null}
        reports={reports}
        onSelectReport={handleSelectReport}
        viewMode="settings"
        onViewModeChange={(mode) => {
          if (mode === "watchlist") {
            router.push("/watchlist");
          } else if (mode === "screener") {
            router.push("/screener");
          } else if (mode === "cockpit" || mode === "memo") {
            if (recentReport?.slug) {
              handleSelectReport(
                recentReport.slug,
                mode === "memo" ? "memo" : "cockpit"
              );
            } else {
              router.push("/");
            }
          }
        }}
        onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
        locale={locale}
        onToggleLocale={handleToggleLocale}
      />

      {/* Main Settings Container */}
      <main className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 p-4 sm:p-6 md:p-8">
        {/* Navigation Breadcrumb & Back Link */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {recentReport?.slug ? (
              <button
                type="button"
                onClick={() => handleSelectReport(recentReport.slug, "cockpit")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-1 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-white"
              >
                <ArrowLeft className="size-3.5" />
                <span>
                  {tSet.backToModel} ({recentReport.ticker || recentReport.slug}
                  )
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/screener")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-1 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-white"
              >
                <ArrowLeft className="size-3.5" />
                <span>{tSet.backToScreener}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-accent">
              StressAlpha v1.0
            </span>
          </div>
        </div>

        {/* Page Header Banner */}
        <div className="glass-panel relative mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-1/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent/15 text-accent shadow-md">
              <Sliders className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                {tSet.title}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-400 sm:text-sm">
                {tSet.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Layout: Desktop 2-column, Mobile stacked */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Category Navigation Bar */}
          <aside className="lg:col-span-3">
            <nav className="glass-panel sticky top-20 flex flex-row gap-1.5 overflow-x-auto rounded-xl border border-white/[0.08] bg-surface-1/90 p-2 shadow-sm backdrop-blur-md lg:flex-col lg:overflow-x-visible">
              {sectionsList.map((sec) => {
                const IconComponent = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all lg:w-full ${
                      isActive
                        ? "border border-accent/40 bg-accent/15 text-accent shadow-sm ring-1 ring-accent/30"
                        : "text-slate-400 hover:bg-surface-2 hover:text-white"
                    }`}
                  >
                    <IconComponent
                      className={`size-4 ${
                        isActive ? "text-accent" : "text-slate-400"
                      }`}
                    />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right Active Panel Content */}
          <div className="space-y-6 lg:col-span-9">
            {/* SECTION 1: Account & Profile */}
            {activeSection === "account" && (
              <div className="space-y-6 duration-150 animate-in fade-in">
                <div className="glass-panel divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-surface-1/90 p-6 shadow-xl backdrop-blur-xl">
                  <div className="pb-5">
                    <h2 className="text-base font-bold text-white">
                      {tAcc.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {tAcc.description}
                    </p>
                  </div>

                  {session?.user ? (
                    <div className="space-y-6 pt-5">
                      {/* Identity Card */}
                      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-surface-0/60 p-4">
                        <div className="flex items-center gap-3.5">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-sky-500/20 font-mono text-base font-bold text-accent ring-1 ring-accent/40">
                            {session.user.name
                              ? session.user.name.charAt(0).toUpperCase()
                              : "A"}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">
                              {session.user.name || t.auth.profile}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                                {t.auth.memberBadge}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            await signOut();
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 hover:text-white"
                        >
                          <LogOut className="size-3.5 text-rose-400" />
                          <span>{tAcc.signOutButton}</span>
                        </button>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Display Name */}
                        <div className="rounded-xl border border-white/[0.06] bg-surface-0/40 p-4">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            {tAcc.nameLabel}
                          </label>
                          <div className="mt-1 text-sm font-bold text-white">
                            {session.user.name || "—"}
                          </div>
                        </div>

                        {/* Email Address with Privacy Concealment & Reveal Toggle */}
                        <div className="rounded-xl border border-white/[0.06] bg-surface-0/40 p-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                              {tAcc.emailLabel}
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowRawEmail(!showRawEmail)}
                              className="flex items-center gap-1 font-mono text-[11px] text-accent transition-colors hover:text-accent-hover"
                              title={
                                showRawEmail ? tAcc.hideEmail : tAcc.showEmail
                              }
                            >
                              {showRawEmail ? (
                                <>
                                  <EyeOff className="size-3" />
                                  <span>{tAcc.hideEmail}</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="size-3" />
                                  <span>{tAcc.showEmail}</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-slate-200">
                              {showRawEmail
                                ? session.user.email
                                : maskEmail(session.user.email)}
                            </span>
                            <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                              {tAcc.verifiedBadge}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Explicit Privacy Banner */}
                      <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
                        <Shield className="mt-0.5 size-4 shrink-0 text-accent" />
                        <div className="text-xs leading-relaxed text-slate-300">
                          <span className="font-semibold text-white">
                            {tPriv.dropdownPrivacyTitle}:{" "}
                          </span>
                          {tAcc.emailPrivacyNotice}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Guest Workspace State */
                    <div className="space-y-5 pt-5">
                      <div className="rounded-xl border border-white/[0.08] bg-surface-0/50 p-6 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-white/10 bg-surface-2 text-slate-400">
                          <User className="size-6" />
                        </div>
                        <h3 className="mt-3 text-sm font-bold text-white">
                          {tAcc.notSignedIn}
                        </h3>
                        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-400">
                          {tAcc.notSignedInDesc}
                        </p>
                        <div className="mt-5">
                          <button
                            type="button"
                            onClick={() => setIsAuthModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] hover:bg-accent-hover hover:shadow-accent/40 active:scale-[0.98]"
                          >
                            <LogIn className="size-4" />
                            <span>{tAcc.signInButton}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 2: Appearance & Localization */}
            {activeSection === "appearance" && (
              <div className="space-y-6 duration-150 animate-in fade-in">
                {/* Theme Card */}
                <div className="glass-panel divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-surface-1/90 p-6 shadow-xl backdrop-blur-xl">
                  <div className="pb-5">
                    <h2 className="text-base font-bold text-white">
                      {tApp.themeTitle}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {tApp.themeDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2">
                    {/* Dark Theme Option */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setTheme("dark")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setTheme("dark");
                        }
                      }}
                      className={`cursor-pointer rounded-xl border p-4.5 transition-all ${
                        theme === "dark"
                          ? "border-accent bg-accent/10 shadow-lg shadow-accent/10 ring-1 ring-accent"
                          : "border-white/[0.08] bg-surface-0/60 hover:border-white/20 hover:bg-surface-2"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-sky-400">
                            <Moon className="size-4" />
                          </div>
                          <span className="font-bold text-white">
                            {tApp.themeDarkTitle}
                          </span>
                        </div>
                        {theme === "dark" && (
                          <CheckCircle2 className="size-4 text-accent" />
                        )}
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                        {tApp.themeDarkDesc}
                      </p>
                    </div>

                    {/* Light Theme Option */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setTheme("light")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setTheme("light");
                        }
                      }}
                      className={`cursor-pointer rounded-xl border p-4.5 transition-all ${
                        theme === "light"
                          ? "border-accent bg-accent/10 shadow-lg shadow-accent/10 ring-1 ring-accent"
                          : "border-white/[0.08] bg-surface-0/60 hover:border-white/20 hover:bg-surface-2"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                            <Sun className="size-4" />
                          </div>
                          <span className="font-bold text-white">
                            {tApp.themeLightTitle}
                          </span>
                        </div>
                        {theme === "light" && (
                          <CheckCircle2 className="size-4 text-accent" />
                        )}
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                        {tApp.themeLightDesc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Language Selection Card */}
                <div className="glass-panel divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-surface-1/90 p-6 shadow-xl backdrop-blur-xl">
                  <div className="pb-5">
                    <h2 className="text-base font-bold text-white">
                      {tApp.languageTitle}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {tApp.languageDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2">
                    {/* English Option */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleLocale("en")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggleLocale("en");
                        }
                      }}
                      className={`cursor-pointer rounded-xl border p-4.5 transition-all ${
                        locale === "en"
                          ? "border-accent bg-accent/10 shadow-lg shadow-accent/10 ring-1 ring-accent"
                          : "border-white/[0.08] bg-surface-0/60 hover:border-white/20 hover:bg-surface-2"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 font-mono text-xs font-bold text-white">
                            EN
                          </div>
                          <span className="font-bold text-white">
                            {tApp.langEnTitle}
                          </span>
                        </div>
                        {locale === "en" && (
                          <CheckCircle2 className="size-4 text-accent" />
                        )}
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                        {tApp.langEnDesc}
                      </p>
                    </div>

                    {/* Chinese Option */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleLocale("zh")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggleLocale("zh");
                        }
                      }}
                      className={`cursor-pointer rounded-xl border p-4.5 transition-all ${
                        locale === "zh"
                          ? "border-accent bg-accent/10 shadow-lg shadow-accent/10 ring-1 ring-accent"
                          : "border-white/[0.08] bg-surface-0/60 hover:border-white/20 hover:bg-surface-2"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 font-mono text-xs font-bold text-white">
                            中文
                          </div>
                          <span className="font-bold text-white">
                            {tApp.langZhTitle}
                          </span>
                        </div>
                        {locale === "zh" && (
                          <CheckCircle2 className="size-4 text-accent" />
                        )}
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                        {tApp.langZhDesc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: Valuation Defaults & Engine */}
            {activeSection === "valuation" && (
              <div className="space-y-6 duration-150 animate-in fade-in">
                <div className="glass-panel divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-surface-1/90 p-6 shadow-xl backdrop-blur-xl">
                  <div className="pb-5">
                    <h2 className="text-base font-bold text-white">
                      {tVal.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {tVal.description}
                    </p>
                  </div>

                  <div className="space-y-5 pt-5">
                    {/* QPCE Panel */}
                    <div className="rounded-xl border border-white/[0.06] bg-surface-0/50 p-4.5">
                      <div className="flex items-center gap-2">
                        <Sliders className="size-4 text-accent" />
                        <h3 className="text-sm font-bold text-white">
                          {tVal.qpceTitle}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                        {tVal.qpceDesc}
                      </p>
                      <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-2.5 font-mono text-xs text-accent">
                        {tVal.qpceFormula}
                      </div>
                    </div>

                    {/* Income Quality Guardrail */}
                    <div className="rounded-xl border border-white/[0.06] bg-surface-0/50 p-4.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-white">
                          {tVal.guardrailTitle}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                        {tVal.guardrailDesc}
                      </p>
                    </div>

                    {/* Audited SEC Data Ingestion Feeds */}
                    <div className="rounded-xl border border-white/[0.06] bg-surface-0/50 p-4.5">
                      <div className="flex items-center gap-2">
                        <Database className="size-4 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">
                          {tVal.feedsTitle}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                        {tVal.feedsDesc}
                      </p>
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="rounded-lg border border-white/[0.06] bg-surface-1 p-2 font-mono text-slate-300">
                          {tVal.feedsMassive}
                        </div>
                        <div className="rounded-lg border border-white/[0.06] bg-surface-1 p-2 font-mono text-slate-300">
                          {tVal.feedsFinnhub}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: Privacy & Storage */}
            {activeSection === "privacy" && (
              <div className="space-y-6 duration-150 animate-in fade-in">
                <div className="glass-panel divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-surface-1/90 p-6 shadow-xl backdrop-blur-xl">
                  <div className="pb-5">
                    <h2 className="text-base font-bold text-white">
                      {tPriv.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {tPriv.description}
                    </p>
                  </div>

                  <div className="space-y-5 pt-5">
                    {/* Privacy Guardrail: Concealed in Menus */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="size-4 text-emerald-400" />
                          <h3 className="text-sm font-bold text-white">
                            {tPriv.dropdownPrivacyTitle}
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          {tPriv.statusActive}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                        {tPriv.dropdownPrivacyDesc}
                      </p>
                    </div>

                    {/* Zero-tracking Guarantee */}
                    <div className="rounded-xl border border-white/[0.06] bg-surface-0/50 p-4.5">
                      <div className="flex items-center gap-2">
                        <Shield className="size-4 text-accent" />
                        <h3 className="text-sm font-bold text-white">
                          {tPriv.privacyFirstTitle}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                        {tPriv.privacyFirstDesc}
                      </p>
                    </div>

                    {/* Cloud Storage */}
                    <div className="rounded-xl border border-white/[0.06] bg-surface-0/50 p-4.5">
                      <div className="flex items-center gap-2">
                        <Database className="size-4 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">
                          {tPriv.cloudSyncTitle}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                        {tPriv.cloudSyncDesc}
                      </p>
                    </div>

                    {/* Local Cache Management */}
                    <div className="rounded-xl border border-white/[0.06] bg-surface-0/50 p-4.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trash2 className="size-4 text-amber-400" />
                          <h3 className="text-sm font-bold text-white">
                            {tPriv.clearCacheTitle}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearCache}
                          className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 hover:text-white"
                        >
                          <Trash2 className="size-3 text-amber-400" />
                          <span>{tPriv.clearCacheButton}</span>
                        </button>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">
                        {tPriv.clearCacheDesc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: System Telemetry & Documentation */}
            {activeSection === "system" && (
              <div className="space-y-6 duration-150 animate-in fade-in">
                <div className="glass-panel divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-surface-1/90 p-6 shadow-xl backdrop-blur-xl">
                  <div className="pb-5">
                    <h2 className="text-base font-bold text-white">
                      {tSys.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {tSys.description}
                    </p>
                  </div>

                  <div className="space-y-5 pt-5">
                    {/* Platform Invariants */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/[0.06] bg-surface-0/50 p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {tSys.versionLabel}
                        </span>
                        <div className="mt-1 font-mono text-xs font-bold text-white">
                          v1.0.0 (Production)
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-surface-0/50 p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {tSys.engineLabel}
                        </span>
                        <div className="mt-1 font-mono text-xs font-bold text-accent">
                          TypeScript Deterministic
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-surface-0/50 p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {tSys.databaseLabel}
                        </span>
                        <div className="mt-1 font-mono text-xs font-bold text-emerald-400">
                          Neon PostgreSQL
                        </div>
                      </div>
                    </div>

                    {/* Institutional Resource Links */}
                    <div className="space-y-2 pt-2">
                      <Link
                        href="/methodology"
                        className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-surface-0/60 p-4 text-xs font-medium text-slate-200 transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-accent">
                            <BookOpen className="size-4" />
                          </div>
                          <span>{tSys.methodologyLink}</span>
                        </div>
                        <ArrowUpRight className="size-4 text-slate-400" />
                      </Link>

                      <a
                        href="https://github.com/phanturne/stress-alpha"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-surface-0/60 p-4 text-xs font-medium text-slate-200 transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-slate-300">
                            <ExternalLink className="size-4" />
                          </div>
                          <span>{tSys.githubLink}</span>
                        </div>
                        <ArrowUpRight className="size-4 text-slate-400" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setIsShortcutsOpen(true)}
                        className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-surface-0/60 p-4 text-xs font-medium text-slate-200 transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-accent">
                            <Keyboard className="size-4" />
                          </div>
                          <span>{tSys.shortcutsButton}</span>
                        </div>
                        <kbd className="rounded border border-white/[0.1] bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                          ?
                        </kbd>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-surface-1 px-4 py-2.5 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        locale={locale}
      />

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/[0.12] p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="size-5 text-accent" />
                <h3 className="font-bold text-white">{t.header.shortcuts}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-surface-2 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.header.language}</span>
                <kbd className="rounded border border-white/[0.1] bg-surface-2 px-2 py-1 font-semibold text-accent">
                  L
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.header.shortcuts}</span>
                <kbd className="rounded border border-white/[0.1] bg-surface-2 px-2 py-1 font-semibold text-accent">
                  ?
                </kbd>
              </div>
              {recentReport?.slug && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">
                    {t.shortcuts.returnToModel}
                  </span>
                  <kbd className="rounded border border-white/[0.1] bg-surface-2 px-2 py-1 font-semibold text-accent">
                    M
                  </kbd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  {t.shortcuts.toggleFavorite}
                </span>
                <kbd className="rounded border border-white/[0.1] bg-surface-2 px-2 py-1 font-semibold text-accent">
                  F
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.shortcuts.close}</span>
                <kbd className="rounded border border-white/[0.1] bg-surface-2 px-2 py-1 font-semibold text-slate-300">
                  ESC
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
