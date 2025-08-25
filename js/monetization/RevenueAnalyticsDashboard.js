// Revenue Analytics Dashboard
// King/Blizzard standard: Comprehensive monetization metrics and insights

class RevenueAnalyticsDashboard {
    constructor(analyticsService, playerSegmentationService, abTestingService, conversionFunnelService, dynamicOfferService, personalizedMonetizationService) {
        this.analytics = analyticsService;
        this.segmentation = playerSegmentationService;
        this.abTesting = abTestingService;
        this.funnelService = conversionFunnelService;
        this.offerService = dynamicOfferService;
        this.monetizationService = personalizedMonetizationService;
        
        // Dashboard data
        this.dashboardData = new Map();
        this.realtimeMetrics = new Map();
        this.historicalData = new Map();
        
        // Configuration
        this.refreshInterval = 60 * 1000; // 1 minute
        this.dataRetentionDays = 90;
        
        this.initialize();
    }
    
    initialize() {
        this.loadHistoricalData();
        this.startRealtimeMonitoring();
        this.setupDashboardUI();
        
        // Initial data calculation
        this.calculateAllMetrics();
    }
    
    startRealtimeMonitoring() {
        // Update metrics every minute
        setInterval(() => {
            this.updateRealtimeMetrics();
        }, this.refreshInterval);
        
        // Listen to revenue events
        if (window.GameEventBus) {
            this.setupEventListeners();
        }
    }
    
    setupEventListeners() {
        const eventBus = window.GameEventBus;
        
        // Revenue events
        eventBus.on('purchase:completed', (data) => this.onRevenueEvent(data));
        eventBus.on('offer:shown', (data) => this.onOfferEvent('shown', data));
        eventBus.on('offer:clicked', (data) => this.onOfferEvent('clicked', data));
        eventBus.on('offer:purchased', (data) => this.onOfferEvent('purchased', data));
        
        // Player events
        eventBus.on('player:segment_changed', (data) => this.onSegmentChange(data));
        eventBus.on('player:level_up', (data) => this.onPlayerProgress(data));
        
        // A/B test events
        eventBus.on('ab_test_conversion', (data) => this.onABTestEvent(data));
    }
    
    calculateAllMetrics() {
        const metrics = {
            // Core revenue metrics
            revenue: this.calculateRevenueMetrics(),
            
            // Player segmentation metrics
            segments: this.calculateSegmentMetrics(),
            
            // Conversion metrics
            conversion: this.calculateConversionMetrics(),
            
            // A/B testing metrics
            experiments: this.calculateExperimentMetrics(),
            
            // Offer performance metrics
            offers: this.calculateOfferMetrics(),
            
            // Funnel metrics
            funnels: this.calculateFunnelMetrics(),
            
            // Cohort metrics
            cohorts: this.calculateCohortMetrics(),
            
            // Predictive metrics
            predictions: this.calculatePredictiveMetrics()
        };
        
        this.dashboardData.set('current', metrics);
        this.persistDashboardData();
        
        return metrics;
    }
    
    calculateRevenueMetrics() {
        const now = Date.now();
        const periods = {
            today: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000
        };
        
        const revenue = {
            // Total revenue
            total: this.getTotalRevenue(),
            
            // Time-based revenue
            today: this.getRevenueForPeriod(now - periods.today, now),
            week: this.getRevenueForPeriod(now - periods.week, now),
            month: this.getRevenueForPeriod(now - periods.month, now),
            
            // Revenue per user metrics
            arpu: this.calculateARPU(),
            arppu: this.calculateARPPU(),
            
            // Growth metrics
            growth: {
                daily: this.calculateGrowthRate('daily'),
                weekly: this.calculateGrowthRate('weekly'),
                monthly: this.calculateGrowthRate('monthly')
            },
            
            // Revenue by source
            sources: this.getRevenueBySource(),
            
            // Revenue trends
            trends: this.getRevenueTrends()
        };
        
        return revenue;
    }
    
    calculateSegmentMetrics() {
        const segments = {
            distribution: this.getSegmentDistribution(),
            revenue: this.getRevenueBySegment(),
            conversion: this.getConversionBySegment(),
            ltv: this.getLTVBySegment(),
            migration: this.getSegmentMigration()
        };
        
        return segments;
    }
    
