// Core game logic and rendering engine for Snake
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Game settings
        this.gridSize = 16;
        this.tileCount = {
            x: this.canvas.width / this.gridSize,
            y: this.canvas.height / this.gridSize
        };
        
        // Game state
        this.reset();
        
        // Performance tracking
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
    }
    
    reset() {
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 }; // Buffer for smooth direction changes
        this.score = 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.speed = 150; // milliseconds between moves
        this.lastMoveTime = 0;
        this.frameCount = 0;
    }
    
    // Game Logic Methods
    setDirection(x, y) {
        // Prevent snake from going into itself
        if (this.direction.x === -x && this.direction.y === -y) {
            return false;
        }
        
        // Buffer the next direction to prevent double-tapping issues
        this.nextDirection = { x, y };
        return true;
    }
    
    move() {
        if (!this.gameRunning || this.gameOver) return false;
        
        // Apply buffered direction change
        if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
            // Only change direction if it's not opposite to current direction
            if (!(this.direction.x === -this.nextDirection.x && this.direction.y === -this.nextDirection.y)) {
                this.direction = { ...this.nextDirection };
            }
            this.nextDirection = { x: 0, y: 0 };
        }
        
        // Don't move if no direction is set (snake hasn't started moving yet)
        if (this.direction.x === 0 && this.direction.y === 0) return false;
        
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount.x || 
            head.y < 0 || head.y >= this.tileCount.y) {
            this.gameOver = true;
            return false;
        }
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver = true;
            return false;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.generateFood();
            this.increaseSpeed();
            return 'ate_food';
        } else {
            this.snake.pop();
        }
        
        return true;
    }
    
    generateFood() {
        let food;
        let attempts = 0;
        const maxAttempts = this.tileCount.x * this.tileCount.y;
        
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount.x),
                y: Math.floor(Math.random() * this.tileCount.y)
            };
            attempts++;
            
            // Prevent infinite loop if board is full
            if (attempts > maxAttempts) {
                // Game won - extremely rare case
                this.gameOver = true;
                break;
            }
        } while (this.snake.some(segment => 
            segment.x === food.x && segment.y === food.y));
        
        return food;
    }
    
    increaseSpeed() {
        // Gradually increase speed, but not too fast
        const minSpeed = 50;
        const speedIncrease = 2;
        this.speed = Math.max(minSpeed, this.speed - speedIncrease);
    }
    
    // Rendering Methods
    draw() {
        this.clearCanvas();
        this.drawGrid();
        this.drawFood();
        this.drawSnake();
        
        // Update FPS counter (for debugging)
        this.updateFPS();
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#9cb86f'; // Classic Nokia green
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
    
    drawFood() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(
            this.food.x * this.gridSize + 1,
            this.food.y * this.gridSize + 1,
            this.gridSize - 2,
            this.gridSize - 2
        );
    }
    
    drawSnake() {
        this.ctx.fillStyle = '#000';
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Snake head is slightly different (full square)
                this.ctx.fillRect(
                    segment.x * this.gridSize,
                    segment.y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
            } else {
                // Snake body segments have small borders
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
            }
        });
    }
    
    // Game Loop
    gameLoop(currentTime = 0) {
        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Game logic updates
        if (this.gameRunning && !this.gameOver) {
            if (currentTime - this.lastMoveTime >= this.speed) {
                const moveResult = this.move();
                this.lastMoveTime = currentTime;
                
                // Return move result for audio/UI feedback
                if (moveResult === 'ate_food') {
                    this.onFoodEaten?.();
                } else if (moveResult === false && this.gameOver) {
                    this.onGameOver?.();
                }
            }
        }
        
        // Always render
        this.draw();
        
        // Continue the game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // Game State Management
    start() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.onGameStart?.();
        }
    }
    
    pause() {
        if (this.gameRunning && !this.gameOver) {
            this.gameRunning = false;
            this.onGamePause?.();
        }
    }
    
    resume() {
        if (!this.gameRunning && !this.gameOver) {
            this.gameRunning = true;
            this.onGameResume?.();
        }
    }
    
    restart() {
        this.reset();
        this.gameRunning = true;
        this.onGameRestart?.();
    }
    
    // Performance monitoring
    updateFPS() {
        this.frameCount++;
        if (this.frameCount % 60 === 0) { // Update every 60 frames
            this.fps = Math.round(60000 / (performance.now() - this.lastFrameTime));
        }
    }
    
    getFPS() {
        return this.fps;
    }
    
    // Getters for game state
    isRunning() {
        return this.gameRunning;
    }
    
    isGameOver() {
        return this.gameOver;
    }
    
    getScore() {
        return this.score;
    }
    
    getSnakeLength() {
        return this.snake.length;
    }
    
    getSpeed() {
        return this.speed;
    }
    
    // Event handlers (to be set by the main game class)
    onFoodEaten = null;
    onGameOver = null;
    onGameStart = null;
    onGamePause = null;
    onGameResume = null;
    onGameRestart = null;
}