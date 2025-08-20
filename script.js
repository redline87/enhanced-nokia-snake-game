// Enhanced Snake Game - Live Service Platform (Phase 5A)
class SnakeGame {
    constructor() {
        // Initialize Phase 5A Foundation Systems first
        this.dataManager = new DataManager();
        this.userProfile = new UserProfileManager(null); // Will pass analytics after it's created
        
        // Initialize core modules
        this.engine = new GameEngine('gameCanvas');
        this.scoreManager = new ScoreManager();
        this.audioManager = new AudioManager();
        
        // Initialize Phase 3 & 4 modules with user profile
        this.analytics = new AnalyticsManager();
        this.achievements = new AchievementManager(this.analytics);
        this.challenges = new ChallengeManager(this.analytics, this.achievements);
        this.social = new SocialManager(this.analytics, this.achievements);
        this.monetization = new MonetizationManager(this.analytics);
        
        // Initialize Phase 5A Live Service modules
        this.seasonManager = new SeasonManager(this.userProfile, this.analytics);
        this.cloudSave = new CloudSaveManager(this.userProfile, this.analytics);
        this.notifications = new NotificationManager(this.userProfile, this.analytics);
        
        // Connect analytics to user profile
        this.userProfile.analytics = this.analytics;
        
        // Initialize UI controller with all dependencies
        this.uiController = new UIController(this.engine, this.scoreManager, this.audioManager);
        
        // Set circular reference for UI to access main game methods
        this.uiController.setGame(this);
        
        // Set up event handlers
        this.setupGameEventHandlers();
        
        // Store global references for other modules (Phase 5A)
        window.socialManager = this.social;
        window.userProfile = this.userProfile;
        window.seasonManager = this.seasonManager;
        window.dataManager = this.dataManager;
        
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
        this.uiController.showShareButton(false); // Hide share button during gameplay
        
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
        
        // Update all tracking systems
        this.updateAllProgress(score, duration, isNewRecord);
        
        // Handle UI and social features
        this.uiController.handleGameOver(score);
        this.uiController.showShareButton(true);
        
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
        this.uiController.showShareButton(false);
        
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
        this.achievements.updateStats({
            score: score,
            totalGames: 1,
            gamesThisSession: 1,
            gameDuration: duration,
            bestScore: isNewRecord ? score : undefined,
            applesEaten: this.foodEaten
        });
        
        // Challenge progress
        this.challenges.updateProgress({
            score: score,
            duration: duration,
            completed: true,
            applesEaten: this.foodEaten,
            previousBest: this.scoreManager.getLocalHighScore()
        });
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
            this.engine.restart();
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
            notificationsEnabled: this.notifications.hasNotificationPermission()
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
    
    // Settings management
    toggleSound() {
        return this.audioManager.toggleSound();
    }
    
    setSoundVolume(volume) {
        this.audioManager.setVolume(volume);
    }
    
    // Cleanup method for Phase 5A systems
    destroy() {
        // Cleanup all systems in reverse order
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
        
        // Debug info in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Development mode: Performance stats available via snakeGame.getPerformanceStats()');
            console.log('Phase 5A APIs: getUserProfile(), getCurrentSeason(), getCloudSaveStatus()');
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