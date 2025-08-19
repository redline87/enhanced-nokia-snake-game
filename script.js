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
        
        // Show initial overlay
        this.showOverlay('SNAKE', 'Press SPACE to start');
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
        document.getElementById('up').addEventListener('click', () => this.changeDirection(0, -1));
        document.getElementById('down').addEventListener('click', () => this.changeDirection(0, 1));
        document.getElementById('left').addEventListener('click', () => this.changeDirection(-1, 0));
        document.getElementById('right').addEventListener('click', () => this.changeDirection(1, 0));
        document.getElementById('select').addEventListener('click', () => this.toggleGame());
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleKeyPress(e) {
        e.preventDefault();
        
        switch(e.code) {
            case 'ArrowUp':
                this.changeDirection(0, -1);
                this.pulseKey('up');
                break;
            case 'ArrowDown':
                this.changeDirection(0, 1);
                this.pulseKey('down');
                break;
            case 'ArrowLeft':
                this.changeDirection(-1, 0);
                this.pulseKey('left');
                break;
            case 'ArrowRight':
                this.changeDirection(1, 0);
                this.pulseKey('right');
                break;
            case 'Space':
                this.toggleGame();
                this.pulseKey('select');
                break;
        }
    }
    
    pulseKey(keyId) {
        const key = document.getElementById(keyId);
        key.classList.add('pulse');
        setTimeout(() => key.classList.remove('pulse'), 500);
    }
    
    changeDirection(x, y) {
        if (!this.gameRunning) return;
        
        // Prevent reverse direction
        if (this.direction.x === -x && this.direction.y === -y) return;
        
        this.direction = { x, y };
    }
    
    toggleGame() {
        if (this.gameOver) {
            this.restart();
        } else if (this.gameRunning) {
            this.pause();
        } else {
            this.start();
        }
    }
    
    start() {
        this.gameRunning = true;
        this.hideOverlay();
        this.gameLoop();
    }
    
    pause() {
        this.gameRunning = false;
        this.showOverlay('PAUSED', 'Press SPACE to continue');
    }
    
    restart() {
        this.reset();
        this.start();
    }
    
    gameLoop() {
        const currentTime = Date.now();
        
        if (currentTime - this.lastMoveTime >= this.speed) {
            this.update();
            this.lastMoveTime = currentTime;
        }
        
        this.draw();
        
        if (this.gameRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    update() {
        if (!this.gameRunning || this.gameOver) return;
        
        // Move snake head
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount.x || head.y < 0 || head.y >= this.tileCount.y) {
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
        
        // Vertical lines
        for (let x = 0; x <= this.tileCount.x; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
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
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        
        return food;
    }
    
    increaseSpeed() {
        if (this.speed > 80) {
            this.speed -= 2;
        }
    }
    
    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        
        // Shake animation
        document.querySelector('.nokia-phone').classList.add('shake');
        setTimeout(() => {
            document.querySelector('.nokia-phone').classList.remove('shake');
        }, 500);
        
        // Check for high score
        if (this.score > this.getHighScore()) {
            this.saveHighScore(this.score);
            this.showOverlay('NEW HIGH SCORE!', `Score: ${this.score}\\nPress SPACE to play again`);
        } else {
            this.showOverlay('GAME OVER', `Score: ${this.score}\\nPress SPACE to play again`);
        }
        
        this.playGameOverSound();
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    showOverlay(title, message) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.innerHTML = message.replace('\\n', '<br>');
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
    }
    
    loadHighScore() {
        this.highScoreElement.textContent = this.getHighScore();
    }
    
    // Sound effects (simple beep simulation)
    playEatSound() {
        this.playBeep(800, 100);
    }
    
    playGameOverSound() {
        this.playBeep(300, 300);
        setTimeout(() => this.playBeep(200, 300), 350);
    }
    
    playBeep(frequency, duration) {
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