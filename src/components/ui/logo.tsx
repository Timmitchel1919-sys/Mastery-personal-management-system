import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  /** "mark" = flat gold monogram (collapsed sidebar rail, on the light surface).
   * "full" = monogram + wordmark lockup (landing nav, large branding areas).
   * "app" = the approved square app icon — black tile + gold monogram — as used for the
   * favicon / PWA / auth branding. */
  variant?: "mark" | "full" | "app";
  /** Rendered height in pixels; width follows the asset's own aspect ratio. */
  height?: number;
  className?: string;
  /** Set false only when adjacent visible text already names "Mastery". */
  withLabel?: boolean;
}

// Real intrinsic dimensions of the source assets — required by next/image, and kept
// here (not measured from the DOM) so the aspect ratio never drifts.
const ASSET = {
  mark: { src: "/brand/mastery-mark.png", width: 512, height: 199 },
  full: { src: "/brand/mastery-logo.png", width: 960, height: 332 },
  app: { src: "/brand/mastery-app-icon.png", width: 1254, height: 1254 },
} as const;

/**
 * The Mastery logo — the actual brand asset, never redrawn. `variant="mark"` for the
 * flat monogram (collapsed rail), `variant="full"` for the monogram + wordmark lockup
 * (landing nav), and `variant="app"` for the approved square app icon (auth branding —
 * the same asset the browser tab and PWA use).
 */
export function Logo({ variant = "full", height = 32, className, withLabel = true }: LogoProps) {
  const asset = ASSET[variant];
  const width = Math.round((asset.width / asset.height) * height);
  return (
    <Image
      src={asset.src}
      alt={withLabel ? "Mastery" : ""}
      width={width}
      height={height}
      style={{ height, width: "auto" }}
      className={cn("shrink-0", className)}
      priority
    />
  );
}
