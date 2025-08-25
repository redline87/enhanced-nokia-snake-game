// Monetization System Initializer
// King/Blizzard standard: Complete revenue optimization deployment

class MonetizationInitializer {
    constructor() {
        this.services = new Map();
        this.initializationSteps = [];
        this.validationResults = new Map();
        this.isInitialized = false;
        
        this.setupInitializationPlan();
    }
    
    setupInitializationPlan() {
        this.initializationSteps = [
            {
                id: 'dependency_check',
                name: 'Check Dependencies',
                description: 'Verify all required services are available',
                execute: () => this.checkDependencies(),
                critical: true
            },
            {
                id: 'analytics_init',
                name: 'Initialize Analytics',
                description: 'Set up analytics and tracking services',
                execute: () => this.initializeAnalytics(),
                critical: true
            },
            {
                id: 'segmentation_init',
                name: 'Initialize Player Segmentation',
                description: 'Set up player classification system',
                execute: () => this.initializeSegmentation(),
                critical: true
            },
            {
                id: 'ab_testing_init',
                name: 'Initialize A/B Testing',
                description: 'Set up experimentation framework',
                execute: () => this.initializeABTesting(),
                critical: false
            },
            {
                id: 'funnel_init',
                name: 'Initialize Conversion Funnels',
                description: 'Set up funnel tracking and analysis',
                execute: () => this.initializeFunnels(),
                critical: false
            },
            {
                id: 'offers_init',
                name: 'Initialize Dynamic Offers',
                description: 'Set up personalized offer generation',
                execute: () => this.initializeDynamicOffers(),
                critical: false
            },
            {
                id: 'strategies_init',
                name: 'Initialize Monetization Strategies',
                description: 'Set up personalized monetization',
                execute: () => this.initializeStrategies(),
                critical: false
            },
            {
                id: 'cohorts_init',
                name: 'Initialize Cohort Analysis',
                description: 'Set up retention and cohort tracking',
                execute: () => this.initializeCohorts(),
                critical: false
            },
            {
                id: 'dashboard_init',
                name: 'Initialize Analytics Dashboard',
                description: 'Set up revenue analytics dashboard',
                execute: () => this.initializeDashboard(),
                critical: false
            },
            {
                id: 'integration_test',
                name: 'Integration Testing',
                description: 'Validate all systems work together',
                execute: () => this.runIntegrationTests(),
                critical: true
            },
            {
                id: 'feature_flags',
                name: 'Configure Feature Flags',
                description: 'Set up feature flag configuration',
                execute: () => this.configureFeatureFlags(),
                critical: false
            },
            {
                id: 'initial_data',
                name: 'Generate Initial Data',
                description: 'Create baseline metrics and data',
                execute: () => this.generateInitialData(),
                critical: false
            },
            {
                id: 'validation',
                name: 'System Validation',
                description: 'Final validation and health checks',
                execute: () => this.validateSystem(),
                critical: true
            }
        ];
    }
    
    async initialize() {
        console.log('🚀 Starting monetization system initialization...');
        
        const startTime = Date.now();
        let successfulSteps = 0;
        let failedSteps = 0;
        
        for (const step of this.initializationSteps) {
            try {
                console.log(`📋 Executing: ${step.name}`);
                const result = await step.execute();
                
                this.validationResults.set(step.id, {
                    success: true,
                    result,
                    timestamp: Date.now()
                });
                
                successfulSteps++;
                console.log(`✅ ${step.name} completed successfully`);
                
            } catch (error) {
                this.validationResults.set(step.id, {
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                });
                
                failedSteps++;
                console.error(`❌ ${step.name} failed:`, error);
                
                if (step.critical) {
                    console.error('🚨 Critical step failed, aborting initialization');
                    return this.generateInitializationReport(false, startTime);
                }
            }
        }
        
        const totalTime = Date.now() - startTime;
        this.isInitialized = failedSteps === 0 || this.validateMinimumRequirements();
        
        const report = this.generateInitializationReport(this.isInitialized, startTime);
        
        if (this.isInitialized) {
            console.log(`🎉 Monetization system initialized successfully in ${totalTime}ms`);
            console.log(`📊 ${successfulSteps} steps successful, ${failedSteps} steps failed`);
            
            // Start monitoring and optimization
            this.startSystemMonitoring();
            
            // Track initialization
            this.trackInitialization(report);
        } else {
            console.error('💥 Monetization system initialization failed');
        }
        
        return report;
    }
    
