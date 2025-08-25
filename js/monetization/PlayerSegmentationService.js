// Player Segmentation Service
// King/Blizzard standard: Classify players for targeted monetization

class PlayerSegmentationService {
    constructor(analyticsService, userProfileService) {
        this.analytics = analyticsService;
        this.userProfile = userProfileService;
        this.segments = new Map();
        this.segmentHistory = new Map();
        this.segmentationRules = this.initializeSegmentationRules();
        
        // Update interval for segment recalculation
        this.updateInterval = 24 * 60 * 60 * 1000; // 24 hours
        this.lastUpdate = 0;
        
        this.initialize();
    }
    
    initialize() {
        // Load existing segments
        this.loadSegmentHistory();
        
        // Calculate initial segment
        this.calculatePlayerSegment();
        
        // Set up periodic recalculation
        setInterval(() => {
            this.recalculateSegments();
        }, this.updateInterval);
        
        // Listen to spending events for real-time updates
        if (window.GameEventBus) {
            window.GameEventBus.on('purchase:completed', (data) => {
                this.onPurchaseCompleted(data);
            });
            
            window.GameEventBus.on('currency:spent', (data) => {
                this.onCurrencySpent(data);
            });
        }
    }
    
    initializeSegmentationRules() {
        return {
            // Whale Classification (5% of players, 60-80% of revenue)
            whale: {
                criteria: [
                    { metric: 'totalSpent', operator: '>=', value: 50 },
                    { metric: 'purchaseFrequency', operator: '>=', value: 5 },
                    { metric: 'avgSessionLength', operator: '>=', value: 900000 }, // 15 minutes
                    { metric: 'daysActive', operator: '>=', value: 7 }
                ],
                minimumCriteria: 2, // Must meet at least 2 criteria
                priority: 1,
                description: 'High-value players driving majority of revenue',
                targetOffers: ['premium_bundles', 'exclusive_content', 'vip_subscription'],
                maxOfferPrice: 99.99,
                offerFrequency: 'daily'
            },
            
            // Dolphin Classification (20% of players, 20-30% of revenue)
            dolphin: {
                criteria: [
                    { metric: 'totalSpent', operator: '>=', value: 5 },
                    { metric: 'totalSpent', operator: '<', value: 50 },
                    { metric: 'purchaseCount', operator: '>=', value: 1 },
                    { metric: 'engagementScore', operator: '>=', value: 0.6 },
                    { metric: 'daysActive', operator: '>=', value: 3 }
                ],
                minimumCriteria: 3,
                priority: 2,
                description: 'Regular spenders with consistent engagement',
                targetOffers: ['battle_pass', 'cosmetic_items', 'convenience_purchases'],
                maxOfferPrice: 19.99,
                offerFrequency: 'weekly'
            },
            
            // Minnow Classification (75% of players, 5-10% of revenue)
            minnow: {
                criteria: [
                    { metric: 'totalSpent', operator: '<', value: 5 },
                    { metric: 'daysActive', operator: '>=', value: 1 }
                ],
                minimumCriteria: 1,
                priority: 3,
                description: 'Free-to-play users, potential for conversion',
                targetOffers: ['starter_packs', 'first_purchase_bonus', 'small_currency_packs'],
                maxOfferPrice: 4.99,
                offerFrequency: 'bi-weekly'
            },
            
            // Risk Segments
            churn_risk: {
                criteria: [
                    { metric: 'daysSinceLastSession', operator: '>=', value: 3 },
                    { metric: 'sessionTrend', operator: '<=', value: -0.2 },
                    { metric: 'engagementScore', operator: '<=', value: 0.3 }
                ],
                minimumCriteria: 2,
                priority: 4,
                description: 'Players at risk of churning',
                targetOffers: ['comeback_bonus', 'free_premium_trial', 'discount_offers'],
                maxOfferPrice: 0.99,
                offerFrequency: 'immediate'
            },
            
            // High Potential
            high_potential: {
                criteria: [
                    { metric: 'engagementScore', operator: '>=', value: 0.8 },
                    { metric: 'sessionLength', operator: '>=', value: 600000 }, // 10 minutes
                    { metric: 'totalSpent', operator: '<', value: 1 },
                    { metric: 'daysActive', operator: '>=', value: 5 }
                ],
                minimumCriteria: 3,
                priority: 2,
                description: 'Highly engaged players ready to convert',
                targetOffers: ['first_time_buyer', 'limited_time_discount', 'exclusive_preview'],
                maxOfferPrice: 9.99,
                offerFrequency: 'weekly'
            }
        };
    }
    
