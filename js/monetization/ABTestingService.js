// A/B Testing Framework for Revenue Optimization
// King/Blizzard standard: Data-driven pricing and feature optimization

class ABTestingService {
    constructor(analyticsService, playerSegmentationService, featureFlagService) {
        this.analytics = analyticsService;
        this.segmentation = playerSegmentationService;
        this.featureFlags = featureFlagService;
        
        // Active experiments
        this.activeExperiments = new Map();
        this.userAssignments = new Map();
        this.experimentResults = new Map();
        
        // Configuration
        this.confidenceThreshold = 0.95; // 95% statistical significance
        this.minimumSampleSize = 100;
        this.maxExperimentDuration = 14 * 24 * 60 * 60 * 1000; // 14 days
        
        this.initialize();
    }
    
    initialize() {
        this.loadExperimentData();
        this.initializeDefaultExperiments();
        this.startExperimentMonitoring();
        
        // Listen to conversion events
        if (window.GameEventBus) {
            window.GameEventBus.on('purchase:completed', (data) => {
                this.trackConversion(data);
            });
            
            window.GameEventBus.on('offer:shown', (data) => {
                this.trackExposure(data);
            });
            
            window.GameEventBus.on('player:segment_changed', (data) => {
                this.onPlayerSegmentChanged(data);
            });
        }
    }
    
    initializeDefaultExperiments() {
        // Pricing optimization experiments
        this.createExperiment('starter_pack_price_test', {
            name: 'Starter Pack Price Test',
            description: 'Test optimal pricing for starter packs',
            type: 'pricing',
            targetMetric: 'conversion_rate',
            segments: ['minnow', 'high_potential'],
            variants: [
                { name: 'control', weight: 25, config: { price: 2.99 } },
                { name: 'low_price', weight: 25, config: { price: 1.99 } },
                { name: 'medium_price', weight: 25, config: { price: 4.99 } },
                { name: 'high_price', weight: 25, config: { price: 6.99 } }
            ],
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            minSampleSize: 50
        });
        
        // Battle pass pricing
        this.createExperiment('battle_pass_pricing', {
            name: 'Battle Pass Pricing Optimization',
            description: 'Find optimal battle pass price point',
            type: 'pricing',
            targetMetric: 'revenue_per_user',
            segments: ['dolphin'],
            variants: [
                { name: 'control', weight: 33, config: { price: 4.99 } },
                { name: 'premium', weight: 33, config: { price: 7.99 } },
                { name: 'discount', weight: 34, config: { price: 3.99 } }
            ],
            duration: 14 * 24 * 60 * 60 * 1000
        });
        
        // VIP subscription test for whales
        this.createExperiment('vip_subscription_test', {
            name: 'VIP Subscription Introduction',
            description: 'Test VIP subscription acceptance',
            type: 'feature',
            targetMetric: 'subscription_rate',
            segments: ['whale'],
            variants: [
                { name: 'control', weight: 50, config: { showVIP: false } },
                { name: 'vip_enabled', weight: 50, config: { showVIP: true, price: 9.99 } }
            ],
            duration: 21 * 24 * 60 * 60 * 1000
        });
        
        // Offer frequency optimization
        this.createExperiment('offer_frequency_test', {
            name: 'Offer Frequency Optimization',
            description: 'Test optimal offer frequency',
            type: 'behavior',
            targetMetric: 'lifetime_value',
            segments: ['minnow', 'dolphin'],
            variants: [
                { name: 'conservative', weight: 25, config: { frequency: 'weekly' } },
                { name: 'moderate', weight: 25, config: { frequency: 'bi-weekly' } },
                { name: 'aggressive', weight: 25, config: { frequency: 'daily' } },
                { name: 'dynamic', weight: 25, config: { frequency: 'adaptive' } }
            ],
            duration: 30 * 24 * 60 * 60 * 1000
        });
    }
    
