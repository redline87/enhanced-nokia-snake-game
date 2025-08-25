// Cohort-based Retention Analysis Service
// King/Blizzard standard: Advanced cohort analytics for long-term monetization optimization

class CohortRetentionService {
    constructor(analyticsService, playerSegmentationService) {
        this.analytics = analyticsService;
        this.segmentation = playerSegmentationService;
        
        // Cohort data storage
        this.cohorts = new Map();
        this.playerCohortMapping = new Map();
        this.cohortMetrics = new Map();
        
        // Analysis configuration
        this.cohortTypes = ['weekly', 'monthly', 'segment_based', 'feature_based'];
        this.retentionPeriods = [1, 3, 7, 14, 30, 60, 90]; // Days
        this.metricTypes = ['retention', 'revenue', 'engagement', 'ltv'];
        
        this.initialize();
    }
    
    initialize() {
        this.loadCohortData();
        this.initializeCohortTracking();
        this.startCohortAnalysis();
        
        // Setup event listeners
        if (window.GameEventBus) {
            this.setupEventListeners();
        }
    }
    
    setupEventListeners() {
        const eventBus = window.GameEventBus;
        
        // Player lifecycle events
        eventBus.on('player:created', (data) => this.onPlayerCreated(data));
        eventBus.on('player:login', (data) => this.onPlayerLogin(data));
        eventBus.on('player:segment_changed', (data) => this.onSegmentChanged(data));
        
        // Monetization events
        eventBus.on('purchase:completed', (data) => this.onPurchase(data));
        eventBus.on('offer:shown', (data) => this.onOfferShown(data));
        
        // Engagement events
        eventBus.on('game:start', (data) => this.onEngagementEvent('session_start', data));
        eventBus.on('game:end', (data) => this.onEngagementEvent('session_end', data));
        eventBus.on('achievement:unlocked', (data) => this.onEngagementEvent('achievement', data));
    }
    
    initializeCohortTracking() {
        // Create cohort definitions
        this.createCohortDefinitions();
        
        // Assign existing players to cohorts
        this.assignExistingPlayersToCohorts();
        
        // Start periodic cohort updates
        this.startCohortUpdates();
    }
    