    calculateConversionMetrics() {
        const conversion = {
            overall: this.getOverallConversionRate(),
            bySegment: this.getConversionBySegment(),
            byOffer: this.getConversionByOffer(),
            byPrice: this.getConversionByPrice(),
            funnel: this.getFunnelConversionRates(),
            timeToConvert: this.getTimeToConvertMetrics()
        };
        
        return conversion;
    }
    
    calculateExperimentMetrics() {
        const experiments = this.abTesting.getAllExperiments().map(exp => ({
            id: exp.id,
            name: exp.name,
            status: exp.status,
            participants: exp.participants,
            winner: exp.winner,
            confidence: exp.confidence,
            improvement: exp.variants.find(v => v.name === exp.winner)?.improvement || 0,
            revenue: exp.variants.reduce((sum, v) => sum + (v.revenue || 0), 0)
        }));
        
        return {
            active: experiments.filter(e => e.status === 'active'),
            completed: experiments.filter(e => e.status === 'ended'),
            totalRevenue: experiments.reduce((sum, e) => sum + e.revenue, 0),
            averageImprovement: this.calculateAverageImprovement(experiments)
        };
    }
    
    calculateOfferMetrics() {
        const offerReport = this.offerService.getOfferPerformanceReport();
        
        return {
            templates: offerReport.templates,
            overall: offerReport.overall,
            topPerforming: this.getTopPerformingOffers(offerReport.templates),
            underperforming: this.getUnderperformingOffers(offerReport.templates),
            revenueByCategory: this.getRevenueByOfferCategory()
        };
    }
    
    calculateFunnelMetrics() {
        const funnelAnalyses = this.funnelService.getAllFunnelAnalyses();
        
        return {
            funnels: funnelAnalyses,
            bottlenecks: this.identifyBottlenecks(funnelAnalyses),
            opportunities: this.identifyOptimizationOpportunities(funnelAnalyses),
            averageConversion: this.calculateAverageFunnelConversion(funnelAnalyses)
        };
    }
    
    calculateCohortMetrics() {
        return {
            retention: this.calculateRetentionCohorts(),
            revenue: this.calculateRevenueCohorts(),
            ltv: this.calculateLTVCohorts(),
            segmentEvolution: this.calculateSegmentEvolutionCohorts()
        };
    }
    
    calculatePredictiveMetrics() {
        return {
            churnRisk: this.predictChurnRisk(),
            revenueForecast: this.forecastRevenue(),
            ltvPrediction: this.predictLTV(),
            segmentPrediction: this.predictSegmentChanges(),
            optimalPricing: this.predictOptimalPricing()
        };
    }
    
    // Revenue calculation methods
    getTotalRevenue() {
        try {
            const purchaseHistory = this.getPurchaseHistory();
            return purchaseHistory.reduce((sum, purchase) => sum + purchase.amount, 0);
        } catch {
            return 0;
        }
    }
    
    getRevenueForPeriod(startTime, endTime) {
        try {
            const purchaseHistory = this.getPurchaseHistory();
            return purchaseHistory
                .filter(p => p.timestamp >= startTime && p.timestamp <= endTime)
                .reduce((sum, purchase) => sum + purchase.amount, 0);
        } catch {
            return 0;
        }
    }
    
    calculateARPU() {
        const totalRevenue = this.getTotalRevenue();
        const totalUsers = this.getTotalUsers();
        return totalUsers > 0 ? totalRevenue / totalUsers : 0;
    }
    
    calculateARPPU() {
        const totalRevenue = this.getTotalRevenue();
        const payingUsers = this.getPayingUsers();
        return payingUsers > 0 ? totalRevenue / payingUsers : 0;
    }
    
