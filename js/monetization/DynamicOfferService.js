// Dynamic Offer Generation System
// King/Blizzard standard: AI-driven personalized monetization offers

class DynamicOfferService {
    constructor(analyticsService, playerSegmentationService, abTestingService, conversionFunnelService) {
        this.analytics = analyticsService;
        this.segmentation = playerSegmentationService;
        this.abTesting = abTestingService;
        this.funnelService = conversionFunnelService;
        
        // Offer catalog and templates
        this.offerTemplates = new Map();
        this.activeOffers = new Map();
        this.offerHistory = new Map();
        this.personalizedOffers = new Map();
        
        // AI/ML models for offer optimization
        this.behaviorModels = new Map();
        this.conversionProbabilities = new Map();
        
        // Configuration
        this.maxActiveOffers = 3;
        this.offerCooldown = 24 * 60 * 60 * 1000; // 24 hours
        this.contextualTriggers = new Map();
        
        this.initialize();
    }
    
    initialize() {
        this.defineOfferTemplates();
        this.setupContextualTriggers();
        this.loadOfferData();
        this.startOfferEngine();
        
        // Setup event listeners
        if (window.GameEventBus) {
            this.setupEventListeners();
        }
    }
    
    defineOfferTemplates() {
        // Starter Packs - For new players
        this.createOfferTemplate('starter_pack_basic', {
            name: 'Welcome Pack',
            description: 'Perfect start to your journey!',
            category: 'starter',
            basePrice: 2.99,
            items: [
                { type: 'currency', id: 'coins', amount: 500 },
                { type: 'currency', id: 'gems', amount: 50 },
                { type: 'boost', id: 'xp_boost', duration: 3600000 }
            ],
            segments: ['minnow', 'high_potential'],
            triggers: ['first_death', 'tutorial_complete'],
            cooldown: 7 * 24 * 60 * 60 * 1000,
            maxPurchases: 1
        });
        
        // Value Packs - For engaged players
        this.createOfferTemplate('value_pack_medium', {
            name: 'Player\'s Choice Pack',
            description: 'Great value for active players!',
            category: 'value',
            basePrice: 4.99,
            items: [
                { type: 'currency', id: 'coins', amount: 1200 },
                { type: 'currency', id: 'gems', amount: 150 },
                { type: 'cosmetic', id: 'snake_skin', rarity: 'rare' },
                { type: 'boost', id: 'score_boost', duration: 7200000 }
            ],
            segments: ['dolphin', 'whale'],
            triggers: ['high_score', 'session_length_10min', 'daily_return'],
            cooldown: 3 * 24 * 60 * 60 * 1000
        });
        
        // Premium Bundles - For high spenders
        this.createOfferTemplate('premium_bundle', {
            name: 'Elite Gaming Bundle',
            description: 'Ultimate package for serious players!',
            category: 'premium',
            basePrice: 19.99,
            items: [
                { type: 'currency', id: 'coins', amount: 5000 },
                { type: 'currency', id: 'gems', amount: 500 },
                { type: 'subscription', id: 'vip_pass', duration: 30 * 24 * 60 * 60 * 1000 },
                { type: 'cosmetic', id: 'exclusive_skin', rarity: 'legendary' },
                { type: 'boost', id: 'mega_boost', duration: 86400000 }
            ],
            segments: ['whale'],
            triggers: ['whale_behavior', 'high_session_frequency'],
            cooldown: 7 * 24 * 60 * 60 * 1000
        });
        
        // Comeback Offers - For churning players
        this.createOfferTemplate('comeback_special', {
            name: 'Welcome Back!',
            description: 'We missed you! Here\'s something special.',
            category: 'retention',
            basePrice: 1.99,
            items: [
                { type: 'currency', id: 'coins', amount: 800 },
                { type: 'currency', id: 'gems', amount: 100 },
                { type: 'boost', id: 'comeback_boost', duration: 3600000 }
            ],
            segments: ['churn_risk', 'minnow', 'dolphin'],
            triggers: ['return_after_absence'],
            cooldown: 14 * 24 * 60 * 60 * 1000,
            discount: 50
        });
        
        // Competitive Offers - Social motivation
        this.createOfferTemplate('competitive_edge', {
            name: 'Competitive Edge Pack',
            description: 'Climb the leaderboards faster!',
            category: 'competitive',
            basePrice: 7.99,
            items: [
                { type: 'currency', id: 'gems', amount: 300 },
                { type: 'boost', id: 'leaderboard_boost', duration: 7200000 },
                { type: 'cosmetic', id: 'winner_badge', rarity: 'epic' }
            ],
            segments: ['all'],
            triggers: ['leaderboard_viewed', 'friend_high_score'],
            cooldown: 5 * 24 * 60 * 60 * 1000
        });
        
        // Limited Time Offers
        this.createOfferTemplate('flash_sale', {
            name: 'Flash Sale - 70% Off!',
            description: 'Limited time mega discount!',
            category: 'flash',
            basePrice: 9.99,
            salePrice: 2.99,
            items: [
                { type: 'currency', id: 'coins', amount: 2500 },
                { type: 'currency', id: 'gems', amount: 250 },
                { type: 'cosmetic', id: 'flash_skin', rarity: 'epic' }
            ],
            segments: ['all'],
            triggers: ['manual'],
            duration: 2 * 60 * 60 * 1000, // 2 hours
            urgency: true
        });
    }
    