    // Create new A/B experiment
    createExperiment(experimentId, config) {
        const experiment = {
            id: experimentId,
            ...config,
            status: 'active',
            createdAt: Date.now(),
            startedAt: Date.now(),
            endAt: Date.now() + (config.duration || this.maxExperimentDuration),
            participants: new Map(),
            results: {
                variants: new Map(),
                significance: null,
                winner: null,
                confidence: 0
            }
        };
        
        // Initialize variant results
        config.variants.forEach(variant => {
            experiment.results.variants.set(variant.name, {
                participants: 0,
                conversions: 0,
                revenue: 0,
                conversionRate: 0,
                revenuePerUser: 0,
                confidence: 0
            });
        });
        
        this.activeExperiments.set(experimentId, experiment);
        this.persistExperimentData();
        
        console.log(`🧪 A/B Experiment created: ${config.name}`);
        return experiment;
    }
    
    // Assign user to experiment variant
    assignToExperiment(experimentId, userId = null) {
        const experiment = this.activeExperiments.get(experimentId);
        if (!experiment || experiment.status !== 'active') {
            return null;
        }
        
        // Check if experiment has ended
        if (Date.now() > experiment.endAt) {
            this.endExperiment(experimentId);
            return null;
        }
        
        userId = userId || this.getCurrentUserId();
        const playerSegment = this.segmentation.getCurrentSegment();
        
        // Check if user's segment is targeted
        if (!experiment.segments.includes(playerSegment)) {
            return null;
        }
        
        // Check if user is already assigned
        if (this.userAssignments.has(userId) && 
            this.userAssignments.get(userId)[experimentId]) {
            return this.userAssignments.get(userId)[experimentId];
        }
        
        // Assign to variant based on weights
        const variant = this.selectVariant(experiment, userId);
        
        // Store assignment
        if (!this.userAssignments.has(userId)) {
            this.userAssignments.set(userId, {});
        }
        this.userAssignments.get(userId)[experimentId] = variant;
        
        // Update participant count
        const variantResults = experiment.results.variants.get(variant.name);
        variantResults.participants++;
        experiment.participants.set(userId, {
            variant: variant.name,
            assignedAt: Date.now(),
            segment: playerSegment
        });
        
        this.persistExperimentData();
        
        // Track assignment
        this.analytics.trackEvent('ab_test_assigned', {
            experimentId,
            experimentName: experiment.name,
            variant: variant.name,
            segment: playerSegment,
            userId
        });
        
        return variant;
    }
    
    selectVariant(experiment, userId) {
        // Use consistent hashing for stable assignment
        const hash = this.hashUserId(userId + experiment.id);
        const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
        const selection = hash % totalWeight;
        
        let cumulativeWeight = 0;
        for (const variant of experiment.variants) {
            cumulativeWeight += variant.weight;
            if (selection < cumulativeWeight) {
                return variant;
            }
        }
        
        return experiment.variants[0]; // Fallback
    }
    
