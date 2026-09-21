"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import { getTranslations, type Locale } from "@/lib/i18n";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: Locale;
  initialMode?: "signIn" | "signUp";
  onSuccess?: () => void;
}

interface AuthModalContentProps {
  onClose: () => void;
  locale?: Locale;
  initialMode?: "signIn" | "signUp";
  onSuccess?: () => void;
}

const AuthModalContent: React.FC<AuthModalContentProps> = ({
  onClose,
  locale = "en",
  initialMode = "signIn",
  onSuccess,
}) => {
  const t = getTranslations(locale).auth;
  const [mode, setMode] = useState<"signIn" | "signUp">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signIn") {
        const res = await signIn.email({
          email: email.trim(),
          password,
        });

        if (res?.error) {
          setError(res.error.message || t.errorTitle);
          setLoading(false);
          return;
        }

        setSuccess(t.loginSuccess);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      } else {
        const res = await signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0] || "Analyst",
        });

        if (res?.error) {
          setError(res.error.message || t.errorTitle);
          setLoading(false);
          return;
        }

        setSuccess(t.signupSuccess);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setError(err?.message || t.errorTitle);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Blur Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Institutional Dialog Card */}
      <div className="glass-panel relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.12] bg-surface-1/95 p-6 shadow-2xl backdrop-blur-2xl duration-200 animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Header Branding & Title */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-accent/40 bg-accent/15 text-accent shadow-glow">
            <Shield className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white">
              {mode === "signIn" ? t.signInTitle : t.signUpTitle}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
              {mode === "signIn" ? t.signInSubtitle : t.signUpSubtitle}
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            <div>{success}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signUp" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                {t.name}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full rounded-lg border border-white/[0.1] bg-surface-2/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              {t.email}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full rounded-lg border border-white/[0.1] bg-surface-2/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              {t.password}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full rounded-lg border border-white/[0.1] bg-surface-2/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-accent/90 active:scale-[0.99] disabled:opacity-50"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            <span>
              {loading
                ? t.loading
                : mode === "signIn"
                  ? t.signIn
                  : t.createAccount}
            </span>
          </button>
        </form>

        {/* Mode Toggle Switcher */}
        <div className="mt-5 border-t border-white/[0.08] pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setSuccess(null);
              setMode(mode === "signIn" ? "signUp" : "signIn");
            }}
            className="text-xs text-slate-400 transition-colors hover:text-accent"
          >
            {mode === "signIn" ? t.dontHaveAccount : t.alreadyHaveAccount}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AuthModal: React.FC<AuthModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <AuthModalContent {...props} />;
};