    createOfferTemplate(templateId, config) {
        const template = {
            id: templateId,
            ...config,
            createdAt: Date.now(),
            performance: {
                impressions: 0,
                clicks: 0,
                purchases: 0,
                revenue: 0,
                ctr: 0,
                conversionRate: 0,
                rpu: 0
            }
        };
        
        this.offerTemplates.set(templateId, template);
        return template;
    }
    
    setupContextualTriggers() {
        // Define when offers should be triggered
        this.contextualTriggers.set('first_death', {
            event: 'game:end',
            condition: (data) => this.isFirstDeath(data),
            offers: ['starter_pack_basic']
        });
        
        this.contextualTriggers.set('high_score', {
            event: 'score:high_score',
            condition: (data) => data.score > this.getPlayerAverageScore() * 1.5,
            offers: ['value_pack_medium', 'competitive_edge']
        });
        
        this.contextualTriggers.set('session_length_10min', {
            event: 'game:end',
            condition: (data) => data.duration > 10 * 60 * 1000,
            offers: ['value_pack_medium']
        });
        
        this.contextualTriggers.set('daily_return', {
            event: 'game:start',
            condition: (data) => this.isDailyReturn(),
            offers: ['value_pack_medium']
        });
        
        this.contextualTriggers.set('whale_behavior', {
            event: 'player:segment_changed',
            condition: (data) => data.newSegment === 'whale',
            offers: ['premium_bundle']
        });
        
        this.contextualTriggers.set('return_after_absence', {
            event: 'game:start',
            condition: (data) => this.isReturnAfterAbsence(),
            offers: ['comeback_special']
        });
        
        this.contextualTriggers.set('leaderboard_viewed', {
            event: 'social:leaderboard_viewed',
            condition: (data) => this.isPlayerBehindInLeaderboard(),
            offers: ['competitive_edge']
        });
    }
    
    setupEventListeners() {
        const eventBus = window.GameEventBus;
        
        // Core game events
        eventBus.on('game:start', (data) => this.onGameEvent('game:start', data));
        eventBus.on('game:end', (data) => this.onGameEvent('game:end', data));
        eventBus.on('score:high_score', (data) => this.onGameEvent('score:high_score', data));
        
        // Player events
        eventBus.on('player:segment_changed', (data) => this.onGameEvent('player:segment_changed', data));
        eventBus.on('player:level_up', (data) => this.onGameEvent('player:level_up', data));
        
        // Social events
        eventBus.on('social:leaderboard_viewed', (data) => this.onGameEvent('social:leaderboard_viewed', data));
        eventBus.on('social:friend_high_score', (data) => this.onGameEvent('social:friend_high_score', data));
        
        // Purchase events
        eventBus.on('purchase:completed', (data) => this.onPurchaseCompleted(data));
        eventBus.on('offer:clicked', (data) => this.onOfferClicked(data));
        eventBus.on('offer:dismissed', (data) => this.onOfferDismissed(data));
    }
    
