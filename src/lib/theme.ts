export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "mastery.theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/** The OS-level preference. Returns "light" when it cannot be determined (SSR / no matchMedia). */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Collapse a preference (which may be "system") to a concrete light/dark value. */
export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

/** Apply the resolved theme to the document root. No-op on the server. */
export function applyTheme(theme: Theme): ResolvedTheme {
  const resolved = resolveTheme(theme);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
  }
  return resolved;
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

export function writeStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage unavailable (private mode, blocked) — preference is session-only, non-fatal
  }
}

/* ── External store for useSyncExternalStore ─────────────────────
 * Holds the current preference, keeps <html data-theme> in sync, and reacts to
 * cross-tab storage changes and OS theme changes. */

type Listener = () => void;

const listeners = new Set<Listener>();
let currentTheme: Theme | null = null;

function notify(): void {
  for (const listener of listeners) listener();
}

export const themeStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      currentTheme = readStoredTheme();
      applyTheme(currentTheme);
      notify();
    };

    const media =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    const onMediaChange = () => {
      applyTheme(currentTheme ?? readStoredTheme());
      notify();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    media?.addEventListener("change", onMediaChange);

    return () => {
      listeners.delete(listener);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
      media?.removeEventListener("change", onMediaChange);
    };
  },

  getSnapshot(): Theme {
    if (currentTheme === null) currentTheme = readStoredTheme();
    return currentTheme;
  },

  getServerSnapshot(): Theme {
    return "system";
  },

  setTheme(theme: Theme): void {
    currentTheme = theme;
    writeStoredTheme(theme);
    applyTheme(theme);
    notify();
  },
};
