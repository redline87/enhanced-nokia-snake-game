// Feature Flag System with Kill Switches
// King/Blizzard standard: Safe feature deployment with instant rollback

class FeatureFlagService extends IFeatureFlagService {
    constructor(analyticsService) {
        super();
        this.analytics = analyticsService;
        this.flags = new Map();
        this.killSwitches = new Map();
        this.remoteFlags = new Map();
        this.experiments = new Map();
        
        // Configuration
        this.refreshInterval = 5 * 60 * 1000; // 5 minutes
        this.remoteEndpoint = this.getRemoteEndpoint();
        
        // Initialize default flags
        this.initializeDefaultFlags();
        
        // Load persisted flags
        this.loadPersistedFlags();
        
        // Start remote flag polling
        this.startRemoteFlagPolling();
        
        // Setup emergency kill switch listener
        this.setupEmergencyKillSwitch();
    }
    
    getRemoteEndpoint() {
        if (window.location.hostname === 'localhost') {
            return 'http://localhost:3000/api/feature-flags';
        }
        return '/api/feature-flags';
    }
    
    initializeDefaultFlags() {
        // Core feature flags with safe defaults
        const defaultFlags = {
            // Battle Pass System
            'BATTLE_PASS_ENABLED': { 
                value: true, 
                description: 'Enable Battle Pass system',
                rolloutPercentage: 100
            },
            'BATTLE_PASS_AUTO_CLAIM': { 
                value: false, 
                description: 'Auto-claim Battle Pass rewards',
                rolloutPercentage: 0
            },
            
            // Clan System
            'CLAN_WARS_ENABLED': { 
                value: true, 
                description: 'Enable Clan Wars feature',
                rolloutPercentage: 100
            },
            'CLAN_CHAT_ENABLED': { 
                value: true, 
                description: 'Enable clan chat system',
                rolloutPercentage: 80
            },
            'CLAN_GHOST_REPLAYS': { 
                value: true, 
                description: 'Enable ghost replay system',
                rolloutPercentage: 50
            },
            
            // Monetization
            'PREMIUM_OFFERS_V2': { 
                value: false, 
                description: 'New premium offers system',
                rolloutPercentage: 10
            },
            'DYNAMIC_PRICING': { 
                value: false, 
                description: 'Dynamic pricing based on player segments',
                rolloutPercentage: 0
            },
            'VIP_SUBSCRIPTION': { 
                value: false, 
                description: 'VIP monthly subscription',
                rolloutPercentage: 5
            },
            
            // Analytics & Anti-Cheat
            'ENHANCED_ANTI_CHEAT': { 
                value: true, 
                description: 'Enhanced anti-cheat validation',
                rolloutPercentage: 100
            },
            'BEHAVIORAL_ANALYTICS': { 
                value: true, 
                description: 'Advanced behavioral tracking',
                rolloutPercentage: 90
            },
            'REAL_TIME_VALIDATION': { 
                value: false, 
                description: 'Real-time server validation',
                rolloutPercentage: 20
            },
            
            // Social Features
            'SOCIAL_SHARING_V2': { 
                value: false, 
                description: 'Enhanced social sharing',
                rolloutPercentage: 25
            },
            'FRIEND_CHALLENGES': { 
                value: false, 
                description: 'Friend challenge system',
                rolloutPercentage: 0
            },
            
            // Performance & UI
            'LAZY_LOADING': { 
                value: true, 
                description: 'Lazy load non-critical features',
                rolloutPercentage: 100
            },
            'UI_REDESIGN_V2': { 
                value: false, 
                description: 'New UI design system',
                rolloutPercentage: 5
            },
            'WEB_WORKERS': { 
                value: false, 
                description: 'Use Web Workers for heavy processing',
                rolloutPercentage: 30
            },
            
            // Experimental Features
            'AI_DIFFICULTY_SCALING': { 
                value: false, 
                description: 'AI-based difficulty adjustment',
                rolloutPercentage: 1
            },
            'MULTIPLAYER_MODE': { 
                value: false, 
                description: 'Real-time multiplayer',
                rolloutPercentage: 0
            }
        };
        
        // Set default flags
        Object.entries(defaultFlags).forEach(([flagName, config]) => {
            this.flags.set(flagName, config);
        });
    }
    
    // Check if feature is enabled for current user
    isEnabled(flagName) {
        // Check kill switches first - these override everything
        if (this.killSwitches.has(flagName)) {
            const killSwitch = this.killSwitches.get(flagName);
            if (killSwitch.active) {
                this.trackFlagUsage(flagName, false, 'kill_switch');
                return false;
            }
        }
        
        // Check remote flags (highest priority)
        if (this.remoteFlags.has(flagName)) {
            const remoteFlag = this.remoteFlags.get(flagName);
            const enabled = this.evaluateFlag(flagName, remoteFlag);
            this.trackFlagUsage(flagName, enabled, 'remote');
            return enabled;
        }
        
        // Check local flags
        if (this.flags.has(flagName)) {
            const flag = this.flags.get(flagName);
            const enabled = this.evaluateFlag(flagName, flag);
            this.trackFlagUsage(flagName, enabled, 'local');
            return enabled;
        }
        
        // Flag not found - default to false
        this.trackFlagUsage(flagName, false, 'not_found');
        return false;
    }
    