    async checkDependencies() {
        const dependencies = [
            { name: 'DIContainer', global: 'DIContainer', required: true },
            { name: 'GameEventBus', global: 'GameEventBus', required: true },
            { name: 'IAnalyticsService', service: 'IAnalyticsService', required: true },
            { name: 'IUserProfileService', service: 'IUserProfileService', required: true },
            { name: 'IFeatureFlagService', service: 'IFeatureFlagService', required: false },
            { name: 'LocalStorage', check: () => typeof localStorage !== 'undefined', required: true },
            { name: 'Fetch API', check: () => typeof fetch !== 'undefined', required: false }
        ];
        
        const results = {};
        
        for (const dep of dependencies) {
            try {
                let available = false;
                
                if (dep.global) {
                    available = typeof window[dep.global] !== 'undefined';
                } else if (dep.service) {
                    available = window.DIContainer?.has(dep.service) || false;
                } else if (dep.check) {
                    available = dep.check();
                }
                
                results[dep.name] = {
                    available,
                    required: dep.required,
                    status: available ? 'OK' : (dep.required ? 'MISSING' : 'OPTIONAL')
                };
                
                if (dep.required && !available) {
                    throw new Error(`Required dependency ${dep.name} is not available`);
                }
                
            } catch (error) {
                results[dep.name] = {
                    available: false,
                    required: dep.required,
                    status: 'ERROR',
                    error: error.message
                };
                
                if (dep.required) {
                    throw error;
                }
            }
        }
        
        return results;
    }
    
    async initializeAnalytics() {
        // Get or create analytics service
        let analyticsService;
        
        try {
            analyticsService = window.DIContainer.resolve('IAnalyticsService');
        } catch {
            // Create a basic analytics service if none exists
            analyticsService = this.createBasicAnalyticsService();
            window.DIContainer.registerInstance('IAnalyticsService', analyticsService);
        }
        
        this.services.set('analytics', analyticsService);
        
        // Track monetization system initialization
        analyticsService.trackEvent('monetization_system_init_started', {
            timestamp: Date.now(),
            version: '1.0.0'
        });
        
        return { service: 'analytics', status: 'initialized' };
    }
    
    async initializeSegmentation() {
        const analyticsService = this.services.get('analytics');
        let userProfileService;
        
        try {
            userProfileService = window.DIContainer.resolve('IUserProfileService');
        } catch {
            userProfileService = this.createBasicUserProfileService();
            window.DIContainer.registerInstance('IUserProfileService', userProfileService);
        }
        
        // Initialize player segmentation service
        const segmentationService = new window.PlayerSegmentationService(
            analyticsService,
            userProfileService
        );
        
        this.services.set('segmentation', segmentationService);
        
        // Register with DI container
        window.DIContainer.registerInstance('PlayerSegmentationService', segmentationService);
        
        return { service: 'segmentation', status: 'initialized' };
    }
    
    async initializeABTesting() {
        const analyticsService = this.services.get('analytics');
        const segmentationService = this.services.get('segmentation');
        
        let featureFlagService;
        try {
            featureFlagService = window.DIContainer.resolve('IFeatureFlagService');
        } catch {
            featureFlagService = this.createBasicFeatureFlagService();
        }
        
        const abTestingService = new window.ABTestingService(
            analyticsService,
            segmentationService,
            featureFlagService
        );
        
        this.services.set('abTesting', abTestingService);
        window.DIContainer.registerInstance('ABTestingService', abTestingService);
        
        return { service: 'abTesting', status: 'initialized' };
    }
    
    async initializeFunnels() {
        const analyticsService = this.services.get('analytics');
        const segmentationService = this.services.get('segmentation');
        
        const funnelService = new window.ConversionFunnelService(
            analyticsService,
            segmentationService
        );
        
        this.services.set('funnels', funnelService);
        window.DIContainer.registerInstance('ConversionFunnelService', funnelService);
        
        return { service: 'funnels', status: 'initialized' };
    }
    
