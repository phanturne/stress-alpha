"use client";

import { useEffect } from "react";

export interface TabItem {
  id: string;
}

export interface UseKeyboardShortcutsOptions {
  tabItems: TabItem[];
  currentTabIndex: number;
  switchWorkspace: (tabId: string) => void;
  onResetDefaults: () => void;
  onToggleMemo: () => void;
  onOpenScreener: () => void;
  onToggleLocale: () => void;
  onToggleSocialCard: () => void;
  onToggleSnowflake: () => void;
  onToggleFavorite: () => void;
  onToggleShortcuts: () => void;
  isSnowflakeOpen: boolean;
  setIsSnowflakeOpen: (open: boolean) => void;
  isSocialCardOpen: boolean;
  setIsSocialCardOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
}

export function useKeyboardShortcuts({
  tabItems,
  currentTabIndex,
  switchWorkspace,
  onResetDefaults,
  onToggleMemo,
  onOpenScreener,
  onToggleLocale,
  onToggleSocialCard,
  onToggleSnowflake,
  onToggleFavorite,
  onToggleShortcuts,
  isSnowflakeOpen,
  setIsSnowflakeOpen,
  isSocialCardOpen,
  setIsSocialCardOpen,
  isShortcutsOpen,
  setIsShortcutsOpen,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept browser-native shortcuts (Cmd+R, Ctrl+R, Cmd+W, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const inputType = (target as HTMLInputElement)?.type?.toLowerCase();

      // Only suppress hotkeys when actively typing inside text-entry controls
      const isTextEntry =
        tag === "textarea" ||
        Boolean(target?.isContentEditable) ||
        (tag === "input" &&
          !["range", "button", "checkbox", "radio", "submit", "reset"].includes(
            inputType || ""
          ));

      if (isTextEntry) {
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= tabItems.length) {
        e.preventDefault();
        switchWorkspace(tabItems[num - 1].id);
        return;
      }

      if (e.key === "[" || e.key === "PageUp") {
        e.preventDefault();
        if (currentTabIndex > 0) {
          switchWorkspace(tabItems[currentTabIndex - 1].id);
        }
        return;
      }

      if (e.key === "]" || e.key === "PageDown") {
        e.preventDefault();
        if (currentTabIndex < tabItems.length - 1) {
          switchWorkspace(tabItems[currentTabIndex + 1].id);
        }
        return;
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        onResetDefaults();
        return;
      }

      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        onToggleMemo();
        return;
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        onOpenScreener();
        return;
      }

      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        onToggleLocale();
        return;
      }

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        onToggleSocialCard();
        return;
      }

      if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        onToggleSnowflake();
        return;
      }

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        onToggleFavorite();
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        onToggleShortcuts();
        return;
      }

      if (e.key === "Escape") {
        if (isSnowflakeOpen) {
          e.preventDefault();
          setIsSnowflakeOpen(false);
          return;
        }
        if (isSocialCardOpen) {
          e.preventDefault();
          setIsSocialCardOpen(false);
          return;
        }
        if (isShortcutsOpen) {
          e.preventDefault();
          setIsShortcutsOpen(false);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    tabItems,
    currentTabIndex,
    switchWorkspace,
    onResetDefaults,
    onToggleMemo,
    onOpenScreener,
    onToggleLocale,
    onToggleSocialCard,
    onToggleSnowflake,
    onToggleFavorite,
    onToggleShortcuts,
    isSnowflakeOpen,
    setIsSnowflakeOpen,
    isSocialCardOpen,
    setIsSocialCardOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
  ]);
}
