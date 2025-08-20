// Unified Data Management and Persistence Layer
class DataManager {
    constructor() {
        this.version = '5.0.0';
        this.initialized = false;
        this.dataCache = new Map();
        this.saveQueue = [];
        this.compressionEnabled = true;
        this.encryptionKey = this.generateEncryptionKey();
        
        this.initializeDataLayer();
        this.setupAutoSave();
    }
    
    initializeDataLayer() {
        try {
            // Check storage availability
            this.checkStorageSupport();
            
            // Perform data migrations if needed
            this.performDataMigrations();
            
            // Initialize data schemas
            this.initializeSchemas();
            
            // Setup storage event listeners
            this.setupStorageListeners();
            
            this.initialized = true;
            console.log('💾 Data Management System initialized');
            
        } catch (error) {
            console.error('Failed to initialize data layer:', error);
            this.handleDataLayerFailure(error);
        }
    }
    
    checkStorageSupport() {
        // Check localStorage availability
        if (!this.isStorageAvailable('localStorage')) {
            throw new Error('localStorage not available');
        }
        
        // Check IndexedDB availability
        this.indexedDBSupported = 'indexedDB' in window;
        
        // Check storage quota
        this.checkStorageQuota();
    }
    
    isStorageAvailable(type) {
        try {
            const storage = window[type];
            const test = '__storage_test__';
            storage.setItem(test, test);
            storage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                this.storageQuota = {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    available: estimate.quota - estimate.usage
                };
                
                // Warn if storage is getting full (>80%)
                if (estimate.usage / estimate.quota > 0.8) {
                    console.warn('⚠️ Storage quota nearly full:', estimate);
                }
            } catch (error) {
                console.error('Failed to check storage quota:', error);
            }
        }
    }
    
    performDataMigrations() {
        const currentVersion = localStorage.getItem('dataVersion') || '1.0.0';
        
        if (this.isVersionOlder(currentVersion, this.version)) {
            console.log(`🔄 Migrating data from v${currentVersion} to v${this.version}`);
            
            // Migration logic based on version differences
            this.migrateFromVersion(currentVersion);
            
            // Update version
            localStorage.setItem('dataVersion', this.version);
        }
    }
    
    migrateFromVersion(fromVersion) {
        const migrations = {
            '1.0.0': () => this.migrateFrom1_0_0(),
            '2.0.0': () => this.migrateFrom2_0_0(),
            '3.0.0': () => this.migrateFrom3_0_0(),
            '4.0.0': () => this.migrateFrom4_0_0()
        };
        
        // Apply migrations in sequence
        Object.entries(migrations).forEach(([version, migrate]) => {
            if (this.isVersionOlder(fromVersion, version)) {
                try {
                    migrate();
                    console.log(`✅ Migrated from v${version}`);
                } catch (error) {
                    console.error(`❌ Migration from v${version} failed:`, error);
                }
            }
        });
    }
    
    migrateFrom1_0_0() {
        // Migrate old score format to new profile system
        const oldHighScore = localStorage.getItem('highScore');
        if (oldHighScore && !localStorage.getItem('userProfile')) {
            const profile = {
                bestScore: parseInt(oldHighScore) || 0,
                createdAt: Date.now(),
                version: '5.0.0'
            };
            localStorage.setItem('userProfile', JSON.stringify(profile));
        }
    }
    
    migrateFrom2_0_0() {
        // Migrate achievement data structure
        const oldAchievements = localStorage.getItem('achievements');
        if (oldAchievements) {
            const achievements = JSON.parse(oldAchievements);
            // Transform to new format
            const newAchievements = this.transformAchievementData(achievements);
            localStorage.setItem('achievements', JSON.stringify(newAchievements));
        }
    }
    
    migrateFrom3_0_0() {
        // Migrate currency system
        const coins = localStorage.getItem('coins') || '0';
        if (coins && !localStorage.getItem('userCurrencies')) {
            const currencies = {
                coins: parseInt(coins),
                gems: 0,
                seasonTokens: 0,
                version: '5.0.0'
            };
            localStorage.setItem('userCurrencies', JSON.stringify(currencies));
            localStorage.removeItem('coins'); // Clean up old format
        }
    }
    
    migrateFrom4_0_0() {
        // Migrate to new profile structure with social features
        const profile = this.getData('userProfile');
        if (profile && !profile.clanId) {
            profile.clanId = null;
            profile.friendIds = [];
            profile.socialStats = {
                gamesShared: 0,
                friendsReferred: 0
            };
            this.saveData('userProfile', profile);
        }
    }
    
    initializeSchemas() {
        this.schemas = {
            userProfile: {
                required: ['playerId', 'username', 'level', 'experience'],
                defaults: {
                    level: 1,
                    experience: 0,
                    createdAt: Date.now()
                }
            },
            
            userCurrencies: {
                required: ['coins', 'gems'],
                defaults: {
                    coins: 0,
                    gems: 0,
                    seasonTokens: 0
                }
            },
            
            userProgression: {
                required: ['currentSeason'],
                defaults: {
                    currentSeason: 1,
                    battlePassTier: 0,
                    loginStreak: 0
                }
            },
            
            gameStatistics: {
                required: ['gamesPlayed'],
                defaults: {
                    gamesPlayed: 0,
                    totalScore: 0,
                    bestScore: 0,
                    totalPlaytime: 0
                }
            },
            
            achievements: {
                required: ['unlocked', 'progress'],
                defaults: {
                    unlocked: [],
                    progress: {},
                    lastUpdated: Date.now()
                }
            },
            
            settings: {
                required: ['soundEnabled'],
                defaults: {
                    soundEnabled: true,
                    notificationsEnabled: true,
                    theme: 'classic'
                }
            }
        };
    }
    
    setupStorageListeners() {
        // Listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (e.storageArea === localStorage) {
                this.handleStorageChange(e.key, e.newValue, e.oldValue);
            }
        });
        
        // Listen for beforeunload to ensure data is saved
        window.addEventListener('beforeunload', () => {
            this.flushSaveQueue();
        });
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.flushSaveQueue();
            }
        });
    }
    
    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.flushSaveQueue();
        }, 30000);
        
        // Periodic data integrity check every 5 minutes
        this.integrityCheckInterval = setInterval(() => {
            this.performIntegrityCheck();
        }, 5 * 60 * 1000);
    }
    
    // Core Data Operations
    saveData(key, data, options = {}) {
        try {
            // Validate data against schema
            if (this.schemas[key]) {
                data = this.validateAndNormalizeData(key, data);
            }
            
            // Add metadata
            const wrappedData = {
                data: data,
                timestamp: Date.now(),
                version: this.version,
                compressed: false,
                encrypted: false
            };
            
            // Apply compression if enabled and data is large
            if (this.compressionEnabled && JSON.stringify(data).length > 1000) {
                wrappedData.data = this.compressData(data);
                wrappedData.compressed = true;
            }
            
            // Apply encryption for sensitive data
            if (options.encrypt || this.isSensitiveData(key)) {
                wrappedData.data = this.encryptData(wrappedData.data);
                wrappedData.encrypted = true;
            }
            
            // Save to localStorage
            localStorage.setItem(key, JSON.stringify(wrappedData));
            
            // Update cache
            this.dataCache.set(key, data);
            
            // Track save operation
            this.trackDataOperation('save', key, JSON.stringify(wrappedData).length);
            
            return true;
            
        } catch (error) {
            console.error(`Failed to save data for key "${key}":`, error);
            this.handleSaveError(key, error);
            return false;
        }
    }
    
    getData(key, defaultValue = null) {
        try {
            // Check cache first
            if (this.dataCache.has(key)) {
                return this.dataCache.get(key);
            }
            
            // Load from localStorage
            const stored = localStorage.getItem(key);
            if (!stored) {
                return defaultValue;
            }
            
            const wrappedData = JSON.parse(stored);
            let data = wrappedData.data;
            
            // Apply decompression if needed
            if (wrappedData.compressed) {
                data = this.decompressData(data);
            }
            
            // Apply decryption if needed
            if (wrappedData.encrypted) {
                data = this.decryptData(data);
            }
            
            // Validate data integrity
            if (this.schemas[key]) {
                data = this.validateAndNormalizeData(key, data);
            }
            
            // Update cache
            this.dataCache.set(key, data);
            
            // Track load operation
            this.trackDataOperation('load', key, stored.length);
            
            return data;
            
        } catch (error) {
            console.error(`Failed to load data for key "${key}":`, error);
            this.handleLoadError(key, error);
            return defaultValue;
        }
    }
    
    queueSave(key, data, options = {}) {
        // Add to save queue for batch processing
        const existingIndex = this.saveQueue.findIndex(item => item.key === key);
        
        if (existingIndex >= 0) {
            // Update existing queue item
            this.saveQueue[existingIndex] = { key, data, options, timestamp: Date.now() };
        } else {
            // Add new queue item
            this.saveQueue.push({ key, data, options, timestamp: Date.now() });
        }
        
        // Flush queue if it gets too large
        if (this.saveQueue.length > 10) {
            this.flushSaveQueue();
        }
    }
    
    flushSaveQueue() {
        if (this.saveQueue.length === 0) return;
        
        const queue = [...this.saveQueue];
        this.saveQueue = [];
        
        queue.forEach(({ key, data, options }) => {
            this.saveData(key, data, options);
        });
        
        console.log(`💾 Flushed ${queue.length} items from save queue`);
    }
    
    // Data Validation and Normalization
    validateAndNormalizeData(key, data) {
        const schema = this.schemas[key];
        if (!schema) return data;
        
        // Ensure required fields exist
        schema.required.forEach(field => {
            if (!(field in data)) {
                if (field in schema.defaults) {
                    data[field] = schema.defaults[field];
                } else {
                    throw new Error(`Required field "${field}" missing from ${key}`);
                }
            }
        });
        
        // Apply default values for missing optional fields
        Object.entries(schema.defaults).forEach(([field, defaultValue]) => {
            if (!(field in data)) {
                data[field] = defaultValue;
            }
        });
        
        return data;
    }
    
    // Data Integrity and Backup
    performIntegrityCheck() {
        const criticalKeys = ['userProfile', 'userCurrencies', 'userProgression'];
        const issues = [];
        
        criticalKeys.forEach(key => {
            try {
                const data = this.getData(key);
                if (!data) {
                    issues.push(`Missing critical data: ${key}`);
                } else if (this.schemas[key]) {
                    // Validate structure
                    this.validateAndNormalizeData(key, data);
                }
            } catch (error) {
                issues.push(`Corrupted data: ${key} - ${error.message}`);
            }
        });
        
        if (issues.length > 0) {
            console.error('🚨 Data integrity issues detected:', issues);
            this.handleIntegrityIssues(issues);
        }
    }
    
    createBackup() {
        const backup = {
            version: this.version,
            timestamp: Date.now(),
            data: {}
        };
        
        // Backup all user data
        const keysToBackup = [
            'userProfile',
            'userCurrencies', 
            'userProgression',
            'achievements',
            'gameStatistics',
            'settings',
            'unlockedContent',
            'seasonHistory'
        ];
        
        keysToBackup.forEach(key => {
            const data = this.getData(key);
            if (data) {
                backup.data[key] = data;
            }
        });
        
        return backup;
    }
    
    restoreFromBackup(backup) {
        if (!backup || backup.version !== this.version) {
            throw new Error('Invalid or incompatible backup');
        }
        
        Object.entries(backup.data).forEach(([key, data]) => {
            this.saveData(key, data);
        });
        
        // Clear cache to force reload
        this.dataCache.clear();
        
        console.log('✅ Data restored from backup');
    }
    
    exportUserData() {
        const userData = this.createBackup();
        const blob = new Blob([JSON.stringify(userData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snake-game-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Data Compression and Encryption
    compressData(data) {
        // Simple compression using JSON string manipulation
        // In production, use proper compression like LZ77 or gzip
        const jsonString = JSON.stringify(data);
        
        // Basic compression: replace common patterns
        return jsonString
            .replace(/\":/g, '"§')
            .replace(/,\"/g, '¤\"')
            .replace(/true/g, '†')
            .replace(/false/g, '‡')
            .replace(/null/g, 'ø');
    }
    
    decompressData(compressedData) {
        // Reverse compression
        const decompressed = compressedData
            .replace(/\"§/g, '":')
            .replace(/¤\"/g, ',"')
            .replace(/†/g, 'true')
            .replace(/‡/g, 'false')
            .replace(/ø/g, 'null');
        
        return JSON.parse(decompressed);
    }
    
    encryptData(data) {
        // Simple XOR encryption for demo (use proper encryption in production)
        const jsonString = JSON.stringify(data);
        let encrypted = '';
        
        for (let i = 0; i < jsonString.length; i++) {
            encrypted += String.fromCharCode(
                jsonString.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
            );
        }
        
        return btoa(encrypted); // Base64 encode
    }
    
    decryptData(encryptedData) {
        const encrypted = atob(encryptedData); // Base64 decode
        let decrypted = '';
        
        for (let i = 0; i < encrypted.length; i++) {
            decrypted += String.fromCharCode(
                encrypted.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
            );
        }
        
        return JSON.parse(decrypted);
    }
    
    generateEncryptionKey() {
        // Generate a simple key based on device characteristics
        const userAgent = navigator.userAgent;
        const timestamp = localStorage.getItem('firstRun') || Date.now().toString();
        
        let key = '';
        for (let i = 0; i < userAgent.length && key.length < 32; i++) {
            key += userAgent.charCodeAt(i).toString(36);
        }
        
        return (key + timestamp).substring(0, 32);
    }
    
    // Storage Event Handling
    handleStorageChange(key, newValue, oldValue) {
        if (key && this.dataCache.has(key)) {
            // Invalidate cache for changed key
            this.dataCache.delete(key);
            
            console.log(`🔄 Storage changed for ${key}, cache invalidated`);
        }
    }
    
    // Error Handling
    handleDataLayerFailure(error) {
        // Implement fallback storage or recovery mechanisms
        console.error('Data layer failed to initialize:', error);
        
        // Try to show user-friendly error message
        this.showDataError('Data system initialization failed. Some features may not work properly.');
    }
    
    handleSaveError(key, error) {
        // Log error and potentially retry
        console.error(`Save failed for ${key}:`, error);
        
        // Add to retry queue
        this.scheduleRetry('save', key);
    }
    
    handleLoadError(key, error) {
        console.error(`Load failed for ${key}:`, error);
        
        // Check if data is corrupted and attempt recovery
        if (error.name === 'SyntaxError') {
            this.attemptDataRecovery(key);
        }
    }
    
    handleIntegrityIssues(issues) {
        // Attempt to fix common issues
        issues.forEach(issue => {
            if (issue.includes('Missing critical data')) {
                const key = issue.split(': ')[1];
                this.initializeDefaultData(key);
            }
        });
    }
    
    showDataError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e53e3e;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 9999;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        `;
        
        errorDiv.innerHTML = `
            <h3>⚠️ Data Error</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">OK</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.parentElement.removeChild(errorDiv);
            }
        }, 10000);
    }
    
    scheduleRetry(operation, key, maxRetries = 3) {
        const retryKey = `${operation}_${key}`;
        let retries = parseInt(localStorage.getItem(`retries_${retryKey}`) || '0');
        
        if (retries < maxRetries) {
            retries++;
            localStorage.setItem(`retries_${retryKey}`, retries.toString());
            
            setTimeout(() => {
                if (operation === 'save') {
                    // Retry save operation
                    const data = this.dataCache.get(key);
                    if (data) {
                        this.saveData(key, data);
                    }
                }
            }, 1000 * Math.pow(2, retries)); // Exponential backoff
        }
    }
    
    attemptDataRecovery(key) {
        console.log(`🔧 Attempting recovery for ${key}`);
        
        // Try to load from backup
        const backupKey = `${key}_backup`;
        const backup = localStorage.getItem(backupKey);
        
        if (backup) {
            try {
                const backupData = JSON.parse(backup);
                this.saveData(key, backupData);
                console.log(`✅ Recovered ${key} from backup`);
                return true;
            } catch (error) {
                console.error(`Backup recovery failed for ${key}:`, error);
            }
        }
        
        // Initialize with defaults if no backup available
        this.initializeDefaultData(key);
        return false;
    }
    
    initializeDefaultData(key) {
        const schema = this.schemas[key];
        if (schema) {
            const defaultData = { ...schema.defaults };
            this.saveData(key, defaultData);
            console.log(`🔧 Initialized default data for ${key}`);
        }
    }
    
    // Utility Methods
    isVersionOlder(version1, version2) {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const v1Part = v1Parts[i] || 0;
            const v2Part = v2Parts[i] || 0;
            
            if (v1Part < v2Part) return true;
            if (v1Part > v2Part) return false;
        }
        
        return false;
    }
    
    isSensitiveData(key) {
        const sensitiveKeys = ['userProfile', 'userCurrencies', 'userProgression'];
        return sensitiveKeys.includes(key);
    }
    
    trackDataOperation(operation, key, size) {
        // Track data operations for analytics
        if (window.analytics) {
            window.analytics.trackEvent('data_operation', {
                operation: operation,
                key: key,
                size: size
            });
        }
    }
    
    transformAchievementData(oldData) {
        // Transform old achievement format to new format
        // Implementation would depend on the specific changes needed
        return oldData;
    }
    
    // Public API Methods
    isInitialized() {
        return this.initialized;
    }
    
    getStorageInfo() {
        return {
            quota: this.storageQuota,
            cacheSize: this.dataCache.size,
            queueSize: this.saveQueue.length,
            version: this.version
        };
    }
    
    clearAllData() {
        const confirmClear = confirm(
            'This will delete all your game progress permanently. Are you sure?'
        );
        
        if (confirmClear) {
            // Clear localStorage
            Object.keys(localStorage).forEach(key => {
                if (!key.startsWith('system_')) { // Keep system settings
                    localStorage.removeItem(key);
                }
            });
            
            // Clear cache
            this.dataCache.clear();
            
            // Clear save queue
            this.saveQueue = [];
            
            console.log('🗑️ All user data cleared');
            return true;
        }
        
        return false;
    }
    
    // Cleanup
    destroy() {
        // Clear intervals
        if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
        if (this.integrityCheckInterval) clearInterval(this.integrityCheckInterval);
        
        // Flush any pending saves
        this.flushSaveQueue();
        
        // Clear cache
        this.dataCache.clear();
        
        console.log('💾 Data Manager destroyed');
    }
}

// Global data manager instance
window.dataManager = null;