    calculatePlayerSegment() {
        const profile = this.userProfile.getProfile();
        const metrics = this.calculatePlayerMetrics(profile);
        
        // Find best matching segment
        let bestSegment = 'minnow'; // Default
        let highestScore = 0;
        
        Object.entries(this.segmentationRules).forEach(([segmentName, rules]) => {
            const score = this.calculateSegmentScore(metrics, rules);
            
            if (score >= rules.minimumCriteria && score > highestScore) {
                bestSegment = segmentName;
                highestScore = score;
            }
        });
        
        // Update segment if changed
        const currentSegment = this.getCurrentSegment();
        if (currentSegment !== bestSegment) {
            this.updatePlayerSegment(bestSegment, metrics);
        }
        
        return bestSegment;
    }
    
    calculatePlayerMetrics(profile) {
        const currencies = this.userProfile.getCurrencies();
        const progression = this.userProfile.getProgression();
        
        // Calculate spending metrics
        const purchaseHistory = this.getPurchaseHistory();
        const totalSpent = purchaseHistory.reduce((sum, purchase) => sum + purchase.amount, 0);
        const purchaseCount = purchaseHistory.length;
        const purchaseFrequency = this.calculatePurchaseFrequency(purchaseHistory);
        
        // Calculate engagement metrics
        const sessionMetrics = this.calculateSessionMetrics();
        const engagementScore = this.calculateEngagementScore(profile, sessionMetrics);
        
        // Calculate retention metrics
        const daysSinceInstall = Math.floor((Date.now() - profile.createdAt) / (24 * 60 * 60 * 1000));
        const daysSinceLastSession = Math.floor((Date.now() - profile.lastLogin) / (24 * 60 * 60 * 1000));
        const daysActive = this.calculateActiveDays(profile);
        
        return {
            // Spending metrics
            totalSpent,
            purchaseCount,
            purchaseFrequency,
            avgPurchaseAmount: purchaseCount > 0 ? totalSpent / purchaseCount : 0,
            
            // Engagement metrics
            engagementScore,
            avgSessionLength: sessionMetrics.avgLength,
            sessionFrequency: sessionMetrics.frequency,
            sessionTrend: sessionMetrics.trend,
            
            // Progression metrics
            level: profile.level,
            progressionRate: profile.level / Math.max(daysSinceInstall, 1),
            achievementCompletion: profile.unlockedAchievements.length / this.getTotalAchievements(),
            
            // Retention metrics
            daysSinceInstall,
            daysSinceLastSession,
            daysActive,
            retentionRate: daysActive / Math.max(daysSinceInstall, 1),
            
            // Social metrics
            socialEngagement: this.calculateSocialEngagement(profile),
            
            // Time-based metrics
            timestamp: Date.now()
        };
    }
    
    calculateSegmentScore(metrics, rules) {
        let score = 0;
        
        rules.criteria.forEach(criterion => {
            const metricValue = metrics[criterion.metric];
            if (metricValue === undefined) return;
            
            let criterionMet = false;
            
            switch (criterion.operator) {
                case '>=':
                    criterionMet = metricValue >= criterion.value;
                    break;
                case '<=':
                    criterionMet = metricValue <= criterion.value;
                    break;
                case '>':
                    criterionMet = metricValue > criterion.value;
                    break;
                case '<':
                    criterionMet = metricValue < criterion.value;
                    break;
                case '==':
                    criterionMet = metricValue === criterion.value;
                    break;
            }
            
            if (criterionMet) {
                score += 1;
            }
        });
        
        return score;
    }
    
    calculateEngagementScore(profile, sessionMetrics) {
        // Weighted engagement formula
        const weights = {
            sessionLength: 0.3,     // How long they play
            sessionFrequency: 0.25, // How often they play
            progression: 0.2,       // How fast they progress
            retention: 0.15,        // How long they stick around
            social: 0.1            // Social interaction
        };
        
        const metrics = {
            sessionLength: Math.min(sessionMetrics.avgLength / 1800000, 1), // Normalize to 30 min max
            sessionFrequency: Math.min(sessionMetrics.frequency / 10, 1),   // Normalize to 10 sessions/day max
            progression: Math.min(profile.level / 50, 1),                   // Normalize to level 50 max
            retention: Math.min((Date.now() - profile.createdAt) / (30 * 24 * 60 * 60 * 1000), 1), // 30 days max
            social: Math.min(this.calculateSocialEngagement(profile), 1)
        };
        
        return Object.entries(weights).reduce((score, [metric, weight]) => {
            return score + (metrics[metric] * weight);
        }, 0);
    }
    
