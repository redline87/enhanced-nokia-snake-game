// Game Initializer - King/Blizzard Architecture Implementation
// Implements SOLID principles with dependency injection and event-driven architecture

class GameInitializer {
    constructor() {
        this.container = window.DIContainer;
        this.eventBus = window.GameEventBus;
        this.initializationSteps = [
            'registerInterfaces',
            'registerCoreServices', 
            'registerGameSystems',
            'registerSecurityServices',
            'initializeGame'
        ];
        
        this.currentStep = 0;
        this.initializationErrors = [];
    }
    
    async initialize() {
        console.log('🎮 Starting King/Blizzard Architecture Initialization...');
        
        try {
            for (const step of this.initializationSteps) {
                await this.executeStep(step);
                this.currentStep++;
            }
            
            console.log('✅ Game initialization completed successfully!');
            this.eventBus.emit('system:initialization_complete');
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
            this.handleInitializationFailure(error);
        }
    }
    
    async executeStep(stepName) {
        console.log(`🔧 Executing step: ${stepName}`);
        
        try {
            await this[stepName]();
            console.log(`✅ Step completed: ${stepName}`);
        } catch (error) {
            console.error(`❌ Step failed: ${stepName}`, error);
            this.initializationErrors.push({ step: stepName, error });
            throw error;
        }
    }
    
    // Step 1: Register all interfaces with the DI container
    registerInterfaces() {
        console.log('📝 Registering service interfaces...');
        
        // Register interface mappings - this allows us to inject by interface
        const interfaces = [
            'IAnalyticsService', 'IMonetizationService', 'IUserProfileService',
            'IBattlePassService', 'IClanService', 'INotificationService',
            'ISocialService', 'IAchievementService', 'ISeasonService',
            'ISecurityService', 'IDataService', 'IEventBus', 'IFeatureFlagService',
            'IAudioService', 'IGameEngine'
        ];
        
        // For now, we'll map interfaces to concrete implementations
        // In a full implementation, these would be properly abstracted
        const mappings = {
            'IEventBus': 'EventBus',
            'IFeatureFlagService': 'FeatureFlagService'
        };
        
        Object.entries(mappings).forEach(([interfaceName, implementationName]) => {
            if (window[implementationName]) {
                this.container.register(interfaceName, window[implementationName], [], {
                    singleton: true,
                    interface: interfaceName
                });
            }
        });
    }
    
    // Step 2: Register core services with proper dependency injection
    registerCoreServices() {
        console.log('🏗️ Registering core services...');
        
        // Event Bus (no dependencies)
        this.container.registerInstance('IEventBus', this.eventBus);
        
        // Analytics Service (depends on EventBus)
        this.container.register('AnalyticsManager', AnalyticsManager, ['IEventBus'], {
            singleton: true,
            interface: 'IAnalyticsService'
        });
        
        // Security Service (depends on Analytics)
        this.container.register('SecureClient', SecureClient, ['IAnalyticsService'], {
            singleton: true,
            interface: 'ISecurityService'
        });
        
        // Data Manager (no dependencies)
        this.container.register('DataManager', DataManager, [], {
            singleton: true,
            interface: 'IDataService'
        });
        
        // Audio Manager (no dependencies)
        this.container.register('AudioManager', AudioManager, [], {
            singleton: true,
            interface: 'IAudioService'
        });
    }
    
