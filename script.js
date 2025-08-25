// Enhanced Snake Game - Live Service Platform (Phase 5A)
class SnakeGame {
    constructor() {
        console.log('🎮 Initializing Snake Game Live Service Platform...');
        
        try {
            // Initialize Phase 5A Foundation Systems first
            console.log('🔧 Phase 5A: Foundation Systems...');
            this.dataManager = this.safeInitialize(() => new DataManager(), 'DataManager');
            this.userProfile = this.safeInitialize(() => new UserProfileManager(null), 'UserProfileManager');
            
            // Initialize core modules
            console.log('🔧 Core Systems...');
            this.engine = this.safeInitialize(() => new GameEngine('gameCanvas'), 'GameEngine');
            this.scoreManager = this.safeInitialize(() => new ScoreManager(), 'ScoreManager');
            this.audioManager = this.safeInitialize(() => new AudioManager(), 'AudioManager');
            
            // Initialize Phase 3 & 4 modules with user profile
            console.log('🔧 Phase 3 & 4: Analytics & Monetization...');
            this.analytics = this.safeInitialize(() => new AnalyticsManager(), 'AnalyticsManager');
            this.achievements = this.safeInitialize(() => new AchievementManager(this.analytics), 'AchievementManager');
            this.challenges = this.safeInitialize(() => new ChallengeManager(this.analytics, this.achievements), 'ChallengeManager');
            this.social = this.safeInitialize(() => new SocialManager(this.analytics, this.achievements), 'SocialManager');
            this.monetization = this.safeInitialize(() => new MonetizationManager(this.analytics), 'MonetizationManager');
            
            // Initialize Phase 5A Live Service modules
            console.log('🔧 Phase 5A: Live Service Systems...');
            this.seasonManager = this.safeInitialize(() => new SeasonManager(this.userProfile, this.analytics), 'SeasonManager');
            this.cloudSave = this.safeInitialize(() => new CloudSaveManager(this.userProfile, this.analytics), 'CloudSaveManager');
            this.notifications = this.safeInitialize(() => new NotificationManager(this.userProfile, this.analytics), 'NotificationManager');
            
            // Initialize Phase 5B Battle Pass System
            console.log('🔧 Phase 5B: Battle Pass System...');
            this.battlePass = this.safeInitialize(() => new BattlePassManager(this.userProfile, this.seasonManager, this.analytics), 'BattlePassManager');
            
            // Initialize Phase 5C Clan Wars & Social System
            console.log('🔧 Phase 5C: Clan Wars System...');
            this.clanManager = this.safeInitialize(() => new ClanManager(this.userProfile, this.analytics), 'ClanManager');
            
            // Connect analytics to user profile
            if (this.userProfile && this.analytics) {
                this.userProfile.analytics = this.analytics;
            }
            
            console.log('✅ All systems initialized successfully');
            
        } catch (error) {
            console.error('❌ Critical error during initialization:', error);
            this.handleInitializationFailure(error);
            return;
        }
        
        // Initialize UI controller with all dependencies
        this.uiController = new UIController(this.engine, this.scoreManager, this.audioManager);
        
        // Set circular reference for UI to access main game methods
        this.uiController.setGame(this);
        
        // Set up event handlers
        this.setupGameEventHandlers();
        
        // Store global references for other modules (Phase 5A, 5B & 5C)
        window.socialManager = this.social;
        window.userProfile = this.userProfile;
        window.seasonManager = this.seasonManager;
        window.dataManager = this.dataManager;
        window.battlePass = this.battlePass;
        window.clanManager = this.clanManager;
        
        // Apply UI fixes after a short delay to ensure all components are loaded
        setTimeout(() => {
            if (window.uiFixManager) {
                window.uiFixManager.fixPremiumButtonOverlay();
                window.uiFixManager.fixModalOverlaps();
            }
        }, 2000);
        
        // Initialize UI
        this.uiController.updateHighScore();
        this.uiController.showGameStart();
        
        // Start the game loop
        this.engine.gameLoop();
        
        // Prevent zoom on double tap (mobile)
        this.preventMobileZoom();
    }
    
