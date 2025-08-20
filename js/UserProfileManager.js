// User Profile and Progression System for Live Service Snake Game
class UserProfileManager {
    constructor(analytics) {
        this.analytics = analytics;
        this.profile = this.loadProfile();
        this.currencies = this.loadCurrencies();
        this.progression = this.loadProgression();
        this.settings = this.loadSettings();
        
        this.initializeProfile();
        this.createProfileUI();
        
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.saveProfile();
        }, 30000);
    }
    
    loadProfile() {
        const defaultProfile = {
            playerId: this.generatePlayerId(),
            username: this.generateUsername(),
            createdAt: Date.now(),
            lastLogin: Date.now(),
            totalPlaytime: 0,
            level: 1,
            experience: 0,
            experienceToNext: 100,
            prestigeLevel: 0,
            profilePicture: 'default_snake',
            title: 'Newcomer',
            
            // Game Statistics
            gamesPlayed: 0,
            totalScore: 0,
            bestScore: 0,
            totalApplesEaten: 0,
            totalDeaths: 0,
            averageScore: 0,
            
            // Progression Milestones
            unlockedAchievements: [],
            unlockedTitles: ['Newcomer'],
            unlockedCosmetics: ['classic_snake'],
            equippedCosmetics: {
                snake: 'classic_snake',
                trail: 'none',
                banner: 'none',
                frame: 'none'
            },
            
            // Social Data
            clanId: null,
            friendIds: [],
            blockedIds: [],
            
            // Session Data
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: this.getDateString(),
            
            version: '5.0.0'
        };
        
        const saved = localStorage.getItem('userProfile');
        return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
    }
    
    loadCurrencies() {
        const defaultCurrencies = {
            coins: 0,           // Primary currency (earned through gameplay)
            gems: 0,            // Premium currency (purchased or earned)
            seasonTokens: 0,    // Season-specific currency
            clanPoints: 0,      // Clan contribution points
            prestigePoints: 0,  // Post-max-level currency
            
            // Daily/Weekly limits for earning
            dailyCoinsEarned: 0,
            weeklyGemsEarned: 0,
            lastResetDate: this.getDateString()
        };
        
        const saved = localStorage.getItem('userCurrencies');
        return saved ? { ...defaultCurrencies, ...JSON.parse(saved) } : defaultCurrencies;
    }
    
    loadProgression() {
        const defaultProgression = {
            currentSeason: 1,
            seasonStartDate: Date.now(),
            seasonEndDate: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days
            
            // Battle Pass Progress
            battlePassTier: 0,
            battlePassXP: 0,
            hasPremiumPass: false,
            
            // Daily/Weekly Progress
            dailyMissionsCompleted: 0,
            weeklyMissionsCompleted: 0,
            lastDailyReset: this.getDateString(),
            lastWeeklyReset: this.getWeekString(),
            
            // Streaks and Engagement
            loginStreak: 0,
            maxLoginStreak: 0,
            consecutivePlays: 0,
            
            // Mastery System
            snakeMastery: {},  // Track playtime with each skin
            achievementProgress: {},
            
            version: '5.0.0'
        };
        
        const saved = localStorage.getItem('userProgression');
        return saved ? { ...defaultProgression, ...JSON.parse(saved) } : defaultProgression;
    }
    
    loadSettings() {
        const defaultSettings = {
            soundEnabled: true,
            musicEnabled: true,
            notificationsEnabled: true,
            vibrationEnabled: true,
            theme: 'classic',
            language: 'en',
            
            // Privacy Settings
            profileVisible: true,
            allowFriendRequests: true,
            allowClanInvites: true,
            
            // Gameplay Settings
            controlScheme: 'arrows',
            gameSpeed: 'normal',
            showGhostTrails: true,
            showPerformanceStats: false,
            
            version: '5.0.0'
        };
        
        const saved = localStorage.getItem('userSettings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }
    
    initializeProfile() {
        // Check if it's a new day (for daily resets)
        if (this.getDateString() !== this.progression.lastDailyReset) {
            this.performDailyReset();
        }
        
        // Check if it's a new week (for weekly resets)
        if (this.getWeekString() !== this.progression.lastWeeklyReset) {
            this.performWeeklyReset();
        }
        
        // Check login streak
        this.updateLoginStreak();
        
        // Update last login
        this.profile.lastLogin = Date.now();
        
        console.log(`👤 Welcome back, ${this.profile.username}! (Level ${this.profile.level})`);
    }
    
    createProfileUI() {
        // Create profile button in top-right corner
        const profileBtn = document.createElement('button');
        profileBtn.id = 'profileButton';
        profileBtn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                    🐍
                </div>
                <div style="text-align: left; font-size: 12px;">
                    <div style="font-weight: bold;">${this.profile.username}</div>
                    <div style="opacity: 0.8;">Level ${this.profile.level}</div>
                </div>
            </div>
        `;
        profileBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #e2e8f0;
            border-radius: 25px;
            padding: 8px 16px;
            cursor: pointer;
            z-index: 1000;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        profileBtn.addEventListener('click', () => this.showProfileModal());
        document.body.appendChild(profileBtn);
        
        // Create currency display
        this.createCurrencyDisplay();
        
        // Create profile modal
        this.createProfileModal();
    }
    
    createCurrencyDisplay() {
        const currencyDisplay = document.createElement('div');
        currencyDisplay.id = 'currencyDisplay';
        currencyDisplay.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 15px;
            padding: 12px 16px;
            z-index: 1000;
            font-size: 14px;
            font-weight: bold;
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 120px;
        `;
        
        this.updateCurrencyDisplay();
        document.body.appendChild(currencyDisplay);
    }
    
    updateCurrencyDisplay() {
        const display = document.getElementById('currencyDisplay');
        if (display) {
            display.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>🪙</span>
                    <span>${this.formatNumber(this.currencies.coins)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>💎</span>
                    <span>${this.formatNumber(this.currencies.gems)}</span>
                </div>
                ${this.currencies.seasonTokens > 0 ? `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>🎫</span>
                        <span>${this.formatNumber(this.currencies.seasonTokens)}</span>
                    </div>
                ` : ''}
            `;
        }
    }
    
    createProfileModal() {
        const modal = document.createElement('div');
        modal.id = 'profileModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1004;
            display: none;
            align-items: center;
            justify-content: center;
            overflow-y: auto;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            margin: 20px;
        `;
        
        content.innerHTML = `
            <button id="closeProfileModal" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            ">×</button>
            
            <div id="profileModalContent"></div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Event listeners
        content.querySelector('#closeProfileModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    showProfileModal() {
        const modal = document.getElementById('profileModal');
        const content = document.getElementById('profileModalContent');
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 40px;">
                    🐍
                </div>
                <h2 style="margin: 0; color: #2d3748;">${this.profile.username}</h2>
                <p style="margin: 5px 0; color: #666;">${this.profile.title}</p>
                <div style="background: #f7fafc; padding: 10px; border-radius: 10px; margin: 15px 0;">
                    <strong>Level ${this.profile.level}</strong> • ${this.profile.experience}/${this.profile.experienceToNext} XP
                    <div style="background: #e2e8f0; height: 6px; border-radius: 3px; margin: 5px 0;">
                        <div style="background: linear-gradient(90deg, #38b2ac, #319795); height: 100%; width: ${(this.profile.experience / this.profile.experienceToNext) * 100}%; border-radius: 3px;"></div>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div style="background: #f7fafc; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4 style="margin: 0 0 10px 0; color: #4a5568;">Game Stats</h4>
                    <p><strong>${this.profile.gamesPlayed}</strong> Games Played</p>
                    <p><strong>${this.formatNumber(this.profile.bestScore)}</strong> Best Score</p>
                    <p><strong>${this.formatNumber(this.profile.totalApplesEaten)}</strong> Apples Eaten</p>
                    <p><strong>${this.profile.currentStreak}</strong> Current Streak</p>
                </div>
                
                <div style="background: #f7fafc; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4 style="margin: 0 0 10px 0; color: #4a5568;">Progress</h4>
                    <p><strong>${this.profile.unlockedAchievements.length}</strong> Achievements</p>
                    <p><strong>${Object.keys(this.profile.unlockedCosmetics).length}</strong> Cosmetics</p>
                    <p><strong>${Math.floor(this.profile.totalPlaytime / 60000)}</strong> Minutes Played</p>
                    <p><strong>Season ${this.progression.currentSeason}</strong></p>
                </div>
            </div>
            
            <div style="background: #fffbeb; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h4 style="margin: 0 0 15px 0; color: #744210;">Currencies</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px;">🪙</div>
                        <strong>${this.formatNumber(this.currencies.coins)}</strong>
                        <div style="font-size: 12px; opacity: 0.7;">Coins</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px;">💎</div>
                        <strong>${this.formatNumber(this.currencies.gems)}</strong>
                        <div style="font-size: 12px; opacity: 0.7;">Gems</div>
                    </div>
                    ${this.currencies.seasonTokens > 0 ? `
                        <div style="text-align: center;">
                            <div style="font-size: 24px;">🎫</div>
                            <strong>${this.formatNumber(this.currencies.seasonTokens)}</strong>
                            <div style="font-size: 12px; opacity: 0.7;">Season Tokens</div>
                        </div>
                    ` : ''}
                    ${this.currencies.clanPoints > 0 ? `
                        <div style="text-align: center;">
                            <div style="font-size: 24px;">⚔️</div>
                            <strong>${this.formatNumber(this.currencies.clanPoints)}</strong>
                            <div style="font-size: 12px; opacity: 0.7;">Clan Points</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button id="editProfileBtn" style="
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    margin: 0 10px;
                ">Edit Profile</button>
                <button id="settingsBtn" style="
                    background: #718096;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    margin: 0 10px;
                ">Settings</button>
            </div>
        `;
        
        // Add event listeners for profile actions
        content.querySelector('#editProfileBtn').addEventListener('click', () => {
            this.showEditProfileModal();
        });
        
        content.querySelector('#settingsBtn').addEventListener('click', () => {
            this.showSettingsModal();
        });
        
        modal.style.display = 'flex';
    }
    
    showEditProfileModal() {
        // Simple username edit for now
        const newUsername = prompt('Enter new username:', this.profile.username);
        if (newUsername && newUsername.trim() && newUsername !== this.profile.username) {
            this.profile.username = newUsername.trim().substring(0, 20);
            this.saveProfile();
            this.updateProfileButton();
            this.showProfileModal(); // Refresh modal
            
            this.analytics?.trackEvent('profile_updated', {
                field: 'username'
            });
        }
    }
    
    showSettingsModal() {
        // Basic settings modal - expand this later
        const modal = document.getElementById('profileModal');
        const content = document.getElementById('profileModalContent');
        
        content.innerHTML = `
            <h2 style="text-align: center; margin-bottom: 30px;">Settings</h2>
            
            <div style="margin: 20px 0;">
                <h4>Audio</h4>
                <label style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
                    Sound Effects
                    <input type="checkbox" id="soundToggle" ${this.settings.soundEnabled ? 'checked' : ''}>
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
                    Background Music
                    <input type="checkbox" id="musicToggle" ${this.settings.musicEnabled ? 'checked' : ''}>
                </label>
            </div>
            
            <div style="margin: 20px 0;">
                <h4>Notifications</h4>
                <label style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
                    Push Notifications
                    <input type="checkbox" id="notificationToggle" ${this.settings.notificationsEnabled ? 'checked' : ''}>
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
                    Vibration
                    <input type="checkbox" id="vibrationToggle" ${this.settings.vibrationEnabled ? 'checked' : ''}>
                </label>
            </div>
            
            <div style="margin: 20px 0;">
                <h4>Gameplay</h4>
                <label style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
                    Show Ghost Trails
                    <input type="checkbox" id="ghostTrailToggle" ${this.settings.showGhostTrails ? 'checked' : ''}>
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
                    Performance Stats
                    <input type="checkbox" id="performanceToggle" ${this.settings.showPerformanceStats ? 'checked' : ''}>
                </label>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button id="saveSettingsBtn" style="
                    background: linear-gradient(135deg, #48bb78, #38a169);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    margin: 0 10px;
                ">Save Settings</button>
                <button id="backToProfileBtn" style="
                    background: #718096;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    margin: 0 10px;
                ">Back</button>
            </div>
        `;
        
        // Settings event handlers
        content.querySelector('#saveSettingsBtn').addEventListener('click', () => {
            this.settings.soundEnabled = content.querySelector('#soundToggle').checked;
            this.settings.musicEnabled = content.querySelector('#musicToggle').checked;
            this.settings.notificationsEnabled = content.querySelector('#notificationToggle').checked;
            this.settings.vibrationEnabled = content.querySelector('#vibrationToggle').checked;
            this.settings.showGhostTrails = content.querySelector('#ghostTrailToggle').checked;
            this.settings.showPerformanceStats = content.querySelector('#performanceToggle').checked;
            
            this.saveProfile();
            this.showNotification('Settings saved!', 'success');
            
            this.analytics?.trackEvent('settings_updated');
        });
        
        content.querySelector('#backToProfileBtn').addEventListener('click', () => {
            this.showProfileModal();
        });
    }
    
    updateProfileButton() {
        const profileBtn = document.getElementById('profileButton');
        if (profileBtn) {
            const usernameElement = profileBtn.querySelector('div > div > div:first-child');
            const levelElement = profileBtn.querySelector('div > div > div:last-child');
            
            if (usernameElement) usernameElement.textContent = this.profile.username;
            if (levelElement) levelElement.textContent = `Level ${this.profile.level}`;
        }
    }
    
    // Game Event Handlers
    onGameEnd(gameData) {
        this.profile.gamesPlayed++;
        this.profile.totalScore += gameData.score;
        this.profile.totalApplesEaten += gameData.applesEaten || 0;
        this.profile.totalDeaths++;
        this.profile.averageScore = Math.round(this.profile.totalScore / this.profile.gamesPlayed);
        
        if (gameData.score > this.profile.bestScore) {
            this.profile.bestScore = gameData.score;
            this.showNotification('🏆 New Personal Best!', 'achievement');
        }
        
        // Award experience based on performance
        const baseXP = Math.floor(gameData.score / 10);
        const bonusXP = gameData.score > this.profile.averageScore ? 10 : 0;
        const totalXP = baseXP + bonusXP;
        
        this.addExperience(totalXP, 'game_completion');
        
        // Award coins based on score
        const coinsEarned = Math.floor(gameData.score / 5);
        this.addCurrency('coins', coinsEarned, 'game_reward');
        
        this.saveProfile();
    }
    
    addExperience(amount, source = 'unknown') {
        this.profile.experience += amount;
        
        // Check for level up
        while (this.profile.experience >= this.profile.experienceToNext) {
            this.levelUp();
        }
        
        console.log(`+${amount} XP from ${source}`);
        this.analytics?.trackEvent('experience_gained', {
            amount: amount,
            source: source,
            newLevel: this.profile.level
        });
    }
    
    levelUp() {
        this.profile.experience -= this.profile.experienceToNext;
        this.profile.level++;
        
        // Increase XP requirement for next level (scaling curve)
        this.profile.experienceToNext = Math.floor(100 * Math.pow(1.1, this.profile.level - 1));
        
        // Level up rewards
        const coinReward = this.profile.level * 50;
        const gemReward = Math.floor(this.profile.level / 5);
        
        this.addCurrency('coins', coinReward, 'level_up');
        if (gemReward > 0) {
            this.addCurrency('gems', gemReward, 'level_up');
        }
        
        this.showNotification(`🎉 Level Up! Welcome to Level ${this.profile.level}!`, 'achievement');
        this.updateProfileButton();
        
        this.analytics?.trackEvent('level_up', {
            newLevel: this.profile.level,
            coinReward: coinReward,
            gemReward: gemReward
        });
    }
    
    addCurrency(type, amount, source = 'unknown') {
        if (amount <= 0) return false;
        
        // Check daily limits
        if (type === 'coins') {
            const dailyLimit = 1000;
            if (this.currencies.dailyCoinsEarned + amount > dailyLimit) {
                amount = Math.max(0, dailyLimit - this.currencies.dailyCoinsEarned);
                if (amount === 0) {
                    this.showNotification('Daily coin limit reached!', 'warning');
                    return false;
                }
            }
            this.currencies.dailyCoinsEarned += amount;
        }
        
        this.currencies[type] = (this.currencies[type] || 0) + amount;
        this.updateCurrencyDisplay();
        
        if (amount > 0) {
            this.showCurrencyNotification(type, amount);
        }
        
        this.analytics?.trackEvent('currency_earned', {
            type: type,
            amount: amount,
            source: source,
            newTotal: this.currencies[type]
        });
        
        return true;
    }
    
    spendCurrency(type, amount, source = 'unknown') {
        if (amount <= 0) return false;
        if (!this.currencies[type] || this.currencies[type] < amount) {
            this.showNotification(`Not enough ${type}!`, 'error');
            return false;
        }
        
        this.currencies[type] -= amount;
        this.updateCurrencyDisplay();
        
        this.analytics?.trackEvent('currency_spent', {
            type: type,
            amount: amount,
            source: source,
            remaining: this.currencies[type]
        });
        
        return true;
    }
    
    showCurrencyNotification(type, amount) {
        const emojis = {
            coins: '🪙',
            gems: '💎',
            seasonTokens: '🎫',
            clanPoints: '⚔️',
            prestigePoints: '⭐'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            z-index: 1001;
            font-weight: bold;
            animation: slideInRight 0.3s ease;
        `;
        
        notification.textContent = `+${amount} ${emojis[type] || '💰'}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }
    
    showNotification(message, type = 'info') {
        const colors = {
            info: '#4299e1',
            success: '#48bb78',
            warning: '#ed8936',
            error: '#e53e3e',
            achievement: '#9f7aea'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${colors[type] || colors.info};
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            z-index: 1005;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: notificationPop 0.5s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    performDailyReset() {
        this.currencies.dailyCoinsEarned = 0;
        this.progression.dailyMissionsCompleted = 0;
        this.progression.lastDailyReset = this.getDateString();
        
        console.log('🌅 Daily reset performed');
    }
    
    performWeeklyReset() {
        this.currencies.weeklyGemsEarned = 0;
        this.progression.weeklyMissionsCompleted = 0;
        this.progression.lastWeeklyReset = this.getWeekString();
        
        console.log('📅 Weekly reset performed');
    }
    
    updateLoginStreak() {
        const today = this.getDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];
        
        if (this.profile.lastActiveDate === yesterdayString) {
            // Consecutive login
            this.profile.currentStreak++;
            this.progression.loginStreak++;
        } else if (this.profile.lastActiveDate !== today) {
            // Streak broken
            this.profile.currentStreak = 1;
            this.progression.loginStreak = 1;
        }
        
        // Update max streaks
        this.profile.longestStreak = Math.max(this.profile.longestStreak, this.profile.currentStreak);
        this.progression.maxLoginStreak = Math.max(this.progression.maxLoginStreak, this.progression.loginStreak);
        
        this.profile.lastActiveDate = today;
        
        // Login streak rewards
        if (this.profile.currentStreak > 1) {
            const streakReward = this.profile.currentStreak * 10;
            this.addCurrency('coins', streakReward, 'login_streak');
            this.showNotification(`🔥 ${this.profile.currentStreak} day streak! +${streakReward} coins`, 'success');
            
            // Notify Battle Pass about login streak
            if (window.battlePass) {
                window.battlePass.onLoginStreak(this.profile.currentStreak);
            }
        }
    }
    
    // Utility Methods
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateUsername() {
        const adjectives = ['Swift', 'Clever', 'Mighty', 'Golden', 'Shadow', 'Neon', 'Cosmic', 'Fire', 'Ice', 'Lightning'];
        const nouns = ['Snake', 'Serpent', 'Viper', 'Python', 'Cobra', 'Adder', 'Mamba', 'Boa', 'Anaconda', 'Venom'];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 999) + 1;
        
        return `${adj}${noun}${num}`;
    }
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    getDateString() {
        return new Date().toISOString().split('T')[0];
    }
    
    getWeekString() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
        return `${now.getFullYear()}-W${week}`;
    }
    
    saveProfile() {
        try {
            localStorage.setItem('userProfile', JSON.stringify(this.profile));
            localStorage.setItem('userCurrencies', JSON.stringify(this.currencies));
            localStorage.setItem('userProgression', JSON.stringify(this.progression));
            localStorage.setItem('userSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save profile:', error);
        }
    }
    
    // Public API Methods
    getProfile() {
        return { ...this.profile };
    }
    
    getCurrencies() {
        return { ...this.currencies };
    }
    
    getProgression() {
        return { ...this.progression };
    }
    
    getSettings() {
        return { ...this.settings };
    }
    
    hasCurrency(type, amount) {
        return this.currencies[type] >= amount;
    }
    
    getLevel() {
        return this.profile.level;
    }
    
    getExperienceProgress() {
        return {
            current: this.profile.experience,
            needed: this.profile.experienceToNext,
            percentage: (this.profile.experience / this.profile.experienceToNext) * 100
        };
    }
    
    // Cleanup
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.saveProfile();
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes notificationPop {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);