    // Get flag value (for non-boolean flags)
    getValue(flagName, defaultValue = null) {
        if (!this.isEnabled(flagName)) {
            return defaultValue;
        }
        
        const flag = this.remoteFlags.get(flagName) || this.flags.get(flagName);
        return flag?.value ?? defaultValue;
    }
    
    // Evaluate flag based on rollout percentage and user segment
    evaluateFlag(flagName, flag) {
        if (!flag.value) {
            return false;
        }
        
        // If 100% rollout, always enabled
        if (flag.rolloutPercentage >= 100) {
            return true;
        }
        
        // If 0% rollout, always disabled
        if (flag.rolloutPercentage <= 0) {
            return false;
        }
        
        // Check user's experiment assignment
        const userHash = this.getUserHash();
        const assignedPercentage = userHash % 100;
        
        return assignedPercentage < flag.rolloutPercentage;
    }
    
    // Generate consistent hash for current user
    getUserHash() {
        const playerId = localStorage.getItem('secure_player_id') || 'anonymous';
        let hash = 0;
        
        for (let i = 0; i < playerId.length; i++) {
            const char = playerId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash);
    }
    
    // Manually set flag (for testing/debugging)
    setFlag(flagName, value, temporary = false) {
        if (temporary) {
            // Set in session storage for temporary override
            sessionStorage.setItem(`ff_${flagName}`, JSON.stringify({ value, temporary: true }));
        } else {
            this.flags.set(flagName, { 
                value, 
                rolloutPercentage: value ? 100 : 0,
                description: 'Manually set flag',
                setAt: Date.now()
            });
            this.persistFlags();
        }
        
        this.trackFlagChange(flagName, value, 'manual');
        return this;
    }
    
    // Remove flag
    removeFlag(flagName) {
        this.flags.delete(flagName);
        sessionStorage.removeItem(`ff_${flagName}`);
        this.persistFlags();
        return this;
    }
    
    // Emergency kill switch - instantly disable feature
    activateKillSwitch(flagName, reason = 'Emergency disable') {
        this.killSwitches.set(flagName, {
            active: true,
            reason,
            activatedAt: Date.now(),
            activatedBy: 'system'
        });
        
        this.persistKillSwitches();
        this.trackKillSwitch(flagName, true, reason);
        
        console.warn(`🚨 Kill switch activated for ${flagName}: ${reason}`);
        return this;
    }
    
    // Deactivate kill switch
    deactivateKillSwitch(flagName) {
        if (this.killSwitches.has(flagName)) {
            this.killSwitches.delete(flagName);
            this.persistKillSwitches();
            this.trackKillSwitch(flagName, false, 'Manually deactivated');
        }
        return this;
    }
    
    // Get all flags with their current status
    getAllFlags() {
        const result = {};
        
        // Combine all flag sources
        const allFlagNames = new Set([
            ...this.flags.keys(),
            ...this.remoteFlags.keys()
        ]);
        
        allFlagNames.forEach(flagName => {
            result[flagName] = {
                enabled: this.isEnabled(flagName),
                value: this.getValue(flagName),
                source: this.getFlagSource(flagName),
                killSwitchActive: this.killSwitches.has(flagName),
                description: this.getFlagDescription(flagName)
            };
        });
        
        return result;
    }
    
    getFlagSource(flagName) {
        if (this.killSwitches.has(flagName)) return 'kill_switch';
        if (this.remoteFlags.has(flagName)) return 'remote';
        if (this.flags.has(flagName)) return 'local';
        return 'not_found';
    }
    
    getFlagDescription(flagName) {
        const flag = this.remoteFlags.get(flagName) || this.flags.get(flagName);
        return flag?.description || 'No description available';
    }
    
    // Load flags from remote server
    async loadRemoteFlags() {
        try {
            const response = await fetch(`${this.remoteEndpoint}?player=${this.getUserHash()}`);
            
            if (response.ok) {
                const remoteFlags = await response.json();
                
                Object.entries(remoteFlags.flags || {}).forEach(([flagName, config]) => {
                    this.remoteFlags.set(flagName, config);
                });
                
                // Handle kill switches from server
                Object.entries(remoteFlags.killSwitches || {}).forEach(([flagName, config]) => {
                    if (config.active) {
                        this.killSwitches.set(flagName, config);
                    }
                });
                
                console.log(`📡 Loaded ${Object.keys(remoteFlags.flags || {}).length} remote flags`);
            }
        } catch (error) {
            console.warn('Failed to load remote flags:', error);
        }
    }
    