    setupGameEventHandlers() {
        // Connect game engine events to all systems
        this.engine.onFoodEaten = () => {
            this.audioManager.playEatSound();
            this.uiController.updateScore(this.engine.getScore());
            
            // Track food eaten for achievements
            this.foodEaten = (this.foodEaten || 0) + 1;
        };
        
        this.engine.onGameOver = () => {
            this.handleGameEnd();
        };
        
        this.engine.onGameStart = () => {
            this.handleGameStart();
        };
        
        this.engine.onGamePause = () => {
            this.uiController.showGamePaused();
            this.analytics.trackEvent('game_pause', {
                score: this.engine.getScore(),
                duration: this.currentGameDuration()
            });
        };
        
        this.engine.onGameResume = () => {
            this.uiController.hideOverlay();
            this.analytics.trackEvent('game_resume', {
                score: this.engine.getScore()
            });
        };
        
        this.engine.onGameRestart = () => {
            this.handleGameRestart();
        };
    }
    
    handleGameStart() {
        this.gameStartTime = Date.now();
        this.foodEaten = 0;
        
        // Apply any active monetization bonuses
        const bonus = this.monetization.applyActiveBonus();
        if (bonus) {
            this.applyGameBonus(bonus);
        }
        
        // Audio and UI
        this.audioManager.playStartSound();
        this.uiController.hideOverlay();
        this.social.showShareButton(false); // Hide share button during gameplay
        
        // Analytics and tracking
        this.analytics.trackGameStart();
        this.monetization.onGameStart();
    }
    
    handleGameEnd() {
        const score = this.engine.getScore();
        const duration = this.currentGameDuration();
        const isNewRecord = score > this.scoreManager.getLocalHighScore();
        
        // Update user profile first (Phase 5A integration)
        this.userProfile.onGameEnd({
            score: score,
            duration: duration,
            applesEaten: this.foodEaten,
            isNewRecord: isNewRecord
        });
        
        // Update Battle Pass progress (Phase 5B integration)
        this.battlePass.onGameEnd({
            score: score,
            duration: duration,
            applesEaten: this.foodEaten,
            isNewRecord: isNewRecord
        });
        
        // Update Clan Wars progress (Phase 5C integration)
        this.clanManager.onGameEnd({
            score: score,
            duration: duration,
            applesEaten: this.foodEaten,
            isNewRecord: isNewRecord
        });
        
        // Update all tracking systems
        this.updateAllProgress(score, duration, isNewRecord);
        
        // Handle UI and social features
        this.uiController.handleGameOver(score);
        this.social.showShareButton(true);
        
        // Custom events for monetization system
        const gameEndEvent = new CustomEvent('gameEnd', {
            detail: { score, duration, isNewRecord, completed: true }
        });
        document.dispatchEvent(gameEndEvent);
        
        // Show social sharing for high scores
        if (isNewRecord && score > 50) {
            setTimeout(() => {
                this.social.shareScore(score, isNewRecord);
            }, 2000);
        }
        
        // Trigger cloud save for important progress
        if (this.cloudSave.isCloudSaveEnabled()) {
            this.cloudSave.forceSyncNow();
        }
        
        // Schedule re-engagement notifications
        this.notifications.rescheduleEngagementNotifications();
    }
    
    handleGameRestart() {
        this.audioManager.playStartSound();
        this.uiController.updateScore(0);
        this.uiController.hideOverlay();
        this.social.showShareButton(false);
        
        // Track restart
        this.analytics.trackEvent('game_restart', {
            previousScore: this.lastScore || 0
        });
    }
    
