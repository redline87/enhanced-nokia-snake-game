class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        
        // Game settings
        this.gridSize = 16;
        this.tileCount = {
            x: this.canvas.width / this.gridSize,
            y: this.canvas.height / this.gridSize
        };
        
        // Game state
        this.reset();
        this.loadHighScore();
        
        // Bind events
        this.bindEvents();
        this.initializeScoreboard();
        
        // Show initial overlay
        this.showOverlay('SNAKE', 'Press SPACE or ● to start\\nThen use arrow keys to move');
    }
    
    reset() {
        this.snake = [
            { x: 10, y: 10 }
        ];
        this.food = this.generateFood();
        this.direction = { x: 0, y: 0 };
        this.score = 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.speed = 150; // milliseconds between moves
        this.lastMoveTime = 0;
        
        this.updateScore();
    }
    
    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Virtual keypad controls
        document.getElementById('up').addEventListener('click', () => {
            this.setDirection(0, -1);
        });
        document.getElementById('down').addEventListener('click', () => {
            this.setDirection(0, 1);
        });
        document.getElementById('left').addEventListener('click', () => {
            this.setDirection(-1, 0);
        });
        document.getElementById('right').addEventListener('click', () => {
            this.setDirection(1, 0);
        });
        document.getElementById('select').addEventListener('click', () => {
            this.toggleGame();
        });
        
        // Touch controls for mobile
        this.canvas.addEventListener('click', () => {
            if (!this.gameRunning || this.gameOver) {
                this.toggleGame();
            }
        });
        
        // Scoreboard events
        document.getElementById('showScoreboard').addEventListener('click', () => {
            this.showScoreboard();
        });
        
        // Start game loop
        this.gameLoop();
    }
    
    initializeScoreboard() {
        // Name input modal events
        const nameInputModal = document.getElementById('nameInputModal');
        const scoreboardModal = document.getElementById('scoreboardModal');
        const playerNameInput = document.getElementById('playerName');
        const finalScoreSpan = document.getElementById('finalScore');
        
        document.getElementById('submitScore').addEventListener('click', () => {
            const name = playerNameInput.value.trim();
            if (name) {
                this.submitScore(name, this.score);
                this.hideModal(nameInputModal);
            } else {
                playerNameInput.focus();
                playerNameInput.style.borderColor = '#e74c3c';
                setTimeout(() => {
                    playerNameInput.style.borderColor = '#34495e';
                }, 1000);
            }
        });
        
        document.getElementById('skipScore').addEventListener('click', () => {
            this.hideModal(nameInputModal);
        });
        
        // Scoreboard modal events
        document.getElementById('closeScoreboard').addEventListener('click', () => {
            this.hideModal(scoreboardModal);
        });
        
        document.getElementById('refreshScores').addEventListener('click', () => {
            this.loadScoreboard();
        });
        
        // Enter key support for name input
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('submitScore').click();
            }
        });
        
        // Close modals on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal(nameInputModal);
                this.hideModal(scoreboardModal);
            }
        });
        
        // Close modals on background click
        nameInputModal.addEventListener('click', (e) => {
            if (e.target === nameInputModal) {
                this.hideModal(nameInputModal);
            }
        });
        
        scoreboardModal.addEventListener('click', (e) => {
            if (e.target === scoreboardModal) {
                this.hideModal(scoreboardModal);
            }
        });
    }
    
    handleKeyPress(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            this.toggleGame();
            return;
        }
        
        if (this.gameRunning && !this.gameOver) {
            switch(e.code) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.setDirection(0, -1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.setDirection(0, 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.setDirection(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.setDirection(1, 0);
                    break;
            }
        }
    }
    
    setDirection(x, y) {
        // Prevent snake from going into itself
        if (this.direction.x === -x && this.direction.y === -y) {
            return;
        }
        this.direction = { x, y };
        
        // Button press animation
        const buttons = {
            '0,-1': 'up',
            '0,1': 'down',
            '-1,0': 'left',
            '1,0': 'right'
        };
        const buttonId = buttons[`${x},${y}`];
        if (buttonId) {
            const button = document.getElementById(buttonId);
            button.classList.add('pulse');
            setTimeout(() => button.classList.remove('pulse'), 200);
        }
    }
    
    toggleGame() {
        if (this.gameOver) {
            this.reset();
            this.hideOverlay();
            this.gameRunning = true;
        } else if (this.gameRunning) {
            this.gameRunning = false;
            this.showOverlay('PAUSED', 'Press SPACE to continue');
        } else {
            this.gameRunning = true;
            this.hideOverlay();
        }
        
        // Center button animation
        const centerBtn = document.getElementById('select');
        centerBtn.classList.add('pulse');
        setTimeout(() => centerBtn.classList.remove('pulse'), 200);
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameRunning && !this.gameOver) {
            if (currentTime - this.lastMoveTime >= this.speed) {
                this.move();
                this.lastMoveTime = currentTime;
            }
        }
        
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    move() {
        if (!this.gameRunning || this.gameOver) return;
        
        // Don't move if no direction is set (snake hasn't started moving yet)
        if (this.direction.x === 0 && this.direction.y === 0) return;
        
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount.x || 
            head.y < 0 || head.y >= this.tileCount.y) {
            this.endGame();
            return;
        }
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.endGame();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
            this.increaseSpeed();
            this.playEatSound();
        } else {
            this.snake.pop();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#9cb86f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (optional - classic Nokia had a subtle grid)
        this.drawGrid();
        
        // Draw food
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(
            this.food.x * this.gridSize + 1,
            this.food.y * this.gridSize + 1,
            this.gridSize - 2,
            this.gridSize - 2
        );
        
        // Draw snake
        this.ctx.fillStyle = '#000';
        this.snake.forEach((segment, index) => {
            // Snake head is slightly different
            if (index === 0) {
                this.ctx.fillRect(
                    segment.x * this.gridSize,
                    segment.y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
            } else {
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
            }
        });
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.tileCount.x; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.tileCount.y; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.canvas.width, y * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount.x),
                y: Math.floor(Math.random() * this.tileCount.y)
            };
        } while (this.snake.some(segment => 
            segment.x === food.x && segment.y === food.y));
        
        return food;
    }
    
    increaseSpeed() {
        // Increase speed slightly each time food is eaten
        this.speed = Math.max(50, this.speed - 2);
    }
    
    async endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        
        // Shake animation
        document.querySelector('.nokia-phone').classList.add('shake');
        setTimeout(() => {
            document.querySelector('.nokia-phone').classList.remove('shake');
        }, 500);
        
        this.playGameOverSound();
        
        // Check if score qualifies for top 10
        try {
            const response = await fetch(`/api/scores/check/${this.score}`);
            const result = await response.json();
            
            if (result.qualifies) {
                // Show name input dialog
                this.showNameInputDialog();
            } else {
                // Show regular game over
                const localHighScore = this.getHighScore();
                if (this.score > localHighScore) {
                    this.saveHighScore(this.score);
                    this.showOverlay('NEW LOCAL HIGH!', `Score: ${this.score}\\nPress SPACE to play again`);
                } else {
                    this.showOverlay('GAME OVER', `Score: ${this.score}\\nPress SPACE to play again`);
                }
            }
        } catch (error) {
            console.error('Error checking score:', error);
            // Fallback to local high score logic
            const localHighScore = this.getHighScore();
            if (this.score > localHighScore) {
                this.saveHighScore(this.score);
                this.showOverlay('NEW HIGH SCORE!', `Score: ${this.score}\\nPress SPACE to play again`);
            } else {
                this.showOverlay('GAME OVER', `Score: ${this.score}\\nPress SPACE to play again`);
            }
        }
    }
    
    showNameInputDialog() {
        const modal = document.getElementById('nameInputModal');
        const finalScoreSpan = document.getElementById('finalScore');
        const playerNameInput = document.getElementById('playerName');
        
        finalScoreSpan.textContent = this.score;
        playerNameInput.value = '';
        playerNameInput.style.borderColor = '#34495e';
        
        this.showModal(modal);
        
        // Focus on input after animation
        setTimeout(() => {
            playerNameInput.focus();
        }, 300);
    }
    
    async submitScore(name, score) {
        try {
            const response = await fetch('/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, score }),
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Score submitted:', result);
                
                // Update local high score too
                const localHighScore = this.getHighScore();
                if (score > localHighScore) {
                    this.saveHighScore(score);
                }
                
                // Show success message
                this.showOverlay('SCORE SAVED!', `${name}: ${score}\\nPress SPACE to play again`);
            } else {
                const error = await response.json();
                console.error('Error submitting score:', error);
                this.showOverlay('SAVE FAILED', `Score: ${score}\\nPress SPACE to play again`);
            }
        } catch (error) {
            console.error('Network error:', error);
            this.showOverlay('CONNECTION ERROR', `Score: ${score}\\nPress SPACE to play again`);
        }
    }
    
    async showScoreboard() {
        const modal = document.getElementById('scoreboardModal');
        this.showModal(modal);
        this.loadScoreboard();
    }
    
    async loadScoreboard() {
        const content = document.getElementById('scoreboardContent');
        content.innerHTML = '<div class=\"loading\">Loading scores...</div>';
        
        try {
            const response = await fetch('/api/scores');
            const scores = await response.json();
            
            if (scores.length === 0) {
                content.innerHTML = `
                    <div class=\"empty-scores\">
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
                
                const date = new Date(score.timestamp).toLocaleDateString();
                
                listItem.innerHTML = `
                    <span class=\"score-rank\">#${index + 1}</span>
                    <span class=\"score-name\">${this.escapeHtml(score.name)}</span>
                    <span class=\"score-value\">${score.score}</span>
                    <span class=\"score-date\">${date}</span>
                `;
                
                scoresList.appendChild(listItem);
            });
            
            content.innerHTML = '';
            content.appendChild(scoresList);
            
        } catch (error) {
            console.error('Error loading scoreboard:', error);
            content.innerHTML = `
                <div class=\"error\">
                    Failed to load scores.<br>
                    Please check your connection.
                </div>
            `;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showModal(modal) {
        modal.classList.add('show');
    }
    
    hideModal(modal) {
        modal.classList.remove('show');
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    showOverlay(title, message) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.innerHTML = message.replace('\\\\n', '<br>');
        this.highScoreElement.textContent = this.getHighScore();
        this.overlay.classList.remove('hidden');
    }
    
    hideOverlay() {
        this.overlay.classList.add('hidden');
    }
    
    getHighScore() {
        return parseInt(localStorage.getItem('snakeHighScore') || '0');
    }
    
    saveHighScore(score) {
        localStorage.setItem('snakeHighScore', score.toString());
        this.loadHighScore();
    }
    
    loadHighScore() {
        this.highScoreElement.textContent = this.getHighScore();
    }
    
    playEatSound() {
        this.playSound(800, 100);
    }
    
    playGameOverSound() {
        // Play a sequence of descending tones
        this.playSound(400, 200);
        setTimeout(() => this.playSound(300, 200), 150);
        setTimeout(() => this.playSound(200, 300), 300);
    }
    
    playSound(frequency, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (e) {
            // Fallback: no sound if audio context fails
            console.log('Audio not supported');
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});

// Prevent zoom on double tap (mobile)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);