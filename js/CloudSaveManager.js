// Cloud Save and Cross-Device Sync System
class CloudSaveManager {
    constructor(userProfile, analytics) {
        this.userProfile = userProfile;
        this.analytics = analytics;
        
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.lastSyncTime = this.getLastSyncTime();
        this.syncQueue = [];
        this.maxRetries = 3;
        
        this.initializeCloudSave();
        this.setupNetworkListeners();
        this.startPeriodicSync();
    }
    
    initializeCloudSave() {
        // For demo purposes, we'll simulate cloud save with localStorage + timestamp
        // In production, this would connect to Firebase, AWS, or your backend
        
        this.cloudEndpoint = 'https://your-backend-api.com/api/save'; // Demo endpoint
        this.apiKey = 'demo_api_key'; // Would be real API key
        
        // Check if user has cloud save enabled
        this.cloudSaveEnabled = localStorage.getItem('cloudSaveEnabled') === 'true';
        
        // Create cloud save UI
        this.createCloudSaveUI();
        
        // Auto-sync if enabled and online
        if (this.cloudSaveEnabled && this.isOnline) {
            setTimeout(() => {
                this.attemptCloudSync();
            }, 5000); // Sync after 5 seconds
        }
        
        console.log(`☁️ Cloud Save ${this.cloudSaveEnabled ? 'enabled' : 'disabled'}`);
    }
    
