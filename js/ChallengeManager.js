// Daily challenges and special events for Snake Game
class ChallengeManager {
    constructor(analytics, achievementManager) {
        this.analytics = analytics;
        this.achievementManager = achievementManager;
        this.challenges = this.generateDailyChallenges();
        this.currentChallenge = this.getCurrentChallenge();
        this.progress = this.loadProgress();
        
        this.initializeUI();
    }
    
    generateDailyChallenges() {
        // Base challenges that rotate daily
        const challengeTemplates = [
            {
                id: 'speed_run',
                name: 'Speed Run',
                description: 'Score {target} points in under {time} seconds',
                icon: '⚡',
                type: 'speed',
                difficulty: 'medium',
                rewards: { xp: 50, premiumCurrency: 10 },
                generateParams: () => ({
                    target: 50 + Math.floor(Math.random() * 100),
                    time: 90 + Math.floor(Math.random() * 60)
                })
            },
            
            {
                id: 'marathon',
                name: 'Marathon Mode',
                description: 'Survive for {duration} minutes in a single game',
                icon: '🏃',
                type: 'survival',
                difficulty: 'hard',
                rewards: { xp: 75, premiumCurrency: 15 },
                generateParams: () => ({
                    duration: 3 + Math.floor(Math.random() * 4)
                })
            },
            
            {
                id: 'perfect_score',
                name: 'Perfect Score',
                description: 'Score exactly {target} points',
                icon: '🎯',
                type: 'precision',
                difficulty: 'hard',
                rewards: { xp: 100, premiumCurrency: 25, specialReward: 'golden_apple' },
                generateParams: () => {
                    const targets = [77, 111, 123, 150, 200, 222, 333];
                    return { target: targets[Math.floor(Math.random() * targets.length)] };
                }
            },
            
            {
                id: 'high_scorer',
                name: 'High Scorer',
                description: 'Beat your personal best by at least {improvement} points',
                icon: '📈',
                type: 'improvement',
                difficulty: 'medium',
                rewards: { xp: 60, premiumCurrency: 12 },
                generateParams: () => ({
                    improvement: 10 + Math.floor(Math.random() * 40)
                })
            },
            
            {
                id: 'consistency',
                name: 'Consistency Challenge',
                description: 'Play {games} games with each scoring at least {minScore} points',
                icon: '📊',
                type: 'consistency',
                difficulty: 'medium',
                rewards: { xp: 40, premiumCurrency: 8 },
                generateParams: () => ({
                    games: 3 + Math.floor(Math.random() * 3),
                    minScore: 30 + Math.floor(Math.random() * 50)
                })
            },
            
            {
                id: 'streak_master',
                name: 'Streak Master',
                description: 'Complete {games} games in a row without quitting',
                icon: '🔥',
                type: 'persistence',
                difficulty: 'easy',
                rewards: { xp: 30, premiumCurrency: 5 },
                generateParams: () => ({
                    games: 5 + Math.floor(Math.random() * 5)
                })
            },
            
            {
                id: 'food_hunter',
                name: 'Food Hunter',
                description: 'Eat {apples} apples in total across all games today',
                icon: '🍎',
                type: 'collection',
                difficulty: 'easy',
                rewards: { xp: 25, premiumCurrency: 5 },
                generateParams: () => ({
                    apples: 20 + Math.floor(Math.random() * 30)
                })
            },
            
            {
                id: 'social_butterfly',
                name: 'Social Butterfly',
                description: 'Share your score {shares} times today',
                icon: '📱',
                type: 'social',
                difficulty: 'easy',
                rewards: { xp: 20, premiumCurrency: 8, specialReward: 'social_frame' },
                generateParams: () => ({
                    shares: 2 + Math.floor(Math.random() * 3)
                })
            }
        ];
        
        return challengeTemplates;
    }
    
