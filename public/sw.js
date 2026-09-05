/*
 * Mastery service worker (Layer 19). Hand-rolled — no Workbox — so it stays legible and
 * has no build-time coupling to the static export.
 *
 * Strategy:
 *   - Precache a tiny shell: the offline page + manifest + icons.
 *   - Navigations: network-first, fall back to a cached copy of that URL, then /offline.
 *   - Hashed static assets (/_next/static/**) and icons: cache-first.
 *   - Everything else: network, fall back to cache.
 *
 * Privacy (docs/RECOVERY_PRIVACY.md §7): Recovery Center navigations are NEVER cached and
 * NEVER served from cache — offline, they fail closed rather than show stale private data.
 * Firestore / Auth / Google APIs are cross-origin and are not touched here at all.
 */

const VERSION = "v1";
const CACHE = `mastery-${VERSION}`;
const PRECACHE = [
  "/offline",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function isRecoveryPath(url) {
  return url.pathname === "/recovery" || url.pathname.startsWith("/recovery/");
}

async function networkFirst(request, url) {
  try {
    const response = await fetch(request);
    if (response && response.ok && !isRecoveryPath(url)) {
      const copy = response.clone();
      caches
        .open(CACHE)
        .then((cache) => cache.put(request, copy))
        .catch(() => {});
    }
    return response;
  } catch {
    if (!isRecoveryPath(url)) {
      const cached = await caches.match(request);
      if (cached) return cached;
    }
    const offline = await caches.match("/offline");
    return offline ?? new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const copy = response.clone();
    caches
      .open(CACHE)
      .then((cache) => cache.put(request, copy))
      .catch(() => {});
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, url));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((r) => r ?? Response.error())),
  );
});
