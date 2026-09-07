"use client";

import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallAppButton({
  className,
  size = "md",
  variant = "secondary",
  showFallbackText = false,
}: {
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  showFallbackText?: boolean;
}) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandaloneMode);
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setFallbackText(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const buttonLabel = useMemo(() => {
    if (installed) return "App installed";
    return "Download app";
  }, [installed]);

  const handleInstall = async () => {
    if (installed) return;

    if (!promptEvent) {
      setFallbackText("Use your browser menu and choose Install app.");
      return;
    }

    setFallbackText(null);
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome !== "accepted") {
      setFallbackText("Install prompt dismissed. You can try again anytime.");
    }
    setPromptEvent(null);
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        className={className}
        variant={variant}
        size={size}
        onClick={handleInstall}
        disabled={installed}
      >
        <Download />
        {buttonLabel}
      </Button>
      {showFallbackText && fallbackText ? (
        <p className="text-subtle max-w-60 text-xs">{fallbackText}</p>
      ) : null}
    </div>
  );
}
