// Service worker de MonAi.
//
// - Los assets de /_next/static llevan hash en el nombre: cache-first.
// - Las páginas van siempre a la red. Si no hay conexión se muestra
//   /offline. No se guardan páginas con datos del usuario en caché: en un
//   dispositivo compartido quedarían visibles tras cerrar sesión.
// - Las Server Actions (POST) y las peticiones RSC no se tocan; Next las
//   reintenta solo al volver la conexión (experimental.useOffline).

const VERSION = "v1";
const STATIC_CACHE = `monai-static-${VERSION}`;
const SHELL_CACHE = `monai-shell-${VERSION}`;
const OFFLINE_URL = "/offline";

const SHELL = [OFFLINE_URL, "/icons/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match(OFFLINE_URL)) ?? Response.error();
      }),
    );
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}
