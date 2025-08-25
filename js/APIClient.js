// API Client Service - Handles all backend communication
// Implements King/Blizzard best practices for API integration

class APIClient {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.token = localStorage.getItem('auth_token');
        this.user = null;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        
        // Check for stored user data
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
            } catch (e) {
                console.error('Failed to parse stored user data');
            }
        }
        
        // Verify token on initialization
        if (this.token) {
            this.verifyToken().catch(() => {
                this.clearAuth();
            });
        }
    }
    
    // Set authorization header
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }
    
    // Generic request handler with retry logic
    async request(endpoint, options = {}, retryCount = 0) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(options.includeAuth !== false)
        };
        
        try {
            const response = await fetch(url, config);
            
            // Handle 401 Unauthorized
            if (response.status === 401 && this.token) {
                this.clearAuth();
                window.GameEventBus?.emit('auth:logout');
                throw new Error('Authentication expired');
            }
            
            // Parse response
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
            
        } catch (error) {
            // Retry logic for network errors
            if (retryCount < this.retryAttempts && !error.message.includes('401')) {
                console.warn(`API request failed, retrying... (${retryCount + 1}/${this.retryAttempts})`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
                return this.request(endpoint, options, retryCount + 1);
            }
            
            throw error;
        }
    }
    
    // ============== AUTHENTICATION ==============
    
    async register(username, email, password, displayName) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, displayName }),
            includeAuth: false
        });
        
        // Auto-login after registration
        if (data.success) {
            return this.login(username, password);
        }
        
        return data;
    }
    
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            includeAuth: false
        });
        
        if (data.token) {
            this.token = data.token;
            this.user = data.user;
            
            // Store auth data
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user_data', JSON.stringify(this.user));
            
            // Emit login event
            window.GameEventBus?.emit('auth:login', this.user);
        }
        
        return data;
    }
    
    async logout() {
        try {
            await this.request('/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
            window.GameEventBus?.emit('auth:logout');
        }
    }
    
    async verifyToken() {
        if (!this.token) {
            throw new Error('No token');
        }
        
        const data = await this.request('/auth/verify', {
            method: 'GET'
        });
        
        if (data.valid) {
            this.user = data.user;
            localStorage.setItem('user_data', JSON.stringify(this.user));
            return true;
        }
        
        throw new Error('Invalid token');
    }
    
    async getProfile() {
        return this.request('/auth/profile', {
            method: 'GET'
        });
    }
    
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }
    
    isAuthenticated() {
        return !!this.token && !!this.user;
    }
    
    getUser() {
        return this.user;
    }
    
    // ============== BATTLE PASS ==============
    
    async getBattlePassStatus() {
        if (!this.isAuthenticated()) {
            throw new Error('Authentication required');
        }
        
        return this.request('/battlepass/status', {
            method: 'GET'
        });
    }
    
    async addBattlePassXP(amount, source, details) {
        if (!this.isAuthenticated()) {
            throw new Error('Authentication required');
        }
        
        return this.request('/battlepass/xp', {
            method: 'POST',
            body: JSON.stringify({ amount, source, details })
        });
    }
    
    async purchaseBattlePass() {
        if (!this.isAuthenticated()) {
            throw new Error('Authentication required');
        }
        
        return this.request('/battlepass/purchase', {
            method: 'POST'
        });
    }
    
    async claimBattlePassReward(tier, isPremium) {
        if (!this.isAuthenticated()) {
            throw new Error('Authentication required');
        }
        
        return this.request('/battlepass/claim', {
            method: 'POST',
            body: JSON.stringify({ tier, isPremium })
        });
    }
    
    // ============== GAME ==============
    
    async submitGameResult(score, duration, applesEaten) {
        if (!this.isAuthenticated()) {
            // If not authenticated, just save locally
            console.log('Not authenticated, saving score locally');
            return { success: false, local: true };
        }
        
        try {
            return await this.request('/game/end', {
                method: 'POST',
                body: JSON.stringify({ score, duration, applesEaten })
            });
        } catch (error) {
            console.error('Failed to submit game result:', error);
            // Fall back to local storage
            return { success: false, local: true, error: error.message };
        }
    }
    
    // ============== SCORES ==============
    
    async getTopScores() {
        return this.request('/scores', {
            method: 'GET',
            includeAuth: false
        });
    }
    
    async submitScore(name, score) {
        return this.request('/scores', {
            method: 'POST',
            body: JSON.stringify({ name, score }),
            includeAuth: false
        });
    }
    
    async checkScoreQualifies(score) {
        return this.request(`/scores/check/${score}`, {
            method: 'GET',
            includeAuth: false
        });
    }
    
    // ============== UTILITY ==============
    
    formatError(error) {
        if (error.message) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return 'An unexpected error occurred';
    }
    
    // Handle offline mode
    isOnline() {
        return navigator.onLine;
    }
    
    // Queue requests for offline mode
    async queueOfflineRequest(endpoint, options) {
        const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        queue.push({
            endpoint,
            options,
            timestamp: Date.now()
        });
        localStorage.setItem('offline_queue', JSON.stringify(queue));
    }
    
    // Process offline queue when back online
    async processOfflineQueue() {
        const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        if (queue.length === 0) return;
        
        console.log(`Processing ${queue.length} offline requests`);
        
        for (const request of queue) {
            try {
                await this.request(request.endpoint, request.options);
            } catch (error) {
                console.error('Failed to process offline request:', error);
            }
        }
        
        localStorage.removeItem('offline_queue');
    }
}

// Handle online/offline events
window.addEventListener('online', () => {
    console.log('Back online - processing offline queue');
    if (window.apiClient) {
        window.apiClient.processOfflineQueue();
    }
});

// Create global instance
window.APIClient = APIClient;
window.apiClient = new APIClient();

// Register with DI container if available
if (window.DIContainer) {
    window.DIContainer.registerInstance('IAPIClient', window.apiClient);
}

console.log('🌐 API Client initialized');