    updateAllProgress(score, duration, isNewRecord) {
        this.lastScore = score;
        
        // Analytics tracking
        this.analytics.trackGameEnd(score, duration, 'collision');
        
        // Achievement progress
        const achievementProgress = this.achievements.updateStats({
            score: score,
            totalGames: 1,
            gamesThisSession: 1,
            gameDuration: duration,
            bestScore: isNewRecord ? score : undefined,
            applesEaten: this.foodEaten
        });
        
        // Check for new achievement unlocks for Battle Pass XP
        if (achievementProgress && achievementProgress.newUnlocks) {
            achievementProgress.newUnlocks.forEach(achievement => {
                this.battlePass.onAchievementUnlocked(achievement);
            });
        }
        
        // Challenge progress
        const challengeProgress = this.challenges.updateProgress({
            score: score,
            duration: duration,
            completed: true,
            applesEaten: this.foodEaten,
            previousBest: this.scoreManager.getLocalHighScore()
        });
        
        // Check for challenge completion for Battle Pass XP
        if (challengeProgress && challengeProgress.completed) {
            this.battlePass.onChallengeCompleted(challengeProgress.challenge);
        }
    }
    
    applyGameBonus(bonus) {
        switch (bonus.type) {
            case 'bonus_points':
                // Add bonus points at game start
                this.engine.score += bonus.value;
                this.uiController.updateScore(this.engine.getScore());
                this.showBonusNotification(`🌟 +${bonus.value} Bonus Points!`);
                break;
                
            case 'multiplier':
                this.activeMultiplier = bonus.value;
                this.showBonusNotification(`⚡ ${bonus.value}x Score Multiplier Active!`);
                break;
        }
    }
    
    showBonusNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #f6d55c, #ed8936);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-weight: bold;
            z-index: 1001;
            box-shadow: 0 4px 20px rgba(246, 213, 92, 0.3);
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    currentGameDuration() {
        return this.gameStartTime ? Date.now() - this.gameStartTime : 0;
    }
    
    // Game control methods (called by UIController)
    setDirection(x, y) {
        const success = this.engine.setDirection(x, y);
        
        if (success) {
            // Visual feedback for direction changes
            this.highlightDirectionButton(x, y);
        }
        
        return success;
    }
    
    highlightDirectionButton(x, y) {
        const buttonMap = {
            '0,-1': 'up',
            '0,1': 'down',
            '-1,0': 'left',
            '1,0': 'right'
        };
        
        const buttonId = buttonMap[`${x},${y}`];
        if (buttonId) {
            const button = document.getElementById(buttonId);
            if (button) {
                this.uiController.animateButton(button);
            }
        }
    }
    
    toggleGame() {
        if (this.engine.isGameOver()) {
            // Don't auto-restart - wait for user to dismiss game over overlay first
            return;
        } else if (this.engine.isRunning()) {
            this.engine.pause();
        } else {
            this.engine.start();
        }
        
        // Animate center button
        const centerBtn = document.getElementById('select');
        if (centerBtn) {
            this.uiController.animateButton(centerBtn);
        }
    }
    
    // Getters for external access
    get gameRunning() {
        return this.engine.isRunning();
    }
    
    get gameOver() {
        return this.engine.isGameOver();
    }
    
    get score() {
        return this.engine.getScore();
    }
    
    // Error handling and reliability methods (Google-style)
    safeInitialize(initFunction, componentName) {
        try {
            const component = initFunction();
            console.log(`✅ ${componentName} initialized successfully`);
            return component;
        } catch (error) {
            console.error(`❌ Failed to initialize ${componentName}:`, error);
            this.logInitializationError(componentName, error);
            return this.createFallbackComponent(componentName);
        }
    }
    
    createFallbackComponent(componentName) {
        // Create minimal fallback to prevent crashes
        const fallback = {
            isStub: true,
            componentName: componentName,
            // Add basic methods that might be called
            destroy: () => console.log(`Fallback ${componentName} destroyed`),
            // Catch-all method for any calls
            __proto__: new Proxy({}, {
                get(target, prop) {
                    return () => {
                        console.warn(`Called ${prop} on fallback ${componentName}`);
                        return null;
                    };
                }
            })
        };
        
        console.log(`🔧 Created fallback for ${componentName}`);
        return fallback;
    }
    
