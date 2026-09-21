/* ============================================================
   Funny Calculator — Service Worker (offline app shell)
   ------------------------------------------------------------
   • Cache-first for the local app files. Nothing external is
     ever cached (no third-party / CDN resources are involved).
   • Bump CACHE_VERSION whenever an app file changes; the old
     cache is deleted automatically inside "activate".
   • If service workers are unsupported or blocked (e.g. the
     page is opened from file://) the app keeps working as-is,
     because this file is only a progressive enhancement.
   ============================================================ */

const CACHE_VERSION = "v1";
const CACHE_PREFIX = "funny-calculator";
const CACHE_NAME = CACHE_PREFIX + "-" + CACHE_VERSION;

/* Local app shell — everything the calculator needs offline. */
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon.svg"
];

const INDEX_URL = new URL("index.html", self.location).href;

/* Self-contained page shown only if a navigation happens while
   offline and nothing has been cached yet (very first visit). */
const OFFLINE_FALLBACK =
  '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
  "<title>Funny Calculator — Offline</title></head>" +
  '<body style="margin:0;min-height:100vh;display:flex;align-items:center;' +
  "justify-content:center;background:#0a0a13;color:#f5f5fc;text-align:center;" +
  'font-family:system-ui,Segoe UI,Arial,sans-serif"><div>' +
  '<h1 style="font-size:1.5rem">😴 Offline hai bhai!</h1>' +
  '<p style="color:#9c9cb8;margin-top:10px">Ye app ek baar internet ke saath ' +
  "kholo, uske baad offline bhi chalegi.</p></div></body></html>";

/* ---------- helpers ---------- */
/* Returns the URL for same-origin http(s) requests, otherwise null. */
function localUrl(request) {
  let url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return null;
  }
  if (url.origin !== self.location.origin) return null; /* external site */
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return url;
}

/* Fire-and-forget copy into the cache; failures are never fatal. */
function putInCache(request, responseClone) {
  if (!responseClone || !responseClone.ok || responseClone.type !== "basic") return;
  caches
    .open(CACHE_NAME)
    .then(function (cache) {
      return cache.put(request, responseClone);
    })
    .catch(function () {
      /* storage full / redirected response: ignore, app still works */
    });
}

/* ---------- install: pre-cache the app shell ---------- */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        /* Each file is cached on its own so one missing file can
           never break the whole installation. */
        return Promise.all(
          APP_SHELL.map(function (path) {
            const url = new URL(path, self.location).href;
            return cache.add(new Request(url, { cache: "reload" })).catch(function () {
              return null;
            });
          })
        );
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

/* ---------- activate: drop caches from older versions ---------- */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key.indexOf(CACHE_PREFIX + "-") === 0 && key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return null;
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

/* ---------- fetch: cache-first for local files ---------- */
self.addEventListener("fetch", function (event) {
  const request = event.request;

  if (request.method !== "GET") return; /* only reads */
  if (!localUrl(request)) return; /* never touch other origins */

  /* Navigations (the app itself). */
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;
        return caches.match(INDEX_URL).then(function (indexCached) {
          if (indexCached) return indexCached;
          return fetch(request)
            .then(function (response) {
              putInCache(request, response.clone());
              return response;
            })
            .catch(function () {
              return new Response(OFFLINE_FALLBACK, {
                status: 200,
                headers: { "Content-Type": "text/html; charset=utf-8" }
              });
            });
        });
      })
    );
    return;
  }

  /* Local assets: style.css, script.js, manifest.json, icon.svg… */
  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request)
        .then(function (response) {
          putInCache(request, response.clone());
          return response;
        })
        .catch(function () {
          return new Response("", { status: 504, statusText: "Offline" });
        });
    })
  );
});
