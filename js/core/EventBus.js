// Central Event Bus for Decoupled Communication
// King/Blizzard standard: Event-driven architecture for loose coupling

class EventBus extends IEventBus {
    constructor() {
        super();
        this.events = new Map();
        this.middleware = [];
        this.maxListeners = 100; // Prevent memory leaks
        this.debugMode = false;
        
        // Performance monitoring
        this.metrics = {
            eventsEmitted: 0,
            listenersRegistered: 0,
            totalExecutionTime: 0
        };
        
        this.setupErrorHandling();
    }
    
    setupErrorHandling() {
        // Global error handler for async event handlers
        this.on('error', (error, eventName, data) => {
            console.error(`Event handler error for '${eventName}':`, error);
            
            // Track errors if analytics is available
            if (window.DIContainer?.has('IAnalyticsService')) {
                try {
                    const analytics = window.DIContainer.resolve('IAnalyticsService');
                    analytics.trackEvent('event_bus_error', {
                        eventName,
                        error: error.message,
                        stack: error.stack
                    });
                } catch (e) {
                    // Ignore analytics errors
                }
            }
        });
    }
    
    // Add middleware for cross-cutting concerns
    use(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        this.middleware.push(middleware);
        return this;
    }
    
    // Enable/disable debug logging
    setDebugMode(enabled) {
        this.debugMode = enabled;
        return this;
    }
    
    // Emit an event to all listeners
    emit(eventName, data = {}) {
        if (typeof eventName !== 'string') {
            throw new Error('Event name must be a string');
        }
        
        const startTime = performance.now();
        this.metrics.eventsEmitted++;
        
        if (this.debugMode) {
            console.log(`📡 Event emitted: ${eventName}`, data);
        }
        
        const listeners = this.events.get(eventName);
        if (!listeners || listeners.length === 0) {
            return this;
        }
        
        // Apply middleware
        let processedData = data;
        for (const middleware of this.middleware) {
            try {
                processedData = middleware(eventName, processedData, 'emit') || processedData;
            } catch (error) {
                console.error('Event middleware error:', error);
            }
        }
        
        // Execute listeners
        const promises = [];
        
        for (let i = listeners.length - 1; i >= 0; i--) {
            const listener = listeners[i];
            
            try {
                // Check if it's a once listener and remove it
                if (listener.once) {
                    listeners.splice(i, 1);
                }
                
                const result = listener.callback.call(listener.context, processedData, eventName);
                
                // Handle async listeners
                if (result && typeof result.catch === 'function') {
                    promises.push(
                        result.catch(error => {
                            this.emit('error', error, eventName, processedData);
                        })
                    );
                }
                
            } catch (error) {
                // Emit error event for sync errors
                setTimeout(() => {
                    this.emit('error', error, eventName, processedData);
                }, 0);
            }
        }
        
        // Wait for all async listeners if needed
        if (promises.length > 0) {
            Promise.allSettled(promises).then(() => {
                this.recordExecutionTime(startTime);
            });
        } else {
            this.recordExecutionTime(startTime);
        }
        
        return this;
    }
    
    // Add event listener
    on(eventName, callback, context = null) {
        return this.addEventListener(eventName, callback, context, false);
    }
    
    // Add one-time event listener
    once(eventName, callback, context = null) {
        return this.addEventListener(eventName, callback, context, true);
    }
    
    addEventListener(eventName, callback, context, once) {
        if (typeof eventName !== 'string') {
            throw new Error('Event name must be a string');
        }
        
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        const listeners = this.events.get(eventName);
        
        // Check max listeners limit
        if (listeners.length >= this.maxListeners) {
            console.warn(`Maximum listeners (${this.maxListeners}) exceeded for event '${eventName}'`);
        }
        
        const listener = {
            callback,
            context,
            once,
            id: this.generateListenerId()
        };
        
        listeners.push(listener);
        this.metrics.listenersRegistered++;
        
        if (this.debugMode) {
            console.log(`👂 Listener added for: ${eventName} (${listener.id})`);
        }
        
        // Return unsubscribe function
        return () => {
            this.off(eventName, callback);
        };
    }
    
