// Service worker de Angel’s Spendly.
//
// - Los assets de /_next/static llevan hash en el nombre: cache-first.
// - Las páginas van siempre a la red. Si no hay conexión se muestra
//   /{idioma}/offline. No se guardan páginas con datos del usuario en caché: en un
//   dispositivo compartido quedarían visibles tras cerrar sesión.
// - Las Server Actions (POST) y las peticiones RSC no se tocan; Next las
//   reintenta solo al volver la conexión (experimental.useOffline).
// - Notificaciones push: el servidor envía { title, body, url, tag }
//   (src/lib/push/messages.ts); al tocarla se abre esa página.

// v2: páginas offline por idioma (/en/offline, /es/offline).
const VERSION = "v2";
const STATIC_CACHE = `spendly-static-${VERSION}`;
const SHELL_CACHE = `spendly-shell-${VERSION}`;
// Se cachean con el prefijo: "/offline" es una redirección y una respuesta
// redirigida no se puede servir como página.
const OFFLINE_URLS = { en: "/en/offline", es: "/es/offline" };

const SHELL = [
  ...Object.values(OFFLINE_URLS),
  "/icons/icon-192.png",
  "/manifest.webmanifest",
];

/** La página offline en el idioma de la URL que falló (inglés por defecto). */
function offlineUrlFor(url) {
  const lang = url.pathname.split("/")[1];
  return OFFLINE_URLS[lang] ?? OFFLINE_URLS.en;
}

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
        return (await cache.match(offlineUrlFor(url))) ?? Response.error();
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

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    // Sin JSON válido: un aviso genérico (el navegador exige mostrar algo).
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Spendly", {
      body: payload.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag,
      data: { url: payload.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/", self.location.origin)
    .href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Si la app ya está abierta, se reutiliza esa ventana.
      const open = windows.find((client) => "focus" in client);
      if (open) {
        await open.focus();
        if ("navigate" in open) await open.navigate(url);
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