    onGameEvent(eventName, data) {
        // Check all contextual triggers
        this.contextualTriggers.forEach((trigger, triggerId) => {
            if (trigger.event === eventName && trigger.condition(data)) {
                this.triggerOffers(trigger.offers, triggerId, data);
            }
        });
        
        // Update player behavior model
        this.updateBehaviorModel(eventName, data);
    }
    
    triggerOffers(offerTemplateIds, triggerId, eventData) {
        const userId = this.getCurrentUserId();
        const segment = this.segmentation.getCurrentSegment();
        
        offerTemplateIds.forEach(templateId => {
            const template = this.offerTemplates.get(templateId);
            if (!template) return;
            
            // Check segment eligibility
            if (!template.segments.includes('all') && !template.segments.includes(segment)) {
                return;
            }
            
            // Check cooldown
            if (this.isOfferOnCooldown(userId, templateId)) {
                return;
            }
            
            // Check max active offers
            if (this.getActiveOfferCount(userId) >= this.maxActiveOffers) {
                return;
            }
            
            // Generate personalized offer
            const personalizedOffer = this.generatePersonalizedOffer(template, userId, triggerId, eventData);
            if (personalizedOffer) {
                this.activateOffer(personalizedOffer);
            }
        });
    }
    
    generatePersonalizedOffer(template, userId, triggerId, eventData) {
        const segment = this.segmentation.getCurrentSegment();
        const playerMetrics = this.getPlayerMetrics(userId);
        const conversionProbability = this.calculateConversionProbability(template, playerMetrics);
        
        // Personalize pricing based on segment and A/B tests
        const personalizedPrice = this.personalizePrice(template, segment, userId);
        
        // Personalize items based on player preferences
        const personalizedItems = this.personalizeItems(template.items, playerMetrics);
        
        // Calculate urgency and timing
        const urgency = this.calculateOfferUrgency(template, playerMetrics);
        
        const offer = {
            id: this.generateOfferId(),
            templateId: template.id,
            userId,
            name: template.name,
            description: template.description,
            category: template.category,
            originalPrice: template.basePrice,
            price: personalizedPrice,
            discount: this.calculateDiscount(template.basePrice, personalizedPrice),
            items: personalizedItems,
            triggerId,
            triggerData: eventData,
            segment,
            conversionProbability,
            urgency,
            createdAt: Date.now(),
            expiresAt: Date.now() + (template.duration || 24 * 60 * 60 * 1000),
            status: 'pending',
            analytics: {
                impressions: 0,
                clicks: 0,
                purchased: false
            }
        };
        
        return offer;
    }
    
    personalizePrice(template, segment, userId) {
        let price = template.basePrice;
        
        // Apply A/B test pricing if available
        const abConfig = this.abTesting.getExperimentConfig('pricing_optimization', userId);
        if (abConfig && abConfig.priceMultiplier) {
            price *= abConfig.priceMultiplier;
        }
        
        // Segment-based pricing adjustments
        switch (segment) {
            case 'whale':
                price *= 1.2; // Whales can afford premium pricing
                break;
            case 'dolphin':
                price *= 1.0; // Standard pricing
                break;
            case 'minnow':
                price *= 0.8; // Discount for conversion
                break;
            case 'churn_risk':
                price *= 0.6; // Heavy discount for retention
                break;
        }
        
        // Apply template discount
        if (template.discount) {
            price *= (1 - template.discount / 100);
        }
        
        // Round to psychological pricing
        return this.roundToPsychologicalPrice(price);
    }
    
    roundToPsychologicalPrice(price) {
        if (price < 1) return 0.99;
        if (price < 5) return Math.floor(price) + 0.99;
        if (price < 10) return Math.floor(price) + 0.99;
        return Math.floor(price) + 0.99;
    }
    