    // Step 3: Register game-specific services
    registerGameSystems() {
        console.log('🎮 Registering game systems...');
        
        // User Profile Service (depends on Analytics, DataService)
        this.container.register('UserProfileManager', UserProfileManager, ['IAnalyticsService'], {
            singleton: true,
            interface: 'IUserProfileService'
        });
        
        // Season Manager (depends on UserProfile, Analytics)
        this.container.register('SeasonManager', SeasonManager, ['IUserProfileService', 'IAnalyticsService'], {
            singleton: true,
            interface: 'ISeasonService'
        });
        
        // Achievement Manager (depends on Analytics)
        this.container.register('AchievementManager', AchievementManager, ['IAnalyticsService'], {
            singleton: true,
            interface: 'IAchievementService'
        });
        
        // Social Manager (depends on Analytics, AchievementService)
        this.container.register('SocialManager', SocialManager, ['IAnalyticsService', 'IAchievementService'], {
            singleton: true,
            interface: 'ISocialService'
        });
        
        // Monetization Manager (depends on Analytics)
        this.container.register('MonetizationManager', MonetizationManager, ['IAnalyticsService'], {
            singleton: true,
            interface: 'IMonetizationService'
        });
        
        // Battle Pass Manager (depends on UserProfile, SeasonService, Analytics)
        this.container.register('BattlePassManager', BattlePassManager, [
            'IUserProfileService', 'ISeasonService', 'IAnalyticsService'
        ], {
            singleton: true,
            interface: 'IBattlePassService'
        });
        
        // Clan Manager (depends on UserProfile, Analytics)
        this.container.register('ClanManager', ClanManager, ['IUserProfileService', 'IAnalyticsService'], {
            singleton: true,
            interface: 'IClanService'
        });
        
        // Notification Manager (depends on UserProfile, Analytics)
        this.container.register('NotificationManager', NotificationManager, ['IUserProfileService', 'IAnalyticsService'], {
            singleton: true,
            interface: 'INotificationService'
        });
    }
    
    // Step 4: Register security services
    registerSecurityServices() {
        console.log('🔒 Registering security services...');
        
        // Feature Flag Service is already registered in its own initializer
        
        // Register security middleware
        this.container.addMiddleware((instance, serviceName) => {
            // Add security wrapper for sensitive operations
            if (this.isSensitiveService(serviceName)) {
                return this.wrapWithSecurity(instance, serviceName);
            }
            return instance;
        });
    }
    
    // Step 5: Initialize the main game with all dependencies
    async initializeGame() {
        console.log('🎲 Initializing main game...');
        
        // Initialize Game Engine with canvas ID
        this.container.registerFactory('IGameEngine', () => new GameEngine('gameCanvas'), []);
        
        // Initialize Score Manager
        this.container.register('ScoreManager', ScoreManager, [], {
            singleton: true
        });
        
        // Initialize UI Controller with dependencies
        this.container.register('UIController', UIController, [
            'IGameEngine', 'ScoreManager', 'IAudioService'
        ], {
            singleton: true
        });
        
        // Create the main game instance using dependency injection
        const gameInstance = new EnhancedSnakeGame();
        
        // Register as singleton
        this.container.registerInstance('SnakeGame', gameInstance);
        
        // Set global reference for backwards compatibility
        window.snakeGame = gameInstance;
        
        // Wire up event handlers using the event bus
        this.wireEventHandlers();
        
        // Initialize UI
        const uiController = this.container.resolve('UIController');
        uiController.updateHighScore();
        uiController.showGameStart();
    }
    
    // Wire up event handlers using the event bus for loose coupling
    wireEventHandlers() {
        console.log('🔌 Wiring event handlers...');
        
        // Game events
        this.eventBus.on(GameEvents.GAME_START, (data) => {
            const analytics = this.container.resolve('IAnalyticsService');
            analytics.trackGameStart();
            
            const security = this.container.resolve('ISecurityService');
            security.startGameSession();
        });
        
        this.eventBus.on(GameEvents.GAME_END, async (data) => {
            const { score, duration, applesEaten, isNewRecord } = data;
            
            // Update all systems asynchronously
            const promises = [];
            
            // Analytics
            const analytics = this.container.resolve('IAnalyticsService');
            promises.push(analytics.trackGameEnd(score, duration, 'collision'));
            
            // User profile
            const userProfile = this.container.resolve('IUserProfileService');
            promises.push(userProfile.onGameEnd({ score, duration, applesEaten, isNewRecord }));
            
            // Battle Pass
            if (this.container.has('IBattlePassService')) {
                const battlePass = this.container.resolve('IBattlePassService');
                promises.push(battlePass.onGameEnd({ score, duration, applesEaten, isNewRecord }));
            }
            
            // Clan system
            if (this.container.has('IClanService')) {
                const clanManager = this.container.resolve('IClanService');
                promises.push(clanManager.onGameEnd({ score, duration, applesEaten, isNewRecord }));
            }
            
            // Security validation
            const security = this.container.resolve('ISecurityService');
            promises.push(security.validateScore({ score, duration, applesEaten }));
            
            // Wait for all updates
            await Promise.allSettled(promises);
        });
        
        // Achievement events
        this.eventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (data) => {
            const { achievement } = data;
            
            // Award Battle Pass XP
            if (this.container.has('IBattlePassService')) {
                const battlePass = this.container.resolve('IBattlePassService');
                battlePass.onAchievementUnlocked(achievement);
            }
        });
        