    // Remove event listener
    off(eventName, callback = null) {
        if (!this.events.has(eventName)) {
            return this;
        }
        
        const listeners = this.events.get(eventName);
        
        if (callback === null) {
            // Remove all listeners for this event
            this.events.delete(eventName);
        } else {
            // Remove specific listener
            const index = listeners.findIndex(listener => listener.callback === callback);
            if (index !== -1) {
                listeners.splice(index, 1);
                
                if (this.debugMode) {
                    console.log(`👂❌ Listener removed for: ${eventName}`);
                }
            }
            
            // Clean up empty event arrays
            if (listeners.length === 0) {
                this.events.delete(eventName);
            }
        }
        
        return this;
    }
    
    // Remove all listeners for an event
    removeAllListeners(eventName = null) {
        if (eventName) {
            this.events.delete(eventName);
        } else {
            this.events.clear();
        }
        return this;
    }
    
    // Get list of events that have listeners
    getEventNames() {
        return Array.from(this.events.keys());
    }
    
    // Get number of listeners for an event
    listenerCount(eventName) {
        const listeners = this.events.get(eventName);
        return listeners ? listeners.length : 0;
    }
    
    // Get all listeners for an event
    listeners(eventName) {
        const listeners = this.events.get(eventName);
        return listeners ? listeners.map(l => l.callback) : [];
    }
    
    // Emit event and wait for all async listeners
    async emitAsync(eventName, data = {}) {
        const startTime = performance.now();
        this.metrics.eventsEmitted++;
        
        if (this.debugMode) {
            console.log(`📡 Async event emitted: ${eventName}`, data);
        }
        
        const listeners = this.events.get(eventName);
        if (!listeners || listeners.length === 0) {
            return;
        }
        
        // Apply middleware
        let processedData = data;
        for (const middleware of this.middleware) {
            try {
                processedData = middleware(eventName, processedData, 'emitAsync') || processedData;
            } catch (error) {
                console.error('Event middleware error:', error);
            }
        }
        
        const promises = [];
        
        for (let i = listeners.length - 1; i >= 0; i--) {
            const listener = listeners[i];
            
            try {
                // Check if it's a once listener and remove it
                if (listener.once) {
                    listeners.splice(i, 1);
                }
                
                const result = listener.callback.call(listener.context, processedData, eventName);
                
                // Always treat as promise
                promises.push(Promise.resolve(result));
                
            } catch (error) {
                promises.push(Promise.reject(error));
            }
        }
        
        try {
            await Promise.allSettled(promises);
        } catch (error) {
            this.emit('error', error, eventName, processedData);
        }
        
        this.recordExecutionTime(startTime);
    }
    
    generateListenerId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    recordExecutionTime(startTime) {
        this.metrics.totalExecutionTime += performance.now() - startTime;
    }
    
    // Get performance metrics
    getMetrics() {
        return {
            ...this.metrics,
            averageExecutionTime: this.metrics.eventsEmitted > 0 
                ? this.metrics.totalExecutionTime / this.metrics.eventsEmitted 
                : 0,
            activeEvents: this.events.size,
            totalListeners: Array.from(this.events.values()).reduce((sum, listeners) => sum + listeners.length, 0)
        };
    }
    
    // Reset metrics
    resetMetrics() {
        this.metrics = {
            eventsEmitted: 0,
            listenersRegistered: 0,
            totalExecutionTime: 0
        };
    }
    
    // Cleanup method
    dispose() {
        this.removeAllListeners();
        this.middleware = [];
        this.resetMetrics();
    }
}