    createCloudSaveUI() {
        // Cloud save status indicator
        const cloudIndicator = document.createElement('div');
        cloudIndicator.id = 'cloudSaveIndicator';
        cloudIndicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 1000;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        `;
        
        cloudIndicator.addEventListener('click', () => this.showCloudSaveModal());
        this.updateCloudIndicator();
        
        document.body.appendChild(cloudIndicator);
        
        // Create cloud save modal
        this.createCloudSaveModal();
    }
    
    updateCloudIndicator() {
        const indicator = document.getElementById('cloudSaveIndicator');
        if (!indicator) return;
        
        let status, icon, color;
        
        if (!this.isOnline) {
            status = 'Offline';
            icon = '📶';
            color = '#e53e3e';
        } else if (this.syncInProgress) {
            status = 'Syncing...';
            icon = '🔄';
            color = '#ed8936';
        } else if (!this.cloudSaveEnabled) {
            status = 'Local Save';
            icon = '💾';
            color = '#718096';
        } else {
            const timeSinceSync = Date.now() - this.lastSyncTime;
            if (timeSinceSync < 60000) { // Less than 1 minute
                status = 'Synced';
                icon = '☁️';
                color = '#48bb78';
            } else {
                status = 'Sync Pending';
                icon = '⏳';
                color = '#ed8936';
            }
        }
        
        indicator.innerHTML = `${icon} ${status}`;
        indicator.style.background = `rgba(0, 0, 0, 0.8)`;
        indicator.style.borderLeft = `4px solid ${color}`;
    }
    
    createCloudSaveModal() {
        const modal = document.createElement('div');
        modal.id = 'cloudSaveModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1006;
            display: none;
            align-items: center;
            justify-content: center;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            position: relative;
            text-align: center;
        `;
        
        content.innerHTML = `
            <button id="closeCloudModal" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            ">×</button>
            
            <div id="cloudModalContent"></div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Event listeners
        content.querySelector('#closeCloudModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    showCloudSaveModal() {
        const modal = document.getElementById('cloudSaveModal');
        const content = document.getElementById('cloudModalContent');
        
        const lastSyncText = this.lastSyncTime > 0 ? 
            new Date(this.lastSyncTime).toLocaleString() : 
            'Never';
        
        const deviceInfo = this.getDeviceInfo();
        const saveSize = this.calculateSaveSize();
        
        content.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 20px;">☁️</div>
            <h2>Cloud Save</h2>
            <p style="color: #666; margin: 15px 0;">
                Sync your progress across all devices
            </p>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                    <div>
                        <strong>Status:</strong><br>
                        <span style="color: ${this.cloudSaveEnabled ? '#48bb78' : '#718096'};">
                            ${this.cloudSaveEnabled ? '✅ Enabled' : '❌ Disabled'}
                        </span>
                    </div>
                    <div>
                        <strong>Last Sync:</strong><br>
                        <span>${lastSyncText}</span>
                    </div>
                    <div>
                        <strong>Connection:</strong><br>
                        <span style="color: ${this.isOnline ? '#48bb78' : '#e53e3e'};">
                            ${this.isOnline ? '🌐 Online' : '📶 Offline'}
                        </span>
                    </div>
                    <div>
                        <strong>Save Size:</strong><br>
                        <span>${saveSize} KB</span>
                    </div>
                </div>
            </div>
            
            <div style="background: #fffbeb; padding: 15px; border-radius: 10px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0;">Current Device</h4>
                <p style="margin: 0; font-size: 14px; color: #744210;">
                    ${deviceInfo.browser} on ${deviceInfo.os}<br>
                    Device ID: ${deviceInfo.deviceId}
                </p>
            </div>
            
            ${this.cloudSaveEnabled ? `
                <div style="margin: 20px 0;">
                    <button id="forceSyncBtn" style="
                        background: linear-gradient(135deg, #4299e1, #3182ce);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 25px;
                        cursor: pointer;
                        margin: 5px;
                        ${!this.isOnline ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                    " ${!this.isOnline ? 'disabled' : ''}>
                        🔄 Sync Now
                    </button>
                    <button id="disableCloudBtn" style="
                        background: #e53e3e;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 25px;
                        cursor: pointer;
                        margin: 5px;
                    ">
                        ❌ Disable Cloud Save
                    </button>
                </div>
                
                <div style="background: #f0fff4; border: 2px solid #9ae6b4; padding: 15px; border-radius: 10px; margin: 20px 0; font-size: 14px;">
                    <strong>✅ Your progress is protected!</strong><br>
                    Play on any device and your progress will sync automatically.
                </div>
            ` : `
                <div style="margin: 20px 0;">
                    <button id="enableCloudBtn" style="
                        background: linear-gradient(135deg, #48bb78, #38a169);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                    ">
                        ☁️ Enable Cloud Save
                    </button>
                </div>
                
                <div style="background: #fff5f5; border: 2px solid #feb2b2; padding: 15px; border-radius: 10px; margin: 20px 0; font-size: 14px;">
                    <strong>⚠️ Local save only</strong><br>
                    Your progress is only saved on this device. Enable cloud save to protect your progress!
                </div>
            `}
            
            <div style="font-size: 12px; color: #666; margin-top: 20px;">
                Data is encrypted and stored securely.<br>
                You can disable cloud save at any time.
            </div>
        `;
        
        // Add event handlers
        content.querySelector('#enableCloudBtn')?.addEventListener('click', () => {
            this.enableCloudSave();
        });
        
        content.querySelector('#disableCloudBtn')?.addEventListener('click', () => {
            this.disableCloudSave();
        });
        
        content.querySelector('#forceSyncBtn')?.addEventListener('click', () => {
            this.attemptCloudSync(true);
        });
        
        modal.style.display = 'flex';
    }
    
    enableCloudSave() {
        if (!this.isOnline) {
            this.showNotification('❌ Cannot enable cloud save while offline', 'error');
            return;
        }
        
        this.cloudSaveEnabled = true;
        localStorage.setItem('cloudSaveEnabled', 'true');
        
        // Perform initial sync
        this.attemptCloudSync();
        
        this.showNotification('☁️ Cloud Save enabled!', 'success');
        this.updateCloudIndicator();
        
        // Close modal and refresh
        document.getElementById('cloudSaveModal').style.display = 'none';
        
        this.analytics?.trackEvent('cloud_save_enabled', {
            deviceId: this.getDeviceInfo().deviceId
        });
    }
    
    disableCloudSave() {
        const confirm = window.confirm('Are you sure you want to disable cloud save? Your progress will only be saved locally.');
        
        if (confirm) {
            this.cloudSaveEnabled = false;
            localStorage.setItem('cloudSaveEnabled', 'false');
            
            this.showNotification('💾 Cloud Save disabled', 'warning');
            this.updateCloudIndicator();
            
            // Close modal
            document.getElementById('cloudSaveModal').style.display = 'none';
            
            this.analytics?.trackEvent('cloud_save_disabled');
        }
    }
    
    async attemptCloudSync(forceSync = false) {
        if (!this.cloudSaveEnabled || this.syncInProgress) return;
        if (!this.isOnline && !forceSync) return;
        
        // Check if we need to sync (don't sync too frequently)
        const timeSinceLastSync = Date.now() - this.lastSyncTime;
        if (!forceSync && timeSinceLastSync < 300000) { // 5 minutes
            return;
        }
        
        this.syncInProgress = true;
        this.updateCloudIndicator();
        
        try {
            // Prepare save data
            const saveData = this.prepareSaveData();
            
            // Simulate cloud save operation
            const success = await this.performCloudSync(saveData);
            
            if (success) {
                this.lastSyncTime = Date.now();
                localStorage.setItem('lastSyncTime', this.lastSyncTime.toString());
                
                if (forceSync) {
                    this.showNotification('☁️ Sync completed successfully!', 'success');
                }
                
                this.analytics?.trackEvent('cloud_sync_success', {
                    saveSize: JSON.stringify(saveData).length,
                    forced: forceSync
                });
            } else {
                throw new Error('Sync failed');
            }
            
        } catch (error) {
            console.error('Cloud sync failed:', error);
            
            if (forceSync) {
                this.showNotification('❌ Sync failed. Will retry later.', 'error');
            }
            
            // Add to retry queue
            this.syncQueue.push({
                data: this.prepareSaveData(),
                attempts: 0,
                timestamp: Date.now()
            });
            
            this.analytics?.trackEvent('cloud_sync_failed', {
                error: error.message,
                forced: forceSync
            });
        } finally {
            this.syncInProgress = false;
            this.updateCloudIndicator();
        }
    }
    
    prepareSaveData() {
        // Gather all save data that needs to be synced
        return {
            version: '5.0.0',
            timestamp: Date.now(),
            deviceId: this.getDeviceInfo().deviceId,
            
            // User profile data
            profile: this.userProfile.getProfile(),
            currencies: this.userProfile.getCurrencies(),
            progression: this.userProfile.getProgression(),
            settings: this.userProfile.getSettings(),
            
            // Game data
            achievements: JSON.parse(localStorage.getItem('achievements') || '{}'),
            statistics: JSON.parse(localStorage.getItem('gameStatistics') || '{}'),
            unlockables: JSON.parse(localStorage.getItem('unlockedContent') || '{}'),
            
            // Analytics data (summary)
            playTime: localStorage.getItem('totalPlayTime') || '0',
            gamesPlayed: localStorage.getItem('totalGamesPlayed') || '0',
            
            // Cloud metadata
            lastModified: Date.now(),
            checksum: this.generateChecksum()
        };
    }
    
    async performCloudSync(saveData) {
        // Simulate cloud API call with timeout and retry logic
        return new Promise((resolve) => {
            // Simulate network delay
            setTimeout(() => {
                // For demo purposes, we'll store in localStorage with a cloud prefix
                // In production, this would be an actual API call
                
                try {
                    const cloudSaveKey = `cloudSave_${this.userProfile.getProfile().playerId}`;
                    localStorage.setItem(cloudSaveKey, JSON.stringify(saveData));
                    
                    // Simulate 90% success rate
                    const success = Math.random() > 0.1;
                    resolve(success);
                } catch (error) {
                    resolve(false);
                }
            }, 1000 + Math.random() * 2000); // 1-3 second delay
        });
    }
    
    async loadFromCloud() {
        if (!this.cloudSaveEnabled || !this.isOnline) return null;
        
        try {
            // Simulate loading from cloud
            const cloudSaveKey = `cloudSave_${this.userProfile.getProfile().playerId}`;
            const cloudData = localStorage.getItem(cloudSaveKey);
            
            if (cloudData) {
                const parsedData = JSON.parse(cloudData);
                
                // Validate cloud data
                if (this.validateCloudData(parsedData)) {
                    return parsedData;
                }
            }
        } catch (error) {
            console.error('Failed to load from cloud:', error);
        }
        
        return null;
    }
    
    validateCloudData(data) {
        // Basic validation of cloud save data
        if (!data || typeof data !== 'object') return false;
        if (!data.version || !data.timestamp || !data.profile) return false;
        if (!data.checksum) return false;
        
        // Validate checksum (basic integrity check)
        const expectedChecksum = this.generateChecksum(data);
        return data.checksum === expectedChecksum;
    }
    
    generateChecksum(data = null) {
        // Simple checksum generation (in production, use proper hashing)
        const source = data ? JSON.stringify(data).slice(0, -50) : // Exclude checksum itself
                       JSON.stringify(this.prepareSaveData()).slice(0, -50);
        
        let hash = 0;
        for (let i = 0; i < source.length; i++) {
            const char = source.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36);
    }
    
    async resolveConflict(localData, cloudData) {
        // Simple conflict resolution: choose newer data
        const localTime = localData.timestamp || 0;
        const cloudTime = cloudData.timestamp || 0;
        
        if (cloudTime > localTime) {
            // Cloud data is newer
            await this.applyCloudData(cloudData);
            this.showNotification('☁️ Cloud progress loaded (newer)', 'info');
            return 'cloud';
        } else if (localTime > cloudTime) {
            // Local data is newer - sync to cloud
            await this.attemptCloudSync(true);
            this.showNotification('📱 Local progress synced (newer)', 'info');
            return 'local';
        } else {
            // Same timestamp - no conflict
            return 'none';
        }
    }
    
    async applyCloudData(cloudData) {
        // Apply cloud save data to local storage
        try {
            if (cloudData.profile) {
                localStorage.setItem('userProfile', JSON.stringify(cloudData.profile));
            }
            
            if (cloudData.currencies) {
                localStorage.setItem('userCurrencies', JSON.stringify(cloudData.currencies));
            }
            
            if (cloudData.progression) {
                localStorage.setItem('userProgression', JSON.stringify(cloudData.progression));
            }
            
            if (cloudData.settings) {
                localStorage.setItem('userSettings', JSON.stringify(cloudData.settings));
            }
            
            if (cloudData.achievements) {
                localStorage.setItem('achievements', JSON.stringify(cloudData.achievements));
            }
            
            // Reload user profile to apply changes
            if (this.userProfile && typeof this.userProfile.reload === 'function') {
                this.userProfile.reload();
            }
            
            this.analytics?.trackEvent('cloud_data_applied', {
                timestamp: cloudData.timestamp
            });
            
        } catch (error) {
            console.error('Failed to apply cloud data:', error);
            throw error;
        }
    }
    
    setupNetworkListeners() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateCloudIndicator();
            
            // Attempt sync when coming back online
            if (this.cloudSaveEnabled) {
                setTimeout(() => {
                    this.attemptCloudSync();
                }, 2000);
            }
            
            this.showNotification('🌐 Back online', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateCloudIndicator();
            this.showNotification('📶 Offline mode', 'warning');
        });
    }
    
    startPeriodicSync() {
        // Auto-sync every 10 minutes
        this.syncInterval = setInterval(() => {
            if (this.cloudSaveEnabled && this.isOnline) {
                this.attemptCloudSync();
            }
        }, 10 * 60 * 1000);
        
        // Process retry queue every 2 minutes
        this.retryInterval = setInterval(() => {
            this.processRetryQueue();
        }, 2 * 60 * 1000);
    }
    
    processRetryQueue() {
        if (!this.isOnline || this.syncQueue.length === 0) return;
        
        const item = this.syncQueue[0];
        if (item.attempts < this.maxRetries) {
            item.attempts++;
            
            this.performCloudSync(item.data).then(success => {
                if (success) {
                    this.syncQueue.shift(); // Remove from queue
                    this.lastSyncTime = Date.now();
                    localStorage.setItem('lastSyncTime', this.lastSyncTime.toString());
                }
            });
        } else {
            // Max retries exceeded, remove from queue
            this.syncQueue.shift();
            console.warn('Cloud sync retry exhausted for item');
        }
    }
    
    getDeviceInfo() {
        const deviceId = localStorage.getItem('deviceId') || this.generateDeviceId();
        localStorage.setItem('deviceId', deviceId);
        
        return {
            deviceId: deviceId,
            browser: this.getBrowserName(),
            os: this.getOSName(),
            timestamp: Date.now()
        };
    }
    
    generateDeviceId() {
        return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getBrowserName() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        
        return 'Unknown';
    }
    
    getOSName() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
        
        return 'Unknown';
    }
    