    getCurrentChallenge() {
        const today = this.getDateString();
        const storedChallenge = localStorage.getItem(`dailyChallenge_${today}`);
        
        if (storedChallenge) {
            return JSON.parse(storedChallenge);
        }
        
        // Generate new challenge for today
        const template = this.selectDailyTemplate();
        const params = template.generateParams();
        
        const challenge = {
            id: `${template.id}_${today}`,
            templateId: template.id,
            name: template.name,
            description: this.formatDescription(template.description, params),
            icon: template.icon,
            type: template.type,
            difficulty: template.difficulty,
            rewards: template.rewards,
            params: params,
            date: today,
            progress: this.initializeProgress(template.type, params),
            completed: false,
            startTime: Date.now()
        };
        
        localStorage.setItem(`dailyChallenge_${today}`, JSON.stringify(challenge));
        return challenge;
    }
    
    selectDailyTemplate() {
        // Use date as seed for consistent daily challenges
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const index = dayOfYear % this.challenges.length;
        return this.challenges[index];
    }
    
    formatDescription(template, params) {
        let formatted = template;
        Object.entries(params).forEach(([key, value]) => {
            formatted = formatted.replace(`{${key}}`, value);
        });
        return formatted;
    }
    
    initializeProgress(type, params) {
        const progressTypes = {
            speed: { type: 'best_time', current: null, target: params.target },
            survival: { type: 'best_duration', current: 0, target: params.duration * 60000 },
            precision: { type: 'exact_score', current: 0, target: params.target },
            improvement: { type: 'score_improvement', current: 0, target: params.improvement },
            consistency: { type: 'qualifying_games', current: 0, target: params.games },
            persistence: { type: 'consecutive_games', current: 0, target: params.games },
            collection: { type: 'items_collected', current: 0, target: params.apples },
            social: { type: 'shares_made', current: 0, target: params.shares }
        };
        
        return progressTypes[type] || { type: 'generic', current: 0, target: 1 };
    }
    
    loadProgress() {
        const today = this.getDateString();
        const saved = localStorage.getItem(`challengeProgress_${today}`);
        return saved ? JSON.parse(saved) : {};
    }
    
    saveProgress() {
        const today = this.getDateString();
        localStorage.setItem(`challengeProgress_${today}`, JSON.stringify(this.progress));
    }
    
    updateProgress(gameData) {
        if (!this.currentChallenge || this.currentChallenge.completed) {
            return;
        }
        
        let progressMade = false;
        const challenge = this.currentChallenge;
        
        switch (challenge.type) {
            case 'speed':
                if (gameData.score >= challenge.params.target && 
                    gameData.duration <= challenge.params.time * 1000) {
                    if (!challenge.progress.current || gameData.duration < challenge.progress.current) {
                        challenge.progress.current = gameData.duration;
                        progressMade = true;
                    }
                }
                break;
                
            case 'survival':
                if (gameData.duration > challenge.progress.current) {
                    challenge.progress.current = gameData.duration;
                    progressMade = true;
                }
                break;
                
            case 'precision':
                if (gameData.score === challenge.params.target) {
                    challenge.progress.current = gameData.score;
                    progressMade = true;
                }
                break;
                
            case 'improvement':
                const improvement = gameData.score - (gameData.previousBest || 0);
                if (improvement >= challenge.params.improvement) {
                    challenge.progress.current = Math.max(challenge.progress.current, improvement);
                    progressMade = true;
                }
                break;
                
            case 'consistency':
                if (gameData.score >= challenge.params.minScore) {
                    challenge.progress.current = Math.min(
                        challenge.progress.current + 1, 
                        challenge.params.games
                    );
                    progressMade = true;
                }
                break;
                
            case 'persistence':
                if (gameData.completed) { // Game finished, not quit
                    challenge.progress.current++;
                    progressMade = true;
                } else if (gameData.quit) {
                    challenge.progress.current = 0; // Reset streak
                }
                break;
                
            case 'collection':
                if (gameData.applesEaten) {
                    challenge.progress.current += gameData.applesEaten;
                    progressMade = true;
                }
                break;
                
            case 'social':
                if (gameData.shared) {
                    challenge.progress.current++;
                    progressMade = true;
                }
                break;
        }
        
        if (progressMade) {
            this.checkCompletion();
            this.updateUI();
            
            // Save progress
            localStorage.setItem(`dailyChallenge_${this.getDateString()}`, JSON.stringify(challenge));
            
            // Track analytics
            this.analytics?.trackEvent('challenge_progress', {
                challengeId: challenge.id,
                type: challenge.type,
                progress: this.getProgressPercentage()
            });
        }
    }
    