    async initializeDynamicOffers() {
        const analyticsService = this.services.get('analytics');
        const segmentationService = this.services.get('segmentation');
        const abTestingService = this.services.get('abTesting');
        const funnelService = this.services.get('funnels');
        
        const offerService = new window.DynamicOfferService(
            analyticsService,
            segmentationService,
            abTestingService,
            funnelService
        );
        
        this.services.set('offers', offerService);
        window.DIContainer.registerInstance('DynamicOfferService', offerService);
        
        return { service: 'offers', status: 'initialized' };
    }
    
    async initializeStrategies() {
        const analyticsService = this.services.get('analytics');
        const segmentationService = this.services.get('segmentation');
        const offerService = this.services.get('offers');
        const abTestingService = this.services.get('abTesting');
        
        const strategiesService = new window.PersonalizedMonetizationService(
            analyticsService,
            segmentationService,
            offerService,
            abTestingService
        );
        
        this.services.set('strategies', strategiesService);
        window.DIContainer.registerInstance('PersonalizedMonetizationService', strategiesService);
        
        return { service: 'strategies', status: 'initialized' };
    }
    
    async initializeCohorts() {
        const analyticsService = this.services.get('analytics');
        const segmentationService = this.services.get('segmentation');
        
        const cohortService = new window.CohortRetentionService(
            analyticsService,
            segmentationService
        );
        
        this.services.set('cohorts', cohortService);
        window.DIContainer.registerInstance('CohortRetentionService', cohortService);
        
        return { service: 'cohorts', status: 'initialized' };
    }
    
    async initializeDashboard() {
        const analyticsService = this.services.get('analytics');
        const segmentationService = this.services.get('segmentation');
        const abTestingService = this.services.get('abTesting');
        const funnelService = this.services.get('funnels');
        const offerService = this.services.get('offers');
        const strategiesService = this.services.get('strategies');
        
        const dashboardService = new window.RevenueAnalyticsDashboard(
            analyticsService,
            segmentationService,
            abTestingService,
            funnelService,
            offerService,
            strategiesService
        );
        
        this.services.set('dashboard', dashboardService);
        window.DIContainer.registerInstance('RevenueAnalyticsDashboard', dashboardService);
        
        return { service: 'dashboard', status: 'initialized' };
    }
    
    async runIntegrationTests() {
        const tests = [
            {
                name: 'Event Bus Communication',
                test: () => this.testEventBusCommunication()
            },
            {
                name: 'Service Dependencies',
                test: () => this.testServiceDependencies()
            },
            {
                name: 'Data Persistence',
                test: () => this.testDataPersistence()
            },
            {
                name: 'Player Segmentation',
                test: () => this.testPlayerSegmentation()
            },
            {
                name: 'Offer Generation',
                test: () => this.testOfferGeneration()
            }
        ];
        
        const results = {};
        
        for (const test of tests) {
            try {
                const result = await test.test();
                results[test.name] = { success: true, result };
            } catch (error) {
                results[test.name] = { success: false, error: error.message };
            }
        }
        
        const failedTests = Object.values(results).filter(r => !r.success).length;
        if (failedTests > 0) {
            throw new Error(`${failedTests} integration tests failed`);
        }
        
        return results;
    }
    
    async configureFeatureFlags() {
        const featureFlagConfig = {
            'MONETIZATION_SYSTEM_ENABLED': true,
            'DYNAMIC_OFFERS_ENABLED': true,
            'AB_TESTING_ENABLED': true,
            'REVENUE_DASHBOARD_ENABLED': true,
            'COHORT_ANALYSIS_ENABLED': true,
            'PERSONALIZED_STRATEGIES_ENABLED': true,
            'CONVERSION_FUNNELS_ENABLED': true
        };
        
        // Set feature flags
        Object.entries(featureFlagConfig).forEach(([flag, value]) => {
            try {
                window.FeatureFlags?.setFlag(flag, value);
            } catch {
                // Store in localStorage as fallback
                localStorage.setItem(`feature_flag_${flag}`, value.toString());
            }
        });
        
        return featureFlagConfig;
    }
    