    // Start polling for remote flag updates
    startRemoteFlagPolling() {
        // Initial load
        this.loadRemoteFlags();
        
        // Set up polling interval
        this.pollingInterval = setInterval(() => {
            this.loadRemoteFlags();
        }, this.refreshInterval);
        
        // Load on network reconnection
        window.addEventListener('online', () => {
            this.loadRemoteFlags();
        });
    }
    
    // Setup emergency kill switch via URL parameters (for emergencies)
    setupEmergencyKillSwitch() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for emergency kill switch in URL
        const emergencyKill = urlParams.get('emergency_kill');
        if (emergencyKill) {
            const flags = emergencyKill.split(',');
            flags.forEach(flagName => {
                this.activateKillSwitch(flagName.trim(), 'Emergency URL parameter');
            });
        }
        
        // Check for emergency enable in URL (for testing)
        const emergencyEnable = urlParams.get('emergency_enable');
        if (emergencyEnable) {
            const flags = emergencyEnable.split(',');
            flags.forEach(flagName => {
                this.setFlag(flagName.trim(), true, true);
            });
        }
    }
    
    // Persist flags to localStorage
    persistFlags() {
        try {
            const flagsObj = Object.fromEntries(this.flags);
            localStorage.setItem('feature_flags', JSON.stringify(flagsObj));
        } catch (error) {
            console.warn('Failed to persist flags:', error);
        }
    }
    
    // Persist kill switches to localStorage
    persistKillSwitches() {
        try {
            const killSwitchesObj = Object.fromEntries(this.killSwitches);
            localStorage.setItem('kill_switches', JSON.stringify(killSwitchesObj));
        } catch (error) {
            console.warn('Failed to persist kill switches:', error);
        }
    }
    
    // Load persisted flags from localStorage
    loadPersistedFlags() {
        try {
            const stored = localStorage.getItem('feature_flags');
            if (stored) {
                const flagsObj = JSON.parse(stored);
                Object.entries(flagsObj).forEach(([name, config]) => {
                    // Only load user-set flags, not defaults
                    if (config.setAt) {
                        this.flags.set(name, config);
                    }
                });
            }
            
            const storedKillSwitches = localStorage.getItem('kill_switches');
            if (storedKillSwitches) {
                const killSwitchesObj = JSON.parse(storedKillSwitches);
                Object.entries(killSwitchesObj).forEach(([name, config]) => {
                    this.killSwitches.set(name, config);
                });
            }
        } catch (error) {
            console.warn('Failed to load persisted flags:', error);
        }
    }
    
    // Track flag usage for analytics
    trackFlagUsage(flagName, enabled, source) {
        if (this.analytics) {
            this.analytics.trackEvent('feature_flag_evaluated', {
                flagName,
                enabled,
                source,
                userHash: this.getUserHash()
            });
        }
    }
    
    // Track flag changes
    trackFlagChange(flagName, value, source) {
        if (this.analytics) {
            this.analytics.trackEvent('feature_flag_changed', {
                flagName,
                value,
                source,
                timestamp: Date.now()
            });
        }
    }
    
    // Track kill switch activation
    trackKillSwitch(flagName, active, reason) {
        if (this.analytics) {
            this.analytics.trackEvent('kill_switch_activated', {
                flagName,
                active,
                reason,
                timestamp: Date.now()
            });
        }
    }
    
    // Get feature flag metrics
    getMetrics() {
        return {
            totalFlags: this.flags.size + this.remoteFlags.size,
            localFlags: this.flags.size,
            remoteFlags: this.remoteFlags.size,
            activeKillSwitches: this.killSwitches.size,
            userHash: this.getUserHash(),
            lastRemoteUpdate: this.lastRemoteUpdate || 'Never'
        };
    }
    
    // Debug helper - log all flags
    debugFlags() {
        console.group('🚩 Feature Flags Debug');
        console.table(this.getAllFlags());
        console.log('Metrics:', this.getMetrics());
        console.groupEnd();
    }
    
    // Cleanup
    dispose() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.flags.clear();
        this.killSwitches.clear();
        this.remoteFlags.clear();
        this.experiments.clear();
    }
}

// Create global feature flag service
// Will be properly injected via DI container later
let featureFlagService = null;

// Initialize when DI container is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.DIContainer && window.DIContainer.has('IAnalyticsService')) {
            try {
                const analytics = window.DIContainer.resolve('IAnalyticsService');
                featureFlagService = new FeatureFlagService(analytics);
                
                // Register with DI container
                window.DIContainer.registerInstance('IFeatureFlagService', featureFlagService);
                
                console.log('🚩 Feature Flag Service initialized');
            } catch (error) {
                console.warn('Failed to initialize Feature Flag Service:', error);
            }
        }
    }, 1000);
});

// Export service and class
window.FeatureFlagService = FeatureFlagService;
window.FeatureFlags = featureFlagService;

export { FeatureFlagService };