"use client";

import { useEffect } from "react";

/**
 * Registers `/sw.js` once, after load, in production-like origins only (not on
 * `localhost` dev, where a stale SW is a constant nuisance). When a new worker takes
 * control it reloads the page once so the user always runs the latest shell.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return;

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = () => {
      navigator.serviceWorker.register("/sw.js").then(
        (reg) => {
          reg.addEventListener("updatefound", () => {
            const next = reg.installing;
            if (!next) return;
            next.addEventListener("statechange", () => {
              if (next.state === "installed" && navigator.serviceWorker.controller) {
                // A newer worker is waiting — activate it immediately.
                next.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
        },
        () => {},
      );
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
