// Service worker: permite instalar el juego y jugar sin conexión.
// - Código y páginas: red primero (siempre la última versión) y caché de respaldo.
// - Imágenes, audio, fuentes y modelos: lo guardado al instante y se refresca por detrás, con un tope para no llenar el móvil.
// Cada versión del juego usa su propia caché y al activarse borra las anteriores.
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const CODE = `dftc-code-${VERSION}`;
const MEDIA = "dftc-media-v1";
const MEDIA_MAX = 400; // archivos

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CODE && k !== MEDIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);

const isMedia = (url) => /\.(png|jpe?g|webp|avif|gif|svg|mp3|ogg|wav|woff2?|ttf|glb|gltf|obj)$/i.test(url.pathname);

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length > MEDIA_MAX) await Promise.all(keys.slice(0, keys.length - MEDIA_MAX).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (isMedia(url)) {
    e.respondWith(
      // Lo guardado se ve al instante y se actualiza por detrás (si una imagen cambia, se ve en la siguiente visita)
      caches.open(MEDIA).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((res) => { if (res.ok && res.status === 200) { c.put(req, res.clone()); trim(c); } return res; });
        if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
        return net;
      }),
    );
    return;
  }
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CODE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.open(CODE).then((c) => c.match(req)).then((r) => r || caches.match("./index.html"))),
  );
});