    async generateInitialData() {
        const tasks = [
            {
                name: 'Player Segmentation',
                action: () => {
                    const segmentationService = this.services.get('segmentation');
                    return segmentationService?.calculatePlayerSegment();
                }
            },
            {
                name: 'Initial Offers',
                action: () => {
                    const strategiesService = this.services.get('strategies');
                    return strategiesService?.assignPersonalizedStrategy();
                }
            },
            {
                name: 'Baseline Metrics',
                action: () => {
                    const dashboardService = this.services.get('dashboard');
                    return dashboardService?.calculateAllMetrics();
                }
            }
        ];
        
        const results = {};
        
        for (const task of tasks) {
            try {
                results[task.name] = await task.action();
            } catch (error) {
                console.warn(`Failed to generate ${task.name}:`, error);
                results[task.name] = { error: error.message };
            }
        }
        
        return results;
    }
    
    async validateSystem() {
        const validations = [
            {
                name: 'All Services Running',
                check: () => this.services.size >= 6 // Minimum required services
            },
            {
                name: 'Event Bus Functional',
                check: () => typeof window.GameEventBus?.emit === 'function'
            },
            {
                name: 'Analytics Tracking',
                check: () => this.services.has('analytics')
            },
            {
                name: 'Player Segmentation',
                check: () => this.services.has('segmentation')
            },
            {
                name: 'Data Persistence',
                check: () => {
                    try {
                        localStorage.setItem('validation_test', 'test');
                        localStorage.removeItem('validation_test');
                        return true;
                    } catch {
                        return false;
                    }
                }
            }
        ];
        
        const results = {};
        let validationsPassed = 0;
        
        for (const validation of validations) {
            try {
                const passed = validation.check();
                results[validation.name] = { passed, status: passed ? 'PASS' : 'FAIL' };
                if (passed) validationsPassed++;
            } catch (error) {
                results[validation.name] = { passed: false, status: 'ERROR', error: error.message };
            }
        }
        
        const validationRate = validationsPassed / validations.length;
        if (validationRate < 0.8) { // Require 80% validation pass rate
            throw new Error(`System validation failed: ${validationsPassed}/${validations.length} checks passed`);
        }
        
        return {
            validationRate,
            validationsPassed,
            totalValidations: validations.length,
            results
        };
    }
    
    validateMinimumRequirements() {
        const criticalServices = ['analytics', 'segmentation'];
        return criticalServices.every(service => this.services.has(service));
    }
    
    // Integration test methods
    testEventBusCommunication() {
        return new Promise((resolve, reject) => {
            const testEvent = 'monetization_test_event';
            const testData = { test: true, timestamp: Date.now() };
            
            let eventReceived = false;
            
            const handler = (data) => {
                if (data.test && data.timestamp === testData.timestamp) {
                    eventReceived = true;
                    window.GameEventBus.off(testEvent, handler);
                    resolve(true);
                }
            };
            
            window.GameEventBus.on(testEvent, handler);
            window.GameEventBus.emit(testEvent, testData);
            
            // Timeout after 1 second
            setTimeout(() => {
                if (!eventReceived) {
                    window.GameEventBus.off(testEvent, handler);
                    reject(new Error('Event bus communication test failed'));
                }
            }, 1000);
        });
    }
    
    testServiceDependencies() {
        const dependencies = [
            ['segmentation', 'analytics'],
            ['offers', 'segmentation'],
            ['strategies', 'offers'],
            ['dashboard', 'analytics']
        ];
        
        for (const [service, dependency] of dependencies) {
            if (this.services.has(service) && !this.services.has(dependency)) {
                throw new Error(`Service ${service} requires ${dependency} but it's not available`);
            }
        }
        
        return true;
    }
    
    testDataPersistence() {
        const testKey = 'monetization_persistence_test';
        const testData = { test: true, timestamp: Date.now() };
        
        try {
            localStorage.setItem(testKey, JSON.stringify(testData));
            const retrieved = JSON.parse(localStorage.getItem(testKey));
            localStorage.removeItem(testKey);
            
            if (retrieved.test && retrieved.timestamp === testData.timestamp) {
                return true;
            } else {
                throw new Error('Data persistence test failed: data corruption');
            }
        } catch (error) {
            throw new Error(`Data persistence test failed: ${error.message}`);
        }
    }
    
