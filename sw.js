const CACHE_NAME = 'escape-rush-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.webmanifest',
  '/src/main.js',
  '/src/game/utils.js',
  '/src/game/state.js',
  '/src/game/audio.js',
  '/src/game/monetization.js',
  '/src/game/road.js',
  '/src/game/player.js',
  '/src/game/enemy.js',
  '/src/game/ui.js',
  'https://unpkg.com/three@0.160.0/build/three.min.js'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if (url.origin === location.origin){
    e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
  }
});