    createCohortDefinitions() {
        const now = Date.now();
        
        // Weekly cohorts for the last 12 weeks
        for (let week = 0; week < 12; week++) {
            const weekStart = this.getWeekStart(now - week * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000 - 1;
            
            this.createCohort(`week_${this.formatDate(weekStart)}`, {
                type: 'weekly',
                name: `Week of ${this.formatDate(weekStart)}`,
                startDate: weekStart,
                endDate: weekEnd,
                criteria: {
                    installDateRange: [weekStart, weekEnd]
                }
            });
        }
        
        // Monthly cohorts for the last 6 months
        for (let month = 0; month < 6; month++) {
            const monthStart = this.getMonthStart(now - month * 30 * 24 * 60 * 60 * 1000);
            const monthEnd = monthStart + 30 * 24 * 60 * 60 * 1000 - 1;
            
            this.createCohort(`month_${this.formatDate(monthStart)}`, {
                type: 'monthly',
                name: `Month of ${this.formatDate(monthStart)}`,
                startDate: monthStart,
                endDate: monthEnd,
                criteria: {
                    installDateRange: [monthStart, monthEnd]
                }
            });
        }
        
        // Segment-based cohorts
        ['minnow', 'dolphin', 'whale', 'high_potential'].forEach(segment => {
            this.createCohort(`segment_${segment}`, {
                type: 'segment_based',
                name: `${segment.charAt(0).toUpperCase() + segment.slice(1)} Players`,
                startDate: now - 90 * 24 * 60 * 60 * 1000, // Last 90 days
                endDate: now,
                criteria: {
                    initialSegment: segment
                }
            });
        });
        
        // Feature-based cohorts
        this.createCohort('battle_pass_users', {
            type: 'feature_based',
            name: 'Battle Pass Users',
            startDate: now - 30 * 24 * 60 * 60 * 1000,
            endDate: now,
            criteria: {
                usedFeature: 'battle_pass'
            }
        });
        
        this.createCohort('social_users', {
            type: 'feature_based',
            name: 'Social Feature Users',
            startDate: now - 30 * 24 * 60 * 60 * 1000,
            endDate: now,
            criteria: {
                usedFeature: 'social'
            }
        });
    }
    
    createCohort(cohortId, definition) {
        const cohort = {
            id: cohortId,
            ...definition,
            players: new Set(),
            metrics: {
                retention: new Map(), // Day -> retention rate
                revenue: new Map(),   // Day -> cumulative revenue
                engagement: new Map(), // Day -> engagement metrics
                ltv: new Map()        // Day -> lifetime value
            },
            size: 0,
            createdAt: Date.now()
        };
        
        // Initialize retention periods
        this.retentionPeriods.forEach(day => {
            cohort.metrics.retention.set(day, 0);
            cohort.metrics.revenue.set(day, 0);
            cohort.metrics.engagement.set(day, {});
            cohort.metrics.ltv.set(day, 0);
        });
        
        this.cohorts.set(cohortId, cohort);
        return cohort;
    }
    
    assignExistingPlayersToCohorts() {
        // In production, this would query the user database
        // For now, we'll create mock historical data
        this.createMockHistoricalData();
    }
    
    createMockHistoricalData() {
        const now = Date.now();
        
        // Generate mock players for each weekly cohort
        this.cohorts.forEach((cohort, cohortId) => {
            if (cohort.type === 'weekly') {
                const cohortSize = Math.floor(Math.random() * 500) + 100; // 100-600 players
                
                for (let i = 0; i < cohortSize; i++) {
                    const playerId = `mock_player_${cohortId}_${i}`;
                    const installDate = cohort.startDate + Math.random() * (cohort.endDate - cohort.startDate);
                    
                    this.addPlayerToCohort(playerId, cohortId, {
                        installDate,
                        initialSegment: this.getRandomSegment(),
                        mockPlayer: true
                    });
                    
                    // Generate mock retention data
                    this.generateMockRetentionData(playerId, cohortId, installDate);
                }
            }
        });
    }
    
    generateMockRetentionData(playerId, cohortId, installDate) {
        const cohort = this.cohorts.get(cohortId);
        const now = Date.now();
        
        // Simulate retention curve (decreasing over time)
        let isRetained = true;
        let totalRevenue = 0;
        let sessionCount = 0;
        
        this.retentionPeriods.forEach(day => {
            const checkDate = installDate + day * 24 * 60 * 60 * 1000;
            
            if (checkDate > now) return; // Can't predict future
            
            // Calculate retention probability (decreases over time)
            const baseRetention = 0.8; // 80% base retention
            const decayRate = 0.05; // 5% decay per day
            const retentionProbability = baseRetention * Math.pow(1 - decayRate, day);
            
            if (Math.random() < retentionProbability && isRetained) {
                // Player is retained
                const currentRetention = cohort.metrics.retention.get(day);
                cohort.metrics.retention.set(day, currentRetention + 1);
                
                // Generate mock revenue
                if (Math.random() < 0.1) { // 10% chance of purchase
                    const purchaseAmount = Math.random() * 20 + 1; // $1-21
                    totalRevenue += purchaseAmount;
                }
                
                // Generate mock engagement
                sessionCount += Math.floor(Math.random() * 3) + 1; // 1-3 sessions
                
                // Update cumulative metrics
                const currentRevenue = cohort.metrics.revenue.get(day);
                cohort.metrics.revenue.set(day, currentRevenue + totalRevenue);
                
                const currentLTV = cohort.metrics.ltv.get(day);
                cohort.metrics.ltv.set(day, currentLTV + totalRevenue);
                
                const currentEngagement = cohort.metrics.engagement.get(day);
                cohort.metrics.engagement.set(day, {
                    ...currentEngagement,
                    totalSessions: (currentEngagement.totalSessions || 0) + sessionCount
                });
            } else {
                // Player churned
                isRetained = false;
            }
        });
    }
    
    onPlayerCreated(data) {
        const userId = data.userId || this.getCurrentUserId();
        const installDate = Date.now();
        
        // Assign player to appropriate cohorts
        this.assignPlayerToCohorts(userId, {
            installDate,
            initialSegment: this.segmentation.getCurrentSegment()
        });
    }
    
    assignPlayerToCohorts(userId, playerData) {
        this.cohorts.forEach((cohort, cohortId) => {
            if (this.playerMatchesCohortCriteria(playerData, cohort)) {
                this.addPlayerToCohort(userId, cohortId, playerData);
            }
        });
    }
    
    playerMatchesCohortCriteria(playerData, cohort) {
        const criteria = cohort.criteria;
        
        // Check install date range
        if (criteria.installDateRange) {
            const [start, end] = criteria.installDateRange;
            if (playerData.installDate < start || playerData.installDate > end) {
                return false;
            }
        }
        
        // Check initial segment
        if (criteria.initialSegment) {
            if (playerData.initialSegment !== criteria.initialSegment) {
                return false;
            }
        }
        
        // Check feature usage
        if (criteria.usedFeature) {
            // In production, check if player has used the feature
            return Math.random() < 0.3; // Mock 30% feature adoption
        }
        
        return true;
    }
    
    addPlayerToCohort(userId, cohortId, playerData) {
        const cohort = this.cohorts.get(cohortId);
        if (!cohort) return;
        
        cohort.players.add(userId);
        cohort.size = cohort.players.size;
        
        // Store player-to-cohort mapping
        if (!this.playerCohortMapping.has(userId)) {
            this.playerCohortMapping.set(userId, []);
        }
        this.playerCohortMapping.get(userId).push({
            cohortId,
            joinedAt: Date.now(),
            playerData
        });
        
        console.log(`👥 Player ${userId} added to cohort ${cohort.name}`);
    }
    
    onPlayerLogin(data) {
        const userId = data.userId || this.getCurrentUserId();
        this.updatePlayerRetention(userId);
    }
    
    onSegmentChanged(data) {
        const userId = data.userId || this.getCurrentUserId();
        
        // Update cohort metrics for segment changes
        this.updateCohortMetricsForPlayer(userId, 'segment_change', data);
    }
    
    onPurchase(data) {
        const userId = data.userId || this.getCurrentUserId();
        
        // Update revenue metrics for all cohorts this player belongs to
        this.updateCohortMetricsForPlayer(userId, 'purchase', data);
    }
    
    onOfferShown(data) {
        const userId = this.getCurrentUserId();
        
        // Track offer engagement in cohorts
        this.updateCohortMetricsForPlayer(userId, 'offer_shown', data);
    }
    
    onEngagementEvent(eventType, data) {
        const userId = this.getCurrentUserId();
        
        // Update engagement metrics
        this.updateCohortMetricsForPlayer(userId, 'engagement', {
            eventType,
            ...data
        });
    }
    
    updatePlayerRetention(userId) {
        const playerCohorts = this.playerCohortMapping.get(userId);
        if (!playerCohorts) return;
        
        const now = Date.now();
        
        playerCohorts.forEach(cohortInfo => {
            const cohort = this.cohorts.get(cohortInfo.cohortId);
            if (!cohort) return;
            
            const installDate = cohortInfo.playerData.installDate;
            const daysSinceInstall = Math.floor((now - installDate) / (24 * 60 * 60 * 1000));
            
            // Update retention for relevant periods
            this.retentionPeriods.forEach(day => {
                if (daysSinceInstall >= day) {
                    // Player is retained for this period
                    const currentRetention = cohort.metrics.retention.get(day);
                    // Don't double-count - this is a simple implementation
                    // In production, use more sophisticated tracking
                }
            });
        });
    }
    
    updateCohortMetricsForPlayer(userId, metricType, data) {
        const playerCohorts = this.playerCohortMapping.get(userId);
        if (!playerCohorts) return;
        
        playerCohorts.forEach(cohortInfo => {
            const cohort = this.cohorts.get(cohortInfo.cohortId);
            if (!cohort) return;
            
            const installDate = cohortInfo.playerData.installDate;
            const daysSinceInstall = Math.floor((Date.now() - installDate) / (24 * 60 * 60 * 1000));
            
            // Find the appropriate retention period
            const period = this.retentionPeriods.find(day => daysSinceInstall <= day) || 
                          this.retentionPeriods[this.retentionPeriods.length - 1];
            
            switch (metricType) {
                case 'purchase':
                    this.updateCohortRevenue(cohort, period, data.amount);
                    break;
                case 'engagement':
                    this.updateCohortEngagement(cohort, period, data);
                    break;
                case 'segment_change':
                    this.updateCohortSegmentMetrics(cohort, period, data);
                    break;
            }
        });
    }
    
    updateCohortRevenue(cohort, period, amount) {
        const currentRevenue = cohort.metrics.revenue.get(period);
        cohort.metrics.revenue.set(period, currentRevenue + amount);
        
        // Update LTV as well
        const currentLTV = cohort.metrics.ltv.get(period);
        cohort.metrics.ltv.set(period, currentLTV + amount);
    }
    
    updateCohortEngagement(cohort, period, data) {
        const currentEngagement = cohort.metrics.engagement.get(period);
        const updatedEngagement = {
            ...currentEngagement,
            totalEvents: (currentEngagement.totalEvents || 0) + 1
        };
        
        if (data.eventType === 'session_start') {
            updatedEngagement.totalSessions = (currentEngagement.totalSessions || 0) + 1;
        }
        
        cohort.metrics.engagement.set(period, updatedEngagement);
    }
    
    updateCohortSegmentMetrics(cohort, period, data) {
        // Track segment evolution within cohorts
        const engagementData = cohort.metrics.engagement.get(period);
        if (!engagementData.segmentChanges) {
            engagementData.segmentChanges = {};
        }
        
        const changeKey = `${data.previousSegment}_to_${data.newSegment}`;
        engagementData.segmentChanges[changeKey] = 
            (engagementData.segmentChanges[changeKey] || 0) + 1;
        
        cohort.metrics.engagement.set(period, engagementData);
    }
    
    startCohortAnalysis() {
        // Update cohort metrics periodically
        setInterval(() => {
            this.calculateCohortMetrics();
            this.identifyRetentionInsights();
        }, 60 * 60 * 1000); // Every hour
        
        // Daily cohort report
        setInterval(() => {
            this.generateCohortReport();
        }, 24 * 60 * 60 * 1000); // Daily
    }
    
    startCohortUpdates() {
        // Recalculate cohort metrics daily
        setInterval(() => {
            this.recalculateCohortMetrics();
        }, 24 * 60 * 60 * 1000);
    }
    
    calculateCohortMetrics() {
        this.cohorts.forEach((cohort, cohortId) => {
            this.calculateRetentionRates(cohort);
            this.calculateRevenueMetrics(cohort);
            this.calculateEngagementMetrics(cohort);
            this.calculateLTVMetrics(cohort);
        });
    }
    
    calculateRetentionRates(cohort) {
        if (cohort.size === 0) return;
        
        this.retentionPeriods.forEach(day => {
            const retainedCount = cohort.metrics.retention.get(day);
            const retentionRate = (retainedCount / cohort.size) * 100;
            cohort.metrics.retention.set(day, retentionRate);
        });
    }
    
    calculateRevenueMetrics(cohort) {
        if (cohort.size === 0) return;
        
        this.retentionPeriods.forEach(day => {
            const totalRevenue = cohort.metrics.revenue.get(day);
            const arpu = totalRevenue / cohort.size;
            
            // Store ARPU alongside total revenue
            const revenueData = {
                total: totalRevenue,
                arpu: arpu,
                arppu: this.calculateARPPU(cohort, day)
            };
            
            cohort.metrics.revenue.set(day, revenueData);
        });
    }
    
    calculateARPPU(cohort, day) {
        // Calculate ARPPU (Average Revenue Per Paying User)
        const payingUsers = Math.floor(cohort.size * 0.15); // Assume 15% conversion
        const totalRevenue = typeof cohort.metrics.revenue.get(day) === 'object' 
            ? cohort.metrics.revenue.get(day).total 
            : cohort.metrics.revenue.get(day);
        
        return payingUsers > 0 ? totalRevenue / payingUsers : 0;
    }
    
    calculateEngagementMetrics(cohort) {
        this.retentionPeriods.forEach(day => {
            const engagementData = cohort.metrics.engagement.get(day);
            const totalSessions = engagementData.totalSessions || 0;
            const totalEvents = engagementData.totalEvents || 0;
            
            const enhancedMetrics = {
                ...engagementData,
                averageSessionsPerUser: cohort.size > 0 ? totalSessions / cohort.size : 0,
                averageEventsPerUser: cohort.size > 0 ? totalEvents / cohort.size : 0,
                engagementScore: this.calculateCohortEngagementScore(engagementData, cohort.size)
            };
            
            cohort.metrics.engagement.set(day, enhancedMetrics);
        });
    }
    
    calculateCohortEngagementScore(engagementData, cohortSize) {
        if (cohortSize === 0) return 0;
        
        const sessionsScore = Math.min((engagementData.totalSessions || 0) / cohortSize / 10, 1); // Max 10 sessions per user
        const eventsScore = Math.min((engagementData.totalEvents || 0) / cohortSize / 50, 1); // Max 50 events per user
        
        return (sessionsScore + eventsScore) / 2;
    }
    
    calculateLTVMetrics(cohort) {
        this.retentionPeriods.forEach(day => {
            const totalLTV = cohort.metrics.ltv.get(day);
            const averageLTV = cohort.size > 0 ? totalLTV / cohort.size : 0;
            
            cohort.metrics.ltv.set(day, {
                total: totalLTV,
                average: averageLTV,
                predicted: this.predictCohortLTV(cohort, day)
            });
        });
    }
    
    predictCohortLTV(cohort, currentDay) {
        // Simple LTV prediction based on current trends
        const currentLTV = typeof cohort.metrics.ltv.get(currentDay) === 'object'
            ? cohort.metrics.ltv.get(currentDay).average
            : cohort.metrics.ltv.get(currentDay) / cohort.size;
        
        const retentionRate = cohort.metrics.retention.get(currentDay) / 100;
        const monthlyRetention = Math.pow(retentionRate, 30 / currentDay);
        
        // Predict LTV based on retention curve
        return currentLTV * (1 / (1 - monthlyRetention));
    }
    
    recalculateCohortMetrics() {
        // Recalculate metrics for all cohorts
        this.cohorts.forEach((cohort, cohortId) => {
            if (!cohort.mockPlayer) {
                // For real cohorts, recalculate based on actual player data
                this.updateCohortFromPlayerData(cohort);
            }
        });
    }
    
    updateCohortFromPlayerData(cohort) {
        // In production, this would query actual player behavior data
        // For now, we'll update mock data with some variance
        
        this.retentionPeriods.forEach(day => {
            const currentRetention = cohort.metrics.retention.get(day);
            const variance = (Math.random() - 0.5) * 2; // -1 to +1% variance
            const newRetention = Math.max(0, Math.min(100, currentRetention + variance));
            cohort.metrics.retention.set(day, newRetention);
        });
    }
    
    identifyRetentionInsights() {
        const insights = {
            topPerformingCohorts: this.getTopPerformingCohorts(),
            retentionDropOffs: this.identifyRetentionDropOffs(),
            segmentInsights: this.getSegmentRetentionInsights(),
            revenueInsights: this.getRevenueRetentionInsights()
        };
        
        this.cohortMetrics.set('insights', insights);
        return insights;
    }
    
    getTopPerformingCohorts() {
        const cohortPerformance = Array.from(this.cohorts.entries()).map(([id, cohort]) => {
            const day30Retention = cohort.metrics.retention.get(30) || 0;
            const day30LTV = typeof cohort.metrics.ltv.get(30) === 'object'
                ? cohort.metrics.ltv.get(30).average
                : cohort.metrics.ltv.get(30) / Math.max(cohort.size, 1);
            
            return {
                id,
                name: cohort.name,
                type: cohort.type,
                retention30: day30Retention,
                ltv30: day30LTV,
                score: day30Retention * day30LTV // Combined score
            };
        });
        
        return cohortPerformance
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }
    
    identifyRetentionDropOffs() {
        const dropOffs = [];
        
        this.cohorts.forEach((cohort, cohortId) => {
            for (let i = 1; i < this.retentionPeriods.length; i++) {
                const prevDay = this.retentionPeriods[i - 1];
                const currentDay = this.retentionPeriods[i];
                
                const prevRetention = cohort.metrics.retention.get(prevDay);
                const currentRetention = cohort.metrics.retention.get(currentDay);
                
                const dropOff = prevRetention - currentRetention;
                
                if (dropOff > 20) { // More than 20% drop
                    dropOffs.push({
                        cohortId,
                        cohortName: cohort.name,
                        period: `Day ${prevDay} to ${currentDay}`,
                        dropOff: dropOff,
                        fromRetention: prevRetention,
                        toRetention: currentRetention
                    });
                }
            }
        });
        
        return dropOffs.sort((a, b) => b.dropOff - a.dropOff);
    }
    
    getSegmentRetentionInsights() {
        const segmentCohorts = Array.from(this.cohorts.values())
            .filter(cohort => cohort.type === 'segment_based');
        
        const insights = {};
        
        segmentCohorts.forEach(cohort => {
            const segment = cohort.criteria.initialSegment;
            insights[segment] = {
                retention7: cohort.metrics.retention.get(7),
                retention30: cohort.metrics.retention.get(30),
                ltv30: typeof cohort.metrics.ltv.get(30) === 'object'
                    ? cohort.metrics.ltv.get(30).average
                    : cohort.metrics.ltv.get(30) / Math.max(cohort.size, 1)
            };
        });
        
        return insights;
    }
    
    getRevenueRetentionInsights() {
        const insights = {
            retentionVsRevenue: this.analyzeRetentionRevenueCorrelation(),
            payingUserRetention: this.analyzePayingUserRetention(),
            revenueByRetentionCohort: this.analyzeRevenueByRetentionCohort()
        };
        
        return insights;
    }
    
    analyzeRetentionRevenueCorrelation() {
        const correlationData = [];
        
        this.cohorts.forEach((cohort, cohortId) => {
            if (cohort.type === 'weekly' && cohort.size > 50) {
                const retention30 = cohort.metrics.retention.get(30);
                const ltv30 = typeof cohort.metrics.ltv.get(30) === 'object'
                    ? cohort.metrics.ltv.get(30).average
                    : cohort.metrics.ltv.get(30) / Math.max(cohort.size, 1);
                
                correlationData.push({
                    cohortId,
                    retention: retention30,
                    ltv: ltv30
                });
            }
        });
        
        return {
            data: correlationData,
            correlation: this.calculateCorrelation(
                correlationData.map(d => d.retention),
                correlationData.map(d => d.ltv)
            )
        };
    }
    
    analyzePayingUserRetention() {
        // Analyze retention specifically for users who made purchases
        return {
            payingUserRetention7: Math.random() * 20 + 60, // Mock: 60-80%
            payingUserRetention30: Math.random() * 15 + 40, // Mock: 40-55%
            freeUserRetention7: Math.random() * 15 + 30, // Mock: 30-45%
            freeUserRetention30: Math.random() * 10 + 15  // Mock: 15-25%
        };
    }
    
    analyzeRevenueByRetentionCohort() {
        return {
            highRetention: { // >50% day 30 retention
                averageLTV: Math.random() * 20 + 25,
                conversionRate: Math.random() * 10 + 20
            },
            mediumRetention: { // 25-50% day 30 retention
                averageLTV: Math.random() * 10 + 10,
                conversionRate: Math.random() * 8 + 12
            },
            lowRetention: { // <25% day 30 retention
                averageLTV: Math.random() * 5 + 2,
                conversionRate: Math.random() * 5 + 3
            }
        };
    }
    
    calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0) return 0;
        
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }
    
    generateCohortReport() {
        const report = {
            generatedAt: Date.now(),
            summary: this.getCohortSummary(),
            retentionAnalysis: this.getRetentionAnalysis(),
            revenueAnalysis: this.getRevenueAnalysis(),
            insights: this.cohortMetrics.get('insights') || {},
            recommendations: this.generateRecommendations()
        };
        
        this.cohortMetrics.set('latest_report', report);
        
        // Track report generation
        this.analytics.trackEvent('cohort_report_generated', {
            cohortsAnalyzed: this.cohorts.size,
            playersTracked: this.getTotalPlayersTracked(),
            reportType: 'daily'
        });
        
        return report;
    }
    
    getCohortSummary() {
        return {
            totalCohorts: this.cohorts.size,
            totalPlayers: this.getTotalPlayersTracked(),
            activeCohorts: Array.from(this.cohorts.values()).filter(c => c.size > 0).length,
            cohortTypes: this.getCohortTypeSummary()
        };
    }
    
    getRetentionAnalysis() {
        const allCohorts = Array.from(this.cohorts.values()).filter(c => c.size > 0);
        
        return {
            averageRetention: this.calculateAverageRetention(allCohorts),
            retentionByType: this.getRetentionByType(),
            retentionTrends: this.getRetentionTrends(),
            benchmarks: this.getRetentionBenchmarks()
        };
    }
    
    getRevenueAnalysis() {
        return {
            revenueByRetentionDay: this.getRevenueByRetentionDay(),
            ltvProgression: this.getLTVProgression(),
            monetizationByRetention: this.getMonetizationByRetention()
        };
    }
    
    generateRecommendations() {
        const recommendations = [];
        const insights = this.cohortMetrics.get('insights') || {};
        
        // Retention recommendations
        if (insights.retentionDropOffs && insights.retentionDropOffs.length > 0) {
            const biggestDropOff = insights.retentionDropOffs[0];
            recommendations.push({
                type: 'retention',
                priority: 'high',
                title: 'Address Major Retention Drop-off',
                description: `${biggestDropOff.cohortName} shows ${biggestDropOff.dropOff.toFixed(1)}% retention drop in ${biggestDropOff.period}`,
                action: 'Implement targeted retention campaigns for this period'
            });
        }
        
        // Revenue recommendations
        const topCohort = insights.topPerformingCohorts?.[0];
        if (topCohort) {
            recommendations.push({
                type: 'revenue',
                priority: 'medium',
                title: 'Replicate Top Performing Cohort',
                description: `${topCohort.name} shows exceptional performance (${topCohort.retention30.toFixed(1)}% retention, $${topCohort.ltv30.toFixed(2)} LTV)`,
                action: 'Analyze and replicate the conditions that led to this cohort\'s success'
            });
        }
        
        // Segment recommendations
        if (insights.segmentInsights) {
            const bestSegment = Object.entries(insights.segmentInsights)
                .sort(([,a], [,b]) => b.ltv30 - a.ltv30)[0];
            
            if (bestSegment) {
                recommendations.push({
                    type: 'segmentation',
                    priority: 'medium',
                    title: 'Focus on High-Value Segment',
                    description: `${bestSegment[0]} segment shows highest LTV ($${bestSegment[1].ltv30.toFixed(2)})`,
                    action: 'Develop targeted acquisition and retention strategies for this segment'
                });
            }
        }
        
        return recommendations;
    }
    
    // Public API methods
    getCohortAnalysis(cohortId) {
        const cohort = this.cohorts.get(cohortId);
        if (!cohort) return null;
        
        return {
            id: cohortId,
            name: cohort.name,
            type: cohort.type,
            size: cohort.size,
            retention: Object.fromEntries(cohort.metrics.retention),
            revenue: Object.fromEntries(cohort.metrics.revenue),
            engagement: Object.fromEntries(cohort.metrics.engagement),
            ltv: Object.fromEntries(cohort.metrics.ltv)
        };
    }
    
    getAllCohortsAnalysis() {
        return Array.from(this.cohorts.keys()).map(cohortId => 
            this.getCohortAnalysis(cohortId)
        );
    }
    
    getRetentionCurve(cohortId) {
        const cohort = this.cohorts.get(cohortId);
        if (!cohort) return null;
        
        return this.retentionPeriods.map(day => ({
            day,
            retention: cohort.metrics.retention.get(day)
        }));
    }
    
    getRevenueCurve(cohortId) {
        const cohort = this.cohorts.get(cohortId);
        if (!cohort) return null;
        
        return this.retentionPeriods.map(day => {
            const revenueData = cohort.metrics.revenue.get(day);
            return {
                day,
                total: typeof revenueData === 'object' ? revenueData.total : revenueData,
                arpu: typeof revenueData === 'object' ? revenueData.arpu : revenueData / cohort.size
            };
        });
    }
    
    compareCohorts(cohortIds) {
        const comparison = {
            cohorts: cohortIds.map(id => this.getCohortAnalysis(id)).filter(Boolean),
            retentionComparison: this.compareRetention(cohortIds),
            revenueComparison: this.compareRevenue(cohortIds),
            insights: this.generateComparisonInsights(cohortIds)
        };
        
        return comparison;
    }
    
    compareRetention(cohortIds) {
        const comparison = {};
        
        this.retentionPeriods.forEach(day => {
            comparison[`day${day}`] = cohortIds.map(id => {
                const cohort = this.cohorts.get(id);
                return {
                    cohortId: id,
                    cohortName: cohort?.name || 'Unknown',
                    retention: cohort?.metrics.retention.get(day) || 0
                };
            });
        });
        
        return comparison;
    }
    
    compareRevenue(cohortIds) {
        const comparison = {};
        
        this.retentionPeriods.forEach(day => {
            comparison[`day${day}`] = cohortIds.map(id => {
                const cohort = this.cohorts.get(id);
                const revenueData = cohort?.metrics.revenue.get(day) || 0;
                const arpu = typeof revenueData === 'object' ? revenueData.arpu : revenueData / Math.max(cohort?.size || 1, 1);
                
                return {
                    cohortId: id,
                    cohortName: cohort?.name || 'Unknown',
                    arpu: arpu
                };
            });
        });
        
        return comparison;
    }
    
    generateComparisonInsights(cohortIds) {
        // Generate insights from cohort comparison
        return {
            bestPerforming: 'TBD', // Would analyze which cohort performs best
            patterns: [], // Would identify patterns in the data
            recommendations: [] // Would provide actionable recommendations
        };
    }
    
    // Utility methods
    getCurrentUserId() {
        return localStorage.getItem('secure_player_id') || 'anonymous_' + Date.now();
    }
    
    getRandomSegment() {
        const segments = ['minnow', 'dolphin', 'whale', 'high_potential'];
        return segments[Math.floor(Math.random() * segments.length)];
    }
    
    getWeekStart(timestamp) {
        const date = new Date(timestamp);
        const day = date.getDay();
        const diff = date.getDate() - day;
        return new Date(date.setDate(diff)).setHours(0, 0, 0, 0);
    }
    
    getMonthStart(timestamp) {
        const date = new Date(timestamp);
        return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    }
    
    formatDate(timestamp) {
        return new Date(timestamp).toISOString().split('T')[0];
    }
    
    getTotalPlayersTracked() {
        return Array.from(this.cohorts.values()).reduce((sum, cohort) => sum + cohort.size, 0);
    }
    
    getCohortTypeSummary() {
        const summary = {};
        this.cohorts.forEach(cohort => {
            summary[cohort.type] = (summary[cohort.type] || 0) + 1;
        });
        return summary;
    }
    
    calculateAverageRetention(cohorts) {
        const avgRetention = {};
        
        this.retentionPeriods.forEach(day => {
            const validCohorts = cohorts.filter(c => c.metrics.retention.get(day) !== undefined);
            if (validCohorts.length > 0) {
                const totalRetention = validCohorts.reduce((sum, cohort) => 
                    sum + cohort.metrics.retention.get(day), 0);
                avgRetention[`day${day}`] = totalRetention / validCohorts.length;
            }
        });
        
        return avgRetention;
    }
    
    getRetentionByType() {
        const retentionByType = {};
        
        this.cohorts.forEach(cohort => {
            if (!retentionByType[cohort.type]) {
                retentionByType[cohort.type] = {};
            }
            
            this.retentionPeriods.forEach(day => {
                if (!retentionByType[cohort.type][`day${day}`]) {
                    retentionByType[cohort.type][`day${day}`] = [];
                }
                retentionByType[cohort.type][`day${day}`].push(cohort.metrics.retention.get(day));
            });
        });
        
        // Calculate averages
        Object.keys(retentionByType).forEach(type => {
            Object.keys(retentionByType[type]).forEach(day => {
                const values = retentionByType[type][day];
                retentionByType[type][day] = values.reduce((a, b) => a + b, 0) / values.length;
            });
        });
        
        return retentionByType;
    }
    
    getRetentionTrends() {
        // Calculate retention trends over time
        return {
            improving: [], // Cohorts with improving retention
            declining: [], // Cohorts with declining retention
            stable: [] // Cohorts with stable retention
        };
    }
    
    getRetentionBenchmarks() {
        return {
            industry: {
                day1: 75,
                day7: 35,
                day30: 15
            },
            target: {
                day1: 80,
                day7: 40,
                day30: 20
            }
        };
    }
    
    getRevenueByRetentionDay() {
        const revenueByDay = {};
        
        this.retentionPeriods.forEach(day => {
            let totalRevenue = 0;
            let totalPlayers = 0;
            
            this.cohorts.forEach(cohort => {
                const revenueData = cohort.metrics.revenue.get(day);
                const revenue = typeof revenueData === 'object' ? revenueData.total : revenueData;
                totalRevenue += revenue;
                totalPlayers += cohort.size;
            });
            
            revenueByDay[`day${day}`] = {
                totalRevenue,
                arpu: totalPlayers > 0 ? totalRevenue / totalPlayers : 0
            };
        });
        
        return revenueByDay;
    }
    
    getLTVProgression() {
        const ltvProgression = {};
        
        this.retentionPeriods.forEach(day => {
            let totalLTV = 0;
            let totalPlayers = 0;
            
            this.cohorts.forEach(cohort => {
                const ltvData = cohort.metrics.ltv.get(day);
                const ltv = typeof ltvData === 'object' ? ltvData.total : ltvData;
                totalLTV += ltv;
                totalPlayers += cohort.size;
            });
            
            ltvProgression[`day${day}`] = totalPlayers > 0 ? totalLTV / totalPlayers : 0;
        });
        
        return ltvProgression;
    }
    
    getMonetizationByRetention() {
        return {
            high_retention: { // >50% day 7 retention
                conversionRate: 25,
                arpu: 15
            },
            medium_retention: { // 25-50% day 7 retention
                conversionRate: 12,
                arpu: 8
            },
            low_retention: { // <25% day 7 retention
                conversionRate: 5,
                arpu: 3
            }
        };
    }
    
    // Data persistence
    persistCohortData() {
        try {
            const data = {
                cohorts: Object.fromEntries(
                    Array.from(this.cohorts.entries()).map(([id, cohort]) => [
                        id,
                        {
                            ...cohort,
                            players: Array.from(cohort.players),
                            metrics: {
                                retention: Object.fromEntries(cohort.metrics.retention),
                                revenue: Object.fromEntries(cohort.metrics.revenue),
                                engagement: Object.fromEntries(cohort.metrics.engagement),
                                ltv: Object.fromEntries(cohort.metrics.ltv)
                            }
                        }
                    ])
                ),
                playerCohortMapping: Object.fromEntries(this.playerCohortMapping),
                cohortMetrics: Object.fromEntries(this.cohortMetrics)
            };
            localStorage.setItem('cohort_retention', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to persist cohort data:', error);
        }
    }
    
    loadCohortData() {
        try {
            const stored = localStorage.getItem('cohort_retention');
            if (stored) {
                const data = JSON.parse(stored);
                
                // Restore cohorts
                if (data.cohorts) {
                    Object.entries(data.cohorts).forEach(([id, cohortData]) => {
                        const cohort = {
                            ...cohortData,
                            players: new Set(cohortData.players),
                            metrics: {
                                retention: new Map(Object.entries(cohortData.metrics.retention)),
                                revenue: new Map(Object.entries(cohortData.metrics.revenue)),
                                engagement: new Map(Object.entries(cohortData.metrics.engagement)),
                                ltv: new Map(Object.entries(cohortData.metrics.ltv))
                            }
                        };
                        this.cohorts.set(id, cohort);
                    });
                }
                
                // Restore mappings
                this.playerCohortMapping = new Map(Object.entries(data.playerCohortMapping || {}));
                this.cohortMetrics = new Map(Object.entries(data.cohortMetrics || {}));
            }
        } catch (error) {
            console.error('Failed to load cohort data:', error);
        }
    }
    
    // Debug helper
    debugCohorts() {
        console.group('👥 Cohort Retention Analysis Debug');
        console.log(`Total Cohorts: ${this.cohorts.size}`);
        console.log(`Players Tracked: ${this.getTotalPlayersTracked()}`);
        
        const latestReport = this.cohortMetrics.get('latest_report');
        if (latestReport) {
            console.table(latestReport.summary);
        }
        
        console.groupEnd();
    }
    
    // Cleanup
    dispose() {
        this.persistCohortData();
        this.cohorts.clear();
        this.playerCohortMapping.clear();
        this.cohortMetrics.clear();
    }
}

// Export for DI container
window.CohortRetentionService = CohortRetentionService;
export { CohortRetentionService };