// Conversion Funnel Analysis System
// King/Blizzard standard: Track user journey from engagement to monetization

class ConversionFunnelService {
    constructor(analyticsService, playerSegmentationService) {
        this.analytics = analyticsService;
        this.segmentation = playerSegmentationService;
        
        // Funnel definitions
        this.funnels = new Map();
        this.userSessions = new Map();
        this.funnelMetrics = new Map();
        
        // Configuration
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.conversionWindow = 24 * 60 * 60 * 1000; // 24 hours
        
        this.initialize();
    }
    
    initialize() {
        this.defineFunnels();
        this.loadFunnelData();
        this.startSessionTracking();
        
        // Listen to game events
        if (window.GameEventBus) {
            this.setupEventListeners();
        }
    }
    
    defineFunnels() {
        // Main monetization funnel
        this.defineFunnel('main_monetization', {
            name: 'Main Monetization Funnel',
            description: 'Track user journey from game start to purchase',
            steps: [
                { id: 'game_start', name: 'Game Started', event: 'game:start' },
                { id: 'first_death', name: 'First Death', event: 'game:end' },
                { id: 'offer_shown', name: 'Offer Displayed', event: 'offer:shown' },
                { id: 'offer_clicked', name: 'Offer Clicked', event: 'offer:clicked' },
                { id: 'purchase_initiated', name: 'Purchase Started', event: 'purchase:initiated' },
                { id: 'purchase_completed', name: 'Purchase Completed', event: 'purchase:completed' }
            ],
            segments: ['all'],
            conversionWindow: this.conversionWindow
        });
        
        // Battle Pass funnel
        this.defineFunnel('battle_pass', {
            name: 'Battle Pass Conversion',
            description: 'Battle Pass purchase journey',
            steps: [
                { id: 'bp_viewed', name: 'Battle Pass Viewed', event: 'battlepass:viewed' },
                { id: 'bp_progress', name: 'Progress Made', event: 'battlepass:xp_gained' },
                { id: 'bp_rewards_seen', name: 'Rewards Previewed', event: 'battlepass:rewards_viewed' },
                { id: 'bp_purchase_intent', name: 'Purchase Clicked', event: 'battlepass:purchase_clicked' },
                { id: 'bp_purchased', name: 'Battle Pass Purchased', event: 'battlepass:purchased' }
            ],
            segments: ['minnow', 'dolphin', 'high_potential'],
            conversionWindow: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Retention to monetization funnel
        this.defineFunnel('retention_monetization', {
            name: 'Retention to Monetization',
            description: 'Long-term player monetization journey',
            steps: [
                { id: 'day1_return', name: 'Day 1 Return', event: 'retention:day1' },
                { id: 'day3_return', name: 'Day 3 Return', event: 'retention:day3' },
                { id: 'day7_return', name: 'Day 7 Return', event: 'retention:day7' },
                { id: 'first_purchase_intent', name: 'First Purchase Intent', event: 'offer:clicked' },
                { id: 'first_purchase', name: 'First Purchase', event: 'purchase:completed' }
            ],
            segments: ['all'],
            conversionWindow: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        
        // Whale development funnel
        this.defineFunnel('whale_development', {
            name: 'Whale Development',
            description: 'Journey from first purchase to whale status',
            steps: [
                { id: 'first_purchase', name: 'First Purchase', event: 'purchase:completed' },
                { id: 'second_purchase', name: 'Second Purchase', event: 'purchase:completed' },
                { id: 'high_value_offer', name: 'High Value Offer Shown', event: 'offer:premium_shown' },
                { id: 'premium_purchase', name: 'Premium Purchase', event: 'purchase:premium' },
                { id: 'whale_status', name: 'Whale Status Achieved', event: 'player:whale_status' }
            ],
            segments: ['dolphin'],
            conversionWindow: 30 * 24 * 60 * 60 * 1000
        });
        
        // Social to monetization funnel
        this.defineFunnel('social_monetization', {
            name: 'Social to Monetization',
            description: 'Social features leading to purchases',
            steps: [
                { id: 'leaderboard_viewed', name: 'Leaderboard Viewed', event: 'social:leaderboard_viewed' },
                { id: 'social_comparison', name: 'Compared with Friends', event: 'social:comparison' },
                { id: 'competitive_offer', name: 'Competitive Offer Shown', event: 'offer:competitive_shown' },
                { id: 'social_purchase', name: 'Social-motivated Purchase', event: 'purchase:social' }
            ],
            segments: ['all'],
            conversionWindow: 3 * 24 * 60 * 60 * 1000 // 3 days
        });
    }
    
    defineFunnel(funnelId, config) {
        const funnel = {
            id: funnelId,
            ...config,
            createdAt: Date.now(),
            metrics: {
                totalSessions: 0,
                conversionsByStep: new Map(),
                conversionRates: new Map(),
                dropOffRates: new Map(),
                timeToConvert: new Map(),
                segmentPerformance: new Map()
            }
        };
        
        // Initialize step metrics
        config.steps.forEach((step, index) => {
            funnel.metrics.conversionsByStep.set(step.id, 0);
            funnel.metrics.conversionRates.set(step.id, 0);
            funnel.metrics.dropOffRates.set(step.id, 0);
            funnel.metrics.timeToConvert.set(step.id, []);
        });
        
        this.funnels.set(funnelId, funnel);
        return funnel;
    }
    
    setupEventListeners() {
        const eventBus = window.GameEventBus;
        
        // Core game events
        eventBus.on('game:start', (data) => this.trackFunnelEvent('game:start', data));
        eventBus.on('game:end', (data) => this.trackFunnelEvent('game:end', data));
        
        // Monetization events
        eventBus.on('offer:shown', (data) => this.trackFunnelEvent('offer:shown', data));
        eventBus.on('offer:clicked', (data) => this.trackFunnelEvent('offer:clicked', data));
        eventBus.on('purchase:initiated', (data) => this.trackFunnelEvent('purchase:initiated', data));
        eventBus.on('purchase:completed', (data) => this.trackFunnelEvent('purchase:completed', data));
        
        // Battle Pass events
        eventBus.on('battlepass:viewed', (data) => this.trackFunnelEvent('battlepass:viewed', data));
        eventBus.on('battlepass:xp_gained', (data) => this.trackFunnelEvent('battlepass:xp_gained', data));
        eventBus.on('battlepass:rewards_viewed', (data) => this.trackFunnelEvent('battlepass:rewards_viewed', data));
        eventBus.on('battlepass:purchase_clicked', (data) => this.trackFunnelEvent('battlepass:purchase_clicked', data));
        eventBus.on('battlepass:purchased', (data) => this.trackFunnelEvent('battlepass:purchased', data));
        
        // Social events
        eventBus.on('social:leaderboard_viewed', (data) => this.trackFunnelEvent('social:leaderboard_viewed', data));
        eventBus.on('social:comparison', (data) => this.trackFunnelEvent('social:comparison', data));
        
        // Player segment changes
        eventBus.on('player:segment_changed', (data) => this.onPlayerSegmentChanged(data));
        eventBus.on('player:whale_status', (data) => this.trackFunnelEvent('player:whale_status', data));
        
        // Retention tracking
        this.trackRetentionEvents();
    }
    
    trackFunnelEvent(eventName, data) {
        const userId = this.getCurrentUserId();
        const timestamp = Date.now();
        const segment = this.segmentation.getCurrentSegment();
        
        // Update user session
        this.updateUserSession(userId, eventName, data, timestamp);
        
        // Check all funnels for this event
        this.funnels.forEach((funnel, funnelId) => {
            const relevantStep = funnel.steps.find(step => step.event === eventName);
            if (!relevantStep) return;
            
            // Check if user segment matches funnel
            if (!funnel.segments.includes('all') && !funnel.segments.includes(segment)) {
                return;
            }
            
            this.processFunnelStep(funnelId, relevantStep.id, userId, timestamp, data);
        });
    }
    
    updateUserSession(userId, eventName, data, timestamp) {
        if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, {
                sessionId: this.generateSessionId(),
                startTime: timestamp,
                lastActivity: timestamp,
                events: [],
                segment: this.segmentation.getCurrentSegment(),
                funnelStates: new Map()
            });
        }
        
        const session = this.userSessions.get(userId);
        
        // Check for session timeout
        if (timestamp - session.lastActivity > this.sessionTimeout) {
            // Start new session
            session.sessionId = this.generateSessionId();
            session.startTime = timestamp;
            session.events = [];
            session.funnelStates.clear();
        }
        
        session.lastActivity = timestamp;
        session.events.push({
            event: eventName,
            data,
            timestamp
        });
    }
    
    processFunnelStep(funnelId, stepId, userId, timestamp, data) {
        const funnel = this.funnels.get(funnelId);
        const session = this.userSessions.get(userId);
        
        if (!session.funnelStates.has(funnelId)) {
            session.funnelStates.set(funnelId, {
                currentStep: 0,
                steps: new Map(),
                startTime: timestamp,
                segment: session.segment
            });
        }
        
        const funnelState = session.funnelStates.get(funnelId);
        const stepIndex = funnel.steps.findIndex(step => step.id === stepId);
        
        if (stepIndex === -1) return;
        
        // Track step completion
        funnelState.steps.set(stepId, {
            timestamp,
            data,
            timeFromStart: timestamp - funnelState.startTime
        });
        
        // Update funnel metrics
        this.updateFunnelMetrics(funnelId, stepId, funnelState, session.segment);
        
        // Check if this completes the funnel
        if (stepIndex === funnel.steps.length - 1) {
            this.completeFunnel(funnelId, userId, funnelState);
        }
    }
    
    updateFunnelMetrics(funnelId, stepId, funnelState, segment) {
        const funnel = this.funnels.get(funnelId);
        const metrics = funnel.metrics;
        
        // Increment step completion
        const currentCount = metrics.conversionsByStep.get(stepId);
        metrics.conversionsByStep.set(stepId, currentCount + 1);
        
        // Update segment performance
        if (!metrics.segmentPerformance.has(segment)) {
            metrics.segmentPerformance.set(segment, new Map());
        }
        const segmentMetrics = metrics.segmentPerformance.get(segment);
        const segmentCount = segmentMetrics.get(stepId) || 0;
        segmentMetrics.set(stepId, segmentCount + 1);
        
        // Calculate time to convert for this step
        const stepCompletion = funnelState.steps.get(stepId);
        if (stepCompletion) {
            const timeArray = metrics.timeToConvert.get(stepId);
            timeArray.push(stepCompletion.timeFromStart);
        }
        
        // Recalculate conversion rates
        this.calculateConversionRates(funnelId);
    }
    
    calculateConversionRates(funnelId) {
        const funnel = this.funnels.get(funnelId);
        const metrics = funnel.metrics;
        const steps = funnel.steps;
        
        let previousStepCount = metrics.totalSessions;
        
        steps.forEach((step, index) => {
            const stepCount = metrics.conversionsByStep.get(step.id);
            
            if (index === 0) {
                // First step conversion rate is always 100% of those who started
                metrics.conversionRates.set(step.id, previousStepCount > 0 ? 100 : 0);
                metrics.dropOffRates.set(step.id, 0);
            } else {
                // Calculate conversion rate from previous step
                const conversionRate = previousStepCount > 0 ? (stepCount / previousStepCount) * 100 : 0;
                const dropOffRate = 100 - conversionRate;
                
                metrics.conversionRates.set(step.id, conversionRate);
                metrics.dropOffRates.set(step.id, dropOffRate);
            }
            
            previousStepCount = stepCount;
        });
    }
    
    completeFunnel(funnelId, userId, funnelState) {
        const funnel = this.funnels.get(funnelId);
        const totalTime = Date.now() - funnelState.startTime;
        
        // Track funnel completion
        this.analytics.trackEvent('funnel_completed', {
            funnelId,
            funnelName: funnel.name,
            userId,
            segment: funnelState.segment,
            totalTime,
            steps: Object.fromEntries(funnelState.steps)
        });
        
        console.log(`🎯 Funnel completed: ${funnel.name} (${totalTime}ms)`);
    }
    
    // Get funnel analysis for dashboard
    getFunnelAnalysis(funnelId, dateRange = null) {
        const funnel = this.funnels.get(funnelId);
        if (!funnel) return null;
        
        const metrics = funnel.metrics;
        const analysis = {
            id: funnelId,
            name: funnel.name,
            description: funnel.description,
            steps: [],
            overallConversionRate: 0,
            totalUsers: metrics.totalSessions,
            segmentBreakdown: {}
        };
        
        // Build step analysis
        let previousCount = metrics.totalSessions;
        funnel.steps.forEach((step, index) => {
            const stepCount = metrics.conversionsByStep.get(step.id);
            const conversionRate = metrics.conversionRates.get(step.id);
            const dropOffRate = metrics.dropOffRates.get(step.id);
            const timesToConvert = metrics.timeToConvert.get(step.id);
            
            analysis.steps.push({
                id: step.id,
                name: step.name,
                order: index + 1,
                users: stepCount,
                conversionRate: parseFloat(conversionRate.toFixed(2)),
                dropOffRate: parseFloat(dropOffRate.toFixed(2)),
                averageTime: this.calculateAverageTime(timesToConvert),
                medianTime: this.calculateMedianTime(timesToConvert)
            });
            
            previousCount = stepCount;
        });
        
        // Overall conversion rate (first step to last step)
        if (funnel.steps.length > 0) {
            const firstStep = funnel.steps[0].id;
            const lastStep = funnel.steps[funnel.steps.length - 1].id;
            const firstStepCount = metrics.conversionsByStep.get(firstStep);
            const lastStepCount = metrics.conversionsByStep.get(lastStep);
            
            analysis.overallConversionRate = firstStepCount > 0 ? 
                parseFloat(((lastStepCount / firstStepCount) * 100).toFixed(2)) : 0;
        }
        
        // Segment breakdown
        metrics.segmentPerformance.forEach((segmentData, segment) => {
            analysis.segmentBreakdown[segment] = this.calculateSegmentAnalysis(segmentData, funnel);
        });
        
        return analysis;
    }
    
    calculateSegmentAnalysis(segmentData, funnel) {
        const segmentAnalysis = {
            steps: {},
            overallConversion: 0
        };
        
        let firstStepCount = 0;
        let lastStepCount = 0;
        
        funnel.steps.forEach((step, index) => {
            const count = segmentData.get(step.id) || 0;
            segmentAnalysis.steps[step.id] = count;
            
            if (index === 0) firstStepCount = count;
            if (index === funnel.steps.length - 1) lastStepCount = count;
        });
        
        segmentAnalysis.overallConversion = firstStepCount > 0 ? 
            parseFloat(((lastStepCount / firstStepCount) * 100).toFixed(2)) : 0;
        
        return segmentAnalysis;
    }
    
    calculateAverageTime(timeArray) {
        if (!timeArray || timeArray.length === 0) return 0;
        const sum = timeArray.reduce((a, b) => a + b, 0);
        return Math.round(sum / timeArray.length);
    }
    
    calculateMedianTime(timeArray) {
        if (!timeArray || timeArray.length === 0) return 0;
        const sorted = [...timeArray].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? 
            Math.round((sorted[mid - 1] + sorted[mid]) / 2) : 
            sorted[mid];
    }
    
    // Get all funnel analyses
    getAllFunnelAnalyses() {
        return Array.from(this.funnels.keys()).map(funnelId => 
            this.getFunnelAnalysis(funnelId)
        );
    }
    
    // Track retention events (synthetic events for funnel tracking)
    trackRetentionEvents() {
        const checkRetention = () => {
            const userId = this.getCurrentUserId();
            const profile = this.getPlayerProfile();
            
            if (!profile || !profile.createdAt) return;
            
            const daysSinceInstall = Math.floor((Date.now() - profile.createdAt) / (24 * 60 * 60 * 1000));
            const lastLogin = profile.lastLogin || profile.createdAt;
            const daysSinceLastLogin = Math.floor((Date.now() - lastLogin) / (24 * 60 * 60 * 1000));
            
            // Emit retention events based on login pattern
            if (daysSinceInstall >= 1 && daysSinceLastLogin < 2) {
                this.trackFunnelEvent('retention:day1', { daysSinceInstall });
            }
            if (daysSinceInstall >= 3 && daysSinceLastLogin < 2) {
                this.trackFunnelEvent('retention:day3', { daysSinceInstall });
            }
            if (daysSinceInstall >= 7 && daysSinceLastLogin < 2) {
                this.trackFunnelEvent('retention:day7', { daysSinceInstall });
            }
        };
        
        // Check retention on app start and periodically
        setTimeout(checkRetention, 5000);
        setInterval(checkRetention, 60 * 60 * 1000); // Every hour
    }
    
    // Event handlers
    onPlayerSegmentChanged(data) {
        const userId = this.getCurrentUserId();
        const session = this.userSessions.get(userId);
        
        if (session) {
            session.segment = data.newSegment;
            
            // Update all active funnel states
            session.funnelStates.forEach(funnelState => {
                funnelState.segment = data.newSegment;
            });
        }
    }
    
    startSessionTracking() {
        // Track new sessions
        this.funnels.forEach(funnel => {
            funnel.metrics.totalSessions = this.userSessions.size;
        });
        
        // Periodic cleanup of old sessions
        setInterval(() => {
            const now = Date.now();
            this.userSessions.forEach((session, userId) => {
                if (now - session.lastActivity > 24 * 60 * 60 * 1000) { // 24 hours
                    this.userSessions.delete(userId);
                }
            });
        }, 60 * 60 * 1000); // Clean up every hour
    }
    
    // Utility methods
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    getCurrentUserId() {
        return localStorage.getItem('secure_player_id') || 'anonymous_' + Date.now();
    }
    
    getPlayerProfile() {
        try {
            return window.DIContainer?.resolve('IUserProfileService')?.getProfile();
        } catch {
            return null;
        }
    }
    
    // Data persistence
    persistFunnelData() {
        try {
            const data = {
                funnels: Object.fromEntries(this.funnels),
                sessions: Object.fromEntries(this.userSessions),
                lastUpdate: Date.now()
            };
            localStorage.setItem('conversion_funnels', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to persist funnel data:', error);
        }
    }
    
    loadFunnelData() {
        try {
            const stored = localStorage.getItem('conversion_funnels');
            if (stored) {
                const data = JSON.parse(stored);
                
                // Restore funnel metrics (but not definitions - they're dynamic)
                if (data.funnels) {
                    Object.entries(data.funnels).forEach(([funnelId, funnelData]) => {
                        if (this.funnels.has(funnelId)) {
                            this.funnels.get(funnelId).metrics = funnelData.metrics;
                        }
                    });
                }
                
                // Restore recent sessions
                if (data.sessions) {
                    const recentSessions = Object.entries(data.sessions).filter(
                        ([, session]) => Date.now() - session.lastActivity < 24 * 60 * 60 * 1000
                    );
                    this.userSessions = new Map(recentSessions);
                }
            }
        } catch (error) {
            console.error('Failed to load funnel data:', error);
        }
    }
    
    // Debug helper
    debugFunnels() {
        console.group('🔄 Conversion Funnels Debug');
        this.funnels.forEach((funnel, id) => {
            console.log(`\n${funnel.name}:`);
            console.table(this.getFunnelAnalysis(id));
        });
        console.groupEnd();
    }
    
    // Cleanup
    dispose() {
        this.persistFunnelData();
        this.funnels.clear();
        this.userSessions.clear();
    }
}

// Export for DI container
window.ConversionFunnelService = ConversionFunnelService;
export { ConversionFunnelService };