/* Network-first so updates ship immediately; cache is only the offline fallback. */
var CACHE = 'plate450-diary-v26';
var FILES = ['./', 'index.html', 'css/style.css', 'js/stats.js', 'js/sim.js', 'content/content.js', 'js/content.js', 'js/app.js', 'js/learn.js', 'js/brand.js', 'brand/plate450-mark.svg', 'brand/plate450-mark-dark.svg', 'brand/diary-mark.svg', 'favicon-32.png', 'js/review.js', 'js/plan.js', 'js/qr.js', 'js/matchcore.js', 'js/matchup.js', 'js/tour.js', 'js/cloud-config.js', 'js/cloud.js', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copy = r.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return r;
    }).catch(function () {
      return caches.match(e.request).then(function (m) { return m || caches.match('index.html'); });
    })
  );
});