    hashUserId(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    // Get experiment configuration for user
    getExperimentConfig(experimentId, userId = null) {
        const variant = this.assignToExperiment(experimentId, userId);
        return variant ? variant.config : null;
    }
    
    // Track experiment exposure (user saw the feature/price)
    trackExposure(data) {
        const { experimentId, variant, userId } = data;
        if (!experimentId || !variant) return;
        
        const experiment = this.activeExperiments.get(experimentId);
        if (!experiment) return;
        
        this.analytics.trackEvent('ab_test_exposure', {
            experimentId,
            experimentName: experiment.name,
            variant,
            userId: userId || this.getCurrentUserId(),
            segment: this.segmentation.getCurrentSegment()
        });
    }
    
    // Track conversion event
    trackConversion(data) {
        const userId = data.userId || this.getCurrentUserId();
        const userAssignments = this.userAssignments.get(userId);
        
        if (!userAssignments) return;
        
        // Track conversion for all active experiments user is part of
        Object.entries(userAssignments).forEach(([experimentId, variant]) => {
            const experiment = this.activeExperiments.get(experimentId);
            if (!experiment || experiment.status !== 'active') return;
            
            const variantResults = experiment.results.variants.get(variant.name);
            variantResults.conversions++;
            variantResults.revenue += data.amount || 0;
            
            // Recalculate metrics
            variantResults.conversionRate = variantResults.conversions / variantResults.participants;
            variantResults.revenuePerUser = variantResults.revenue / variantResults.participants;
            
            this.analytics.trackEvent('ab_test_conversion', {
                experimentId,
                experimentName: experiment.name,
                variant: variant.name,
                amount: data.amount || 0,
                userId,
                segment: this.segmentation.getCurrentSegment()
            });
            
            // Check if we can determine a winner
            this.checkExperimentSignificance(experimentId);
        });
        
        this.persistExperimentData();
    }
    
    // Calculate statistical significance
    checkExperimentSignificance(experimentId) {
        const experiment = this.activeExperiments.get(experimentId);
        if (!experiment) return;
        
        const variants = Array.from(experiment.results.variants.entries());
        const control = variants.find(([name]) => name === 'control');
        
        if (!control) return; // Need a control group
        
        const [controlName, controlResults] = control;
        let bestVariant = controlName;
        let bestRate = controlResults.conversionRate;
        let isSignificant = false;
        
        // Check each variant against control
        variants.forEach(([variantName, variantResults]) => {
            if (variantName === 'control') return;
            
            const significance = this.calculateSignificance(
                controlResults.conversions, controlResults.participants,
                variantResults.conversions, variantResults.participants
            );
            
            variantResults.significance = significance;
            
            // Check if this variant is significantly better
            if (significance > this.confidenceThreshold && 
                variantResults.conversionRate > controlResults.conversionRate) {
                isSignificant = true;
                if (variantResults.conversionRate > bestRate) {
                    bestVariant = variantName;
                    bestRate = variantResults.conversionRate;
                }
            }
        });
        
        // Update experiment results
        experiment.results.significance = isSignificant;
        experiment.results.winner = bestVariant;
        experiment.results.confidence = Math.max(...variants.map(([, r]) => r.significance || 0));
        
        // Auto-end experiment if we have a clear winner with enough data
        const totalParticipants = Array.from(experiment.results.variants.values())
            .reduce((sum, r) => sum + r.participants, 0);
            
        if (isSignificant && totalParticipants >= experiment.minSampleSize * 2) {
            this.endExperiment(experimentId, 'significant_result');
        }
    }
    
    // Z-test for two proportions
    calculateSignificance(c1, n1, c2, n2) {
        if (n1 === 0 || n2 === 0) return 0;
        
        const p1 = c1 / n1;
        const p2 = c2 / n2;
        const p = (c1 + c2) / (n1 + n2);
        
        const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
        const z = Math.abs(p1 - p2) / se;
        
        // Convert Z-score to confidence level (approximation)
        return Math.min(0.999, 1 - 2 * (1 - this.normalCDF(z)));
    }
    
    normalCDF(x) {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }
    
    erf(x) {
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;
        
        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);
        
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return sign * y;
    }
    
    // End experiment
    endExperiment(experimentId, reason = 'manual') {
        const experiment = this.activeExperiments.get(experimentId);
        if (!experiment) return;
        
        experiment.status = 'ended';
        experiment.endedAt = Date.now();
        experiment.endReason = reason;
        
        // Final significance calculation
        this.checkExperimentSignificance(experimentId);
        
        this.analytics.trackEvent('ab_test_ended', {
            experimentId,
            experimentName: experiment.name,
            reason,
            winner: experiment.results.winner,
            confidence: experiment.results.confidence,
            totalParticipants: Array.from(experiment.results.variants.values())
                .reduce((sum, r) => sum + r.participants, 0)
        });
        
        console.log(`🏁 A/B Experiment ended: ${experiment.name} - Winner: ${experiment.results.winner}`);
        
        // Apply winning variant if significant
        if (experiment.results.significance && experiment.results.winner !== 'control') {
            this.applyWinningVariant(experimentId);
        }
        
        this.persistExperimentData();
    }
    
    // Apply winning variant to feature flags
    applyWinningVariant(experimentId) {
        const experiment = this.activeExperiments.get(experimentId);
        if (!experiment || !experiment.results.winner) return;
        
        const winningVariant = experiment.variants.find(v => v.name === experiment.results.winner);
        if (!winningVariant) return;
        
        // Update feature flags based on experiment type
        switch (experiment.type) {
            case 'pricing':
                this.updatePricingConfig(experiment, winningVariant);
                break;
            case 'feature':
                this.updateFeatureFlags(experiment, winningVariant);
                break;
            case 'behavior':
                this.updateBehaviorConfig(experiment, winningVariant);
                break;
        }
    }
    
