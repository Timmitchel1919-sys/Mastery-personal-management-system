"use client";

import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  /** Transition delay in ms, for staggering siblings. */
  delay?: number;
  as?: ElementType;
  className?: string;
  id?: string;
}

/**
 * Fades + lifts its children into view once, when scrolled near the viewport.
 * SSR-safe: renders fully visible until mounted, so a pre-hydration paint shows
 * all content. Honours `prefers-reduced-motion` (no hidden state, no transition)
 * and degrades to "just show it" without IntersectionObserver.
 */
export function Reveal({ children, delay = 0, as: Tag = "div", className, id }: RevealProps) {
  const mounted = useMounted();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!node) return;

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  // Apply the hidden/animated state only after mount, and only until revealed.
  const animate = mounted && !shown;

  return (
    <Tag
      ref={setNode}
      id={id}
      className={cn("mastery-reveal", animate && "mastery-reveal--hidden", className)}
      style={delay && animate ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
