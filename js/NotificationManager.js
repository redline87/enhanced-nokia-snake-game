// Push Notification and Re-engagement System
class NotificationManager {
    constructor(userProfile, analytics) {
        this.userProfile = userProfile;
        this.analytics = analytics;
        
        this.notificationPermission = 'default';
        this.serviceWorkerRegistered = false;
        this.scheduledNotifications = this.loadScheduledNotifications();
        
        this.initializeNotifications();
        this.setupNotificationTemplates();
        this.scheduleEngagementNotifications();
    }
    
    initializeNotifications() {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return;
        }
        
        this.notificationPermission = Notification.permission;
        
        // Register service worker for background notifications
        this.registerServiceWorker();
        
        // Create notification UI
        this.createNotificationUI();
        
        console.log(`🔔 Notifications: ${this.notificationPermission}`);
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // For demo purposes, we'll create a simple service worker inline
                this.createServiceWorker();
                
                const registration = await navigator.serviceWorker.register('/sw-notifications.js');
                this.serviceWorkerRegistered = true;
                
                console.log('🔧 Service Worker registered:', registration.scope);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
    
    createServiceWorker() {
        // Create a simple service worker for notifications
        const swCode = `
            self.addEventListener('push', function(event) {
                const options = {
                    body: event.data ? event.data.text() : 'Come back and play Snake!',
                    icon: '/icon-192.png',
                    badge: '/badge-72.png',
                    tag: 'snake-game-notification',
                    requireInteraction: true,
                    actions: [
                        {
                            action: 'play',
                            title: '🎮 Play Now',
                            icon: '/play-icon.png'
                        },
                        {
                            action: 'dismiss',
                            title: '❌ Dismiss'
                        }
                    ],
                    data: {
                        url: '${window.location.origin}'
                    }
                };
                
                event.waitUntil(
                    self.registration.showNotification('Snake Game', options)
                );
            });
            
            self.addEventListener('notificationclick', function(event) {
                event.notification.close();
                
                if (event.action === 'play') {
                    event.waitUntil(
                        clients.openWindow(event.notification.data.url)
                    );
                }
            });
        `;
        
        // Create blob and URL for service worker
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        // Store the service worker URL for registration
        this.serviceWorkerUrl = swUrl;
    }
    
    createNotificationUI() {
        // Check if user has notifications disabled in settings
        const settings = this.userProfile.getSettings();
        if (!settings.notificationsEnabled) return;
        
        // Create notification permission prompt if needed
        if (this.notificationPermission === 'default') {
            setTimeout(() => {
                this.showNotificationPermissionPrompt();
            }, 10000); // Show after 10 seconds
        }
        
        // Create notification settings in profile
        this.addNotificationSettings();
    }
    
