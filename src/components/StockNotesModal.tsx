"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  NotebookPen,
  X,
  Check,
  Copy,
  Trash2,
  Cloud,
  HardDrive,
  Sparkles,
  Eye,
  Edit3,
  Clock,
} from "lucide-react";
import { useStockNote } from "@/lib/notes";
import { getTranslations, type Locale } from "@/lib/i18n";

export interface StockNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  company?: string;
  locale?: Locale;
}

export const StockNotesModal: React.FC<StockNotesModalProps> = ({
  isOpen,
  onClose,
  ticker,
  company,
  locale = "en",
}) => {
  const t = getTranslations(locale).stockNotes;
  const {
    content,
    updatedAt,
    saveNote,
    deleteNote,
    isSaving,
    isAuthenticated,
  } = useStockNote(isOpen ? ticker : null);

  const [draft, setDraft] = useState(content);
  const [prevContent, setPrevContent] = useState(content);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftRef = useRef(draft);
  const isDirtyRef = useRef(false);

  // Sync draft if external content updates
  if (content !== prevContent) {
    setPrevContent(content);
    setDraft(content);
  }

  // Update ref when draft changes
  useEffect(() => {
    latestDraftRef.current = draft;
  }, [draft]);

  // Flush any pending debounced change immediately
  const flushPendingSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (isDirtyRef.current) {
      saveNote(latestDraftRef.current);
      isDirtyRef.current = false;
    }
  }, [saveNote]);

  const handleClose = useCallback(() => {
    flushPendingSave();
    onClose();
  }, [flushPendingSave, onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Debounced auto-save (500ms delay to prevent excessive network requests)
  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDraft(val);
    latestDraftRef.current = val;
    isDirtyRef.current = true;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveNote(val);
      isDirtyRef.current = false;
    }, 500);
  };

  useEffect(() => {
    return () => {
      flushPendingSave();
    };
  }, [flushPendingSave]);

  const handleInsertTemplate = (snippet: string) => {
    setMode("edit");
    const currentText = draft;
    const nextText =
      currentText.trim().length === 0
        ? snippet
        : `${currentText.trim()}\n\n${snippet}`;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    isDirtyRef.current = false;
    setDraft(nextText);
    saveNote(nextText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleCopy = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    isDirtyRef.current = false;
    setDraft("");
    deleteNote();
    setIsConfirmingClear(false);
  };

  if (!isOpen || !ticker) return null;

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const charCount = draft.length;

  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString(
        locale === "zh" ? "zh-CN" : "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 duration-200 animate-in fade-in sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-surface-1 shadow-2xl backdrop-blur-xl">
        {/* Modal Header */}
        <div className="flex flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
              <NotebookPen className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black tracking-tight text-foreground">
                  {ticker}
                </span>
                {company && (
                  <span className="max-w-[200px] truncate text-xs text-foreground/60 sm:max-w-[300px]">
                    · {company}
                  </span>
                )}
                <span className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/70">
                  {t.tabTitle}
                </span>
              </div>
              <p className="text-xs text-foreground/50">{t.tabSubtitle}</p>
            </div>
          </div>

          {/* Sync status & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sync Status Badge */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/60 px-2.5 py-1 text-xs">
              {isSaving ? (
                <>
                  <span className="size-2 animate-ping rounded-full bg-accent" />
                  <span className="font-mono text-[11px] text-accent">
                    {t.saving}
                  </span>
                </>
              ) : isAuthenticated ? (
                <>
                  <Cloud className="size-3.5 text-emerald-400" />
                  <span className="font-mono text-[11px] text-foreground/70">
                    {t.cloudSynced}
                  </span>
                </>
              ) : (
                <>
                  <HardDrive className="size-3.5 text-sky-400" />
                  <span
                    className="font-mono text-[11px] text-foreground/70"
                    title={t.signInToSync}
                  >
                    {t.savedLocally}
                  </span>
                </>
              )}
            </div>

            {/* Edit / Preview Pill Toggle */}
            <div className="flex rounded-lg border border-border bg-surface-2/80 p-0.5">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  mode === "edit"
                    ? "bg-accent/20 text-accent"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <Edit3 className="size-3" />
                <span>{t.editMode}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  mode === "preview"
                    ? "bg-accent/20 text-accent"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <Eye className="size-3" />
                <span>{t.previewMode}</span>
              </button>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              disabled={!draft}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface-2/60 px-2.5 py-1 text-xs font-semibold text-foreground/70 transition-colors hover:bg-surface-3 hover:text-foreground disabled:opacity-40"
              title={t.copyNote}
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-400" />
                  <span className="text-emerald-400">{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>{t.copyNote}</span>
                </>
              )}
            </button>

            {/* Clear Button */}
            {isConfirmingClear ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg border border-rose-500/40 bg-rose-500/20 px-2 py-1 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-500/30"
                >
                  {t.confirmClear}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-foreground/60 hover:text-foreground"
                >
                  {t.cancel}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                disabled={!draft}
                className="flex items-center gap-1 rounded-lg border border-border bg-surface-2/60 px-2.5 py-1 text-xs text-foreground/60 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                title={t.clearNote}
              >
                <Trash2 className="size-3" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1 text-foreground/60 transition-colors hover:bg-surface-3 hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Quick Template Chips */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 bg-surface-0/40 px-4 py-2.5 sm:px-5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground/50">
            <Sparkles className="size-3 text-accent" />
            {t.quickTemplatesTitle}
          </span>
          <button
            type="button"
            onClick={() => handleInsertTemplate(t.templateSnippets.thesis)}
            className="rounded-md border border-border/70 bg-surface-2/70 px-2 py-0.5 text-[11px] font-medium text-foreground/80 transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
          >
            {t.templates.thesis}
          </button>
          <button
            type="button"
            onClick={() => handleInsertTemplate(t.templateSnippets.risks)}
            className="rounded-md border border-border/70 bg-surface-2/70 px-2 py-0.5 text-[11px] font-medium text-foreground/80 transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
          >
            {t.templates.risks}
          </button>
          <button
            type="button"
            onClick={() => handleInsertTemplate(t.templateSnippets.levels)}
            className="rounded-md border border-border/70 bg-surface-2/70 px-2 py-0.5 text-[11px] font-medium text-foreground/80 transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
          >
            {t.templates.levels}
          </button>
        </div>

        {/* Main Notepad Area */}
        <div className="flex max-h-[55vh] min-h-[320px] flex-1 flex-col overflow-hidden p-4 sm:p-5">
          {mode === "edit" ? (
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={handleDraftChange}
              placeholder={t.placeholder}
              className="custom-scrollbar size-full min-h-[280px] flex-1 resize-none bg-transparent font-sans text-sm leading-relaxed text-foreground placeholder:text-foreground/30 focus:outline-none"
              autoFocus
            />
          ) : (
            <div className="custom-scrollbar h-full min-h-[280px] flex-1 overflow-y-auto font-sans text-sm leading-relaxed text-foreground">
              {draft.trim() ? (
                <div className="space-y-3">
                  {draft.split("\n\n").map((block, idx) => {
                    const trimmed = block.trim();
                    if (trimmed.startsWith("### ")) {
                      return (
                        <h4
                          key={idx}
                          className="pt-2 font-bold tracking-tight text-accent"
                        >
                          {trimmed.replace(/^###\s+/, "")}
                        </h4>
                      );
                    }
                    if (trimmed.startsWith("## ")) {
                      return (
                        <h3
                          key={idx}
                          className="pt-2 text-base font-extrabold tracking-tight text-foreground"
                        >
                          {trimmed.replace(/^##\s+/, "")}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith("# ")) {
                      return (
                        <h2
                          key={idx}
                          className="pt-3 text-lg font-black tracking-tight text-foreground"
                        >
                          {trimmed.replace(/^#\s+/, "")}
                        </h2>
                      );
                    }
                    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                      const items = trimmed.split("\n");
                      return (
                        <ul
                          key={idx}
                          className="list-inside list-disc space-y-1 pl-1 text-foreground/90"
                        >
                          {items.map((it, itemIdx) => {
                            const cleanItem = it.replace(/^[-*]\s+/, "");
                            return (
                              <li key={itemIdx}>
                                {renderFormattedInline(cleanItem)}
                              </li>
                            );
                          })}
                        </ul>
                      );
                    }
                    return (
                      <p
                        key={idx}
                        className="whitespace-pre-wrap text-foreground/80"
                      >
                        {renderFormattedInline(trimmed)}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full min-h-[240px] items-center justify-center text-xs text-foreground/40">
                  {t.emptyPreview}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Strip */}
        <div className="flex items-center justify-between border-t border-border/60 bg-surface-0/60 px-4 py-3 text-[11px] text-foreground/50 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums">
              {t.charCount(charCount, wordCount)}
            </span>
            {formattedTime && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="size-3" />
                  {t.lastSaved(formattedTime)}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <span className="hidden text-[10px] text-accent/80 sm:inline">
                {t.signInToSync}
              </span>
            )}
            <span className="hidden font-mono text-[10px] text-foreground/40 md:inline">
              Esc to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function renderFormattedInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
