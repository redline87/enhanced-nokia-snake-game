// Score management and API communication module
class ScoreManager {
    constructor() {
        this.localStorageKey = 'snakeHighScore';
    }
    
    // Local high score management
    getLocalHighScore() {
        return parseInt(localStorage.getItem(this.localStorageKey) || '0');
    }
    
    saveLocalHighScore(score) {
        localStorage.setItem(this.localStorageKey, score.toString());
    }
    
    // API communication for online scores
    async checkScoreQualifies(score) {
        try {
            const response = await fetch(`/api/scores/check/${score}`);
            
            if (!response.ok) {
                const error = await response.json();
                console.warn('Score check failed:', error);
                
                return {
                    success: false,
                    error: error.code,
                    message: error.message,
                    resetTime: error.resetTime
                };
            }
            
            const result = await response.json();
            return {
                success: true,
                ...result
            };
        } catch (error) {
            console.error('Network error checking score:', error);
            return {
                success: false,
                error: 'NETWORK_ERROR',
                message: 'Connection failed'
            };
        }
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
                console.log('Score submitted successfully:', result);
                
                // Update local high score too
                if (score > this.getLocalHighScore()) {
                    this.saveLocalHighScore(score);
                }
                
                return {
                    success: true,
                    data: result
                };
            } else {
                const error = await response.json();
                console.error('Error submitting score:', error);
                
                return {
                    success: false,
                    error: error.code,
                    message: error.message,
                    resetTime: error.resetTime
                };
            }
        } catch (error) {
            console.error('Network error submitting score:', error);
            return {
                success: false,
                error: 'NETWORK_ERROR',
                message: 'Connection failed'
            };
        }
    }
    
    async loadScoreboard() {
        try {
            const response = await fetch('/api/scores');
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to load scores');
            }
            
            const scores = await response.json();
            return {
                success: true,
                scores
            };
        } catch (error) {
            console.error('Error loading scoreboard:', error);
            return {
                success: false,
                error: 'NETWORK_ERROR',
                message: error.message || 'Failed to load scores'
            };
        }
    }
    
    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }
    
    // Generate error messages for different scenarios
    getErrorMessage(errorCode, score) {
        const messages = {
            'RATE_LIMIT_EXCEEDED': `TOO FAST!|Slow down there, speed demon!\\nTry again in a minute\\nScore: ${score}`,
            'VALIDATION_ERROR': `INVALID INPUT|Please check your input\\nScore: ${score}\\nTap anywhere to play again`,
            'NETWORK_ERROR': `CONNECTION ERROR|Check your internet connection\\nScore: ${score}\\nTap anywhere to play again`,
            'DATABASE_ERROR': `SERVER ERROR|Something went wrong on our end\\nScore: ${score}\\nTap anywhere to play again`
        };
        
        return messages[errorCode] || `ERROR|Something unexpected happened\\nScore: ${score}\\nTap anywhere to play again`;
    }
}