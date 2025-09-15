// Service Worker for ReddyTalk.ai
// Provides offline capability and caching

const CACHE_NAME = 'reddytalk-v1.0.0';
const API_BASE = 'https://reddytalk-api.politemushroom-457701ff.eastus.azurecontainerapps.io';

// Files to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/main.html',
    '/dashboard.html', 
    '/test-interface.html',
    '/index.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/health/live',
    '/health/ready',
    '/api/test/simple'
];

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Installed successfully');
                self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated');
            self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        if (url.origin === location.origin) {
            // Static assets - cache first
            event.respondWith(handleStaticAsset(request));
        } else if (url.origin === new URL(API_BASE).origin) {
            // API requests - network first with cache fallback
            event.respondWith(handleAPIRequest(request));
        }
    }
});

async function handleStaticAsset(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fetch from network and cache
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Static asset fetch failed:', error);
        
        // Return offline fallback
        return new Response(
            '<html><body><h1>Offline</h1><p>Please check your connection</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
        );
    }
}

async function handleAPIRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request, { timeout: 10000 });
        
        // Cache successful responses
        if (networkResponse.ok && request.method === 'GET') {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('API request failed, trying cache:', error);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return error response
        return new Response(
            JSON.stringify({
                error: 'Network unavailable',
                message: 'Please check your connection and try again',
                offline: true
            }),
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle background sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'health-check') {
        event.waitUntil(performHealthCheck());
    }
});

async function performHealthCheck() {
    try {
        const response = await fetch(`${API_BASE}/health/live`);
        console.log('Background health check:', response.status);
    } catch (error) {
        console.error('Background health check failed:', error);
    }
}