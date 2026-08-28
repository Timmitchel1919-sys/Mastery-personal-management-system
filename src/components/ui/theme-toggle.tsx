"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { isTheme, THEMES, type Theme } from "@/lib/theme";
import { SegmentedControl, SegmentedControlItem } from "./segmented-control";

const ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <SegmentedControl
      className={className}
      value={theme}
      onValueChange={(next) => {
        // Radix emits "" when a segment is toggled off; ignore that.
        if (isTheme(next)) setTheme(next);
      }}
      aria-label="Color theme"
    >
      {THEMES.map((option) => {
        const Icon = ICONS[option];
        return (
          <SegmentedControlItem key={option} value={option} aria-label={LABELS[option]}>
            <Icon aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{LABELS[option]}</span>
          </SegmentedControlItem>
        );
      })}
    </SegmentedControl>
  );
}
