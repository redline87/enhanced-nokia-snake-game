// Secure Client Communication Layer
// King/Blizzard standard: All valuable operations must be server-validated

class SecureClient {
    constructor(analytics) {
        this.analytics = analytics;
        this.baseURL = this.getServerURL();
        this.sessionToken = this.generateSessionToken();
        this.playerId = this.getPlayerId();
        this.requestQueue = [];
        this.isOnline = navigator.onLine;
        
        this.setupNetworkHandling();
        this.startHeartbeat();
    }
    
    getServerURL() {
        // Use different endpoints for dev/staging/production
        if (window.location.hostname === 'localhost') {
            return 'http://localhost:3000/api';
        }
        return '/api'; // Production Vercel endpoint
    }
    
    generateSessionToken() {
        // Generate secure session token
        const playerId = this.getPlayerId();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `${playerId}_${timestamp}_${random}`;
    }
    
    getPlayerId() {
        let playerId = localStorage.getItem('secure_player_id');
        if (!playerId) {
            playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('secure_player_id', playerId);
        }
        return playerId;
    }
    
    setupNetworkHandling() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processQueuedRequests();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }
    
    startHeartbeat() {
        // Keep session alive and sync time
        setInterval(async () => {
            if (this.isOnline) {
                try {
                    await this.syncServerTime();
                } catch (error) {
                    console.warn('Heartbeat failed:', error);
                }
            }
        }, 60000); // Every minute
    }
    
    async syncServerTime() {
        try {
            const start = Date.now();
            const response = await fetch(`${this.baseURL}/time`);
            const roundTripTime = Date.now() - start;
            
            if (response.ok) {
                const { serverTime } = await response.json();
                this.serverTimeOffset = serverTime - Date.now() + (roundTripTime / 2);
            }
        } catch (error) {
            console.warn('Time sync failed:', error);
        }
    }
    
    getServerTime() {
        return new Date(Date.now() + (this.serverTimeOffset || 0));
    }
    
    async validateScore(scoreData) {
        return this.secureRequest('validate_score', {
            score: scoreData.score,
            duration: scoreData.duration,
            applesEaten: scoreData.applesEaten,
            gameSession: this.collectGameSessionData(scoreData)
        });
    }
    
    async validateCurrencyChange(type, amount, source, previousAmount) {
        return this.secureRequest('validate_currency_change', {
            type,
            amount,
            source,
            previousAmount,
            timestamp: this.getServerTime().getTime()
        });
    }
    
    async validateProgression(progressionData) {
        return this.secureRequest('validate_progression', {
            level: progressionData.level,
            experience: progressionData.experience,
            battlePassTier: progressionData.battlePassTier,
            battlePassXP: progressionData.battlePassXP,
            timestamp: this.getServerTime().getTime()
        });
    }
    
    async validatePurchase(purchaseData) {
        return this.secureRequest('validate_purchase', {
            itemId: purchaseData.itemId,
            price: purchaseData.price,
            currency: purchaseData.currency,
            transactionId: purchaseData.transactionId,
            timestamp: this.getServerTime().getTime()
        });
    }
    
    collectGameSessionData(scoreData) {
        // Collect behavioral data for anti-cheat analysis
        return {
            inputs: this.inputHistory || [],
            averageReactionTime: this.calculateAverageReactionTime(),
            totalMoves: this.moveCount || 0,
            correctMoves: this.correctMoveCount || 0,
            gameStartTime: this.gameStartTime,
            gameEndTime: Date.now(),
            userAgent: navigator.userAgent,
            screenSize: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`
        };
    }
    
    calculateAverageReactionTime() {
        if (!this.inputHistory || this.inputHistory.length < 2) return 200;
        
        const reactionTimes = [];
        for (let i = 1; i < this.inputHistory.length; i++) {
            const timeDiff = this.inputHistory[i].timestamp - this.inputHistory[i-1].timestamp;
            if (timeDiff > 50 && timeDiff < 2000) { // Reasonable range
                reactionTimes.push(timeDiff);
            }
        }
        
        return reactionTimes.length > 0 
            ? reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length 
            : 200;
    }
    
    trackInput(direction) {
        if (!this.inputHistory) this.inputHistory = [];
        
        this.inputHistory.push({
            direction,
            timestamp: Date.now(),
            sequence: this.inputHistory.length
        });
        
        // Keep only recent inputs (last 100)
        if (this.inputHistory.length > 100) {
            this.inputHistory = this.inputHistory.slice(-100);
        }
        
        this.moveCount = (this.moveCount || 0) + 1;
    }
    
    trackCorrectMove() {
        this.correctMoveCount = (this.correctMoveCount || 0) + 1;
    }
    
    async secureRequest(action, data) {
        const requestData = {
            action,
            data,
            playerId: this.playerId,
            sessionToken: this.sessionToken,
            timestamp: this.getServerTime().getTime(),
            clientVersion: '1.0.0'
        };
        
        // If offline, queue the request
        if (!this.isOnline) {
            this.queueRequest(requestData);
            return { valid: false, reason: 'OFFLINE', queued: true };
        }
        
        try {
            const response = await this.requestWithRetry(
                `${this.baseURL}/secure/validation`,
                requestData
            );
            
            if (response.valid) {
                this.analytics?.trackEvent('server_validation_success', { action });
                return response;
            } else {
                this.analytics?.trackEvent('server_validation_failed', { 
                    action, 
                    reason: response.reason 
                });
                
                // Handle different failure types
                if (response.reason === 'CURRENCY_MANIPULATION' || 
                    response.reason === 'IMPOSSIBLE_SCORE') {
                    this.handleSecurityViolation(action, response.reason);
                }
                
                return response;
            }
            
        } catch (error) {
            console.error(`Secure request failed for ${action}:`, error);
            this.queueRequest(requestData);
            
            this.analytics?.trackEvent('server_validation_error', { 
                action, 
                error: error.message 
            });
            
            return { 
                valid: false, 
                reason: 'NETWORK_ERROR', 
                error: error.message,
                queued: true
            };
        }
    }
    
    async requestWithRetry(url, data, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Client-Version': '1.0.0',
                        'X-Player-ID': this.playerId
                    },
                    body: JSON.stringify(data),
                    timeout: 5000
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
                
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }
    
    queueRequest(requestData) {
        this.requestQueue.push({
            ...requestData,
            queuedAt: Date.now()
        });
        
        // Limit queue size to prevent memory issues
        if (this.requestQueue.length > 100) {
            this.requestQueue = this.requestQueue.slice(-100);
        }
        
        // Save to localStorage for persistence
        try {
            localStorage.setItem('secure_request_queue', JSON.stringify(this.requestQueue));
        } catch (error) {
            console.warn('Failed to save request queue:', error);
        }
    }
    
    async processQueuedRequests() {
        console.log(`Processing ${this.requestQueue.length} queued requests...`);
        
        // Load any persisted requests
        try {
            const saved = localStorage.getItem('secure_request_queue');
            if (saved) {
                const savedQueue = JSON.parse(saved);
                this.requestQueue = [...savedQueue, ...this.requestQueue];
                localStorage.removeItem('secure_request_queue');
            }
        } catch (error) {
            console.warn('Failed to load saved request queue:', error);
        }
        
        // Process requests in batches to avoid overwhelming the server
        const batchSize = 5;
        const batches = [];
        
        for (let i = 0; i < this.requestQueue.length; i += batchSize) {
            batches.push(this.requestQueue.slice(i, i + batchSize));
        }
        
        let processedCount = 0;
        
        for (const batch of batches) {
            const promises = batch.map(async (request) => {
                try {
                    const response = await this.requestWithRetry(
                        `${this.baseURL}/secure/validation`,
                        request,
                        1 // Only 1 retry for queued requests
                    );
                    
                    // Apply any server corrections
                    if (response.correctedState) {
                        this.applyCorrectedState(response.correctedState);
                    }
                    
                    return { success: true, request };
                } catch (error) {
                    console.warn('Failed to process queued request:', error);
                    return { success: false, request, error };
                }
            });
            
            const results = await Promise.allSettled(promises);
            processedCount += results.filter(r => r.value?.success).length;
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.requestQueue = [];
        console.log(`Successfully processed ${processedCount} queued requests`);
    }
    
    handleSecurityViolation(action, reason) {
        console.warn(`Security violation detected: ${action} - ${reason}`);
        
        // Show warning to user (non-accusatory)
        this.showSecurityNotification(
            "Game data has been automatically corrected to ensure fair play.",
            "info"
        );
        
        // Track security events
        this.analytics?.trackEvent('security_violation', {
            action,
            reason,
            timestamp: Date.now(),
            playerId: this.playerId
        });
    }
    
    applyCorrectedState(correctedState) {
        // Apply server-corrected values to local state
        if (correctedState.score !== undefined) {
            // Update score displays
            const scoreElements = document.querySelectorAll('[id*="score"]');
            scoreElements.forEach(el => {
                if (el.textContent.includes(':')) {
                    el.textContent = el.textContent.replace(/\d+/, correctedState.score);
                }
            });
        }
        
        if (correctedState.coins !== undefined) {
            // Update currency displays
            localStorage.setItem('userCurrencies', JSON.stringify({
                ...JSON.parse(localStorage.getItem('userCurrencies') || '{}'),
                ...correctedState
            }));
        }
        
        console.log('Applied server corrections:', correctedState);
    }
    
    showSecurityNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'info' ? '#4299e1' : '#e53e3e'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    // Game session tracking methods
    startGameSession() {
        this.gameStartTime = Date.now();
        this.inputHistory = [];
        this.moveCount = 0;
        this.correctMoveCount = 0;
    }
    
    endGameSession() {
        const sessionData = this.collectGameSessionData({});
        this.analytics?.trackEvent('game_session_complete', {
            duration: Date.now() - this.gameStartTime,
            totalMoves: this.moveCount,
            averageReactionTime: sessionData.averageReactionTime
        });
    }
    
    // Public API for game systems
    isSecurelyConnected() {
        return this.isOnline && this.serverTimeOffset !== undefined;
    }
    
    getQueuedRequestCount() {
        return this.requestQueue.length;
    }
    
    // Cleanup
    destroy() {
        // Clear any intervals or listeners
        console.log('SecureClient destroyed');
    }
}

// Export for use in other modules
window.SecureClient = SecureClient;