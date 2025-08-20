// Achievement system for Snake Game - gamification and user engagement
class AchievementManager {
    constructor(analytics) {
        this.analytics = analytics;
        this.achievements = this.defineAchievements();
        this.userProgress = this.loadProgress();
        this.justUnlocked = [];
        
        // Initialize achievement UI
        this.initializeUI();
    }
    
    defineAchievements() {
        return {
            // Score-based achievements
            first_blood: {
                id: 'first_blood',
                name: 'First Blood',
                description: 'Submit your first score to the leaderboard',
                icon: '🩸',
                category: 'score',
                condition: (stats) => stats.scoresSubmitted >= 1,
                reward: { type: 'xp', value: 10 }
            },
            
            century: {
                id: 'century',
                name: 'Century Club',
                description: 'Score 100 points in a single game',
                icon: '💯',
                category: 'score',
                condition: (stats) => stats.bestScore >= 100,
                reward: { type: 'xp', value: 25 }
            },
            
            double_century: {
                id: 'double_century',
                name: 'Double Century',
                description: 'Score 200 points in a single game',
                icon: '🚀',
                category: 'score',
                condition: (stats) => stats.bestScore >= 200,
                reward: { type: 'xp', value: 50 }
            },
            
            perfectionist: {
                id: 'perfectionist',
                name: 'Perfectionist',
                description: 'Score 500+ points in a single game',
                icon: '🏆',
                category: 'score',
                condition: (stats) => stats.bestScore >= 500,
                reward: { type: 'premium_skin', value: 'golden_snake' }
            },
            
            // Gameplay achievements
            speed_demon: {
                id: 'speed_demon',
                name: 'Speed Demon',
                description: 'Score 100+ points in under 2 minutes',
                icon: '⚡',
                category: 'gameplay',
                condition: (stats) => stats.fastestCentury && stats.fastestCentury < 120000,
                reward: { type: 'xp', value: 40 }
            },
            
            marathon_runner: {
                id: 'marathon_runner',
                name: 'Marathon Runner',
                description: 'Play for more than 5 minutes in a single game',
                icon: '🏃',
                category: 'gameplay',
                condition: (stats) => stats.longestGame >= 300000,
                reward: { type: 'xp', value: 30 }
            },
            
            // Persistence achievements
            dedication: {
                id: 'dedication',
                name: 'Dedication',
                description: 'Play 10 games in total',
                icon: '🎯',
                category: 'persistence',
                condition: (stats) => stats.totalGames >= 10,
                reward: { type: 'xp', value: 20 }
            },
            
            addicted: {
                id: 'addicted',
                name: 'Addicted',
                description: 'Play 50 games in total',
                icon: '🕹️',
                category: 'persistence',
                condition: (stats) => stats.totalGames >= 50,
                reward: { type: 'theme', value: 'retro_green' }
            },
            
            never_give_up: {
                id: 'never_give_up',
                name: 'Never Give Up',
                description: 'Play 10 games in a single session',
                icon: '💪',
                category: 'persistence',
                condition: (stats) => stats.gamesThisSession >= 10,
                reward: { type: 'xp', value: 35 }
            },
            
            // Streak achievements
            comeback_kid: {
                id: 'comeback_kid',
                name: 'Comeback Kid',
                description: 'Return to play after 7+ days away',
                icon: '🔄',
                category: 'streak',
                condition: (stats) => stats.daysSinceLastPlay >= 7 && stats.gamesThisSession >= 1,
                reward: { type: 'bonus_points', value: 20 }
            },
            
            daily_grind: {
                id: 'daily_grind',
                name: 'Daily Grind',
                description: 'Play 5 days in a row',
                icon: '📅',
                category: 'streak',
                condition: (stats) => stats.dailyStreak >= 5,
                reward: { type: 'multiplier', value: 1.2 }
            },
            
            // Social achievements
            show_off: {
                id: 'show_off',
                name: 'Show Off',
                description: 'Share your score on social media',
                icon: '📱',
                category: 'social',
                condition: (stats) => stats.socialShares >= 1,
                reward: { type: 'xp', value: 15 }
            },
            
            influencer: {
                id: 'influencer',
                name: 'Influencer',
                description: 'Share your score 10 times',
                icon: '🌟',
                category: 'social',
                condition: (stats) => stats.socialShares >= 10,
                reward: { type: 'premium_feature', value: 'ad_free_hour' }
            },
            
            // Special achievements
            early_bird: {
                id: 'early_bird',
                name: 'Early Bird',
                description: 'Play before 8 AM local time',
                icon: '🌅',
                category: 'special',
                condition: (stats) => stats.hasPlayedEarlyMorning,
                reward: { type: 'xp', value: 15 }
            },
            
            night_owl: {
                id: 'night_owl',
                name: 'Night Owl',
                description: 'Play after 11 PM local time',
                icon: '🦉',
                category: 'special',
                condition: (stats) => stats.hasPlayedLateNight,
                reward: { type: 'theme', value: 'dark_mode' }
            },
            
            // Lucky achievements
            lucky_seven: {
                id: 'lucky_seven',
                name: 'Lucky Seven',
                description: 'End a game with exactly 77 points',
                icon: '🍀',
                category: 'lucky',
                condition: (stats) => stats.scores.includes(77),
                reward: { type: 'premium_currency', value: 77 }
            },
            
            palindrome: {
                id: 'palindrome',
                name: 'Palindrome',
                description: 'Score 111, 121, 131, 141, or 151 points',
                icon: '🔄',
                category: 'lucky',
                condition: (stats) => [111, 121, 131, 141, 151].some(score => stats.scores.includes(score)),
                reward: { type: 'xp', value: 25 }
            }
        };
    }
    