    testPlayerSegmentation() {
        const segmentationService = this.services.get('segmentation');
        if (!segmentationService) {
            throw new Error('Segmentation service not available');
        }
        
        const segment = segmentationService.getCurrentSegment();
        if (!segment || typeof segment !== 'string') {
            throw new Error('Player segmentation test failed: invalid segment');
        }
        
        return { segment };
    }
    
    testOfferGeneration() {
        const offerService = this.services.get('offers');
        if (!offerService) {
            throw new Error('Offer service not available');
        }
        
        const testOffer = offerService.triggerManualOffer('starter_pack_basic');
        if (!testOffer) {
            throw new Error('Offer generation test failed: no offer generated');
        }
        
        return { offerId: testOffer.id };
    }
    
    // Basic service implementations (fallbacks)
    createBasicAnalyticsService() {
        return {
            trackEvent: (eventName, properties) => {
                console.log(`📊 Analytics: ${eventName}`, properties);
                // Store in localStorage for debugging
                const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
                events.push({ eventName, properties, timestamp: Date.now() });
                localStorage.setItem('analytics_events', JSON.stringify(events.slice(-100))); // Keep last 100
            },
            setUserProperties: (properties) => {
                localStorage.setItem('user_properties', JSON.stringify(properties));
            },
            getInsights: () => ({}),
            trackGameStart: () => this.trackEvent('game_start'),
            trackGameEnd: (score, duration, reason) => this.trackEvent('game_end', { score, duration, reason })
        };
    }
    
    createBasicUserProfileService() {
        return {
            getProfile: () => {
                const defaultProfile = {
                    level: 1,
                    totalPurchases: 0,
                    lastLogin: Date.now(),
                    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
                    unlockedAchievements: [],
                    friendIds: [],
                    clanId: null,
                    bestScore: 0
                };
                
                const stored = localStorage.getItem('user_profile');
                return stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile;
            },
            updateProfile: (updates) => {
                const current = this.getProfile();
                const updated = { ...current, ...updates };
                localStorage.setItem('user_profile', JSON.stringify(updated));
            },
            getCurrencies: () => ({ coins: 100, gems: 10 }),
            getProgression: () => ({ level: 1, xp: 0 })
        };
    }
    
    createBasicFeatureFlagService() {
        return {
            isEnabled: (flagName) => {
                const stored = localStorage.getItem(`feature_flag_${flagName}`);
                return stored === 'true';
            },
            setFlag: (flagName, value) => {
                localStorage.setItem(`feature_flag_${flagName}`, value.toString());
            }
        };
    }
    
    startSystemMonitoring() {
        // Monitor system health every 5 minutes
        setInterval(() => {
            this.performHealthCheck();
        }, 5 * 60 * 1000);
        
        // Monitor performance every minute
        setInterval(() => {
            this.performPerformanceCheck();
        }, 60 * 1000);
    }
    
    performHealthCheck() {
        const healthStatus = {
            timestamp: Date.now(),
            services: {},
            overallHealth: 'healthy'
        };
        
        this.services.forEach((service, name) => {
            try {
                // Basic health check - verify service exists and has expected methods
                const isHealthy = service && typeof service === 'object';
                healthStatus.services[name] = isHealthy ? 'healthy' : 'unhealthy';
                
                if (!isHealthy) {
                    healthStatus.overallHealth = 'degraded';
                }
            } catch (error) {
                healthStatus.services[name] = 'error';
                healthStatus.overallHealth = 'unhealthy';
            }
        });
        
        // Store health status
        localStorage.setItem('monetization_health', JSON.stringify(healthStatus));
        
        // Track health status
        const analyticsService = this.services.get('analytics');
        analyticsService?.trackEvent('monetization_health_check', healthStatus);
    }
    
