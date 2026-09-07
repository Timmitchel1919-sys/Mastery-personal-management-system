import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  /** "mark" = monogram only (sidebar, compact nav, collapsed rail). "full" = monogram
   * + wordmark (landing, auth screens, large branding areas). */
  variant?: "mark" | "full";
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
} as const;

/**
 * The Mastery logo — the actual brand asset, never redrawn. Use `variant="mark"` for
 * the monogram alone (sidebar, collapsed rail) and `variant="full"` for the
 * monogram + wordmark lockup (landing, login, register, large branding areas).
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
