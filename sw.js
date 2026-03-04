// Service Worker - Enables offline functionality
const CACHE_NAME = 'sum-finance-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js',
    'https://unpkg.com/@supabase/supabase-js@2'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.log('Cache failed:', err))
    );
    self.skipWaiting();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                return fetch(event.request).catch(() => {
                    // If network fails, return offline message for HTML requests
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return new Response('
                            <html><body style="text-align:center;padding:50px;font-family:sans-serif;">
                            <h1>⚠️ 離線模式</h1>
                            <p>請連接網絡後再試</p>
                            </body></html>
                        ', { headers: { 'Content-Type': 'text/html' } });
                    }
                });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});