    checkCompletion() {
        const challenge = this.currentChallenge;
        let completed = false;
        
        switch (challenge.progress.type) {
            case 'best_time':
                completed = challenge.progress.current !== null && 
                           challenge.progress.current <= challenge.params.time * 1000;
                break;
                
            case 'exact_score':
                completed = challenge.progress.current === challenge.progress.target;
                break;
                
            default:
                completed = challenge.progress.current >= challenge.progress.target;
        }
        
        if (completed && !challenge.completed) {
            challenge.completed = true;
            challenge.completedAt = Date.now();
            
            this.grantRewards(challenge.rewards);
            this.showCompletionNotification(challenge);
            
            // Track analytics
            this.analytics?.trackEvent('challenge_completed', {
                challengeId: challenge.id,
                type: challenge.type,
                difficulty: challenge.difficulty,
                completionTime: Date.now() - challenge.startTime
            });
        }
    }
    
    grantRewards(rewards) {
        Object.entries(rewards).forEach(([type, value]) => {
            switch (type) {
                case 'xp':
                    this.grantXP(value);
                    break;
                case 'premiumCurrency':
                    this.grantPremiumCurrency(value);
                    break;
                case 'specialReward':
                    this.grantSpecialReward(value);
                    break;
            }
        });
    }
    
    grantXP(amount) {
        const currentXP = parseInt(localStorage.getItem('playerXP') || '0');
        localStorage.setItem('playerXP', (currentXP + amount).toString());
        console.log(`🌟 Earned ${amount} XP! Total: ${currentXP + amount}`);
    }
    
    grantPremiumCurrency(amount) {
        const current = parseInt(localStorage.getItem('premiumCurrency') || '0');
        localStorage.setItem('premiumCurrency', (current + amount).toString());
        console.log(`💎 Earned ${amount} gems! Total: ${current + amount}`);
    }
    
    grantSpecialReward(rewardId) {
        const rewards = JSON.parse(localStorage.getItem('specialRewards') || '[]');
        if (!rewards.includes(rewardId)) {
            rewards.push(rewardId);
            localStorage.setItem('specialRewards', JSON.stringify(rewards));
            console.log(`🎁 Unlocked special reward: ${rewardId}`);
        }
    }
    
    initializeUI() {
        this.createChallengePanel();
        this.updateUI();
    }
    