    loadProgress() {
        const saved = localStorage.getItem('snakeAchievementProgress');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return {
            unlockedAchievements: [],
            stats: {
                totalGames: 0,
                gamesThisSession: 0,
                bestScore: 0,
                totalScore: 0,
                scoresSubmitted: 0,
                socialShares: 0,
                dailyStreak: 0,
                daysSinceLastPlay: 0,
                fastestCentury: null,
                longestGame: 0,
                scores: [],
                hasPlayedEarlyMorning: false,
                hasPlayedLateNight: false
            }
        };
    }
    
    saveProgress() {
        localStorage.setItem('snakeAchievementProgress', JSON.stringify(this.userProgress));
    }
    
    updateStats(newStats) {
        // Merge new stats with existing ones
        this.userProgress.stats = { ...this.userProgress.stats, ...newStats };
        
        // Track specific achievements
        if (newStats.score !== undefined) {
            this.userProgress.stats.scores.push(newStats.score);
            if (newStats.score > this.userProgress.stats.bestScore) {
                this.userProgress.stats.bestScore = newStats.score;
            }
        }
        
        if (newStats.gameDuration !== undefined) {
            if (newStats.gameDuration > this.userProgress.stats.longestGame) {
                this.userProgress.stats.longestGame = newStats.gameDuration;
            }
            
            // Track fastest century
            if (newStats.score >= 100) {
                if (!this.userProgress.stats.fastestCentury || 
                    newStats.gameDuration < this.userProgress.stats.fastestCentury) {
                    this.userProgress.stats.fastestCentury = newStats.gameDuration;
                }
            }
        }
        
        // Time-based achievements
        const hour = new Date().getHours();
        if (hour < 8) this.userProgress.stats.hasPlayedEarlyMorning = true;
        if (hour >= 23) this.userProgress.stats.hasPlayedLateNight = true;
        
        this.saveProgress();
        this.checkForNewAchievements();
    }
    