// Standard Game Events - Define common events used throughout the system
const GameEvents = {
    // Core game events
    GAME_START: 'game:start',
    GAME_END: 'game:end',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_RESTART: 'game:restart',
    
    // Score events
    SCORE_UPDATE: 'score:update',
    HIGH_SCORE: 'score:high_score',
    SCORE_MILESTONE: 'score:milestone',
    
    // Player progression events
    LEVEL_UP: 'player:level_up',
    XP_GAINED: 'player:xp_gained',
    ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
    
    // Currency events
    CURRENCY_EARNED: 'currency:earned',
    CURRENCY_SPENT: 'currency:spent',
    CURRENCY_UPDATED: 'currency:updated',
    
    // Battle Pass events
    BATTLE_PASS_XP_GAINED: 'battlepass:xp_gained',
    BATTLE_PASS_TIER_UP: 'battlepass:tier_up',
    BATTLE_PASS_REWARD_CLAIMED: 'battlepass:reward_claimed',
    BATTLE_PASS_PURCHASED: 'battlepass:purchased',
    
    // Clan events
    CLAN_JOINED: 'clan:joined',
    CLAN_LEFT: 'clan:left',
    CLAN_WAR_CONTRIBUTION: 'clan:war_contribution',
    CLAN_WAR_STARTED: 'clan:war_started',
    CLAN_WAR_ENDED: 'clan:war_ended',
    
    // Social events
    FRIEND_ADDED: 'social:friend_added',
    LEADERBOARD_UPDATE: 'social:leaderboard_update',
    SHARE_SCORE: 'social:share_score',
    
    // Monetization events
    PURCHASE_INITIATED: 'purchase:initiated',
    PURCHASE_COMPLETED: 'purchase:completed',
    PURCHASE_FAILED: 'purchase:failed',
    OFFER_SHOWN: 'offer:shown',
    
    // System events
    NETWORK_ONLINE: 'system:online',
    NETWORK_OFFLINE: 'system:offline',
    SECURITY_VIOLATION: 'system:security_violation',
    ERROR_OCCURRED: 'system:error',
    
    // UI events
    MODAL_OPENED: 'ui:modal_opened',
    MODAL_CLOSED: 'ui:modal_closed',
    NOTIFICATION_SHOWN: 'ui:notification_shown'
};

// Logging middleware for development
const LoggingMiddleware = (eventName, data, type) => {
    if (window.location.hostname === 'localhost' || window.DEBUG_EVENTS) {
        console.log(`🔄 Event [${type}]: ${eventName}`, data);
    }
    return data;
};

// Performance monitoring middleware
const PerformanceMiddleware = (eventName, data, type) => {
    if (type === 'emit') {
        data._eventStartTime = performance.now();
    }
    return data;
};

// Analytics integration middleware
const AnalyticsMiddleware = (eventName, data, type) => {
    // Only track certain events to avoid spam
    const trackedEvents = [
        GameEvents.GAME_START, GameEvents.GAME_END, GameEvents.LEVEL_UP,
        GameEvents.ACHIEVEMENT_UNLOCKED, GameEvents.PURCHASE_COMPLETED,
        GameEvents.CLAN_JOINED, GameEvents.BATTLE_PASS_PURCHASED
    ];
    
    if (type === 'emit' && trackedEvents.includes(eventName)) {
        // Track with analytics service if available
        if (window.DIContainer?.has('IAnalyticsService')) {
            try {
                const analytics = window.DIContainer.resolve('IAnalyticsService');
                analytics.trackEvent(eventName.replace(':', '_'), {
                    ...data,
                    timestamp: Date.now()
                });
            } catch (error) {
                // Ignore analytics errors
            }
        }
    }
    
    return data;
};

// Create global event bus instance
const eventBus = new EventBus();

// Add standard middleware
eventBus.use(LoggingMiddleware);
eventBus.use(PerformanceMiddleware);
eventBus.use(AnalyticsMiddleware);

// Export for use throughout the application
window.EventBus = EventBus;
window.GameEventBus = eventBus;
window.GameEvents = GameEvents;

export { EventBus, eventBus as GameEventBus, GameEvents };