    personalizeItems(baseItems, playerMetrics) {
        // Clone base items
        const items = JSON.parse(JSON.stringify(baseItems));
        
        // Adjust quantities based on player progress
        items.forEach(item => {
            if (item.type === 'currency') {
                // Scale currency based on player level
                const levelMultiplier = 1 + (playerMetrics.level || 1) * 0.1;
                item.amount = Math.floor(item.amount * levelMultiplier);
            }
        });
        
        // Add contextual items based on recent behavior
        if (playerMetrics.recentDeaths > 5) {
            items.push({
                type: 'boost',
                id: 'extra_life',
                amount: 1,
                description: 'One extra chance!'
            });
        }
        
        return items;
    }
    
    calculateOfferUrgency(template, playerMetrics) {
        let urgencyScore = 0;
        
        // Base urgency from template
        if (template.urgency) urgencyScore += 0.5;
        
        // Player behavior urgency
        if (playerMetrics.daysSinceLastPurchase > 7) urgencyScore += 0.3;
        if (playerMetrics.sessionFrequency < 0.5) urgencyScore += 0.2;
        
        return Math.min(urgencyScore, 1.0);
    }
    
    calculateConversionProbability(template, playerMetrics) {
        // Simple ML model - in production, use more sophisticated algorithms
        let probability = 0.1; // Base 10% chance
        
        // Template performance
        if (template.performance.conversionRate > 0) {
            probability *= (1 + template.performance.conversionRate);
        }
        
        // Player segment factor
        const segment = this.segmentation.getCurrentSegment();
        switch (segment) {
            case 'whale': probability *= 3.0; break;
            case 'dolphin': probability *= 2.0; break;
            case 'high_potential': probability *= 1.5; break;
            case 'minnow': probability *= 0.8; break;
            case 'churn_risk': probability *= 0.5; break;
        }
        
        // Engagement factor
        probability *= (1 + playerMetrics.engagementScore || 0);
        
        // Purchase history factor
        if (playerMetrics.totalPurchases > 0) {
            probability *= (1 + Math.log(playerMetrics.totalPurchases + 1) * 0.2);
        }
        
        return Math.min(probability, 0.95); // Cap at 95%
    }
    
    activateOffer(offer) {
        const userId = offer.userId;
        
        if (!this.activeOffers.has(userId)) {
            this.activeOffers.set(userId, []);
        }
        
        this.activeOffers.get(userId).push(offer);
        offer.status = 'active';
        
        // Track offer creation
        this.analytics.trackEvent('offer_generated', {
            offerId: offer.id,
            templateId: offer.templateId,
            category: offer.category,
            price: offer.price,
            segment: offer.segment,
            conversionProbability: offer.conversionProbability,
            triggerId: offer.triggerId
        });
        
        // Emit offer event for UI
        if (window.GameEventBus) {
            window.GameEventBus.emit('offer:generated', offer);
        }
        
        console.log(`💰 Offer generated: ${offer.name} ($${offer.price}) for ${offer.segment}`);
        
        // Schedule expiration
        setTimeout(() => {
            this.expireOffer(offer.id);
        }, offer.expiresAt - Date.now());
        
        this.persistOfferData();
    }
    
    showOffer(offerId) {
        const offer = this.findOfferById(offerId);
        if (!offer || offer.status !== 'active') return null;
        
        offer.analytics.impressions++;
        offer.status = 'shown';
        
        // Update template performance
        const template = this.offerTemplates.get(offer.templateId);
        if (template) {
            template.performance.impressions++;
        }
        
        // Track impression
        this.analytics.trackEvent('offer_shown', {
            offerId: offer.id,
            templateId: offer.templateId,
            category: offer.category,
            price: offer.price,
            segment: offer.segment
        });
        
        // Emit for funnel tracking
        if (window.GameEventBus) {
            window.GameEventBus.emit('offer:shown', {
                offerId: offer.id,
                experimentId: 'pricing_optimization',
                variant: this.abTesting.assignToExperiment('pricing_optimization')
            });
        }
        
        this.persistOfferData();
        return offer;
    }
    
    onOfferClicked(data) {
        const offer = this.findOfferById(data.offerId);
        if (!offer) return;
        
        offer.analytics.clicks++;
        
        // Update template performance
        const template = this.offerTemplates.get(offer.templateId);
        if (template) {
            template.performance.clicks++;
            template.performance.ctr = template.performance.clicks / template.performance.impressions;
        }
        
        this.analytics.trackEvent('offer_clicked', {
            offerId: offer.id,
            templateId: offer.templateId,
            category: offer.category,
            price: offer.price,
            segment: offer.segment
        });
    }
    
