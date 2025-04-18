/**
 * Updated Service Worker for FitTrack Exercise App
 * Path: /exercise-app/service-worker.js
 */

// Cache version - update when significant changes are made to refresh cache
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `fittrack-${CACHE_VERSION}`;

// Files to cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/css/style.css',
    '/assets/js/app.js',
    '/assets/js/auth.js',
    '/assets/js/charts.js',
    '/assets/js/workout.js',
    '/assets/js/admin.js',
    '/pages/dashboard.html',
    '/pages/workout.html',
    '/pages/progress.html',
    '/pages/profile.html',
    '/pages/admin.html',
    // Cache icon files (selected key sizes)
    '/assets/images/android/android-launchericon-48-48.png',
    '/assets/images/android/android-launchericon-72-72.png',
    '/assets/images/android/android-launchericon-96-96.png',
    '/assets/images/android/android-launchericon-144-144.png',
    '/assets/images/android/android-launchericon-192-192.png',
    '/assets/images/android/android-launchericon-512-512.png',
    '/assets/images/ios/152.png',
    '/assets/images/ios/167.png',
    '/assets/images/ios/180.png',
    '/assets/images/ios/192.png',
    '/assets/images/ios/512.png',
    '/assets/images/ios/1024.png'
];

// External resources to cache
const EXTERNAL_ASSETS = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://code.jquery.com/jquery-3.6.0.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Combined assets to cache
const CACHED_ASSETS = [...STATIC_ASSETS, ...EXTERNAL_ASSETS];

// Install event handler - cache static resources
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing Service Worker...', event);
    
    // Skip waiting to ensure the new service worker activates immediately
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Caching app shell and assets');
            return cache.addAll(CACHED_ASSETS);
        })
    );
});

// Activate event handler - clean up old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating Service Worker...', event);
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Claim clients to ensure the service worker takes control immediately
    return self.clients.claim();
});

// Fetch event handler - serve from cache or network
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip API requests
    if (event.request.url.includes('/api/')) {
        return;
    }
    
    // For page navigations (HTML requests), use network-first strategy
    if (event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone the response to store in cache
                    const clonedResponse = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, clonedResponse);
                        });
                    
                    return response;
                })
                .catch(() => {
                    // If network fails, try to serve from cache
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // For other assets, use cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // If not in cache, fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Clone the response to store in cache
                        const clonedResponse = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, clonedResponse);
                            });
                        
                        return response;
                    });
            })
    );
});

// Push notification event handler
self.addEventListener('push', event => {
    console.log('[Service Worker] Push Received:', event);
    
    const notification = event.data?.json() || {
        title: 'FitTrack Reminder',
        body: 'Time for your workout!',
        icon: '/assets/images/android/android-launchericon-192-192.png',
        badge: '/assets/images/android/android-launchericon-72-72.png',
        data: {
            url: '/index.html?page=workout'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge,
            data: notification.data
        })
    );
});

// Notification click event handler
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification click:', event);
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/index.html';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(windowClients => {
                // Check if there is already a window/tab open with the target URL
                for (let client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // If no window/tab is open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync event handler for offline data
self.addEventListener('sync', event => {
    console.log('[Service Worker] Background Sync:', event);
    
    if (event.tag === 'sync-workout-data') {
        event.waitUntil(syncWorkoutData());
    } else if (event.tag === 'sync-weight-data') {
        event.waitUntil(syncWeightData());
    } else if (event.tag === 'sync-bjj-data') {
        event.waitUntil(syncBjjData());
    }
});

// Sync workout data from IndexedDB to server
async function syncWorkoutData() {
    try {
        const db = await openDatabase();
        const offlineWorkouts = await getOfflineData(db, 'offlineWorkouts');
        
        // If no offline workouts, nothing to sync
        if (!offlineWorkouts || offlineWorkouts.length === 0) {
            return true;
        }
        
        // Get auth token from IndexedDB
        const authData = await getOfflineData(db, 'authData');
        const token = authData?.token;
        
        if (!token) {
            throw new Error('Authentication token not found');
        }
        
        // Sync each workout
        for (const workout of offlineWorkouts) {
            await fetch('/api/workout.php/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(workout)
            });
            
            // Remove synced workout from offline storage
            await removeOfflineData(db, 'offlineWorkouts', workout.id);
        }
        
        // Notify the user if possible
        self.registration.showNotification('FitTrack', {
            body: 'Your workout data has been synced',
            icon: '/assets/images/android/android-launchericon-192-192.png'
        });
        
        return true;
    } catch (error) {
        console.error('[Service Worker] Sync workout data failed:', error);
        return false;
    }
}

// Sync weight data from IndexedDB to server
async function syncWeightData() {
    try {
        const db = await openDatabase();
        const offlineWeights = await getOfflineData(db, 'offlineWeights');
        
        // If no offline weights, nothing to sync
        if (!offlineWeights || offlineWeights.length === 0) {
            return true;
        }
        
        // Get auth token from IndexedDB
        const authData = await getOfflineData(db, 'authData');
        const token = authData?.token;
        
        if (!token) {
            throw new Error('Authentication token not found');
        }
        
        // Sync each weight log
        for (const weight of offlineWeights) {
            await fetch('/api/user.php/weight', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(weight)
            });
            
            // Remove synced weight from offline storage
            await removeOfflineData(db, 'offlineWeights', weight.id);
        }
        
        return true;
    } catch (error) {
        console.error('[Service Worker] Sync weight data failed:', error);
        return false;
    }
}

// Sync BJJ data from IndexedDB to server
async function syncBjjData() {
    try {
        const db = await openDatabase();
        const offlineBjj = await getOfflineData(db, 'offlineBjj');
        
        // If no offline BJJ data, nothing to sync
        if (!offlineBjj || offlineBjj.length === 0) {
            return true;
        }
        
        // Get auth token from IndexedDB
        const authData = await getOfflineData(db, 'authData');
        const token = authData?.token;
        
        if (!token) {
            throw new Error('Authentication token not found');
        }
        
        // Sync each BJJ session
        for (const session of offlineBjj) {
            await fetch('/api/user.php/bjj', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(session)
            });
            
            // Remove synced session from offline storage
            await removeOfflineData(db, 'offlineBjj', session.id);
        }
        
        return true;
    } catch (error) {
        console.error('[Service Worker] Sync BJJ data failed:', error);
        return false;
    }
}

// Helper functions for IndexedDB operations
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('fittrackOfflineDB', 1);
        
        request.onerror = event => reject(event.target.error);
        request.onsuccess = event => resolve(event.target.result);
        
        request.onupgradeneeded = event => {
            const db = event.target.result;
            
            // Create object stores if they don't exist
            if (!db.objectStoreNames.contains('offlineWorkouts')) {
                db.createObjectStore('offlineWorkouts', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('offlineWeights')) {
                db.createObjectStore('offlineWeights', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('offlineBjj')) {
                db.createObjectStore('offlineBjj', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('authData')) {
                db.createObjectStore('authData', { keyPath: 'key' });
            }
        };
    });
}

function getOfflineData(db, storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onerror = event => reject(event.target.error);
        request.onsuccess = event => resolve(event.target.result);
    });
}

function removeOfflineData(db, storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onerror = event => reject(event.target.error);
        request.onsuccess = event => resolve();
    });
}