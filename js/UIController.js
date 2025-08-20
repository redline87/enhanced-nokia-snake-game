// UI management and DOM manipulation for the Snake game
class UIController {
    constructor(gameEngine, scoreManager, audioManager) {
        this.gameEngine = gameEngine;
        this.scoreManager = scoreManager;
        this.audioManager = audioManager;
        
        // Reference to main game (will be set later)
        this.game = null;
        
        // DOM elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        
        // Modal elements
        this.nameInputModal = document.getElementById('nameInputModal');
        this.scoreboardModal = document.getElementById('scoreboardModal');
        this.playerNameInput = document.getElementById('playerName');
        this.finalScoreSpan = document.getElementById('finalScore');
        this.scoreboardContent = document.getElementById('scoreboardContent');
        
        this.initializeEventHandlers();
    }
    
    initializeEventHandlers() {
        // Control buttons - use arrow functions to maintain context
        this.addButtonHandlers('up', () => this.handleDirectionInput(0, -1));
        this.addButtonHandlers('down', () => this.handleDirectionInput(0, 1));
        this.addButtonHandlers('left', () => this.handleDirectionInput(-1, 0));
        this.addButtonHandlers('right', () => this.handleDirectionInput(1, 0));
        this.addButtonHandlers('select', () => this.handleToggleGame());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Touch controls for mobile
        this.setupTouchControls();
        
        // Scoreboard events
        this.setupScoreboardHandlers();
        
        // Modal events
        this.setupModalHandlers();
    }
    