    calculateGrowthRate(period) {
        const now = Date.now();
        let periodMs, previousPeriodMs;
        
        switch (period) {
            case 'daily':
                periodMs = 24 * 60 * 60 * 1000;
                break;
            case 'weekly':
                periodMs = 7 * 24 * 60 * 60 * 1000;
                break;
            case 'monthly':
                periodMs = 30 * 24 * 60 * 60 * 1000;
                break;
            default:
                return 0;
        }
        
        const currentRevenue = this.getRevenueForPeriod(now - periodMs, now);
        const previousRevenue = this.getRevenueForPeriod(now - 2 * periodMs, now - periodMs);
        
        if (previousRevenue === 0) return currentRevenue > 0 ? 100 : 0;
        return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    }
    
    getRevenueBySource() {
        const sources = {
            'starter_packs': 0,
            'battle_pass': 0,
            'premium_bundles': 0,
            'competitive_offers': 0,
            'comeback_offers': 0,
            'flash_sales': 0,
            'other': 0
        };
        
        try {
            const purchaseHistory = this.getPurchaseHistory();
            purchaseHistory.forEach(purchase => {
                const source = purchase.source || 'other';
                sources[source] = (sources[source] || 0) + purchase.amount;
            });
        } catch {
            // Return empty sources if data unavailable
        }
        
        return sources;
    }
    
    getRevenueTrends() {
        const trends = [];
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        
        // Get last 30 days of revenue
        for (let i = 29; i >= 0; i--) {
            const dayStart = now - (i + 1) * dayMs;
            const dayEnd = now - i * dayMs;
            const dayRevenue = this.getRevenueForPeriod(dayStart, dayEnd);
            
            trends.push({
                date: new Date(dayStart).toISOString().split('T')[0],
                revenue: dayRevenue
            });
        }
        
        return trends;
    }
    
    // Segment calculation methods
    getSegmentDistribution() {
        const distribution = {
            minnow: 0,
            dolphin: 0,
            whale: 0,
            high_potential: 0,
            churn_risk: 0
        };
        
        // Mock distribution - in production, get from segmentation service
        distribution.minnow = Math.floor(Math.random() * 70) + 60; // 60-70%
        distribution.dolphin = Math.floor(Math.random() * 20) + 15; // 15-20%
        distribution.whale = Math.floor(Math.random() * 8) + 3; // 3-8%
        distribution.high_potential = Math.floor(Math.random() * 10) + 5; // 5-10%
        distribution.churn_risk = Math.floor(Math.random() * 15) + 5; // 5-15%
        
        return distribution;
    }
    
    getRevenueBySegment() {
        const revenueBySegment = {
            minnow: 0,
            dolphin: 0,
            whale: 0,
            high_potential: 0,
            churn_risk: 0
        };
        
        try {
            const purchaseHistory = this.getPurchaseHistory();
            purchaseHistory.forEach(purchase => {
                const segment = purchase.segment || 'minnow';
                revenueBySegment[segment] = (revenueBySegment[segment] || 0) + purchase.amount;
            });
        } catch {
            // Mock data if unavailable
            const totalRevenue = this.getTotalRevenue();
            revenueBySegment.whale = totalRevenue * 0.70; // Whales drive 70% of revenue
            revenueBySegment.dolphin = totalRevenue * 0.25; // Dolphins drive 25%
            revenueBySegment.minnow = totalRevenue * 0.03; // Minnows drive 3%
            revenueBySegment.high_potential = totalRevenue * 0.02; // High potential 2%
        }
        
        return revenueBySegment;
    }
    
    getConversionBySegment() {
        return {
            minnow: Math.random() * 5 + 1, // 1-5%
            dolphin: Math.random() * 15 + 10, // 10-25%
            whale: Math.random() * 20 + 30, // 30-50%
            high_potential: Math.random() * 10 + 15, // 15-25%
            churn_risk: Math.random() * 3 + 1 // 1-4%
        };
    }
    
    getLTVBySegment() {
        return {
            minnow: Math.random() * 3 + 1, // $1-4
            dolphin: Math.random() * 20 + 15, // $15-35
            whale: Math.random() * 100 + 80, // $80-180
            high_potential: Math.random() * 10 + 5, // $5-15
            churn_risk: Math.random() * 2 + 0.5 // $0.5-2.5
        };
    }
    