    updatePricingConfig(experiment, variant) {
        // Store winning price configuration
        const configKey = `pricing_${experiment.id}`;
        localStorage.setItem(configKey, JSON.stringify({
            config: variant.config,
            appliedAt: Date.now(),
            experimentId: experiment.id
        }));
        
        console.log(`💰 Applied winning pricing: ${JSON.stringify(variant.config)}`);
    }
    
    updateFeatureFlags(experiment, variant) {
        Object.entries(variant.config).forEach(([flag, value]) => {
            this.featureFlags.setFlag(flag, value);
        });
    }
    
    updateBehaviorConfig(experiment, variant) {
        const configKey = `behavior_${experiment.id}`;
        localStorage.setItem(configKey, JSON.stringify(variant.config));
    }
    
    // Get experiment results for dashboard
    getExperimentResults(experimentId) {
        const experiment = this.activeExperiments.get(experimentId);
        if (!experiment) return null;
        
        return {
            id: experiment.id,
            name: experiment.name,
            status: experiment.status,
            startedAt: experiment.startedAt,
            endedAt: experiment.endedAt,
            duration: experiment.endedAt ? experiment.endedAt - experiment.startedAt : Date.now() - experiment.startedAt,
            participants: experiment.participants.size,
            variants: Array.from(experiment.results.variants.entries()).map(([name, results]) => ({
                name,
                ...results,
                improvement: this.calculateImprovement(experiment, name)
            })),
            winner: experiment.results.winner,
            confidence: experiment.results.confidence,
            isSignificant: experiment.results.significance
        };
    }
    
    calculateImprovement(experiment, variantName) {
        const control = experiment.results.variants.get('control');
        const variant = experiment.results.variants.get(variantName);
        
        if (!control || !variant || variantName === 'control') return 0;
        
        if (control.conversionRate === 0) return 0;
        
        return ((variant.conversionRate - control.conversionRate) / control.conversionRate) * 100;
    }
    
    // Get all active experiments
    getAllExperiments() {
        return Array.from(this.activeExperiments.values()).map(exp => 
            this.getExperimentResults(exp.id)
        );
    }
    
    // Monitor experiments and auto-manage
    startExperimentMonitoring() {
        setInterval(() => {
            this.activeExperiments.forEach((experiment, id) => {
                if (experiment.status === 'active' && Date.now() > experiment.endAt) {
                    this.endExperiment(id, 'time_limit');
                }
            });
        }, 60 * 60 * 1000); // Check every hour
    }
    
    // Event handlers
    onPlayerSegmentChanged(data) {
        const { newSegment, previousSegment } = data;
        const userId = this.getCurrentUserId();
        
        // Re-evaluate experiment eligibility
        this.activeExperiments.forEach((experiment, id) => {
            if (experiment.segments.includes(newSegment) && 
                !this.userAssignments.get(userId)?.[id]) {
                // User now qualifies for this experiment
                this.assignToExperiment(id, userId);
            }
        });
    }
    
    // Utility methods
    getCurrentUserId() {
        return localStorage.getItem('secure_player_id') || 'anonymous_' + Date.now();
    }
    
    persistExperimentData() {
        try {
            const data = {
                experiments: Object.fromEntries(this.activeExperiments),
                assignments: Object.fromEntries(this.userAssignments)
            };
            localStorage.setItem('ab_experiments', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to persist experiment data:', error);
        }
    }
    
    loadExperimentData() {
        try {
            const stored = localStorage.getItem('ab_experiments');
            if (stored) {
                const data = JSON.parse(stored);
                this.activeExperiments = new Map(Object.entries(data.experiments || {}));
                this.userAssignments = new Map(Object.entries(data.assignments || {}));
            }
        } catch (error) {
            console.error('Failed to load experiment data:', error);
        }
    }
    
    // Debug helper
    debugExperiments() {
        console.group('🧪 A/B Testing Debug');
        this.activeExperiments.forEach((exp, id) => {
            console.log(`Experiment: ${exp.name} (${exp.status})`);
            console.table(Object.fromEntries(exp.results.variants));
        });
        console.groupEnd();
    }
    
    // Cleanup
    dispose() {
        this.persistExperimentData();
        this.activeExperiments.clear();
        this.userAssignments.clear();
    }
}

// Export for DI container
window.ABTestingService = ABTestingService;
export { ABTestingService };