    addButtonHandlers(id, handler) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', (e) => {
                handler();
                this.audioManager.playButtonSound();
                this.animateButton(button);
            });
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handler();
                this.audioManager.playButtonSound();
                this.animateButton(button);
            });
        }
    }
    
    animateButton(button) {
        button.classList.add('pulse');
        setTimeout(() => button.classList.remove('pulse'), 200);
    }
    
    handleKeyPress(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            this.handleToggleGame();
            return;
        }
        
        if (this.gameEngine.isRunning() && !this.gameEngine.isGameOver()) {
            const directions = {
                'ArrowUp': [0, -1],
                'ArrowDown': [0, 1],
                'ArrowLeft': [-1, 0],
                'ArrowRight': [1, 0]
            };
            
            if (directions[e.code]) {
                e.preventDefault();
                this.handleDirectionInput(...directions[e.code]);
            }
        }
    }
    
    // Handler methods for input
    handleDirectionInput(x, y) {
        if (this.game) {
            this.game.setDirection(x, y);
        }
    }
    
    handleToggleGame() {
        if (this.game) {
            this.game.toggleGame();
        }
    }
    
    // Setter for main game reference
    setGame(game) {
        this.game = game;
    }
    
    setupTouchControls() {
        const startGameTouch = (e) => {
            // Don't trigger if user clicked on a button or interactive element
            if (e.target.tagName === 'BUTTON' || 
                e.target.closest('button') || 
                e.target.classList.contains('scoreboard-btn') ||
                e.target.id === 'showScoreboard') {
                return;
            }
            
            if (!this.gameEngine.isRunning() || this.gameEngine.isGameOver()) {
                e.preventDefault();
                this.handleToggleGame();
            }
        };
        
        // Add touch events to canvas and overlay
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('click', startGameTouch);
            canvas.addEventListener('touchstart', startGameTouch);
        }
        
        if (this.overlay) {
            this.overlay.addEventListener('click', startGameTouch);
            this.overlay.addEventListener('touchstart', startGameTouch);
        }
    }
    
    setupScoreboardHandlers() {
        const showScoreboardBtn = document.getElementById('showScoreboard');
        if (showScoreboardBtn) {
            showScoreboardBtn.addEventListener('click', () => {
                this.showScoreboard();
                this.audioManager.playButtonSound();
            });
        }
        
        const closeScoreboardBtn = document.getElementById('closeScoreboard');
        if (closeScoreboardBtn) {
            closeScoreboardBtn.addEventListener('click', () => {
                this.hideModal(this.scoreboardModal);
                this.audioManager.playButtonSound();
            });
        }
        
        const refreshScoresBtn = document.getElementById('refreshScores');
        if (refreshScoresBtn) {
            refreshScoresBtn.addEventListener('click', () => {
                this.loadScoreboard();
                this.audioManager.playButtonSound();
            });
        }
    }
    
    setupModalHandlers() {
        // Name input modal
        const submitScoreBtn = document.getElementById('submitScore');
        if (submitScoreBtn) {
            submitScoreBtn.addEventListener('click', () => {
                this.submitPlayerScore();
            });
        }
        
        const skipScoreBtn = document.getElementById('skipScore');
        if (skipScoreBtn) {
            skipScoreBtn.addEventListener('click', () => {
                this.hideModal(this.nameInputModal);
                this.audioManager.playButtonSound();
            });
        }
        
        // Enter key support for name input
        if (this.playerNameInput) {
            this.playerNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitPlayerScore();
                }
            });
        }
        
        // Close modals on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal(this.nameInputModal);
                this.hideModal(this.scoreboardModal);
            }
        });
        
        // Close modals on background click
        [this.nameInputModal, this.scoreboardModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideModal(modal);
                    }
                });
            }
        });
    }
    
    // UI Update Methods
    updateScore(score) {
        if (this.scoreElement) {
            this.scoreElement.textContent = score;
        }
    }
    
    updateHighScore() {
        if (this.highScoreElement) {
            this.highScoreElement.textContent = this.scoreManager.getLocalHighScore();
        }
    }
    
    showOverlay(title, message) {
        if (this.overlayTitle && this.overlayMessage && this.overlay) {
            this.overlayTitle.textContent = title;
            this.overlayMessage.innerHTML = message.replace(/\\n/g, '<br>');
            this.updateHighScore();
            this.overlay.classList.remove('hidden');
        }
    }
    
    hideOverlay() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
    }
    
    // Modal Management
    showModal(modal) {
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    hideModal(modal) {
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    // Score Submission UI
    showNameInputDialog(score) {
        if (this.finalScoreSpan && this.playerNameInput && this.nameInputModal) {
            this.finalScoreSpan.textContent = score;
            this.playerNameInput.value = '';
            this.playerNameInput.style.borderColor = '#34495e';
            
            this.showModal(this.nameInputModal);
            
            // Focus on input after animation
            setTimeout(() => {
                this.playerNameInput.focus();
            }, 300);
        }
    }
    
    async submitPlayerScore() {
        const name = this.playerNameInput?.value.trim();
        if (!name) {
            if (this.playerNameInput) {
                this.playerNameInput.focus();
                this.playerNameInput.style.borderColor = '#e74c3c';
                setTimeout(() => {
                    this.playerNameInput.style.borderColor = '#34495e';
                }, 1000);
            }
            this.audioManager.playErrorSound();
            return;
        }
        
        const result = await this.scoreManager.submitScore(name, this.gameEngine.getScore());
        this.hideModal(this.nameInputModal);
        
        if (result.success) {
            this.audioManager.playSuccessChime();
            this.showOverlay('SCORE SAVED!', `${name}: ${this.gameEngine.getScore()}\\nTap anywhere to play again`);
        } else {
            this.audioManager.playErrorSound();
            const [title, message] = this.scoreManager.getErrorMessage(result.error, this.gameEngine.getScore()).split('|');
            this.showOverlay(title, message);
        }
    }
    
    // Scoreboard UI
    async showScoreboard() {
        this.showModal(this.scoreboardModal);
        this.loadScoreboard();
    }
    
    async loadScoreboard() {
        if (!this.scoreboardContent) return;
        
        this.scoreboardContent.innerHTML = '<div class="loading">Loading scores...</div>';
        
        const result = await this.scoreManager.loadScoreboard();
        
        if (!result.success) {
            this.scoreboardContent.innerHTML = `
                <div class="error">
                    Failed to load scores.<br>
                    ${result.message}
                </div>
            `;
            return;
        }
        
        const scores = result.scores;
        
        if (scores.length === 0) {
            this.scoreboardContent.innerHTML = `
                <div class="empty-scores">
                    <h4>No scores yet!</h4>
                    <p>Be the first to set a high score!</p>
                </div>
            `;
            return;
        }
        
        const scoresList = document.createElement('ol');
        scoresList.className = 'scoreboard-list';
        
        scores.forEach((score, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'score-item';
            
            const date = this.scoreManager.formatDate(score.timestamp);
            
            listItem.innerHTML = `
                <span class="score-rank">#${index + 1}</span>
                <span class="score-name">${this.scoreManager.escapeHtml(score.name)}</span>
                <span class="score-value">${score.score}</span>
                <span class="score-date">${date}</span>
            `;
            
            scoresList.appendChild(listItem);
        });
        
        this.scoreboardContent.innerHTML = '';
        this.scoreboardContent.appendChild(scoresList);
    }
    
    // Game State UI Updates
    showGameStart() {
        this.showOverlay('SNAKE', 'Tap anywhere or press ● to start\\nThen use arrow keys or buttons to move');
    }
    
    showGamePaused() {
        this.showOverlay('PAUSED', 'Tap anywhere to continue');
    }
    
    async handleGameOver(score) {
        // Add shake effect to phone
        const phone = document.querySelector('.nokia-phone');
        if (phone) {
            phone.classList.add('shake');
            setTimeout(() => {
                phone.classList.remove('shake');
            }, 500);
        }
        
        this.audioManager.playGameOverSound();
        
        // Check if score qualifies for online leaderboard
        const result = await this.scoreManager.checkScoreQualifies(score);
        
        if (!result.success) {
            // Handle API errors gracefully
            if (result.error === 'RATE_LIMIT_EXCEEDED') {
                this.showOverlay('SLOW DOWN!', `Too many attempts\\nTry again in a moment\\nScore: ${score}`);
                return;
            }
            
            // Fallback to local high score logic
            this.handleLocalHighScore(score);
            return;
        }
        
        if (result.qualifies) {
            this.showNameInputDialog(score);
        } else {
            this.handleLocalHighScore(score);
        }
    }
    
    handleLocalHighScore(score) {
        const localHighScore = this.scoreManager.getLocalHighScore();
        if (score > localHighScore) {
            this.scoreManager.saveLocalHighScore(score);
            this.audioManager.playScoreSound();
            this.showOverlay('NEW LOCAL HIGH!', `Score: ${score}\\nTap anywhere to play again`);
        } else {
            this.showOverlay('GAME OVER', `Score: ${score}\\nTap anywhere to play again`);
        }
    }
}