    calculateSessionMetrics() {
        // Mock implementation - in production, get from analytics
        const sessions = this.getRecentSessions();
        
        if (sessions.length === 0) {
            return { avgLength: 0, frequency: 0, trend: 0 };
        }
        
        const avgLength = sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length;
        const frequency = sessions.length / 7; // Sessions per day over last week
        
        // Calculate trend (positive = increasing, negative = decreasing)
        const recentAvg = sessions.slice(-3).reduce((sum, s) => sum + s.duration, 0) / Math.min(3, sessions.length);
        const olderAvg = sessions.slice(0, -3).reduce((sum, s) => sum + s.duration, 0) / Math.max(1, sessions.length - 3);
        const trend = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
        
        return { avgLength, frequency, trend };
    }
    
    calculateSocialEngagement(profile) {
        let socialScore = 0;
        
        // Clan membership
        if (profile.clanId) socialScore += 0.3;
        
        // Friend connections
        socialScore += Math.min(profile.friendIds.length / 10, 0.3);
        
        // Social sharing
        const shareHistory = this.getShareHistory();
        socialScore += Math.min(shareHistory.length / 20, 0.2);
        
        // Leaderboard participation
        if (profile.bestScore > 0) socialScore += 0.2;
        
        return Math.min(socialScore, 1);
    }
    
    calculatePurchaseFrequency(purchaseHistory) {
        if (purchaseHistory.length < 2) return 0;
        
        const sortedPurchases = purchaseHistory.sort((a, b) => a.timestamp - b.timestamp);
        const timeSpan = sortedPurchases[sortedPurchases.length - 1].timestamp - sortedPurchases[0].timestamp;
        const daySpan = timeSpan / (24 * 60 * 60 * 1000);
        
        return daySpan > 0 ? purchaseHistory.length / daySpan : 0;
    }
    
    calculateActiveDays(profile) {
        // In production, this would come from analytics
        // For now, estimate based on level and time since install
        const daysSinceInstall = Math.floor((Date.now() - profile.createdAt) / (24 * 60 * 60 * 1000));
        const estimatedActiveDays = Math.min(profile.level * 0.5, daysSinceInstall);
        return Math.max(1, estimatedActiveDays);
    }
    
    updatePlayerSegment(newSegment, metrics) {
        const previousSegment = this.getCurrentSegment();
        
        // Update current segment
        this.segments.set('current', {
            segment: newSegment,
            assignedAt: Date.now(),
            metrics: metrics,
            confidence: this.calculateConfidence(metrics, newSegment)
        });
        
        // Add to history
        if (!this.segmentHistory.has(newSegment)) {
            this.segmentHistory.set(newSegment, []);
        }
        
        this.segmentHistory.get(newSegment).push({
            assignedAt: Date.now(),
            metrics: metrics,
            previousSegment: previousSegment
        });
        
        // Persist changes
        this.saveSegmentData();
        
        // Track segment change
        this.analytics.trackEvent('player_segment_changed', {
            previousSegment,
            newSegment,
            totalSpent: metrics.totalSpent,
            engagementScore: metrics.engagementScore,
            daysActive: metrics.daysActive
        });
        
        // Emit event for other systems
        if (window.GameEventBus) {
            window.GameEventBus.emit('player:segment_changed', {
                previousSegment,
                newSegment,
                metrics
            });
        }
        
        console.log(`🎯 Player segment updated: ${previousSegment} → ${newSegment}`);
    }
    
    calculateConfidence(metrics, segment) {
        const rules = this.segmentationRules[segment];
        if (!rules) return 0;
        
        const score = this.calculateSegmentScore(metrics, rules);
        return Math.min(score / rules.criteria.length, 1);
    }
    
    // Event handlers
    onPurchaseCompleted(data) {
        const { amount, currency } = data;
        
        // Recalculate segment immediately after purchase
        setTimeout(() => {
            this.calculatePlayerSegment();
        }, 1000);
        
        // Track purchase for segment analysis
        this.analytics.trackEvent('segment_purchase', {
            segment: this.getCurrentSegment(),
            amount,
            currency,
            timestamp: Date.now()
        });
    }
    
    onCurrencySpent(data) {
        // Only recalculate for significant spending
        if (data.type === 'gems' && data.amount > 10) {
            setTimeout(() => {
                this.calculatePlayerSegment();
            }, 5000);
        }
    }
    
    recalculateSegments() {
        if (Date.now() - this.lastUpdate < this.updateInterval) {
            return;
        }
        
        console.log('🔄 Recalculating player segments...');
        this.calculatePlayerSegment();
        this.lastUpdate = Date.now();
    }
    
    // Public API
    getCurrentSegment() {
        const current = this.segments.get('current');
        return current ? current.segment : 'minnow';
    }
    