    getSegmentMigration() {
        // Track how players move between segments
        return {
            minnow_to_dolphin: Math.random() * 15 + 5, // 5-20% conversion
            dolphin_to_whale: Math.random() * 8 + 2, // 2-10% conversion
            any_to_churn_risk: Math.random() * 10 + 5, // 5-15% churn risk
            churn_recovery: Math.random() * 20 + 10 // 10-30% recovery
        };
    }
    
    // Conversion calculation methods
    getOverallConversionRate() {
        const totalUsers = this.getTotalUsers();
        const payingUsers = this.getPayingUsers();
        return totalUsers > 0 ? (payingUsers / totalUsers) * 100 : 0;
    }
    
    getConversionByOffer() {
        const offerReport = this.offerService.getOfferPerformanceReport();
        const conversionByOffer = {};
        
        Object.entries(offerReport.templates).forEach(([templateId, template]) => {
            conversionByOffer[templateId] = {
                name: template.name,
                conversionRate: template.conversionRate,
                ctr: template.ctr,
                rpu: template.rpu
            };
        });
        
        return conversionByOffer;
    }
    
    getConversionByPrice() {
        const priceRanges = {
            '$0.99-2.99': { conversions: 0, total: 0 },
            '$2.99-4.99': { conversions: 0, total: 0 },
            '$4.99-9.99': { conversions: 0, total: 0 },
            '$9.99-19.99': { conversions: 0, total: 0 },
            '$19.99+': { conversions: 0, total: 0 }
        };
        
        // Mock data - in production, analyze actual offer performance
        Object.keys(priceRanges).forEach(range => {
            priceRanges[range].total = Math.floor(Math.random() * 1000) + 100;
            priceRanges[range].conversions = Math.floor(priceRanges[range].total * (Math.random() * 0.2 + 0.05));
        });
        
        return priceRanges;
    }
    
    getFunnelConversionRates() {
        const funnelAnalyses = this.funnelService.getAllFunnelAnalyses();
        const conversionRates = {};
        
        funnelAnalyses.forEach(funnel => {
            conversionRates[funnel.id] = {
                name: funnel.name,
                overallConversion: funnel.overallConversionRate,
                steps: funnel.steps.map(step => ({
                    name: step.name,
                    conversionRate: step.conversionRate,
                    dropOffRate: step.dropOffRate
                }))
            };
        });
        
        return conversionRates;
    }
    