    checkForNewAchievements() {
        const newUnlocks = [];
        
        Object.values(this.achievements).forEach(achievement => {
            // Skip already unlocked achievements
            if (this.userProgress.unlockedAchievements.includes(achievement.id)) {
                return;
            }
            
            // Check if condition is met
            if (achievement.condition(this.userProgress.stats)) {
                newUnlocks.push(achievement);
                this.userProgress.unlockedAchievements.push(achievement.id);
                
                // Track analytics
                this.analytics?.trackAchievementUnlock(achievement.id, achievement.name);
                
                // Apply reward
                this.applyReward(achievement.reward);
            }
        });
        
        if (newUnlocks.length > 0) {
            this.justUnlocked = newUnlocks;
            this.saveProgress();
            this.showAchievementNotifications(newUnlocks);
        }
        
        return newUnlocks;
    }
    
    applyReward(reward) {
        switch (reward.type) {
            case 'xp':
                // XP system for future gamification
                console.log(`🎉 Earned ${reward.value} XP!`);
                break;
                
            case 'premium_skin':
                this.unlockPremiumSkin(reward.value);
                break;
                
            case 'theme':
                this.unlockTheme(reward.value);
                break;
                
            case 'bonus_points':
                // Add bonus points to next game
                this.setBonusPoints(reward.value);
                break;
                
            case 'multiplier':
                // Set score multiplier for limited time
                this.setScoreMultiplier(reward.value, 300000); // 5 minutes
                break;
                
            case 'premium_currency':
                this.addPremiumCurrency(reward.value);
                break;
                
            case 'premium_feature':
                this.unlockPremiumFeature(reward.value);
                break;
        }
    }
    
    unlockPremiumSkin(skinId) {
        const unlockedSkins = JSON.parse(localStorage.getItem('unlockedSkins') || '["classic"]');
        if (!unlockedSkins.includes(skinId)) {
            unlockedSkins.push(skinId);
            localStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
            console.log(`🐍 Unlocked new snake skin: ${skinId}`);
        }
    }
    
    unlockTheme(themeId) {
        const unlockedThemes = JSON.parse(localStorage.getItem('unlockedThemes') || '["classic"]');
        if (!unlockedThemes.includes(themeId)) {
            unlockedThemes.push(themeId);
            localStorage.setItem('unlockedThemes', JSON.stringify(unlockedThemes));
            console.log(`🎨 Unlocked new theme: ${themeId}`);
        }
    }
    
    setBonusPoints(points) {
        localStorage.setItem('bonusPoints', points.toString());
        console.log(`💰 Bonus points for next game: ${points}`);
    }
    
    setScoreMultiplier(multiplier, duration) {
        const multiplierData = {
            multiplier: multiplier,
            expiresAt: Date.now() + duration
        };
        localStorage.setItem('scoreMultiplier', JSON.stringify(multiplierData));
        console.log(`⚡ Score multiplier active: ${multiplier}x for ${duration/1000} seconds`);
    }
    
    addPremiumCurrency(amount) {
        const current = parseInt(localStorage.getItem('premiumCurrency') || '0');
        localStorage.setItem('premiumCurrency', (current + amount).toString());
        console.log(`💎 Earned ${amount} premium currency! Total: ${current + amount}`);
    }
    
    unlockPremiumFeature(featureId) {
        const features = JSON.parse(localStorage.getItem('premiumFeatures') || '[]');
        if (!features.includes(featureId)) {
            features.push(featureId);
            localStorage.setItem('premiumFeatures', JSON.stringify(features));
            console.log(`✨ Unlocked premium feature: ${featureId}`);
        }
    }
    
    // UI Methods
    initializeUI() {
        this.createAchievementPanel();
        this.createNotificationSystem();
    }
    
