// Service Worker for Snake Game PWA
// Implements offline-first caching strategy with King/Blizzard best practices

const CACHE_NAME = 'snake-game-v1.0.0';
const DYNAMIC_CACHE = 'snake-game-dynamic-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/ui-fixes-targeted.css',
    '/header-layout-fix.css',
    '/ui-fixes-comprehensive.css',
    '/live-service-ui-fix.css',
    '/script.js',
    
    // Core architecture
    '/js/interfaces/GameInterfaces.js',
    '/js/core/DependencyContainer.js',
    '/js/core/EventBus.js',
    '/js/core/FeatureFlagService.js',
    
    // Game modules
    '/js/GameEngine.js',
    '/js/ScoreManager.js',
    '/js/AudioManager.js',
    '/js/UIController.js',
    '/js/GameInitializer.js',
    '/js/SecureClient.js',
    
    // Phase 3 & 4 modules
    '/js/AnalyticsManager.js',
    '/js/AchievementManager.js',
    '/js/ChallengeManager.js',
    '/js/SocialManager.js',
    '/js/MonetizationManager.js',
    
    // Phase 5 modules
    '/js/DataManager.js',
    '/js/UserProfileManager.js',
    '/js/SeasonManager.js',
    '/js/CloudSaveManager.js',
    '/js/NotificationManager.js',
    '/js/BattlePassManager.js',
    '/js/ClanManager.js',
    
    // Monetization modules
    '/js/monetization/PlayerSegmentationService.js',
    '/js/monetization/ABTestingService.js',
    '/js/monetization/ConversionFunnelService.js',
    '/js/monetization/DynamicOfferService.js',
    '/js/monetization/PersonalizedMonetizationService.js',
    '/js/monetization/CohortRetentionService.js',
    '/js/monetization/RevenueAnalyticsDashboard.js',
    '/js/monetization/MonetizationInitializer.js',
    
    // UI Systems
    '/js/ModernUISystem.js',
    '/js/UIFixManager.js',
    '/js/EmergencyUIFix.js',
    '/js/UIPositionFix.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[ServiceWorker] Installation complete');
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[ServiceWorker] Installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
                        .map((name) => {
                            console.log('[ServiceWorker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Activation complete');
                // Claim all clients immediately
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }
    
    // API requests - network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Static assets - cache first, network fallback
    event.respondWith(cacheFirstStrategy(request));
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
    try {
        const cached = await caches.match(request);
        if (cached) {
            // Return cached version
            return cached;
        }
        
        // Not in cache, fetch from network
        const response = await fetch(request);
        
        // Cache successful responses
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('[ServiceWorker] Fetch failed:', error);
        
        // Return offline page if available
        const offlineResponse = await caches.match('/offline.html');
        if (offlineResponse) {
            return offlineResponse;
        }
        
        // Return a basic offline response
        return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain'
            })
        });
    }
}

// Network-first strategy for API calls
async function networkFirstStrategy(request) {
    try {
        // Try network first
        const response = await fetch(request);
        
        // Cache successful API responses
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.log('[ServiceWorker] Network request failed, trying cache:', error);
        
        // Network failed, try cache
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        
        // Return error response
        return new Response(JSON.stringify({
            error: 'Offline',
            message: 'Unable to fetch data. Please check your connection.'
        }), {
            status: 503,
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        });
    }
}

// Handle background sync for score submission
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync triggered');
    
    if (event.tag === 'sync-scores') {
        event.waitUntil(syncScores());
    }
});

// Sync scores when connection is restored
async function syncScores() {
    try {
        // Get pending scores from IndexedDB
        const pendingScores = await getPendingScores();
        
        if (pendingScores.length === 0) {
            return;
        }
        
        console.log(`[ServiceWorker] Syncing ${pendingScores.length} scores`);
        
        // Submit each score
        const promises = pendingScores.map(score => 
            fetch('/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(score)
            })
        );
        
        await Promise.all(promises);
        
        // Clear synced scores
        await clearPendingScores();
        
        console.log('[ServiceWorker] Score sync complete');
    } catch (error) {
        console.error('[ServiceWorker] Score sync failed:', error);
        throw error; // Retry sync later
    }
}

// IndexedDB helpers for offline score storage
async function getPendingScores() {
    // This would connect to IndexedDB and retrieve pending scores
    // For now, return empty array
    return [];
}

async function clearPendingScores() {
    // This would clear synced scores from IndexedDB
    return true;
}

// Handle push notifications
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New update available!',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'play',
                title: 'Play Now',
                icon: '/icons/play.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Snake Game', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'play') {
        // Open the game
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handler for client communication
self.addEventListener('message', (event) => {
    console.log('[ServiceWorker] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(names => 
                Promise.all(names.map(name => caches.delete(name)))
            )
        );
    }
});

console.log('[ServiceWorker] Service worker loaded');