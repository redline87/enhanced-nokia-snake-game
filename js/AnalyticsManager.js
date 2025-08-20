// Analytics and user behavior tracking for Snake Game
class AnalyticsManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.userProfile = this.loadUserProfile();
        
        // Google Analytics 4 integration
        this.initializeGA4();
        
        // Web Vitals monitoring
        this.initializeWebVitals();
        
        // Session tracking
        this.trackSessionStart();
        
        // Periodic data flush
        this.startDataFlush();
    }
    
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    }
    
    loadUserProfile() {
        const saved = localStorage.getItem('snakeUserProfile');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Create new user profile
        const profile = {
            userId: this.generateUserId(),
            firstVisit: new Date().toISOString(),
            totalSessions: 0,
            totalGamesPlayed: 0,
            totalScore: 0,
            bestScore: 0,
            totalPlayTime: 0,
            achievements: [],
            streakRecord: 0,
            currentStreak: 0,
            lastPlayDate: null,
            preferences: {
                soundEnabled: true,
                theme: 'classic'
            }
        };
        
        this.saveUserProfile(profile);
        return profile;
    }
    
    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    
    saveUserProfile(profile = this.userProfile) {
        localStorage.setItem('snakeUserProfile', JSON.stringify(profile));
    }
    
    // Google Analytics 4 Integration
    initializeGA4() {
        // Initialize GA4 if gtag is available
        if (typeof gtag !== 'undefined') {
            this.ga4Available = true;
            
            // Set user properties
            gtag('config', 'GA_MEASUREMENT_ID', {
                user_id: this.userProfile.userId,
                custom_map: {
                    'session_id': this.sessionId
                }
            });
        } else {
            console.log('GA4 not available, using local analytics only');
            this.ga4Available = false;
        }
    }
    
    // Web Vitals Performance Monitoring
    async initializeWebVitals() {
        try {
            // Dynamic import for Web Vitals (if available)
            const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('https://unpkg.com/web-vitals@3/dist/web-vitals.js');
            
            getCLS((metric) => this.trackWebVital('CLS', metric));
            getFID((metric) => this.trackWebVital('FID', metric));
            getFCP((metric) => this.trackWebVital('FCP', metric));
            getLCP((metric) => this.trackWebVital('LCP', metric));
            getTTFB((metric) => this.trackWebVital('TTFB', metric));
            
            console.log('Web Vitals monitoring initialized');
        } catch (error) {
            console.log('Web Vitals not available, skipping performance monitoring');
        }
    }
    
    trackWebVital(name, metric) {
        const vital = {
            name: name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            navigationType: metric.navigationType
        };
        
        this.trackEvent('web_vital', vital);
        
        // Send to GA4 if available
        if (this.ga4Available) {
            gtag('event', 'web_vital', {
                metric_name: name,
                metric_value: metric.value,
                metric_rating: metric.rating
            });
        }
    }
    
    // Core Analytics Methods
    trackEvent(eventName, properties = {}) {
        const event = {
            name: eventName,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userProfile.userId,
            properties: {
                ...properties,
                userAgent: navigator.userAgent,
                screenResolution: `${screen.width}x${screen.height}`,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                referrer: document.referrer
            }
        };
        
        this.events.push(event);
        
        // Send to GA4 if available
        if (this.ga4Available) {
            gtag('event', eventName, properties);
        }
        
        console.log(`📊 Analytics: ${eventName}`, properties);
    }
    
    // Game-Specific Analytics
    trackSessionStart() {
        this.userProfile.totalSessions++;
        this.userProfile.lastPlayDate = new Date().toISOString();
        this.saveUserProfile();
        
        this.trackEvent('session_start', {
            sessionNumber: this.userProfile.totalSessions,
            daysSinceLastPlay: this.getDaysSinceLastPlay(),
            isReturningUser: this.userProfile.totalSessions > 1
        });
    }
    
    trackGameStart(difficulty = 'normal') {
        this.currentGameStartTime = Date.now();
        this.currentGameEvents = [];
        
        this.trackEvent('game_start', {
            gameNumber: this.userProfile.totalGamesPlayed + 1,
            difficulty: difficulty,
            deviceType: this.getDeviceType(),
            sessionGameNumber: this.getSessionGameCount() + 1
        });
    }
    
    trackGameEnd(score, duration, reason = 'collision') {
        const gameStats = {
            score: score,
            duration: duration,
            reason: reason,
            gameNumber: this.userProfile.totalGamesPlayed + 1,
            averageScore: Math.round((this.userProfile.totalScore + score) / (this.userProfile.totalGamesPlayed + 1)),
            isNewRecord: score > this.userProfile.bestScore,
            scoreImprovement: score - this.userProfile.bestScore
        };
        
        // Update user profile
        this.userProfile.totalGamesPlayed++;
        this.userProfile.totalScore += score;
        this.userProfile.totalPlayTime += duration;
        
        if (score > this.userProfile.bestScore) {
            this.userProfile.bestScore = score;
            this.trackEvent('new_high_score', { score, previousBest: this.userProfile.bestScore });
        }
        
        this.saveUserProfile();
        
        this.trackEvent('game_end', gameStats);
    }
    
    trackScoreSubmission(name, score, qualified) {
        this.trackEvent('score_submission', {
            playerName: name,
            score: score,
            qualified: qualified,
            leaderboardPosition: qualified ? 'top_10' : 'not_qualifying'
        });
    }
    
    trackAchievementUnlock(achievementId, achievementName) {
        if (!this.userProfile.achievements.includes(achievementId)) {
            this.userProfile.achievements.push(achievementId);
            this.saveUserProfile();
            
            this.trackEvent('achievement_unlock', {
                achievementId: achievementId,
                achievementName: achievementName,
                totalAchievements: this.userProfile.achievements.length
            });
        }
    }
    
    trackPowerUpUse(powerUpType, effectiveness) {
        this.trackEvent('powerup_use', {
            type: powerUpType,
            effectiveness: effectiveness,
            gameTime: Date.now() - this.currentGameStartTime
        });
    }
    
    trackSocialShare(platform, score) {
        this.trackEvent('social_share', {
            platform: platform,
            score: score,
            shareType: score > this.userProfile.bestScore ? 'new_record' : 'regular_score'
        });
    }
    
    trackAdView(adType, placement, revenue = 0) {
        this.trackEvent('ad_view', {
            type: adType,
            placement: placement,
            revenue: revenue,
            gameContext: this.getGameContext()
        });
    }
    
    trackPurchase(item, price, currency = 'USD') {
        this.trackEvent('purchase', {
            item: item,
            price: price,
            currency: currency,
            userLifetimeValue: this.calculateLifetimeValue() + price
        });
        
        if (this.ga4Available) {
            gtag('event', 'purchase', {
                transaction_id: this.generateTransactionId(),
                value: price,
                currency: currency,
                items: [{
                    item_id: item,
                    item_name: item,
                    category: 'game_enhancement',
                    quantity: 1,
                    price: price
                }]
            });
        }
    }
    
    // User Engagement Metrics
    trackEngagementLevel() {
        const sessionDuration = Date.now() - this.startTime;
        const gamesThisSession = this.getSessionGameCount();
        
        let engagementLevel = 'low';
        if (sessionDuration > 300000 && gamesThisSession > 3) engagementLevel = 'high';
        else if (sessionDuration > 120000 || gamesThisSession > 1) engagementLevel = 'medium';
        
        this.trackEvent('engagement_level', {
            level: engagementLevel,
            sessionDuration: sessionDuration,
            gamesPlayed: gamesThisSession,
            averageGameDuration: gamesThisSession > 0 ? sessionDuration / gamesThisSession : 0
        });
        
        return engagementLevel;
    }
    
    // Utility Methods
    getDaysSinceLastPlay() {
        if (!this.userProfile.lastPlayDate) return 0;
        const lastPlay = new Date(this.userProfile.lastPlayDate);
        const today = new Date();
        return Math.floor((today - lastPlay) / (1000 * 60 * 60 * 24));
    }
    
    getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(userAgent)) {
            return /iPad/i.test(userAgent) ? 'tablet' : 'mobile';
        }
        return 'desktop';
    }
    
    getSessionGameCount() {
        return this.events.filter(e => e.name === 'game_start').length;
    }
    
    getGameContext() {
        return {
            gamesPlayedToday: this.getSessionGameCount(),
            currentStreak: this.userProfile.currentStreak,
            timeInCurrentGame: this.currentGameStartTime ? Date.now() - this.currentGameStartTime : 0
        };
    }
    
    calculateLifetimeValue() {
        // Placeholder for LTV calculation
        return this.events.filter(e => e.name === 'purchase')
            .reduce((total, event) => total + (event.properties.price || 0), 0);
    }
    
    generateTransactionId() {
        return `txn_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    
    // Data Management
    startDataFlush() {
        // Flush analytics data every 30 seconds
        setInterval(() => {
            this.flushData();
        }, 30000);
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flushData();
        });
    }
    
    flushData() {
        if (this.events.length === 0) return;
        
        // In a real implementation, you would send this to your analytics backend
        const dataToFlush = {
            sessionId: this.sessionId,
            userId: this.userProfile.userId,
            events: [...this.events],
            sessionSummary: {
                duration: Date.now() - this.startTime,
                gamesPlayed: this.getSessionGameCount(),
                engagementLevel: this.trackEngagementLevel()
            }
        };
        
        // For now, just log and clear
        console.log('📊 Flushing analytics data:', dataToFlush);
        this.events = [];
    }
    
    // Public API for getting insights
    getInsights() {
        return {
            userProfile: this.userProfile,
            sessionStats: {
                duration: Date.now() - this.startTime,
                gamesPlayed: this.getSessionGameCount(),
                engagementLevel: this.trackEngagementLevel()
            },
            performanceMetrics: this.events.filter(e => e.name === 'web_vital')
        };
    }
}