    createAchievementPanel() {
        // Create achievement button in UI
        const achievementBtn = document.createElement('button');
        achievementBtn.id = 'achievementBtn';
        achievementBtn.innerHTML = '🏆';
        achievementBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4a5568;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 20px;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        achievementBtn.addEventListener('click', () => this.showAchievementPanel());
        document.body.appendChild(achievementBtn);
        
        // Badge for new achievements
        this.achievementBadge = document.createElement('div');
        this.achievementBadge.id = 'achievementBadge';
        this.achievementBadge.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            background: #e53e3e;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 12px;
            display: none;
            align-items: center;
            justify-content: center;
        `;
        achievementBtn.appendChild(this.achievementBadge);
    }
    
    createNotificationSystem() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'achievementNotifications';
        this.notificationContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1001;
            max-width: 300px;
        `;
        document.body.appendChild(this.notificationContainer);
    }
    
    showAchievementNotifications(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.showNotification(achievement);
            }, index * 1000); // Stagger notifications
        });
        
        // Update badge
        this.updateAchievementBadge();
    }
    
    showNotification(achievement) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: linear-gradient(135deg, #4a5568, #2d3748);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transform: translateX(320px);
            transition: all 0.5s ease;
            border-left: 4px solid #38b2ac;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div style="font-size: 30px; margin-right: 15px;">${achievement.icon}</div>
                <div>
                    <div style="font-weight: bold; font-size: 16px;">Achievement Unlocked!</div>
                    <div style="font-size: 14px; margin: 5px 0;">${achievement.name}</div>
                    <div style="font-size: 12px; opacity: 0.8;">${achievement.description}</div>
                </div>
            </div>
        `;
        
        this.notificationContainer.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(320px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
    }
    
    updateAchievementBadge() {
        const newAchievements = this.justUnlocked.length;
        if (newAchievements > 0) {
            this.achievementBadge.textContent = newAchievements;
            this.achievementBadge.style.display = 'flex';
        }
    }
    
    showAchievementPanel() {
        // Clear badge
        this.achievementBadge.style.display = 'none';
        this.justUnlocked = [];
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1002;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const panel = document.createElement('div');
        panel.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        `;
        
        const unlockedCount = this.userProgress.unlockedAchievements.length;
        const totalCount = Object.keys(this.achievements).length;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">🏆 Achievements (${unlockedCount}/${totalCount})</h2>
                <button id="closeAchievements" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
            </div>
            <div id="achievementsList"></div>
        `;
        
        const list = panel.querySelector('#achievementsList');
        
        Object.values(this.achievements).forEach(achievement => {
            const unlocked = this.userProgress.unlockedAchievements.includes(achievement.id);
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 10px;
                background: ${unlocked ? 'linear-gradient(135deg, #e6fffa, #b2f5ea)' : '#f7fafc'};
                border: 2px solid ${unlocked ? '#38b2ac' : '#e2e8f0'};
                opacity: ${unlocked ? '1' : '0.6'};
            `;
            
            item.innerHTML = `
                <div style="font-size: 40px; margin-right: 20px;">${achievement.icon}</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 16px;">${achievement.name}</div>
                    <div style="font-size: 14px; color: #4a5568; margin-top: 5px;">${achievement.description}</div>
                    <div style="font-size: 12px; color: #718096; margin-top: 5px;">
                        Category: ${achievement.category} • 
                        ${unlocked ? '✅ Unlocked' : '🔒 Locked'}
                    </div>
                </div>
            `;
            
            list.appendChild(item);
        });
        
        modal.appendChild(panel);
        document.body.appendChild(modal);
        
        // Close handlers
        panel.querySelector('#closeAchievements').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // Public API
    getUnlockedAchievements() {
        return this.userProgress.unlockedAchievements.map(id => this.achievements[id]);
    }
    
    getProgress() {
        return {
            unlocked: this.userProgress.unlockedAchievements.length,
            total: Object.keys(this.achievements).length,
            percentage: Math.round((this.userProgress.unlockedAchievements.length / Object.keys(this.achievements).length) * 100)
        };
    }
    
    getCurrentStats() {
        return { ...this.userProgress.stats };
    }
}