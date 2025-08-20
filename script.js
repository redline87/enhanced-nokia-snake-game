// Refactored Snake Game - Main Application Class
class SnakeGame {
    constructor() {
        // Initialize core modules
        this.engine = new GameEngine('gameCanvas');
        this.scoreManager = new ScoreManager();
        this.audioManager = new AudioManager();
        this.uiController = new UIController(this.engine, this.scoreManager, this.audioManager);
        
        // Set circular reference for UI to access main game methods
        this.uiController.setGame(this);
        
        // Set up event handlers
        this.setupGameEventHandlers();
        
        // Initialize UI
        this.uiController.updateHighScore();
        this.uiController.showGameStart();
        
        // Start the game loop
        this.engine.gameLoop();
        
        // Prevent zoom on double tap (mobile)
        this.preventMobileZoom();
    }
    
    setupGameEventHandlers() {
        // Connect game engine events to UI and audio
        this.engine.onFoodEaten = () => {
            this.audioManager.playEatSound();
            this.uiController.updateScore(this.engine.getScore());
        };
        
        this.engine.onGameOver = () => {
            this.uiController.handleGameOver(this.engine.getScore());
        };
        
        this.engine.onGameStart = () => {
            this.audioManager.playStartSound();
            this.uiController.hideOverlay();
        };
        
        this.engine.onGamePause = () => {
            this.uiController.showGamePaused();
        };
        
        this.engine.onGameResume = () => {
            this.uiController.hideOverlay();
        };
        
        this.engine.onGameRestart = () => {
            this.audioManager.playStartSound();
            this.uiController.updateScore(0);
            this.uiController.hideOverlay();
        };
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
            score: this.engine.getScore()
        };
    }
    
    // Settings management
    toggleSound() {
        return this.audioManager.toggleSound();
    }
    
    setSoundVolume(volume) {
        this.audioManager.setVolume(volume);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create global game instance
        window.snakeGame = new SnakeGame();
        console.log('🐍 Snake Game initialized successfully!');
        
        // Debug info in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Development mode: Performance stats available via snakeGame.getPerformanceStats()');
        }
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