    performPerformanceCheck() {
        const performanceMetrics = {
            timestamp: Date.now(),
            servicesCount: this.services.size,
            memoryUsage: this.estimateMemoryUsage(),
            eventBusMetrics: this.getEventBusMetrics()
        };
        
        localStorage.setItem('monetization_performance', JSON.stringify(performanceMetrics));
    }
    
    estimateMemoryUsage() {
        // Rough estimate of memory usage
        try {
            const dataSize = JSON.stringify(Object.fromEntries(this.services)).length;
            return { estimatedBytes: dataSize };
        } catch {
            return { estimatedBytes: 0 };
        }
    }
    
    getEventBusMetrics() {
        try {
            return window.GameEventBus?.getMetrics() || {};
        } catch {
            return {};
        }
    }
    
    generateInitializationReport(success, startTime) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const report = {
            success,
            duration,
            timestamp: endTime,
            services: Array.from(this.services.keys()),
            validationResults: Object.fromEntries(this.validationResults),
            systemHealth: success ? 'healthy' : 'unhealthy',
            recommendations: this.generateRecommendations()
        };
        
        // Store report
        localStorage.setItem('monetization_init_report', JSON.stringify(report));
        
        return report;
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        // Check for missing optional services
        const optionalServices = ['abTesting', 'cohorts', 'dashboard'];
        optionalServices.forEach(service => {
            if (!this.services.has(service)) {
                recommendations.push({
                    type: 'enhancement',
                    priority: 'low',
                    message: `Consider enabling ${service} service for enhanced monetization insights`
                });
            }
        });
        
        // Check validation results
        this.validationResults.forEach((result, stepId) => {
            if (!result.success) {
                recommendations.push({
                    type: 'fix',
                    priority: 'high',
                    message: `Address failed initialization step: ${stepId}`
                });
            }
        });
        
        return recommendations;
    }
    
    trackInitialization(report) {
        const analyticsService = this.services.get('analytics');
        analyticsService?.trackEvent('monetization_system_initialized', {
            success: report.success,
            duration: report.duration,
            servicesCount: report.services.length,
            systemHealth: report.systemHealth
        });
    }
    
    // Public API
    getSystemStatus() {
        return {
            initialized: this.isInitialized,
            services: Array.from(this.services.keys()),
            health: this.getSystemHealth(),
            lastReport: this.getLastReport()
        };
    }
    
    getSystemHealth() {
        try {
            const stored = localStorage.getItem('monetization_health');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }
    
    getLastReport() {
        try {
            const stored = localStorage.getItem('monetization_init_report');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }
    
    getService(serviceName) {
        return this.services.get(serviceName);
    }
    
    // Manual service restart
    async restartService(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service ${serviceName} not found`);
        }
        
        // Dispose existing service
        if (typeof service.dispose === 'function') {
            service.dispose();
        }
        
        // Reinitialize
        const initStep = this.initializationSteps.find(step => 
            step.id.includes(serviceName) || step.name.toLowerCase().includes(serviceName)
        );
        
        if (initStep) {
            await initStep.execute();
            console.log(`🔄 Service ${serviceName} restarted`);
        }
    }
    
    // Cleanup
    dispose() {
        this.services.forEach((service, name) => {
            if (typeof service.dispose === 'function') {
                try {
                    service.dispose();
                } catch (error) {
                    console.warn(`Error disposing service ${name}:`, error);
                }
            }
        });
        
        this.services.clear();
        this.validationResults.clear();
        this.isInitialized = false;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for other systems to initialize
    setTimeout(async () => {
        if (!window.MonetizationSystem) {
            const initializer = new MonetizationInitializer();
            const report = await initializer.initialize();
            
            // Make available globally
            window.MonetizationSystem = {
                initializer,
                report,
                services: initializer.services,
                getStatus: () => initializer.getSystemStatus(),
                restart: (service) => initializer.restartService(service)
            };
            
            console.log('💰 Monetization system ready!');
            
            // Emit system ready event
            if (window.GameEventBus) {
                window.GameEventBus.emit('monetization:system_ready', {
                    success: report.success,
                    services: report.services
                });
            }
        }
    }, 2000); // 2 second delay to ensure other systems are ready
});

// Export for manual initialization
window.MonetizationInitializer = MonetizationInitializer;
export { MonetizationInitializer };