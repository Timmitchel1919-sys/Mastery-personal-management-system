"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui";
import { useInstallPrompt } from "./use-install-prompt";

/**
 * "Install Mastery" — visible only where the browser exposes an install prompt and the
 * app isn't already installed. Renders nothing otherwise (no nagging banner).
 */
export function InstallButton({
  label,
  installedLabel,
}: {
  label: string;
  installedLabel: string;
}) {
  const { canInstall, installed, promptInstall } = useInstallPrompt();

  if (installed) return <p className="text-subtle text-sm">{installedLabel}</p>;
  if (!canInstall) return null;

  return (
    <Button variant="outline" onClick={() => void promptInstall()}>
      <Download />
      {label}
    </Button>
  );
}