    getSegmentDetails() {
        const current = this.segments.get('current');
        const segmentRules = this.segmentationRules[this.getCurrentSegment()];
        
        return {
            segment: this.getCurrentSegment(),
            assignedAt: current?.assignedAt || Date.now(),
            confidence: current?.confidence || 0,
            description: segmentRules?.description || '',
            targetOffers: segmentRules?.targetOffers || [],
            maxOfferPrice: segmentRules?.maxOfferPrice || 0,
            offerFrequency: segmentRules?.offerFrequency || 'never'
        };
    }
    
    getPersonalizedOffers() {
        const segment = this.getCurrentSegment();
        const rules = this.segmentationRules[segment];
        
        if (!rules) return [];
        
        // Generate offers based on segment
        return this.generateOffersForSegment(segment, rules);
    }
    
    generateOffersForSegment(segment, rules) {
        const offers = [];
        const profile = this.userProfile.getProfile();
        const metrics = this.calculatePlayerMetrics(profile);
        
        // Base offers for segment
        rules.targetOffers.forEach(offerType => {
            const offer = this.createOfferByType(offerType, segment, metrics);
            if (offer) offers.push(offer);
        });
        
        // Personalization based on behavior
        if (metrics.engagementScore > 0.7 && segment === 'minnow') {
            // High engagement minnow - likely to convert
            offers.push(this.createOfferByType('conversion_special', segment, metrics));
        }
        
        if (metrics.daysSinceLastSession > 7) {
            // Comeback offer
            offers.push(this.createOfferByType('welcome_back', segment, metrics));
        }
        
        // Sort by priority and limit
        return offers
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 3); // Max 3 offers
    }
    
    createOfferByType(offerType, segment, metrics) {
        // This would integrate with the monetization system
        // For now, return mock offers
        const offers = {
            'starter_packs': {
                id: 'starter_pack_1',
                title: 'Starter Bundle',
                description: 'Perfect way to begin your journey!',
                price: 2.99,
                currency: 'USD',
                items: ['500 Coins', '50 Gems', '2x XP Boost'],
                priority: 5
            },
            'battle_pass': {
                id: 'battle_pass_current',
                title: 'Premium Battle Pass',
                description: 'Unlock exclusive rewards!',
                price: 4.99,
                currency: 'USD',
                items: ['Premium Track', '50 Tier Skips', 'Exclusive Cosmetics'],
                priority: 8
            },
            'premium_bundles': {
                id: 'whale_bundle_1',
                title: 'Ultimate Value Pack',
                description: 'Maximum value for serious players!',
                price: 49.99,
                currency: 'USD',
                items: ['10,000 Coins', '1,000 Gems', 'VIP Status', 'Exclusive Content'],
                priority: 10
            }
        };
        
        return offers[offerType] || null;
    }
    
    // Analytics methods
    getSegmentAnalytics() {
        return {
            currentSegment: this.getCurrentSegment(),
            segmentHistory: Object.fromEntries(this.segmentHistory),
            segmentationRules: this.segmentationRules,
            lastUpdate: this.lastUpdate
        };
    }
    
    // Data persistence
    saveSegmentData() {
        try {
            localStorage.setItem('playerSegments', JSON.stringify({
                segments: Object.fromEntries(this.segments),
                history: Object.fromEntries(this.segmentHistory)
            }));
        } catch (error) {
            console.error('Failed to save segment data:', error);
        }
    }
    
    loadSegmentHistory() {
        try {
            const saved = localStorage.getItem('playerSegments');
            if (saved) {
                const data = JSON.parse(saved);
                this.segments = new Map(Object.entries(data.segments || {}));
                this.segmentHistory = new Map(Object.entries(data.history || {}));
            }
        } catch (error) {
            console.error('Failed to load segment data:', error);
        }
    }
    
    // Mock data methods (replace with real analytics)
    getPurchaseHistory() {
        const history = localStorage.getItem('purchaseHistory');
        return history ? JSON.parse(history) : [];
    }
    
    getRecentSessions() {
        // Mock recent sessions data
        return [
            { duration: 600000, timestamp: Date.now() - 86400000 },
            { duration: 450000, timestamp: Date.now() - 172800000 },
            { duration: 800000, timestamp: Date.now() - 259200000 }
        ];
    }
    
    getShareHistory() {
        const history = localStorage.getItem('shareHistory');
        return history ? JSON.parse(history) : [];
    }
    
    getTotalAchievements() {
        return 25; // Total available achievements
    }
    
    // Cleanup
    dispose() {
        this.saveSegmentData();
        this.segments.clear();
        this.segmentHistory.clear();
    }
}

// Export for DI container
window.PlayerSegmentationService = PlayerSegmentationService;
export { PlayerSegmentationService };