    onPurchaseCompleted(data) {
        if (!data.offerId) return;
        
        const offer = this.findOfferById(data.offerId);
        if (!offer) return;
        
        offer.analytics.purchased = true;
        offer.status = 'purchased';
        
        // Update template performance
        const template = this.offerTemplates.get(offer.templateId);
        if (template) {
            template.performance.purchases++;
            template.performance.revenue += data.amount;
            template.performance.conversionRate = template.performance.purchases / template.performance.impressions;
            template.performance.rpu = template.performance.revenue / template.performance.impressions;
        }
        
        // Add to offer history
        this.addToOfferHistory(offer.userId, offer);
        
        // Set cooldown
        this.setOfferCooldown(offer.userId, offer.templateId);
        
        this.analytics.trackEvent('offer_purchased', {
            offerId: offer.id,
            templateId: offer.templateId,
            category: offer.category,
            price: offer.price,
            amount: data.amount,
            segment: offer.segment
        });
        
        console.log(`💳 Offer purchased: ${offer.name} ($${data.amount})`);
    }
    
    onOfferDismissed(data) {
        const offer = this.findOfferById(data.offerId);
        if (!offer) return;
        
        offer.status = 'dismissed';
        
        this.analytics.trackEvent('offer_dismissed', {
            offerId: offer.id,
            templateId: offer.templateId,
            reason: data.reason || 'user_dismissed'
        });
    }
    
    // Get active offers for user
    getActiveOffersForUser(userId = null) {
        userId = userId || this.getCurrentUserId();
        return this.activeOffers.get(userId) || [];
    }
    
    // Get best offer to show based on context
    getBestOfferToShow(context = {}) {
        const userId = this.getCurrentUserId();
        const activeOffers = this.getActiveOffersForUser(userId);
        
        if (activeOffers.length === 0) return null;
        
        // Sort by conversion probability and urgency
        const sortedOffers = activeOffers
            .filter(offer => offer.status === 'active')
            .sort((a, b) => {
                const scoreA = a.conversionProbability * (1 + a.urgency);
                const scoreB = b.conversionProbability * (1 + b.urgency);
                return scoreB - scoreA;
            });
        
        return sortedOffers[0] || null;
    }
    
    // Manual offer triggers for special events
    triggerManualOffer(templateId, userId = null, customConfig = {}) {
        userId = userId || this.getCurrentUserId();
        const template = this.offerTemplates.get(templateId);
        
        if (!template) {
            console.error(`Offer template '${templateId}' not found`);
            return null;
        }
        
        const offer = this.generatePersonalizedOffer(template, userId, 'manual', customConfig);
        if (offer) {
            // Apply custom configuration
            Object.assign(offer, customConfig);
            this.activateOffer(offer);
            return offer;
        }
        
        return null;
    }
    
    // Utility methods
    findOfferById(offerId) {
        for (const userOffers of this.activeOffers.values()) {
            const offer = userOffers.find(o => o.id === offerId);
            if (offer) return offer;
        }
        return null;
    }
    
    expireOffer(offerId) {
        const offer = this.findOfferById(offerId);
        if (offer && offer.status === 'active') {
            offer.status = 'expired';
            this.analytics.trackEvent('offer_expired', {
                offerId: offer.id,
                templateId: offer.templateId
            });
        }
    }
    
    isOfferOnCooldown(userId, templateId) {
        const key = `${userId}_${templateId}`;
        const cooldownEnd = localStorage.getItem(`offer_cooldown_${key}`);
        return cooldownEnd && Date.now() < parseInt(cooldownEnd);
    }
    
    setOfferCooldown(userId, templateId) {
        const template = this.offerTemplates.get(templateId);
        const cooldown = template?.cooldown || this.offerCooldown;
        const key = `${userId}_${templateId}`;
        localStorage.setItem(`offer_cooldown_${key}`, (Date.now() + cooldown).toString());
    }
    
    getActiveOfferCount(userId) {
        const userOffers = this.activeOffers.get(userId) || [];
        return userOffers.filter(offer => offer.status === 'active').length;
    }
    