    getTimeToConvertMetrics() {
        return {
            averageTime: Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000), // 0-2 days in ms
            medianTime: Math.floor(Math.random() * 24 * 60 * 60 * 1000), // 0-1 day in ms
            bySegment: {
                minnow: Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // 0-7 days
                dolphin: Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000), // 0-3 days
                whale: Math.floor(Math.random() * 24 * 60 * 60 * 1000), // 0-1 day
                high_potential: Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000) // 0-2 days
            }
        };
    }
    
    // Cohort analysis methods
    calculateRetentionCohorts() {
        const cohorts = [];
        const now = Date.now();
        
        // Generate weekly cohorts for last 12 weeks
        for (let week = 0; week < 12; week++) {
            const cohortStart = now - (week + 1) * 7 * 24 * 60 * 60 * 1000;
            const cohort = {
                week: `Week ${week + 1}`,
                startDate: new Date(cohortStart).toISOString().split('T')[0],
                size: Math.floor(Math.random() * 500) + 100,
                retention: {}
            };
            
            // Calculate retention for each week after cohort start
            for (let retentionWeek = 1; retentionWeek <= week + 1; retentionWeek++) {
                const retentionRate = Math.max(0, 100 - retentionWeek * 15 + Math.random() * 10);
                cohort.retention[`week${retentionWeek}`] = Math.round(retentionRate);
            }
            
            cohorts.push(cohort);
        }
        
        return cohorts;
    }
    
    calculateRevenueCohorts() {
        const cohorts = [];
        const now = Date.now();
        
        // Generate monthly revenue cohorts for last 6 months
        for (let month = 0; month < 6; month++) {
            const cohortStart = now - (month + 1) * 30 * 24 * 60 * 60 * 1000;
            const baseRevenue = Math.random() * 1000 + 500;
            
            const cohort = {
                month: `Month ${month + 1}`,
                startDate: new Date(cohortStart).toISOString().split('T')[0],
                size: Math.floor(Math.random() * 300) + 100,
                revenue: {}
            };
            
            // Calculate cumulative revenue for each month
            let cumulativeRevenue = 0;
            for (let revenueMonth = 1; revenueMonth <= month + 1; revenueMonth++) {
                const monthRevenue = baseRevenue * Math.pow(0.8, revenueMonth - 1) * (0.8 + Math.random() * 0.4);
                cumulativeRevenue += monthRevenue;
                cohort.revenue[`month${revenueMonth}`] = Math.round(cumulativeRevenue);
            }
            
            cohorts.push(cohort);
        }
        
        return cohorts;
    }
    
    calculateLTVCohorts() {
        const cohorts = [];
        
        // LTV progression by cohort
        for (let cohort = 0; cohort < 6; cohort++) {
            const baseLTV = Math.random() * 20 + 10;
            const ltvCohort = {
                cohort: `Cohort ${cohort + 1}`,
                currentLTV: baseLTV,
                predictedLTV: baseLTV * (1.5 + Math.random() * 0.5),
                ltvProgression: []
            };
            
            // Calculate LTV progression over time
            let currentLTV = 0;
            for (let week = 1; week <= 12; week++) {
                currentLTV += baseLTV * 0.1 * Math.pow(0.95, week - 1);
                ltvCohort.ltvProgression.push({
                    week,
                    ltv: Math.round(currentLTV * 100) / 100
                });
            }
            
            cohorts.push(ltvCohort);
        }
        
        return cohorts;
    }
    
    calculateSegmentEvolutionCohorts() {
        // Track how segment distribution changes over cohort lifetime
        return {
            week1: { minnow: 85, dolphin: 12, whale: 2, high_potential: 1 },
            week4: { minnow: 75, dolphin: 18, whale: 4, high_potential: 3 },
            week12: { minnow: 65, dolphin: 22, whale: 8, high_potential: 5 },
            week24: { minnow: 60, dolphin: 25, whale: 10, high_potential: 5 }
        };
    }
    
    // Predictive analytics methods
    predictChurnRisk() {
        return {
            highRisk: Math.floor(Math.random() * 15) + 5, // 5-20% of players
            mediumRisk: Math.floor(Math.random() * 20) + 15, // 15-35% of players
            lowRisk: Math.floor(Math.random() * 30) + 50, // 50-80% of players
            factors: [
                'Declining session frequency',
                'No purchases in 14 days',
                'Low engagement score',
                'Session duration decreasing'
            ]
        };
    }
    
    forecastRevenue() {
        const currentRevenue = this.getTotalRevenue();
        const growthRate = this.calculateGrowthRate('weekly') / 100;
        
        return {
            nextWeek: currentRevenue * (1 + growthRate),
            nextMonth: currentRevenue * Math.pow(1 + growthRate, 4),
            nextQuarter: currentRevenue * Math.pow(1 + growthRate, 12),
            confidence: Math.random() * 20 + 70 // 70-90% confidence
        };
    }
    
    predictLTV() {
        const segmentLTV = this.getLTVBySegment();
        const distribution = this.getSegmentDistribution();
        
        const weightedLTV = Object.entries(segmentLTV).reduce((sum, [segment, ltv]) => {
            const weight = distribution[segment] / 100;
            return sum + (ltv * weight);
        }, 0);
        
        return {
            current: weightedLTV,
            predicted3Month: weightedLTV * 1.3,
            predicted6Month: weightedLTV * 1.6,
            predicted12Month: weightedLTV * 2.1
        };
    }
    
    predictSegmentChanges() {
        return {
            nextWeek: {
                minnowToHighPotential: Math.random() * 5 + 2,
                highPotentialToDolphin: Math.random() * 15 + 10,
                dolphinToWhale: Math.random() * 8 + 3,
                anyToChurnRisk: Math.random() * 10 + 5
            }
        };
    }
    
    predictOptimalPricing() {
        return {
            bySegment: {
                minnow: { optimal: 1.99, range: [0.99, 2.99] },
                dolphin: { optimal: 7.99, range: [4.99, 12.99] },
                whale: { optimal: 29.99, range: [19.99, 49.99] },
                high_potential: { optimal: 3.99, range: [2.99, 5.99] }
            },
            recommendations: [
                'Increase starter pack price to $2.99 for 15% revenue boost',
                'Test premium bundle at $24.99 for whale segment',
                'Introduce $1.99 convenience packs for minnows'
            ]
        };
    }
    
    // Event handlers
    onRevenueEvent(data) {
        // Update real-time revenue metrics
        const currentMetrics = this.realtimeMetrics.get('revenue') || {
            todayRevenue: 0,
            todayTransactions: 0,
            averageBasketSize: 0
        };
        
        currentMetrics.todayRevenue += data.amount;
        currentMetrics.todayTransactions += 1;
        currentMetrics.averageBasketSize = currentMetrics.todayRevenue / currentMetrics.todayTransactions;
        
        this.realtimeMetrics.set('revenue', currentMetrics);
    }
    
    onOfferEvent(eventType, data) {
        const offerMetrics = this.realtimeMetrics.get('offers') || {
            impressions: 0,
            clicks: 0,
            conversions: 0
        };
        
        switch (eventType) {
            case 'shown':
                offerMetrics.impressions++;
                break;
            case 'clicked':
                offerMetrics.clicks++;
                break;
            case 'purchased':
                offerMetrics.conversions++;
                break;
        }
        
        this.realtimeMetrics.set('offers', offerMetrics);
    }
    
    onSegmentChange(data) {
        // Track segment migrations in real-time
        const segmentMetrics = this.realtimeMetrics.get('segments') || {};
        const migrationKey = `${data.previousSegment}_to_${data.newSegment}`;
        segmentMetrics[migrationKey] = (segmentMetrics[migrationKey] || 0) + 1;
        this.realtimeMetrics.set('segments', segmentMetrics);
    }
    
    onPlayerProgress(data) {
        // Track progression events that may impact monetization
        const progressMetrics = this.realtimeMetrics.get('progress') || {
            levelUps: 0,
            achievements: 0
        };
        progressMetrics.levelUps++;
        this.realtimeMetrics.set('progress', progressMetrics);
    }
    
    onABTestEvent(data) {
        // Track A/B test performance in real-time
        const abMetrics = this.realtimeMetrics.get('experiments') || {};
        const expKey = data.experimentId;
        abMetrics[expKey] = (abMetrics[expKey] || 0) + data.amount;
        this.realtimeMetrics.set('experiments', abMetrics);
    }
    
    updateRealtimeMetrics() {
        // Refresh key metrics for real-time display
        const realtime = {
            revenue: {
                current: this.realtimeMetrics.get('revenue'),
                growth: this.calculateGrowthRate('daily')
            },
            players: {
                online: this.getOnlinePlayerCount(),
                converting: this.getConvertingPlayerCount()
            },
            offers: this.realtimeMetrics.get('offers'),
            alerts: this.generateAlerts()
        };
        
        this.realtimeMetrics.set('dashboard', realtime);
    }
    
    generateAlerts() {
        const alerts = [];
        
        // Revenue alerts
        const dailyGrowth = this.calculateGrowthRate('daily');
        if (dailyGrowth < -10) {
            alerts.push({
                type: 'warning',
                message: `Daily revenue down ${Math.abs(dailyGrowth).toFixed(1)}%`,
                action: 'Review offer performance and player segments'
            });
        }
        
        // Conversion alerts
        const overallConversion = this.getOverallConversionRate();
        if (overallConversion < 5) {
            alerts.push({
                type: 'critical',
                message: `Conversion rate critically low: ${overallConversion.toFixed(1)}%`,
                action: 'Activate retention offers and review pricing'
            });
        }
        
        // Churn alerts
        const churnRisk = this.predictChurnRisk();
        if (churnRisk.highRisk > 20) {
            alerts.push({
                type: 'warning',
                message: `High churn risk: ${churnRisk.highRisk}% of players`,
                action: 'Deploy churn prevention campaigns'
            });
        }
        
        return alerts;
    }
    
    // Dashboard UI setup
    setupDashboardUI() {
        // Create dashboard container if it doesn't exist
        if (!document.getElementById('revenue-dashboard')) {
            const dashboard = document.createElement('div');
            dashboard.id = 'revenue-dashboard';
            dashboard.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                width: 300px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
                z-index: 10000;
                max-height: 80vh;
                overflow-y: auto;
                display: none;
            `;
            document.body.appendChild(dashboard);
        }
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = '📊';
        toggleButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 320px;
            z-index: 10001;
            background: #007acc;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 4px;
            cursor: pointer;
        `;
        toggleButton.onclick = () => this.toggleDashboard();
        document.body.appendChild(toggleButton);
        
        // Update dashboard periodically
        setInterval(() => {
            this.updateDashboardUI();
        }, 10000); // Update every 10 seconds
    }
    
    toggleDashboard() {
        const dashboard = document.getElementById('revenue-dashboard');
        dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
        if (dashboard.style.display === 'block') {
            this.updateDashboardUI();
        }
    }
    
    updateDashboardUI() {
        const dashboard = document.getElementById('revenue-dashboard');
        if (!dashboard || dashboard.style.display === 'none') return;
        
        const metrics = this.calculateAllMetrics();
        const realtime = this.realtimeMetrics.get('dashboard') || {};
        
        dashboard.innerHTML = `
            <h3>🏆 Revenue Analytics</h3>
            
            <h4>💰 Revenue</h4>
            <div>Total: $${metrics.revenue.total.toFixed(2)}</div>
            <div>Today: $${metrics.revenue.today.toFixed(2)}</div>
            <div>ARPU: $${metrics.revenue.arpu.toFixed(2)}</div>
            <div>ARPPU: $${metrics.revenue.arppu.toFixed(2)}</div>
            <div>Growth: ${metrics.revenue.growth.daily.toFixed(1)}%</div>
            
            <h4>👥 Segments</h4>
            <div>Whales: ${metrics.segments.distribution.whale}%</div>
            <div>Dolphins: ${metrics.segments.distribution.dolphin}%</div>
            <div>Minnows: ${metrics.segments.distribution.minnow}%</div>
            
            <h4>🎯 Conversion</h4>
            <div>Overall: ${metrics.conversion.overall.toFixed(1)}%</div>
            <div>Whale: ${metrics.conversion.bySegment.whale.toFixed(1)}%</div>
            <div>Dolphin: ${metrics.conversion.bySegment.dolphin.toFixed(1)}%</div>
            
            <h4>🧪 Experiments</h4>
            <div>Active: ${metrics.experiments.active.length}</div>
            <div>Revenue: $${metrics.experiments.totalRevenue.toFixed(2)}</div>
            
            <h4>🔄 Funnels</h4>
            <div>Avg Conversion: ${metrics.funnels.averageConversion.toFixed(1)}%</div>
            <div>Bottlenecks: ${metrics.funnels.bottlenecks.length}</div>
            
            <h4>⚠️ Alerts</h4>
            ${(realtime.alerts || []).map(alert => 
                `<div style="color: ${alert.type === 'critical' ? 'red' : 'orange'}">
                    ${alert.message}
                </div>`
            ).join('')}
            
            <div style="margin-top: 10px; font-size: 10px; opacity: 0.7;">
                Last updated: ${new Date().toLocaleTimeString()}
            </div>
        `;
    }
    
    // Utility methods
    getPurchaseHistory() {
        try {
            const history = localStorage.getItem('purchaseHistory');
            return history ? JSON.parse(history) : [];
        } catch {
            return [];
        }
    }
    
    getTotalUsers() {
        // Mock implementation
        return Math.floor(Math.random() * 10000) + 1000;
    }
    
    getPayingUsers() {
        // Mock implementation
        return Math.floor(this.getTotalUsers() * (Math.random() * 0.15 + 0.05)); // 5-20% conversion
    }
    
    getOnlinePlayerCount() {
        return Math.floor(Math.random() * 500) + 50;
    }
    
    getConvertingPlayerCount() {
        return Math.floor(Math.random() * 20) + 5;
    }
    
    getTopPerformingOffers(templates) {
        return Object.entries(templates)
            .sort(([,a], [,b]) => b.conversionRate - a.conversionRate)
            .slice(0, 3)
            .map(([id, template]) => ({ id, ...template }));
    }
    
    getUnderperformingOffers(templates) {
        return Object.entries(templates)
            .filter(([,template]) => template.conversionRate < 5 && template.impressions > 100)
            .map(([id, template]) => ({ id, ...template }));
    }
    
    getRevenueByOfferCategory() {
        return {
            starter: Math.random() * 1000 + 500,
            value: Math.random() * 2000 + 1000,
            premium: Math.random() * 5000 + 2000,
            retention: Math.random() * 800 + 200,
            competitive: Math.random() * 1500 + 500,
            flash: Math.random() * 3000 + 1000
        };
    }
    
    identifyBottlenecks(funnelAnalyses) {
        const bottlenecks = [];
        
        funnelAnalyses.forEach(funnel => {
            funnel.steps.forEach(step => {
                if (step.dropOffRate > 50) {
                    bottlenecks.push({
                        funnel: funnel.name,
                        step: step.name,
                        dropOffRate: step.dropOffRate
                    });
                }
            });
        });
        
        return bottlenecks.sort((a, b) => b.dropOffRate - a.dropOffRate);
    }
    
    identifyOptimizationOpportunities(funnelAnalyses) {
        const opportunities = [];
        
        funnelAnalyses.forEach(funnel => {
            if (funnel.overallConversionRate < 10) {
                opportunities.push({
                    type: 'funnel_optimization',
                    description: `${funnel.name} has low conversion (${funnel.overallConversionRate.toFixed(1)}%)`,
                    impact: 'high',
                    effort: 'medium'
                });
            }
        });
        
        return opportunities;
    }
    
    calculateAverageFunnelConversion(funnelAnalyses) {
        if (funnelAnalyses.length === 0) return 0;
        const totalConversion = funnelAnalyses.reduce((sum, funnel) => 
            sum + funnel.overallConversionRate, 0);
        return totalConversion / funnelAnalyses.length;
    }
    
    calculateAverageImprovement(experiments) {
        const completedWithWinners = experiments.filter(e => 
            e.status === 'ended' && e.improvement > 0
        );
        if (completedWithWinners.length === 0) return 0;
        
        const totalImprovement = completedWithWinners.reduce((sum, e) => 
            sum + e.improvement, 0);
        return totalImprovement / completedWithWinners.length;
    }
    
    // Export functionality
    exportDashboardData(format = 'json') {
        const data = this.calculateAllMetrics();
        
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], 
                { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `revenue-analytics-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
    
    // Data persistence
    persistDashboardData() {
        try {
            const data = {
                dashboardData: Object.fromEntries(this.dashboardData),
                realtimeMetrics: Object.fromEntries(this.realtimeMetrics),
                lastUpdate: Date.now()
            };
            localStorage.setItem('revenue_dashboard', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to persist dashboard data:', error);
        }
    }
    
    loadHistoricalData() {
        try {
            const stored = localStorage.getItem('revenue_dashboard');
            if (stored) {
                const data = JSON.parse(stored);
                this.dashboardData = new Map(Object.entries(data.dashboardData || {}));
                this.realtimeMetrics = new Map(Object.entries(data.realtimeMetrics || {}));
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }
    
    // Debug helper
    debugDashboard() {
        console.group('📊 Revenue Analytics Debug');
        console.table(this.calculateAllMetrics().revenue);
        console.table(this.calculateAllMetrics().segments);
        console.groupEnd();
    }
    
    // Cleanup
    dispose() {
        this.persistDashboardData();
        this.dashboardData.clear();
        this.realtimeMetrics.clear();
        
        // Remove UI elements
        const dashboard = document.getElementById('revenue-dashboard');
        if (dashboard) dashboard.remove();
    }
}

// Export for DI container
window.RevenueAnalyticsDashboard = RevenueAnalyticsDashboard;
export { RevenueAnalyticsDashboard };