    showNotificationPermissionPrompt() {
        const prompt = document.createElement('div');
        prompt.id = 'notificationPrompt';
        prompt.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 20px 25px;
            border-radius: 15px;
            z-index: 1008;
            max-width: 350px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: slideUpNotification 0.5s ease;
        `;
        
        prompt.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">🔔</div>
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">Stay Connected!</h3>
            <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
                Get reminders for daily challenges, streaks, and special events
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="enableNotifications" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 2px solid white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-weight: bold;
                ">Enable</button>
                <button id="dismissNotifications" style="
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                ">Maybe Later</button>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        // Event handlers
        prompt.querySelector('#enableNotifications').addEventListener('click', async () => {
            await this.requestNotificationPermission();
            document.body.removeChild(prompt);
        });
        
        prompt.querySelector('#dismissNotifications').addEventListener('click', () => {
            document.body.removeChild(prompt);
            // Show again in 24 hours
            setTimeout(() => {
                if (this.notificationPermission === 'default') {
                    this.showNotificationPermissionPrompt();
                }
            }, 24 * 60 * 60 * 1000);
        });
        
        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (prompt.parentNode) {
                document.body.removeChild(prompt);
            }
        }, 30000);
    }
    
    async requestNotificationPermission() {
        if (!('Notification' in window)) return false;
        
        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            
            if (permission === 'granted') {
                this.showTestNotification();
                this.scheduleEngagementNotifications();
                
                this.analytics?.trackEvent('notification_permission_granted');
                return true;
            } else {
                this.analytics?.trackEvent('notification_permission_denied');
                return false;
            }
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
        }
    }
    
    showTestNotification() {
        this.sendNotification({
            title: '🎉 Notifications Enabled!',
            body: 'You\'ll now get reminders for streaks, challenges, and events',
            icon: '🔔',
            tag: 'test-notification',
            silent: false
        });
    }
    
    setupNotificationTemplates() {
        this.templates = {
            daily_streak: {
                title: '🔥 Don\'t break your streak!',
                body: 'You have a {streak} day streak. Play now to keep it going!',
                icon: '🔥',
                delay: 20 * 60 * 60 * 1000, // 20 hours after last play
                conditions: ['hasStreak', 'notPlayedToday']
            },
            
            daily_challenge: {
                title: '🎯 Daily Challenge Awaits',
                body: 'Complete today\'s challenge: {challengeName}. Reward: {reward}',
                icon: '🎯',
                delay: 8 * 60 * 60 * 1000, // 8 hours after reset
                conditions: ['hasDailyChallenge', 'challengeIncomplete']
            },
            
            comeback_7day: {
                title: '🐍 Your snake misses you!',
                body: 'It\'s been a week! Come back for a comeback bonus of {bonus} coins',
                icon: '🐍',
                delay: 7 * 24 * 60 * 60 * 1000, // 7 days
                conditions: ['notPlayedRecently']
            },
            
            comeback_30day: {
                title: '👑 Welcome back, legend!',
                body: 'Massive comeback rewards waiting! New season, new content!',
                icon: '👑',
                delay: 30 * 24 * 60 * 60 * 1000, // 30 days
                conditions: ['longTimeAway']
            },
            
            season_ending: {
                title: '⏰ Season ends soon!',
                body: 'Only {timeLeft} left to claim your Season {season} rewards',
                icon: '⏰',
                timing: 'season_end_minus_3_days',
                conditions: ['seasonActive', 'hasUnclaimedRewards']
            },
            
            clan_war: {
                title: '⚔️ Clan War started!',
                body: 'Your clan needs you! Help {clanName} win this week\'s war',
                icon: '⚔️',
                timing: 'clan_war_start',
                conditions: ['inClan', 'clanWarActive']
            },
            
            achievement_close: {
                title: '🏆 Achievement almost unlocked!',
                body: 'You\'re {progress}% to unlocking "{achievementName}"',
                icon: '🏆',
                conditions: ['achievementNearCompletion']
            },
            
            weekend_event: {
                title: '🎉 Weekend Event Live!',
                body: 'Double XP Weekend is active! Perfect time to level up',
                icon: '🎉',
                timing: 'weekend_event_start',
                conditions: ['weekendEventActive']
            },
            
            battle_pass: {
                title: '📈 Battle Pass progress',
                body: 'You\'re {tiers} tiers away from the legendary skin!',
                icon: '📈',
                delay: 24 * 60 * 60 * 1000, // Daily
                conditions: ['hasBattlePass', 'nearReward']
            },
            
            high_score_beaten: {
                title: '🎯 Someone beat your score!',
                body: '{player} scored {score} and took your leaderboard spot',
                icon: '🎯',
                timing: 'immediate',
                conditions: ['leaderboardPositionLost']
            }
        };
    }
    
    scheduleEngagementNotifications() {
        if (this.notificationPermission !== 'granted') return;
        
        // Clear existing scheduled notifications
        this.clearScheduledNotifications();
        
        const profile = this.userProfile.getProfile();
        const now = Date.now();
        
        // Schedule based on user behavior patterns
        Object.entries(this.templates).forEach(([type, template]) => {
            if (this.shouldScheduleNotification(type, template)) {
                const scheduledTime = this.calculateNotificationTime(type, template);
                
                if (scheduledTime > now) {
                    this.scheduleNotification(type, template, scheduledTime);
                }
            }
        });
        
        console.log(`📅 Scheduled ${this.scheduledNotifications.length} notifications`);
    }
    
    shouldScheduleNotification(type, template) {
        const profile = this.userProfile.getProfile();
        const settings = this.userProfile.getSettings();
        
        if (!settings.notificationsEnabled) return false;
        
        // Check template conditions
        return template.conditions.every(condition => {
            switch (condition) {
                case 'hasStreak':
                    return profile.currentStreak > 0;
                case 'notPlayedToday':
                    return profile.lastActiveDate !== this.getDateString();
                case 'hasDailyChallenge':
                    return true; // Always have daily challenges
                case 'challengeIncomplete':
                    return this.isDailyChallengeIncomplete();
                case 'notPlayedRecently':
                    return (Date.now() - profile.lastLogin) > (7 * 24 * 60 * 60 * 1000);
                case 'longTimeAway':
                    return (Date.now() - profile.lastLogin) > (30 * 24 * 60 * 60 * 1000);
                case 'seasonActive':
                    return true; // Seasons are always active
                case 'hasUnclaimedRewards':
                    return this.hasUnclaimedSeasonRewards();
                case 'inClan':
                    return profile.clanId !== null;
                case 'achievementNearCompletion':
                    return this.hasNearCompleteAchievement();
                default:
                    return true;
            }
        });
    }
    
    calculateNotificationTime(type, template) {
        const profile = this.userProfile.getProfile();
        const now = Date.now();
        
        if (template.delay) {
            return profile.lastLogin + template.delay;
        }
        
        if (template.timing) {
            switch (template.timing) {
                case 'season_end_minus_3_days':
                    // Would calculate based on season end time
                    return now + (3 * 24 * 60 * 60 * 1000);
                case 'clan_war_start':
                    return this.getNextClanWarTime();
                case 'weekend_event_start':
                    return this.getNextWeekendEventTime();
                default:
                    return now + (24 * 60 * 60 * 1000);
            }
        }
        
        return now + (24 * 60 * 60 * 1000); // Default: 24 hours
    }
    
    scheduleNotification(type, template, scheduledTime) {
        const notification = {
            id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            template: template,
            scheduledTime: scheduledTime,
            created: Date.now(),
            status: 'scheduled'
        };
        
        this.scheduledNotifications.push(notification);
        this.saveScheduledNotifications();
        
        // Set timeout for notification
        const delay = scheduledTime - Date.now();
        if (delay > 0 && delay < 2147483647) { // Max setTimeout delay
            setTimeout(() => {
                this.triggerScheduledNotification(notification.id);
            }, delay);
        }
    }
    
    triggerScheduledNotification(notificationId) {
        const notification = this.scheduledNotifications.find(n => n.id === notificationId);
        if (!notification || notification.status !== 'scheduled') return;
        
        // Mark as triggered
        notification.status = 'triggered';
        notification.triggeredAt = Date.now();
        this.saveScheduledNotifications();
        
        // Generate notification content
        const content = this.generateNotificationContent(notification.type, notification.template);
        
        // Send the notification
        this.sendNotification({
            title: content.title,
            body: content.body,
            icon: content.icon,
            tag: notification.type,
            data: {
                type: notification.type,
                url: window.location.origin
            }
        });
        
        // Track notification sent
        this.analytics?.trackEvent('notification_sent', {
            type: notification.type,
            scheduledTime: notification.scheduledTime,
            actualTime: Date.now()
        });
    }
    
    generateNotificationContent(type, template) {
        const profile = this.userProfile.getProfile();
        
        let title = template.title;
        let body = template.body;
        
        // Replace placeholders
        const replacements = {
            '{streak}': profile.currentStreak,
            '{challengeName}': this.getCurrentChallengeName(),
            '{reward}': this.getCurrentChallengeReward(),
            '{bonus}': this.getComebackBonus(),
            '{timeLeft}': this.getSeasonTimeLeft(),
            '{season}': this.getCurrentSeasonNumber(),
            '{clanName}': this.getClanName(),
            '{progress}': this.getNearestAchievementProgress(),
            '{achievementName}': this.getNearestAchievementName(),
            '{tiers}': this.getTiersToNextReward(),
            '{player}': 'A rival player',
            '{score}': '999'
        };
        
        Object.entries(replacements).forEach(([placeholder, value]) => {
            title = title.replace(placeholder, value);
            body = body.replace(placeholder, value);
        });
        
        return {
            title: title,
            body: body,
            icon: template.icon
        };
    }
    
    sendNotification(options) {
        if (this.notificationPermission !== 'granted') return;
        
        const notification = new Notification(options.title, {
            body: options.body,
            icon: this.createNotificationIcon(options.icon),
            badge: '/badge-72.png',
            tag: options.tag || 'snake-game',
            requireInteraction: true,
            silent: options.silent === undefined ? false : options.silent,
            data: options.data || {}
        });
        
        // Handle notification click
        notification.onclick = () => {
            window.focus();
            notification.close();
            
            // Track notification click
            this.analytics?.trackEvent('notification_clicked', {
                type: options.data?.type || 'unknown'
            });
            
            // Navigate to relevant section
            if (options.data?.type) {
                this.handleNotificationClick(options.data.type);
            }
        };
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            notification.close();
        }, 10000);
        
        return notification;
    }
    
    createNotificationIcon(emoji) {
        // Create a simple icon from emoji (in production, use actual icon files)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 64;
        canvas.height = 64;
        
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 32, 32);
        
        return canvas.toDataURL();
    }
    
    handleNotificationClick(type) {
        switch (type) {
            case 'daily_challenge':
                // Show daily challenge
                if (window.challengeManager) {
                    window.challengeManager.showChallengeDetails();
                }
                break;
            case 'battle_pass':
                // Show battle pass (Phase 5B)
                alert('Battle Pass coming in Phase 5B!');
                break;
            case 'clan_war':
                // Show clan interface (Phase 5C)  
                alert('Clan Wars coming in Phase 5C!');
                break;
            default:
                // Just focus the window
                break;
        }
    }
    
    // Utility methods for notification content
    getCurrentChallengeName() {
        return 'Speed Run Challenge'; // Placeholder
    }
    
    getCurrentChallengeReward() {
        return '50 XP + 25 Coins'; // Placeholder
    }
    
    getComebackBonus() {
        const daysAway = Math.floor((Date.now() - this.userProfile.getProfile().lastLogin) / (24 * 60 * 60 * 1000));
        return Math.min(daysAway * 50, 500); // Max 500 coins
    }
    
    getSeasonTimeLeft() {
        return '5 days'; // Placeholder
    }
    
    getCurrentSeasonNumber() {
        return '1'; // Placeholder
    }
    
    getClanName() {
        return 'Your Clan'; // Placeholder
    }
    
    getNearestAchievementProgress() {
        return '85'; // Placeholder
    }
    
    getNearestAchievementName() {
        return 'Century Scorer'; // Placeholder
    }
    
    getTiersToNextReward() {
        return '3'; // Placeholder
    }
    
    isDailyChallengeIncomplete() {
        // Check if today's challenge is complete
        return true; // Placeholder
    }
    
    hasUnclaimedSeasonRewards() {
        return false; // Placeholder
    }
    
    hasNearCompleteAchievement() {
        return true; // Placeholder
    }
    
    getNextClanWarTime() {
        const now = new Date();
        const nextMonday = new Date();
        nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
        nextMonday.setHours(18, 0, 0, 0); // 6 PM Monday
        return nextMonday.getTime();
    }
    
    getNextWeekendEventTime() {
        const now = new Date();
        const nextFriday = new Date();
        nextFriday.setDate(now.getDate() + (5 + 7 - now.getDay()) % 7);
        nextFriday.setHours(18, 0, 0, 0); // 6 PM Friday
        return nextFriday.getTime();
    }
    
    getDateString() {
        return new Date().toISOString().split('T')[0];
    }
    
    // Notification management
    addNotificationSettings() {
        // This would integrate with the profile settings modal
        // For now, we'll add a simple toggle
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            // Add notification settings to profile modal when it opens
            // Implementation would go here
        }
    }
    
    clearScheduledNotifications() {
        this.scheduledNotifications = this.scheduledNotifications.filter(n => 
            n.status === 'triggered' || n.scheduledTime < Date.now()
        );
        this.saveScheduledNotifications();
    }
    
    loadScheduledNotifications() {
        const saved = localStorage.getItem('scheduledNotifications');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveScheduledNotifications() {
        localStorage.setItem('scheduledNotifications', JSON.stringify(this.scheduledNotifications));
    }
    
    // Public API Methods
    hasNotificationPermission() {
        return this.notificationPermission === 'granted';
    }
    
    getScheduledCount() {
        return this.scheduledNotifications.filter(n => n.status === 'scheduled').length;
    }
    
    sendCustomNotification(title, body, options = {}) {
        return this.sendNotification({
            title: title,
            body: body,
            icon: options.icon || '🔔',
            tag: options.tag || 'custom',
            data: options.data || {}
        });
    }
    
    rescheduleEngagementNotifications() {
        this.scheduleEngagementNotifications();
    }
    
    // Cleanup
    destroy() {
        // Clear any pending timeouts
        this.scheduledNotifications.forEach(notification => {
            if (notification.timeoutId) {
                clearTimeout(notification.timeoutId);
            }
        });
        
        this.saveScheduledNotifications();
    }
}

// Add CSS for notification prompts
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideUpNotification {
        from { transform: translateX(-50%) translateY(100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(notificationStyle);