    addToOfferHistory(userId, offer) {
        if (!this.offerHistory.has(userId)) {
            this.offerHistory.set(userId, []);
        }
        this.offerHistory.get(userId).push({
            ...offer,
            completedAt: Date.now()
        });
    }
    
    // Behavior analysis helpers
    updateBehaviorModel(eventName, data) {
        const userId = this.getCurrentUserId();
        if (!this.behaviorModels.has(userId)) {
            this.behaviorModels.set(userId, {
                events: [],
                patterns: {},
                lastUpdate: Date.now()
            });
        }
        
        const model = this.behaviorModels.get(userId);
        model.events.push({ event: eventName, data, timestamp: Date.now() });
        
        // Keep only recent events (last 100)
        if (model.events.length > 100) {
            model.events = model.events.slice(-100);
        }
        
        model.lastUpdate = Date.now();
    }
    
    getPlayerMetrics(userId) {
        try {
            const profile = window.DIContainer?.resolve('IUserProfileService')?.getProfile();
            const behaviorModel = this.behaviorModels.get(userId);
            
            return {
                level: profile?.level || 1,
                totalPurchases: profile?.totalPurchases || 0,
                daysSinceLastPurchase: profile?.daysSinceLastPurchase || 999,
                engagementScore: this.segmentation?.calculateEngagementScore?.(profile, {}) || 0,
                sessionFrequency: this.calculateSessionFrequency(behaviorModel),
                recentDeaths: this.countRecentEvents(behaviorModel, 'game:end')
            };
        } catch {
            return {
                level: 1,
                totalPurchases: 0,
                daysSinceLastPurchase: 999,
                engagementScore: 0,
                sessionFrequency: 0,
                recentDeaths: 0
            };
        }
    }
    
    calculateSessionFrequency(behaviorModel) {
        if (!behaviorModel || !behaviorModel.events.length) return 0;
        
        const gameStarts = behaviorModel.events.filter(e => e.event === 'game:start');
        const daySpan = 7; // Last 7 days
        const recentStarts = gameStarts.filter(e => 
            Date.now() - e.timestamp < daySpan * 24 * 60 * 60 * 1000
        );
        
        return recentStarts.length / daySpan;
    }
    
    countRecentEvents(behaviorModel, eventName) {
        if (!behaviorModel || !behaviorModel.events.length) return 0;
        
        const recentEvents = behaviorModel.events.filter(e => 
            e.event === eventName && 
            Date.now() - e.timestamp < 24 * 60 * 60 * 1000
        );
        
        return recentEvents.length;
    }
    
    // Condition helpers
    isFirstDeath(data) {
        const userId = this.getCurrentUserId();
        const history = this.offerHistory.get(userId) || [];
        return history.filter(offer => offer.templateId === 'starter_pack_basic').length === 0;
    }
    
    getPlayerAverageScore() {
        try {
            const profile = window.DIContainer?.resolve('IUserProfileService')?.getProfile();
            return profile?.averageScore || 100;
        } catch {
            return 100;
        }
    }
    
    isDailyReturn() {
        try {
            const profile = window.DIContainer?.resolve('IUserProfileService')?.getProfile();
            const lastLogin = profile?.lastLogin || 0;
            const daysSinceLastLogin = (Date.now() - lastLogin) / (24 * 60 * 60 * 1000);
            return daysSinceLastLogin >= 1 && daysSinceLastLogin <= 2;
        } catch {
            return false;
        }
    }
    
    isReturnAfterAbsence() {
        try {
            const profile = window.DIContainer?.resolve('IUserProfileService')?.getProfile();
            const lastLogin = profile?.lastLogin || 0;
            const daysSinceLastLogin = (Date.now() - lastLogin) / (24 * 60 * 60 * 1000);
            return daysSinceLastLogin >= 3;
        } catch {
            return false;
        }
    }
    
    isPlayerBehindInLeaderboard() {
        // Mock implementation - check if player is below median
        return Math.random() < 0.6; // 60% chance player is behind
    }
    
    calculateDiscount(originalPrice, finalPrice) {
        if (originalPrice <= finalPrice) return 0;
        return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
    }
    
