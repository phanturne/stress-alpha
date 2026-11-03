import React from "react";

export interface SegmentedTabOption<T extends string = string> {
  id: T;
  label: React.ReactNode;
  activeClassName?: string;
  badge?: React.ReactNode;
}

export interface SegmentedTabsProps<T extends string = string> {
  options: SegmentedTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  fullWidth?: boolean;
}

/**
 * Modular segmented tabs component.
 *
 * Enforces the invariant:
 * - Base button always retains `border` class with `transition-colors duration-150`.
 * - Active state applies `border-border bg-surface-1 shadow-xs` plus optional accent colors.
 * - Inactive state applies `border-transparent text-slate-400 hover:text-foreground`.
 *
 * This eliminates the border flash / highlight flicker when switching tabs.
 */
export function SegmentedTabs<T extends string = string>({
  options,
  value,
  onChange,
  className = "",
  fullWidth = false,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-0.5 ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.id === value;
        return (
          <button
            key={opt.id}
            role="tab"
            type="button"
            aria-selected={isSelected}
            onClick={() => onChange(opt.id)}
            className={`${
              fullWidth ? "flex-1" : ""
            } flex items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-xs font-bold transition-colors duration-150 ${
              isSelected
                ? `shadow-xs border-border bg-surface-1 ${
                    opt.activeClassName || "font-bold text-foreground"
                  }`
                : "border-transparent text-slate-400 hover:text-foreground"
            }`}
          >
            {opt.label}
            {opt.badge}
          </button>
        );
      })}
    </div>
  );
}