        // Currency events
        this.eventBus.on(GameEvents.CURRENCY_EARNED, async (data) => {
            const { type, amount, source } = data;
            
            // Validate with security service
            const security = this.container.resolve('ISecurityService');
            const validation = await security.validateCurrencyChange(type, amount, source);
            
            if (!validation.valid) {
                console.warn('Currency validation failed:', validation.reason);
                // Apply server correction
                if (validation.correctedState) {
                    this.eventBus.emit(GameEvents.CURRENCY_UPDATED, validation.correctedState);
                }
            }
        });
    }
    
    // Check if service handles sensitive operations
    isSensitiveService(serviceName) {
        const sensitiveServices = [
            'IMonetizationService', 'IBattlePassService', 'IUserProfileService',
            'IClanService', 'ISecurityService'
        ];
        return sensitiveServices.includes(serviceName);
    }
    
    // Wrap sensitive services with security checks
    wrapWithSecurity(instance, serviceName) {
        const securityWrapper = {
            ...instance,
            __original: instance,
            __serviceName: serviceName
        };
        
        // Wrap methods that modify valuable state
        const secureMethods = ['addCurrency', 'spendCurrency', 'purchaseItem', 'claimReward'];
        
        secureMethods.forEach(methodName => {
            if (typeof instance[methodName] === 'function') {
                const originalMethod = instance[methodName];
                
                securityWrapper[methodName] = async function(...args) {
                    // Check if security service is available
                    if (window.DIContainer.has('ISecurityService')) {
                        const security = window.DIContainer.resolve('ISecurityService');
                        
                        // Add security validation here if needed
                        if (!security.isSecurelyConnected()) {
                            throw new Error('Secure connection required for sensitive operations');
                        }
                    }
                    
                    return originalMethod.apply(this, args);
                };
            }
        });
        
        return securityWrapper;
    }
    
    handleInitializationFailure(error) {
        // Create minimal game mode for emergency fallback
        console.log('🆘 Entering emergency mode...');
        
        try {
            // Create basic game engine
            const basicEngine = new GameEngine('gameCanvas');
            const basicScore = new ScoreManager();
            const basicAudio = new AudioManager();
            const basicUI = new UIController(basicEngine, basicScore, basicAudio);
            
            // Set global references
            window.snakeGame = {
                engine: basicEngine,
                scoreManager: basicScore,
                audioManager: basicAudio,
                uiController: basicUI,
                emergencyMode: true
            };
            
            // Initialize basic UI
            basicUI.updateHighScore();
            basicUI.showGameStart();
            
            console.log('🎮 Emergency mode initialized - basic gameplay available');
            
        } catch (emergencyError) {
            console.error('💥 Emergency mode failed:', emergencyError);
            
            // Show error to user
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="
                    position: fixed; 
                    top: 50%; 
                    left: 50%; 
                    transform: translate(-50%, -50%);
                    background: #dc3545; 
                    color: white; 
                    padding: 30px; 
                    border-radius: 15px; 
                    text-align: center;
                    z-index: 10000;
                    font-family: monospace;
                    max-width: 400px;
                ">
                    <h3>⚠️ Game Initialization Failed</h3>
                    <p>The game could not be loaded properly.</p>
                    <button onclick="location.reload()" style="
                        background: white; 
                        color: #dc3545; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer; 
                        font-weight: bold; 
                        margin: 10px;
                    ">🔄 Reload Game</button>
                    <details style="margin-top: 15px; text-align: left;">
                        <summary style="cursor: pointer;">Technical Details</summary>
                        <pre style="font-size: 11px; margin: 10px 0; overflow: auto; max-height: 150px;">${JSON.stringify(this.initializationErrors, null, 2)}</pre>
                    </details>
                </div>
            `;
            document.body.appendChild(errorDiv);
        }
    }
}

// Enhanced Snake Game class using dependency injection
class EnhancedSnakeGame {
    constructor() {
        // Resolve dependencies from container
        this.container = window.DIContainer;
        this.eventBus = window.GameEventBus;
        
        // Core dependencies
        this.engine = this.container.resolve('IGameEngine');
        this.scoreManager = this.container.resolve('ScoreManager');
        this.audioManager = this.container.resolve('IAudioService');
        this.uiController = this.container.resolve('UIController');
        
        // Live service dependencies
        this.analytics = this.container.resolve('IAnalyticsService');
        this.userProfile = this.container.resolve('IUserProfileService');
        this.security = this.container.resolve('ISecurityService');
        
        // Optional dependencies (may not be available in all configurations)
        this.battlePass = this.container.has('IBattlePassService') ? 
            this.container.resolve('IBattlePassService') : null;
            
        this.clanManager = this.container.has('IClanService') ? 
            this.container.resolve('IClanService') : null;
            
        this.featureFlags = this.container.has('IFeatureFlagService') ? 
            this.container.resolve('IFeatureFlagService') : null;
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎮 Enhanced Snake Game initializing with DI architecture...');
        
        // Set up UI controller reference
        this.uiController.setGame(this);
        
        // Set up game event handlers using event bus
        this.setupEventHandlers();
        
        // Initialize based on feature flags
        this.initializeFeatures();
        
        // Start game loop
        this.engine.gameLoop();
        
        console.log('✅ Enhanced Snake Game ready!');
    }
    
    setupEventHandlers() {
        // Use event bus instead of direct coupling
        this.engine.onGameStart = () => {
            this.eventBus.emit(GameEvents.GAME_START, {
                timestamp: Date.now()
            });
        };
        
        this.engine.onGameEnd = () => {
            const gameData = {
                score: this.engine.getScore(),
                duration: this.currentGameDuration(),
                applesEaten: this.foodEaten || 0,
                isNewRecord: this.engine.getScore() > this.scoreManager.getLocalHighScore(),
                timestamp: Date.now()
            };
            
            this.eventBus.emit(GameEvents.GAME_END, gameData);
        };
        
        this.engine.onFoodEaten = () => {
            this.audioManager.playEatSound();
            this.uiController.updateScore(this.engine.getScore());
            this.foodEaten = (this.foodEaten || 0) + 1;
            
            this.eventBus.emit(GameEvents.SCORE_UPDATE, {
                score: this.engine.getScore(),
                applesEaten: this.foodEaten
            });
        };
    }
    
    initializeFeatures() {
        if (this.featureFlags) {
            // Initialize features based on flags
            if (this.featureFlags.isEnabled('ENHANCED_ANTI_CHEAT')) {
                console.log('🔒 Enhanced anti-cheat enabled');
            }
            
            if (this.featureFlags.isEnabled('LAZY_LOADING')) {
                console.log('⚡ Lazy loading enabled');
            }
        }
    }
    
    currentGameDuration() {
        return this.gameStartTime ? Date.now() - this.gameStartTime : 0;
    }
    
    // Public API methods
    toggleGame() {
        if (this.engine.isGameOver()) {
            this.engine.restart();
        } else if (this.engine.isRunning()) {
            this.engine.pause();
        } else {
            this.engine.start();
        }
    }
    
    setDirection(x, y) {
        return this.engine.setDirection(x, y);
    }
    
    get gameRunning() {
        return this.engine.isRunning();
    }
    
    get gameOver() {
        return this.engine.isGameOver();
    }
    
    get score() {
        return this.engine.getScore();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const initializer = new GameInitializer();
    await initializer.initialize();
});

// Export for testing
window.GameInitializer = GameInitializer;
window.EnhancedSnakeGame = EnhancedSnakeGame;