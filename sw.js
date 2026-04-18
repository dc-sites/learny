const CACHE_NAME = 'learny-v1';
const ASSETS = [
  './',
  './index.html',
  './tasks.html',
  './time.html',
'./achievements.html',
'./bot.html',
'./contact.html',
'./countdowns.html',
'./mark.html',
'./motivation.html',
'./music.html',
'./pastpapers.html',
'./pomodoro.html',
'./profile.html',
'./rate.html',
'./settings.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});