    logInitializationError(componentName, error) {
        // Log detailed error information for debugging
        const errorInfo = {
            component: componentName,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Store error in localStorage for debugging
        try {
            const errors = JSON.parse(localStorage.getItem('gameInitErrors') || '[]');
            errors.push(errorInfo);
            localStorage.setItem('gameInitErrors', JSON.stringify(errors.slice(-10))); // Keep last 10 errors
        } catch (e) {
            console.error('Failed to log error to localStorage:', e);
        }
        
        // Track error in analytics if available
        if (window.gtag) {
            gtag('event', 'initialization_error', {
                component: componentName,
                error_message: error.message
            });
        }
    }
    
    handleInitializationFailure(error) {
        console.error('🚨 Game initialization failed completely:', error);
        
        // Show user-friendly error message
        this.showInitializationError(error);
        
        // Try to initialize minimal game mode
        this.initializeMinimalMode();
    }
    
    showInitializationError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed; 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%);
                background: #ff4444; 
                color: white; 
                padding: 30px; 
                border-radius: 15px; 
                text-align: center;
                z-index: 9999;
                font-family: monospace;
                max-width: 400px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            ">
                <h3 style="margin: 0 0 15px 0;">⚠️ Initialization Error</h3>
                <p style="margin: 10px 0;">Some game features failed to load, but the core game should still work.</p>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #ff4444;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    margin: 10px 5px;
                ">🔄 Refresh Page</button>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px 5px;
                ">Continue Anyway</button>
                <details style="margin-top: 15px; text-align: left;">
                    <summary style="cursor: pointer;">Technical Details</summary>
                    <pre style="font-size: 11px; margin: 10px 0; overflow: auto; max-height: 100px;">${error.stack || error.message}</pre>
                </details>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
    
    initializeMinimalMode() {
        try {
            // Initialize only core systems needed for basic gameplay
            if (!this.engine) {
                this.engine = new GameEngine('gameCanvas');
            }
            if (!this.scoreManager) {
                this.scoreManager = new ScoreManager();
            }
            if (!this.audioManager) {
                this.audioManager = new AudioManager();
            }
            if (!this.uiController) {
                this.uiController = new UIController(this.engine, this.scoreManager, this.audioManager);
                this.uiController.setGame(this);
            }
            
            console.log('🎮 Minimal game mode initialized');
        } catch (error) {
            console.error('❌ Even minimal mode failed:', error);
        }
    }
    