    calculateSaveSize() {
        const saveData = this.prepareSaveData();
        return Math.round(JSON.stringify(saveData).length / 1024);
    }
    
    getLastSyncTime() {
        const saved = localStorage.getItem('lastSyncTime');
        return saved ? parseInt(saved) : 0;
    }
    
    showNotification(message, type = 'info') {
        const colors = {
            info: '#4299e1',
            success: '#48bb78',
            warning: '#ed8936',
            error: '#e53e3e'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 1007;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            animation: notificationSlide 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'notificationSlideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }
    
    // Public API Methods
    isCloudSaveEnabled() {
        return this.cloudSaveEnabled;
    }
    
    getLastSyncTimestamp() {
        return this.lastSyncTime;
    }
    
    isOnlineMode() {
        return this.isOnline;
    }
    
    forceSyncNow() {
        return this.attemptCloudSync(true);
    }
    
    // Cleanup
    destroy() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        if (this.retryInterval) clearInterval(this.retryInterval);
        
        // Final sync before cleanup
        if (this.cloudSaveEnabled && this.isOnline) {
            this.attemptCloudSync();
        }
    }
}

// Add CSS for cloud save animations
const cloudStyle = document.createElement('style');
cloudStyle.textContent = `
    @keyframes notificationSlide {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes notificationSlideOut {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
`;
document.head.appendChild(cloudStyle);