    generateOfferId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    getCurrentUserId() {
        return localStorage.getItem('secure_player_id') || 'anonymous_' + Date.now();
    }
    
    startOfferEngine() {
        // Periodic offer optimization
        setInterval(() => {
            this.optimizeOffers();
            this.cleanupExpiredOffers();
        }, 60 * 60 * 1000); // Every hour
    }
    
    optimizeOffers() {
        // Remove poorly performing offers
        this.activeOffers.forEach((userOffers, userId) => {
            userOffers.forEach(offer => {
                if (offer.status === 'shown' && 
                    Date.now() - offer.createdAt > 60 * 60 * 1000 && // Shown for 1 hour
                    offer.analytics.clicks === 0) {
                    offer.status = 'expired';
                }
            });
        });
    }
    
    cleanupExpiredOffers() {
        this.activeOffers.forEach((userOffers, userId) => {
            const activeOffers = userOffers.filter(offer => 
                offer.status === 'active' || offer.status === 'shown'
            );
            this.activeOffers.set(userId, activeOffers);
        });
    }
    
    // Analytics and reporting
    getOfferPerformanceReport() {
        const report = {
            templates: {},
            overall: {
                totalOffers: 0,
                totalImpressions: 0,
                totalClicks: 0,
                totalPurchases: 0,
                totalRevenue: 0,
                overallCTR: 0,
                overallConversionRate: 0,
                overallRPU: 0
            }
        };
        
        this.offerTemplates.forEach((template, id) => {
            const perf = template.performance;
            report.templates[id] = {
                name: template.name,
                category: template.category,
                ...perf
            };
            
            report.overall.totalOffers++;
            report.overall.totalImpressions += perf.impressions;
            report.overall.totalClicks += perf.clicks;
            report.overall.totalPurchases += perf.purchases;
            report.overall.totalRevenue += perf.revenue;
        });
        
        // Calculate overall metrics
        const overall = report.overall;
        overall.overallCTR = overall.totalImpressions > 0 ? 
            (overall.totalClicks / overall.totalImpressions) * 100 : 0;
        overall.overallConversionRate = overall.totalImpressions > 0 ? 
            (overall.totalPurchases / overall.totalImpressions) * 100 : 0;
        overall.overallRPU = overall.totalImpressions > 0 ? 
            overall.totalRevenue / overall.totalImpressions : 0;
        
        return report;
    }
    
    // Data persistence
    persistOfferData() {
        try {
            const data = {
                activeOffers: Object.fromEntries(this.activeOffers),
                offerHistory: Object.fromEntries(this.offerHistory),
                behaviorModels: Object.fromEntries(this.behaviorModels),
                templatePerformance: Array.from(this.offerTemplates.entries()).map(([id, template]) => [
                    id, { performance: template.performance }
                ])
            };
            localStorage.setItem('dynamic_offers', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to persist offer data:', error);
        }
    }
    
    loadOfferData() {
        try {
            const stored = localStorage.getItem('dynamic_offers');
            if (stored) {
                const data = JSON.parse(stored);
                
                this.activeOffers = new Map(Object.entries(data.activeOffers || {}));
                this.offerHistory = new Map(Object.entries(data.offerHistory || {}));
                this.behaviorModels = new Map(Object.entries(data.behaviorModels || {}));
                
                // Restore template performance
                if (data.templatePerformance) {
                    data.templatePerformance.forEach(([id, templateData]) => {
                        const template = this.offerTemplates.get(id);
                        if (template && templateData.performance) {
                            template.performance = templateData.performance;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load offer data:', error);
        }
    }
    
    // Debug helper
    debugOffers() {
        console.group('💰 Dynamic Offers Debug');
        console.table(this.getOfferPerformanceReport().templates);
        console.log('Active Offers:', Object.fromEntries(this.activeOffers));
        console.groupEnd();
    }
    
    // Cleanup
    dispose() {
        this.persistOfferData();
        this.activeOffers.clear();
        this.offerHistory.clear();
        this.behaviorModels.clear();
    }
}

// Export for DI container
window.DynamicOfferService = DynamicOfferService;
export { DynamicOfferService };