    // Mobile optimization
    preventMobileZoom() {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    // Debug methods (for development)
    getPerformanceStats() {
        return {
            fps: this.engine.getFPS(),
            snakeLength: this.engine.getSnakeLength(),
            gameSpeed: this.engine.getSpeed(),
            score: this.engine.getScore(),
            
            // Analytics data
            sessionStats: this.analytics.getInsights().sessionStats,
            userProfile: this.analytics.getInsights().userProfile,
            
            // Achievement progress
            achievementProgress: this.achievements.getProgress(),
            
            // Challenge status
            currentChallenge: this.challenges.getCurrentChallengeInfo(),
            
            // Monetization status
            isPremium: this.monetization.isAdFree(),
            premiumCurrency: this.monetization.getPremiumCurrency(),
            
            // Phase 5A Status
            userProfile: this.userProfile.getProfile(),
            seasonInfo: this.seasonManager.getCurrentSeason(),
            cloudSaveEnabled: this.cloudSave.isCloudSaveEnabled(),
            notificationsEnabled: this.notifications.hasNotificationPermission(),
            
            // Phase 5B Status
            battlePassTier: this.battlePass.getCurrentTier(),
            battlePassXP: this.battlePass.getCurrentXP(),
            hasPremiumPass: this.battlePass.hasPremiumPass(),
            
            // Phase 5C Status
            clanId: this.clanManager.getClanId(),
            clanRole: this.clanManager.getClanRole(),
            clanRank: this.clanManager.getClanRank(),
            clanPoints: this.clanManager.getClanPoints(),
            currentWar: this.clanManager.getCurrentWar()?.name || 'None'
        };
    }
    
    // Analytics API for external access
    getAnalyticsData() {
        return this.analytics.getInsights();
    }
    
    // Achievement API
    getAchievements() {
        return {
            unlocked: this.achievements.getUnlockedAchievements(),
            progress: this.achievements.getProgress(),
            stats: this.achievements.getCurrentStats()
        };
    }
    
    // Phase 5A APIs
    getUserProfile() {
        return this.userProfile.getProfile();
    }
    
    getCurrentSeason() {
        return this.seasonManager.getCurrentSeason();
    }
    
    getCloudSaveStatus() {
        return {
            enabled: this.cloudSave.isCloudSaveEnabled(),
            lastSync: this.cloudSave.getLastSyncTimestamp(),
            online: this.cloudSave.isOnlineMode()
        };
    }
    
    // Phase 5B APIs
    getBattlePassStatus() {
        return {
            currentTier: this.battlePass.getCurrentTier(),
            currentXP: this.battlePass.getCurrentXP(),
            hasPremiumPass: this.battlePass.hasPremiumPass(),
            seasonId: this.seasonManager.getCurrentSeason().id,
            progress: this.battlePass.getCurrentTierProgress(),
            unclaimedRewards: this.battlePass.hasUnclaimedRewards()
        };
    }
    
    getBattlePassData() {
        return this.battlePass.getBattlePassData();
    }
    
    // Phase 5C APIs
    getClanStatus() {
        return {
            clanId: this.clanManager.getClanId(),
            clanName: this.clanManager.getClanName(),
            clanRole: this.clanManager.getClanRole(),
            clanRank: this.clanManager.getClanRank(),
            clanPoints: this.clanManager.getClanPoints(),
            currentWar: this.clanManager.getCurrentWar(),
            warProgress: this.clanManager.getWarProgress()
        };
    }
    
    getClanData() {
        return this.clanManager.getClanData();
    }
    
    // Settings management
    toggleSound() {
        return this.audioManager.toggleSound();
    }
    
    setSoundVolume(volume) {
        this.audioManager.setVolume(volume);
    }
    
    // Cleanup method for Phase 5A, 5B & 5C systems
    destroy() {
        // Cleanup all systems in reverse order
        if (this.clanManager) this.clanManager.destroy();
        if (this.battlePass) this.battlePass.destroy();
        if (this.notifications) this.notifications.destroy();
        if (this.cloudSave) this.cloudSave.destroy();
        if (this.seasonManager) this.seasonManager.destroy();
        if (this.userProfile) this.userProfile.destroy();
        if (this.dataManager) this.dataManager.destroy();
        
        console.log('🧹 Game systems cleaned up');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create global game instance
        window.snakeGame = new SnakeGame();
        console.log('🐍 Live Service Snake Game initialized successfully!');
        console.log('🎯 Phase 5A Foundation Systems: Ready');
        console.log('⚔️ Phase 5B Battle Pass System: Ready');
        console.log('🏰 Phase 5C Clan Wars & Social System: Ready');
        
        // Debug info in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Development mode: Performance stats available via snakeGame.getPerformanceStats()');
            console.log('Phase 5A APIs: getUserProfile(), getCurrentSeason(), getCloudSaveStatus()');
            console.log('Phase 5B APIs: getBattlePassStatus(), getBattlePassData()');
            console.log('Phase 5C APIs: getClanStatus(), getClanData()');
        }
        
        // Setup cleanup handlers
        window.addEventListener('beforeunload', () => {
            if (window.snakeGame) {
                window.snakeGame.destroy();
            }
        });
        
        // Handle page visibility for background sync
        document.addEventListener('visibilitychange', () => {
            if (window.snakeGame && window.snakeGame.cloudSave) {
                if (document.hidden) {
                    // Page is hidden - trigger save
                    window.snakeGame.cloudSave.forceSyncNow();
                } else {
                    // Page is visible - check for updates
                    window.snakeGame.cloudSave.attemptCloudSync();
                }
            }
        });
    } catch (error) {
        console.error('Failed to initialize Snake Game:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed; 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%);
                background: #ff4444; 
                color: white; 
                padding: 20px; 
                border-radius: 10px; 
                text-align: center;
                z-index: 9999;
                font-family: monospace;
            ">
                <h3>Game Initialization Failed</h3>
                <p>Please refresh the page to try again.</p>
                <small>Error: ${error.message}</small>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
});

// Export for testing (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SnakeGame };
}
