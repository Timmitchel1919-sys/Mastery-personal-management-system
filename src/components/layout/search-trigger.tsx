"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Kbd } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useShell } from "./shell-context";

export function SearchTrigger({ className }: { className?: string }) {
  const { setCommandOpen } = useShell();
  const t = useTranslations("chrome");

  return (
    <button
      type="button"
      onClick={() => setCommandOpen(true)}
      aria-label={t("searchLabel")}
      className={cn(
        "border-border text-muted hover:bg-surface flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm outline-none transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 lg:px-3",
        className,
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <span className="hidden lg:inline">{t("searchPlaceholder")}</span>
      <Kbd className="ml-2 hidden lg:inline-flex">⌘K</Kbd>
    </button>
  );
}