    createChallengePanel() {
        // Create challenge indicator in the game overlay
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            const challengeInfo = document.createElement('div');
            challengeInfo.id = 'challengeInfo';
            challengeInfo.style.cssText = `
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                font-size: 14px;
                text-align: center;
                max-width: 300px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
            challengeInfo.addEventListener('click', () => this.showChallengeDetails());
            overlay.appendChild(challengeInfo);
        }
        
        // Create detailed challenge modal
        this.createChallengeModal();
    }
    
    createChallengeModal() {
        const modal = document.createElement('div');
        modal.id = 'challengeModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            display: none;
            align-items: center;
            justify-content: center;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            position: relative;
            text-align: center;
        `;
        
        content.innerHTML = `
            <button id="closeChallengeModal" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            ">×</button>
            <div id="challengeModalContent"></div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Event listeners
        content.querySelector('#closeChallengeModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    updateUI() {
        const challengeInfo = document.getElementById('challengeInfo');
        if (challengeInfo && this.currentChallenge) {
            const progress = this.getProgressPercentage();
            const statusIcon = this.currentChallenge.completed ? '✅' : 
                              progress > 0 ? '🔥' : this.currentChallenge.icon;
            
            challengeInfo.innerHTML = `
                ${statusIcon} Daily Challenge: ${this.currentChallenge.name}<br>
                <div style="font-size: 12px; margin-top: 5px;">
                    ${this.getProgressText()} • Click for details
                </div>
            `;
            
            if (this.currentChallenge.completed) {
                challengeInfo.style.background = 'linear-gradient(135deg, #38a169, #2f855a)';
            }
        }
    }
    
    getProgressPercentage() {
        if (!this.currentChallenge) return 0;
        
        const progress = this.currentChallenge.progress;
        
        if (progress.type === 'exact_score') {
            return progress.current === progress.target ? 100 : 0;
        }
        
        return Math.min(100, Math.round((progress.current / progress.target) * 100));
    }
    
    getProgressText() {
        if (!this.currentChallenge) return '';
        
        const progress = this.currentChallenge.progress;
        const percentage = this.getProgressPercentage();
        
        if (this.currentChallenge.completed) {
            return 'Completed! 🎉';
        }
        
        if (progress.type === 'exact_score') {
            return `Target: ${progress.target} points`;
        }
        
        return `${progress.current}/${progress.target} (${percentage}%)`;
    }
    
    showChallengeDetails() {
        const modal = document.getElementById('challengeModal');
        const content = document.getElementById('challengeModalContent');
        
        if (!this.currentChallenge) {
            content.innerHTML = '<p>No active challenge today. Check back tomorrow!</p>';
        } else {
            const challenge = this.currentChallenge;
            const timeLeft = this.getTimeLeft();
            
            content.innerHTML = `
                <div style="font-size: 40px; margin-bottom: 15px;">${challenge.icon}</div>
                <h2 style="margin: 10px 0;">${challenge.name}</h2>
                <p style="font-size: 16px; color: #4a5568; margin: 15px 0;">${challenge.description}</p>
                
                <div style="background: #f7fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h4>Progress</h4>
                    <div style="background: #e2e8f0; height: 20px; border-radius: 10px; margin: 10px 0;">
                        <div style="
                            background: linear-gradient(90deg, #38b2ac, #319795);
                            height: 100%;
                            width: ${this.getProgressPercentage()}%;
                            border-radius: 10px;
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                    <p>${this.getProgressText()}</p>
                </div>
                
                <div style="background: #fffbeb; padding: 15px; border-radius: 10px; margin: 20px 0;">
                    <h4>Rewards</h4>
                    <p>
                        ${challenge.rewards.xp ? `🌟 ${challenge.rewards.xp} XP` : ''}
                        ${challenge.rewards.premiumCurrency ? ` • 💎 ${challenge.rewards.premiumCurrency} Gems` : ''}
                        ${challenge.rewards.specialReward ? ` • 🎁 Special Reward` : ''}
                    </p>
                </div>
                
                <p style="font-size: 14px; color: #718096;">
                    ${challenge.completed ? 'Challenge completed!' : `Time left: ${timeLeft}`}
                </p>
            `;
        }
        
        modal.style.display = 'flex';
    }
    
    showCompletionNotification(challenge) {
        // Create completion notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #38a169, #2f855a);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            z-index: 1001;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: celebrateIn 0.5s ease;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 15px;">${challenge.icon}</div>
            <h2 style="margin: 10px 0;">Challenge Complete!</h2>
            <p style="margin: 15px 0;">${challenge.name}</p>
            <div style="font-size: 14px; opacity: 0.9;">
                Rewards earned: 
                ${challenge.rewards.xp ? `🌟 ${challenge.rewards.xp} XP` : ''}
                ${challenge.rewards.premiumCurrency ? ` 💎 ${challenge.rewards.premiumCurrency} Gems` : ''}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
        
        // Add celebration animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes celebrateIn {
                0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.1); }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    getTimeLeft() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeLeft = tomorrow - now;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }
    
    getDateString() {
        return new Date().toISOString().split('T')[0];
    }
    
    // Public API
    getCurrentChallengeInfo() {
        return this.currentChallenge;
    }
    
    getChallengeHistory() {
        const history = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const challenge = localStorage.getItem(`dailyChallenge_${dateString}`);
            if (challenge) {
                history.push(JSON.parse(challenge));
            }
        }
        return history;
    }
}