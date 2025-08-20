// Battle Pass System - Primary Revenue Driver for Live Service
class BattlePassManager {
    constructor(userProfile, seasonManager, analytics) {
        this.userProfile = userProfile;
        this.seasonManager = seasonManager;
        this.analytics = analytics;
        
        this.battlePassData = this.loadBattlePassData();
        this.missionSystem = this.initializeMissionSystem();
        this.rewards = this.generateSeasonalRewards();
        
        this.initializeBattlePass();
        this.createBattlePassUI();
        this.setupProgressionTracking();
    }
    
    loadBattlePassData() {
        const currentSeason = this.seasonManager.getCurrentSeason();
        const defaultData = {
            seasonId: currentSeason.id,
            currentTier: 0,
            battlePassXP: 0,
            hasPremiumPass: false,
            purchaseDate: null,
            
            // Free track progress
            freeRewardsClaimed: [],
            
            // Premium track progress  
            premiumRewardsClaimed: [],
            
            // Mission completion tracking
            dailyMissionsCompleted: 0,
            weeklyMissionsCompleted: 0,
            seasonalMissionsCompleted: 0,
            
            // XP sources tracking
            xpFromGames: 0,
            xpFromMissions: 0,
            xpFromChallenges: 0,
            xpFromEvents: 0,
            
            // Purchase history
            purchaseHistory: [],
            
            version: '5.0.0'
        };
        
        const saved = localStorage.getItem(`battlePass_season_${currentSeason.id}`);
        const data = saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
        
        // Reset if new season
        if (data.seasonId !== currentSeason.id) {
            console.log(`🔄 New season detected, resetting Battle Pass`);
            return { ...defaultData, seasonId: currentSeason.id };
        }
        
        return data;
    }
    
    initializeMissionSystem() {
        return {
            daily: this.generateDailyMissions(),
            weekly: this.generateWeeklyMissions(), 
            seasonal: this.generateSeasonalMissions(),
            
            // Mission refresh times
            lastDailyRefresh: this.getDateString(),
            lastWeeklyRefresh: this.getWeekString(),
            
            // Completion tracking
            dailyProgress: {},
            weeklyProgress: {},
            seasonalProgress: {}
        };
    }
    
    generateSeasonalRewards() {
        const season = this.seasonManager.getCurrentSeason();
        const tiers = [];
        
        // Generate 50 tiers of rewards
        for (let tier = 1; tier <= 50; tier++) {
            tiers.push({
                tier: tier,
                xpRequired: this.calculateTierXP(tier),
                totalXPRequired: this.calculateTotalXP(tier),
                
                freeReward: this.generateFreeReward(tier, season),
                premiumReward: this.generatePremiumReward(tier, season),
                
                // Special milestone tiers
                isMilestone: tier % 10 === 0,
                isLegendary: [25, 50].includes(tier)
            });
        }
        
        return tiers;
    }
    
    calculateTierXP(tier) {
        // Progressive XP requirement: 1000 base + 50 per tier + exponential scaling
        return Math.floor(1000 + (tier * 50) + Math.pow(tier * 0.1, 2) * 100);
    }
    
    calculateTotalXP(targetTier) {
        let total = 0;
        for (let i = 1; i <= targetTier; i++) {
            total += this.calculateTierXP(i);
        }
        return total;
    }
    
    generateFreeReward(tier, season) {
        const freeRewards = [
            // Every tier gets something
            { type: 'coins', amount: tier * 25, rarity: 'common' },
            
            // Every 5 tiers: XP boost
            ...(tier % 5 === 0 ? [{ type: 'xp_boost', amount: 1.5, duration: 24, rarity: 'uncommon' }] : []),
            
            // Every 10 tiers: Cosmetic
            ...(tier % 10 === 0 ? [{ 
                type: 'snake_skin', 
                id: `${season.theme}_tier${tier}`, 
                name: `${season.name} Snake ${tier}`,
                rarity: 'rare' 
            }] : []),
            
            // Special milestone rewards
            ...(tier === 25 ? [{ type: 'title', id: `${season.theme}_champion`, name: `${season.name} Champion`, rarity: 'epic' }] : []),
            ...(tier === 50 ? [{ type: 'banner', id: `${season.theme}_master`, name: `${season.name} Master`, rarity: 'legendary' }] : [])
        ];
        
        return freeRewards[0] || { type: 'coins', amount: tier * 25, rarity: 'common' };
    }
    
    generatePremiumReward(tier, season) {
        const premiumRewards = [
            // Premium gets better rewards
            { type: 'gems', amount: Math.floor(tier / 2) + 5, rarity: 'uncommon' },
            
            // Every 3 tiers: Special currency
            ...(tier % 3 === 0 ? [{ type: 'season_tokens', amount: tier * 2, rarity: 'uncommon' }] : []),
            
            // Every 5 tiers: Premium cosmetic
            ...(tier % 5 === 0 ? [{ 
                type: 'snake_skin', 
                id: `premium_${season.theme}_tier${tier}`, 
                name: `Premium ${season.name} ${tier}`,
                rarity: 'epic',
                exclusive: true
            }] : []),
            
            // Premium milestone rewards
            ...(tier === 10 ? [{ type: 'trail_effect', id: `${season.theme}_trail`, name: `${season.name} Trail`, rarity: 'rare' }] : []),
            ...(tier === 25 ? [{ type: 'death_effect', id: `${season.theme}_explosion`, name: `${season.name} Explosion`, rarity: 'epic' }] : []),
            ...(tier === 50 ? [{ 
                type: 'legendary_skin', 
                id: `legendary_${season.theme}`, 
                name: `Legendary ${season.name}`,
                rarity: 'legendary',
                animated: true,
                exclusive: true
            }] : [])
        ];
        
        return premiumRewards[0] || { type: 'gems', amount: Math.floor(tier / 2) + 5, rarity: 'uncommon' };
    }
    
    initializeBattlePass() {
        // Check for daily/weekly resets
        this.checkMissionResets();
        
        // Auto-claim any pending rewards
        this.autoClaimCompletedTiers();
        
        // Calculate current tier from XP
        this.updateCurrentTier();
        
        console.log(`⚔️ Battle Pass Season ${this.battlePassData.seasonId} loaded`);
        console.log(`📊 Current Tier: ${this.battlePassData.currentTier}/50`);
        console.log(`💎 Premium: ${this.battlePassData.hasPremiumPass ? 'Yes' : 'No'}`);
    }
    
    createBattlePassUI() {
        // Battle Pass button in main UI
        const battlePassBtn = document.createElement('button');
        battlePassBtn.id = 'battlePassButton';
        battlePassBtn.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
        `;
        
        this.updateBattlePassButton();
        
        battlePassBtn.addEventListener('click', () => this.showBattlePassModal());
        document.body.appendChild(battlePassBtn);
        
        // Create main Battle Pass modal
        this.createBattlePassModal();
        
        // Create mission tracking UI
        this.createMissionTracker();
        
        // Create XP notification system
        this.createXPNotifications();
    }
    
    updateBattlePassButton() {
        const btn = document.getElementById('battlePassButton');
        if (btn) {
            const progress = this.getCurrentTierProgress();
            const hasUnclaimed = this.hasUnclaimedRewards();
            
            btn.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 18px;">${hasUnclaimed ? '🎁' : '⚔️'}</div>
                    <div style="text-align: left;">
                        <div style="font-size: 12px;">Battle Pass</div>
                        <div style="font-size: 10px; opacity: 0.9;">
                            Tier ${this.battlePassData.currentTier}/50 (${progress}%)
                        </div>
                    </div>
                    ${hasUnclaimed ? '<div style="width: 8px; height: 8px; background: #f56565; border-radius: 50%; margin-left: 4px;"></div>' : ''}
                </div>
            `;
            
            if (hasUnclaimed) {
                btn.style.animation = 'battlePassPulse 2s infinite';
            } else {
                btn.style.animation = 'none';
            }
        }
    }
    
    createBattlePassModal() {
        const modal = document.createElement('div');
        modal.id = 'battlePassModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 1010;
            display: none;
            align-items: center;
            justify-content: center;
            overflow-y: auto;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 15px;
            padding: 0;
            max-width: 95vw;
            max-height: 95vh;
            overflow: hidden;
            position: relative;
            color: white;
        `;
        
        content.innerHTML = `
            <button id="closeBattlePassModal" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255,255,255,0.1);
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                z-index: 1011;
            ">×</button>
            
            <div id="battlePassContent"></div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Event listeners
        content.querySelector('#closeBattlePassModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    showBattlePassModal() {
        const modal = document.getElementById('battlePassModal');
        const content = document.getElementById('battlePassContent');
        
        const season = this.seasonManager.getCurrentSeason();
        const currentTier = this.battlePassData.currentTier;
        const totalXP = this.battlePassData.battlePassXP;
        const timeLeft = this.seasonManager.getTimeUntilSeasonEnd();
        
        content.innerHTML = `
            <!-- Header -->
            <div style="
                background: linear-gradient(135deg, ${season.colors.primary}, ${season.colors.secondary});
                padding: 40px 30px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            ">
                <div style="
                    position: absolute;
                    top: -50px;
                    right: -50px;
                    font-size: 200px;
                    opacity: 0.1;
                ">⚔️</div>
                
                <h1 style="margin: 0; font-size: 32px; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                    Season ${season.id} Battle Pass
                </h1>
                <h2 style="margin: 10px 0; font-size: 20px; opacity: 0.9;">
                    ${season.name}
                </h2>
                
                <div style="display: flex; justify-content: center; gap: 40px; margin: 25px 0;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${currentTier}</div>
                        <div style="font-size: 14px; opacity: 0.8;">Current Tier</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${this.formatNumber(totalXP)}</div>
                        <div style="font-size: 14px; opacity: 0.8;">Total XP</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${timeLeft}</div>
                        <div style="font-size: 14px; opacity: 0.8;">Time Left</div>
                    </div>
                </div>
                
                ${!this.battlePassData.hasPremiumPass ? `
                    <button id="purchasePremiumPass" style="
                        background: linear-gradient(135deg, #f6ad55, #ed8936);
                        color: white;
                        border: none;
                        padding: 15px 40px;
                        border-radius: 25px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-top: 15px;
                        box-shadow: 0 4px 20px rgba(246, 173, 85, 0.4);
                    ">
                        🔓 Unlock Premium Pass - $4.99
                    </button>
                ` : `
                    <div style="
                        background: rgba(72, 187, 120, 0.2);
                        border: 2px solid #48bb78;
                        padding: 12px 25px;
                        border-radius: 25px;
                        display: inline-block;
                        margin-top: 15px;
                    ">
                        ✅ Premium Pass Active
                    </div>
                `}
            </div>
            
            <!-- Progress Visualization -->
            <div style="padding: 30px;">
                <div style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 20px 0; text-align: center;">Battle Pass Progress</h3>
                    ${this.generateTierVisual()}
                </div>
                
                <!-- Tabs -->
                <div style="display: flex; border-bottom: 2px solid #2d3748; margin-bottom: 25px;">
                    <button class="battle-pass-tab active" data-tab="rewards" style="
                        background: none;
                        border: none;
                        color: white;
                        padding: 15px 25px;
                        cursor: pointer;
                        border-bottom: 3px solid ${season.colors.primary};
                        font-weight: bold;
                    ">🎁 Rewards</button>
                    <button class="battle-pass-tab" data-tab="missions" style="
                        background: none;
                        border: none;
                        color: #a0aec0;
                        padding: 15px 25px;
                        cursor: pointer;
                        border-bottom: 3px solid transparent;
                    ">🎯 Missions</button>
                    <button class="battle-pass-tab" data-tab="stats" style="
                        background: none;
                        border: none;
                        color: #a0aec0;
                        padding: 15px 25px;
                        cursor: pointer;
                        border-bottom: 3px solid transparent;
                    ">📊 Stats</button>
                </div>
                
                <!-- Tab Content -->
                <div id="battlePassTabContent">
                    ${this.generateRewardsTab()}
                </div>
            </div>
        `;
        
        // Add tab functionality
        content.querySelectorAll('.battle-pass-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchBattlePassTab(tabName);
            });
        });
        
        // Premium pass purchase
        const purchaseBtn = content.querySelector('#purchasePremiumPass');
        if (purchaseBtn) {
            purchaseBtn.addEventListener('click', () => {
                this.showPremiumPassPurchase();
            });
        }
        
        // Reward claim buttons
        this.addRewardClaimListeners();
        
        modal.style.display = 'flex';
        
        // Track Battle Pass view
        this.analytics?.trackEvent('battle_pass_viewed', {
            seasonId: season.id,
            currentTier: currentTier,
            hasPremium: this.battlePassData.hasPremiumPass
        });
    }
    
    generateTierVisual() {
        const currentTier = this.battlePassData.currentTier;
        const currentProgress = this.getCurrentTierProgress();
        
        // Show current tier and next few tiers
        const startTier = Math.max(1, currentTier - 2);
        const endTier = Math.min(50, currentTier + 3);
        
        let html = `
            <div style="display: flex; align-items: center; gap: 15px; overflow-x: auto; padding: 20px 0;">
        `;
        
        for (let tier = startTier; tier <= endTier; tier++) {
            const reward = this.rewards.find(r => r.tier === tier);
            const isCompleted = tier <= currentTier;
            const isCurrent = tier === currentTier + 1;
            
            html += `
                <div style="
                    min-width: 120px;
                    text-align: center;
                    padding: 15px;
                    border-radius: 10px;
                    border: 2px solid ${isCurrent ? '#667eea' : isCompleted ? '#48bb78' : '#2d3748'};
                    background: ${isCurrent ? 'rgba(102, 126, 234, 0.2)' : isCompleted ? 'rgba(72, 187, 120, 0.2)' : 'rgba(45, 55, 72, 0.3)'};
                    position: relative;
                ">
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
                        ${isCompleted ? '✅' : isCurrent ? '⏳' : '🔒'} Tier ${tier}
                    </div>
                    
                    ${isCurrent ? `
                        <div style="margin: 10px 0;">
                            <div style="background: #2d3748; height: 6px; border-radius: 3px;">
                                <div style="background: #667eea; height: 100%; width: ${currentProgress}%; border-radius: 3px; transition: width 0.3s;"></div>
                            </div>
                            <div style="font-size: 12px; margin-top: 5px;">${currentProgress}%</div>
                        </div>
                    ` : ''}
                    
                    <div style="font-size: 12px; opacity: 0.8;">
                        ${this.formatNumber(reward.xpRequired)} XP
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    generateRewardsTab() {
        let html = `
            <div style="max-height: 400px; overflow-y: auto;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        `;
        
        // Show current tier and nearby rewards
        const currentTier = this.battlePassData.currentTier;
        const startTier = Math.max(1, currentTier - 3);
        const endTier = Math.min(50, currentTier + 10);
        
        for (let tier = startTier; tier <= endTier; tier++) {
            const reward = this.rewards.find(r => r.tier === tier);
            const isUnlocked = tier <= currentTier;
            const canClaim = isUnlocked && !this.battlePassData.freeRewardsClaimed.includes(tier);
            
            html += `
                <div style="
                    background: rgba(45, 55, 72, 0.3);
                    border: 2px solid ${reward.isLegendary ? '#9f7aea' : reward.isMilestone ? '#ed8936' : '#2d3748'};
                    border-radius: 10px;
                    padding: 20px;
                    ${reward.isLegendary ? 'box-shadow: 0 0 20px rgba(159, 122, 234, 0.3);' : ''}
                ">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0;">Tier ${tier}</h4>
                        <div style="font-size: 12px; opacity: 0.7;">${this.formatNumber(reward.totalXPRequired)} XP</div>
                    </div>
                    
                    <!-- Free Reward -->
                    <div style="
                        background: rgba(72, 187, 120, 0.1);
                        border: 1px solid #48bb78;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 10px;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: bold;">Free: ${this.getRewardDisplayName(reward.freeReward)}</div>
                                <div style="font-size: 12px; opacity: 0.8;">${reward.freeReward.rarity}</div>
                            </div>
                            <div>
                                ${canClaim ? `
                                    <button class="claim-reward-btn" data-tier="${tier}" data-track="free" style="
                                        background: #48bb78;
                                        color: white;
                                        border: none;
                                        padding: 8px 16px;
                                        border-radius: 5px;
                                        cursor: pointer;
                                        font-size: 12px;
                                        font-weight: bold;
                                    ">Claim</button>
                                ` : isUnlocked ? '✅' : '🔒'}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Premium Reward -->
                    <div style="
                        background: rgba(246, 173, 85, 0.1);
                        border: 1px solid #f6ad55;
                        border-radius: 8px;
                        padding: 15px;
                        ${!this.battlePassData.hasPremiumPass ? 'opacity: 0.5;' : ''}
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: bold;">Premium: ${this.getRewardDisplayName(reward.premiumReward)}</div>
                                <div style="font-size: 12px; opacity: 0.8;">${reward.premiumReward.rarity}</div>
                            </div>
                            <div>
                                ${this.battlePassData.hasPremiumPass && canClaim ? `
                                    <button class="claim-reward-btn" data-tier="${tier}" data-track="premium" style="
                                        background: #f6ad55;
                                        color: white;
                                        border: none;
                                        padding: 8px 16px;
                                        border-radius: 5px;
                                        cursor: pointer;
                                        font-size: 12px;
                                        font-weight: bold;
                                    ">Claim</button>
                                ` : this.battlePassData.hasPremiumPass && isUnlocked ? '✅' : '🔒'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += '</div></div>';
        return html;
    }
    
    addRewardClaimListeners() {
        const claimButtons = document.querySelectorAll('.claim-reward-btn');
        claimButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tier = parseInt(e.target.dataset.tier);
                const track = e.target.dataset.track;
                this.claimReward(tier, track);
            });
        });
    }
    
    claimReward(tier, track) {
        const reward = this.rewards.find(r => r.tier === tier);
        if (!reward) return;
        
        const rewardData = track === 'free' ? reward.freeReward : reward.premiumReward;
        
        // Grant the reward
        this.grantReward(rewardData);
        
        // Mark as claimed
        if (track === 'free') {
            this.battlePassData.freeRewardsClaimed.push(tier);
        } else {
            this.battlePassData.premiumRewardsClaimed.push(tier);
        }
        
        this.saveBattlePassData();
        
        // Show reward notification
        this.showRewardNotification(rewardData, tier);
        
        // Refresh UI
        this.updateBattlePassButton();
        this.showBattlePassModal(); // Refresh modal
        
        // Track reward claim
        this.analytics?.trackEvent('battle_pass_reward_claimed', {
            tier: tier,
            track: track,
            rewardType: rewardData.type,
            seasonId: this.battlePassData.seasonId
        });
    }
    
    grantReward(reward) {
        switch (reward.type) {
            case 'coins':
                this.userProfile.addCurrency('coins', reward.amount, 'battle_pass');
                break;
            case 'gems':
                this.userProfile.addCurrency('gems', reward.amount, 'battle_pass');
                break;
            case 'season_tokens':
                this.userProfile.addCurrency('seasonTokens', reward.amount, 'battle_pass');
                break;
            case 'xp_boost':
                this.activateXPBoost(reward.amount, reward.duration);
                break;
            case 'snake_skin':
            case 'legendary_skin':
                this.unlockCosmetic('skin', reward.id, reward);
                break;
            case 'trail_effect':
                this.unlockCosmetic('trail', reward.id, reward);
                break;
            case 'death_effect':
                this.unlockCosmetic('death', reward.id, reward);
                break;
            case 'title':
                this.unlockTitle(reward.id, reward.name);
                break;
            case 'banner':
                this.unlockCosmetic('banner', reward.id, reward);
                break;
        }
    }
    
    unlockCosmetic(type, id, data) {
        const profile = this.userProfile.getProfile();
        if (!profile.unlockedCosmetics[type]) {
            profile.unlockedCosmetics[type] = [];
        }
        
        if (!profile.unlockedCosmetics[type].includes(id)) {
            profile.unlockedCosmetics[type].push(id);
            this.userProfile.saveProfile();
            
            console.log(`🎨 Unlocked ${type}: ${data.name}`);
        }
    }
    
    unlockTitle(id, name) {
        const profile = this.userProfile.getProfile();
        if (!profile.unlockedTitles.includes(id)) {
            profile.unlockedTitles.push(id);
            this.userProfile.saveProfile();
            
            console.log(`🏆 Unlocked title: ${name}`);
        }
    }
    
    activateXPBoost(multiplier, durationHours) {
        const boostData = {
            multiplier: multiplier,
            expiresAt: Date.now() + (durationHours * 60 * 60 * 1000)
        };
        
        localStorage.setItem('xpBoost', JSON.stringify(boostData));
        console.log(`⚡ XP Boost activated: ${multiplier}x for ${durationHours} hours`);
    }
    
    showRewardNotification(reward, tier) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 25px 35px;
            border-radius: 15px;
            z-index: 1012;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            animation: rewardClaimed 0.6s ease;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 15px;">🎁</div>
            <h3 style="margin: 0 0 10px 0;">Battle Pass Reward Claimed!</h3>
            <p style="margin: 0; font-size: 16px;">
                Tier ${tier}: ${this.getRewardDisplayName(reward)}
            </p>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    getRewardDisplayName(reward) {
        switch (reward.type) {
            case 'coins': return `${reward.amount} Coins`;
            case 'gems': return `${reward.amount} Gems`;
            case 'season_tokens': return `${reward.amount} Season Tokens`;
            case 'xp_boost': return `${reward.amount}x XP Boost (${reward.duration}h)`;
            case 'snake_skin': return reward.name || 'Snake Skin';
            case 'legendary_skin': return reward.name || 'Legendary Skin';
            case 'trail_effect': return reward.name || 'Trail Effect';
            case 'death_effect': return reward.name || 'Death Effect';
            case 'title': return reward.name || 'Title';
            case 'banner': return reward.name || 'Banner';
            default: return 'Reward';
        }
    }
    
    // Battle Pass XP System
    awardBattlePassXP(amount, source = 'game') {
        // Apply XP boost if active
        const boost = this.getActiveXPBoost();
        const actualAmount = Math.floor(amount * boost);
        
        // Add XP
        this.battlePassData.battlePassXP += actualAmount;
        this.battlePassData[`xpFrom${source.charAt(0).toUpperCase() + source.slice(1)}`] += actualAmount;
        
        // Check for tier ups
        const oldTier = this.battlePassData.currentTier;
        this.updateCurrentTier();
        const newTier = this.battlePassData.currentTier;
        
        // Show XP notification
        this.showXPNotification(actualAmount, source, boost > 1);
        
        // Handle tier ups
        if (newTier > oldTier) {
            this.handleTierUp(oldTier, newTier);
        }
        
        this.saveBattlePassData();
        this.updateBattlePassButton();
        
        // Track XP gain
        this.analytics?.trackEvent('battle_pass_xp_gained', {
            amount: actualAmount,
            source: source,
            boostActive: boost > 1,
            newTotal: this.battlePassData.battlePassXP,
            seasonId: this.battlePassData.seasonId
        });
    }
    
    getActiveXPBoost() {
        const boostData = localStorage.getItem('xpBoost');
        if (boostData) {
            const boost = JSON.parse(boostData);
            if (Date.now() < boost.expiresAt) {
                return boost.multiplier;
            } else {
                localStorage.removeItem('xpBoost');
            }
        }
        return 1.0;
    }
    
    updateCurrentTier() {
        const totalXP = this.battlePassData.battlePassXP;
        let tier = 0;
        
        for (let i = 1; i <= 50; i++) {
            const tierData = this.rewards.find(r => r.tier === i);
            if (totalXP >= tierData.totalXPRequired) {
                tier = i;
            } else {
                break;
            }
        }
        
        this.battlePassData.currentTier = tier;
    }
    
    getCurrentTierProgress() {
        if (this.battlePassData.currentTier >= 50) return 100;
        
        const nextTier = this.battlePassData.currentTier + 1;
        const nextTierData = this.rewards.find(r => r.tier === nextTier);
        const prevTierTotal = nextTierData.totalXPRequired - nextTierData.xpRequired;
        
        const progressInTier = this.battlePassData.battlePassXP - prevTierTotal;
        const tierXPRequired = nextTierData.xpRequired;
        
        return Math.min(100, Math.floor((progressInTier / tierXPRequired) * 100));
    }
    
    handleTierUp(oldTier, newTier) {
        // Show tier up notification
        this.showTierUpNotification(newTier);
        
        // Auto-claim free rewards if enabled
        for (let tier = oldTier + 1; tier <= newTier; tier++) {
            if (!this.battlePassData.freeRewardsClaimed.includes(tier)) {
                // Auto-claim or show notification
                this.showNewRewardAvailable(tier);
            }
        }
        
        // Track tier up
        this.analytics?.trackEvent('battle_pass_tier_up', {
            oldTier: oldTier,
            newTier: newTier,
            seasonId: this.battlePassData.seasonId
        });
    }
    
    showTierUpNotification(tier) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #f6ad55, #ed8936);
            color: white;
            padding: 30px 40px;
            border-radius: 20px;
            z-index: 1011;
            text-align: center;
            box-shadow: 0 15px 50px rgba(246, 173, 85, 0.4);
            animation: tierUpCelebration 1s ease;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 60px; margin-bottom: 20px;">⚔️</div>
            <h2 style="margin: 0 0 15px 0; font-size: 28px;">TIER UP!</h2>
            <p style="margin: 0; font-size: 20px; font-weight: bold;">
                Battle Pass Tier ${tier}
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
                New rewards available!
            </p>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
    
    showNewRewardAvailable(tier) {
        // Show subtle notification that new rewards are available
        const indicator = document.getElementById('battlePassButton');
        if (indicator) {
            indicator.style.animation = 'battlePassPulse 2s infinite';
        }
    }
    
    showXPNotification(amount, source, boosted) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 150px;
            left: 50%;
            transform: translateX(-50%);
            background: ${boosted ? 'linear-gradient(135deg, #ed8936, #f6ad55)' : 'rgba(102, 126, 234, 0.9)'};
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            z-index: 1001;
            font-weight: bold;
            animation: xpGained 0.8s ease;
        `;
        
        notification.textContent = `+${amount} XP ${boosted ? '⚡' : ''} (${source})`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }
    
    // Mission System
    generateDailyMissions() {
        const missions = [
            {
                id: 'daily_games',
                name: 'Daily Player',
                description: 'Play {target} games',
                target: 3,
                progress: 0,
                xpReward: 200,
                type: 'games_played'
            },
            {
                id: 'daily_score',
                name: 'Score Hunter', 
                description: 'Score {target} points in a single game',
                target: 100,
                progress: 0,
                xpReward: 300,
                type: 'single_score'
            },
            {
                id: 'daily_apples',
                name: 'Apple Collector',
                description: 'Eat {target} apples total',
                target: 50,
                progress: 0,
                xpReward: 150,
                type: 'apples_eaten'
            }
        ];
        
        // Randomize targets slightly for variety
        missions.forEach(mission => {
            const variance = Math.floor(mission.target * 0.2);
            mission.target += Math.floor(Math.random() * variance * 2) - variance;
        });
        
        return missions;
    }
    
    generateWeeklyMissions() {
        return [
            {
                id: 'weekly_streak',
                name: 'Consistency Master',
                description: 'Maintain a {target} day login streak',
                target: 5,
                progress: 0,
                xpReward: 1000,
                type: 'login_streak'
            },
            {
                id: 'weekly_total_score',
                name: 'Score Accumulator',
                description: 'Score {target} points total this week',
                target: 2000,
                progress: 0,
                xpReward: 800,
                type: 'total_score'
            }
        ];
    }
    
    generateSeasonalMissions() {
        const season = this.seasonManager.getCurrentSeason();
        
        return [
            {
                id: 'seasonal_master',
                name: `${season.name} Master`,
                description: 'Reach Battle Pass Tier {target}',
                target: 25,
                progress: 0,
                xpReward: 2000,
                type: 'battle_pass_tier'
            },
            {
                id: 'seasonal_dedication',
                name: 'Seasonal Champion',
                description: 'Play {target} games this season',
                target: 100,
                progress: 0,
                xpReward: 1500,
                type: 'seasonal_games'
            }
        ];
    }
    
    createMissionTracker() {
        // Small mission tracker in corner
        const tracker = document.createElement('div');
        tracker.id = 'missionTracker';
        tracker.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-size: 12px;
            max-width: 250px;
            z-index: 1000;
            display: none;
        `;
        
        this.updateMissionTracker();
        document.body.appendChild(tracker);
        
        // Show/hide on hover
        let hideTimeout;
        tracker.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            tracker.style.display = 'block';
        });
        
        tracker.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => {
                tracker.style.display = 'none';
            }, 2000);
        });
    }
    
    updateMissionTracker() {
        const tracker = document.getElementById('missionTracker');
        if (!tracker) return;
        
        const activeMissions = this.getActiveMissions();
        
        if (activeMissions.length === 0) {
            tracker.style.display = 'none';
            return;
        }
        
        let html = '<h4 style="margin: 0 0 10px 0;">Daily Missions</h4>';
        
        activeMissions.slice(0, 3).forEach(mission => {
            const progress = Math.min(100, (mission.progress / mission.target) * 100);
            
            html += `
                <div style="margin: 8px 0;">
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <span>${mission.name}</span>
                        <span>${mission.progress}/${mission.target}</span>
                    </div>
                    <div style="background: #2d3748; height: 4px; border-radius: 2px; margin: 2px 0;">
                        <div style="background: #667eea; height: 100%; width: ${progress}%; border-radius: 2px;"></div>
                    </div>
                </div>
            `;
        });
        
        tracker.innerHTML = html;
    }
    
    getActiveMissions() {
        return [
            ...this.missionSystem.daily.filter(m => m.progress < m.target),
            ...this.missionSystem.weekly.filter(m => m.progress < m.target)
        ];
    }
    
    updateMissionProgress(type, value) {
        let progressMade = false;
        
        // Update daily missions
        this.missionSystem.daily.forEach(mission => {
            if (mission.type === type && mission.progress < mission.target) {
                mission.progress = Math.min(mission.target, mission.progress + value);
                progressMade = true;
                
                // Check for completion
                if (mission.progress >= mission.target && !mission.completed) {
                    this.completeMission(mission, 'daily');
                }
            }
        });
        
        // Update weekly missions
        this.missionSystem.weekly.forEach(mission => {
            if (mission.type === type && mission.progress < mission.target) {
                mission.progress = Math.min(mission.target, mission.progress + value);
                progressMade = true;
                
                if (mission.progress >= mission.target && !mission.completed) {
                    this.completeMission(mission, 'weekly');
                }
            }
        });
        
        // Update seasonal missions  
        this.missionSystem.seasonal.forEach(mission => {
            if (mission.type === type && mission.progress < mission.target) {
                mission.progress = Math.min(mission.target, mission.progress + value);
                progressMade = true;
                
                if (mission.progress >= mission.target && !mission.completed) {
                    this.completeMission(mission, 'seasonal');
                }
            }
        });
        
        if (progressMade) {
            this.updateMissionTracker();
            this.saveBattlePassData();
        }
    }
    
    completeMission(mission, category) {
        mission.completed = true;
        mission.completedAt = Date.now();
        
        // Award XP
        this.awardBattlePassXP(mission.xpReward, 'missions');
        
        // Update completion count
        if (category === 'daily') {
            this.battlePassData.dailyMissionsCompleted++;
        } else if (category === 'weekly') {
            this.battlePassData.weeklyMissionsCompleted++;
        } else if (category === 'seasonal') {
            this.battlePassData.seasonalMissionsCompleted++;
        }
        
        // Show completion notification
        this.showMissionCompleteNotification(mission);
        
        // Track mission completion
        this.analytics?.trackEvent('battle_pass_mission_completed', {
            missionId: mission.id,
            category: category,
            xpReward: mission.xpReward,
            seasonId: this.battlePassData.seasonId
        });
    }
    
    showMissionCompleteNotification(mission) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 20px 25px;
            border-radius: 15px;
            z-index: 1001;
            max-width: 300px;
            animation: missionComplete 0.5s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 30px;">✅</div>
                <div>
                    <div style="font-weight: bold; margin-bottom: 5px;">Mission Complete!</div>
                    <div style="font-size: 14px; opacity: 0.9;">${mission.name}</div>
                    <div style="font-size: 12px; margin-top: 5px;">+${mission.xpReward} XP</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
    
    createXPNotifications() {
        // XP notifications are handled in showXPNotification method
    }
    
    // Premium Pass Purchase
    showPremiumPassPurchase() {
        const modal = document.getElementById('battlePassModal');
        const content = document.getElementById('battlePassContent');
        
        const season = this.seasonManager.getCurrentSeason();
        const timeLeft = this.seasonManager.getTimeUntilSeasonEnd();
        const premiumValue = this.calculatePremiumValue();
        
        content.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <div style="font-size: 80px; margin-bottom: 20px;">⚔️</div>
                <h1 style="margin: 0 0 20px 0; font-size: 32px;">Unlock Premium Pass</h1>
                
                <div style="
                    background: linear-gradient(135deg, ${season.colors.primary}, ${season.colors.secondary});
                    color: white;
                    padding: 30px;
                    border-radius: 15px;
                    margin: 30px 0;
                ">
                    <h2 style="margin: 0 0 15px 0;">Premium Benefits</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; text-align: left;">
                        <div>
                            <h4>🎁 Exclusive Rewards</h4>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li>50 premium tier rewards</li>
                                <li>Legendary ${season.name} skin</li>
                                <li>Exclusive trail effects</li>
                                <li>Animated death effects</li>
                            </ul>
                        </div>
                        <div>
                            <h4>💎 Premium Currency</h4>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li>1,200+ gems total value</li>
                                <li>Season tokens</li>
                                <li>XP boosts</li>
                                <li>Bonus rewards</li>
                            </ul>
                        </div>
                        <div>
                            <h4>⚡ Instant Benefits</h4>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li>Retroactive reward unlock</li>
                                <li>Double mission XP</li>
                                <li>Priority support</li>
                                <li>Exclusive title</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div style="
                    background: rgba(72, 187, 120, 0.1);
                    border: 2px solid #48bb78;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                ">
                    <h3 style="margin: 0 0 10px 0; color: #48bb78;">Incredible Value!</h3>
                    <p style="margin: 0; font-size: 18px;">
                        Premium rewards worth <strong>$${premiumValue}</strong> for only <strong>$4.99</strong>
                    </p>
                    <p style="font-size: 14px; opacity: 0.8; margin: 10px 0 0 0;">
                        Time remaining: ${timeLeft}
                    </p>
                </div>
                
                <div style="margin: 30px 0;">
                    <button id="confirmPurchase" style="
                        background: linear-gradient(135deg, #f6ad55, #ed8936);
                        color: white;
                        border: none;
                        padding: 20px 50px;
                        border-radius: 30px;
                        font-size: 20px;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 6px 30px rgba(246, 173, 85, 0.4);
                        margin: 10px;
                    ">
                        🔓 Unlock Now - $4.99
                    </button>
                    <br>
                    <button onclick="document.getElementById('battlePassModal').querySelector('#battlePassContent').innerHTML = ''; location.reload();" style="
                        background: #718096;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        cursor: pointer;
                        margin: 10px;
                    ">
                        Maybe Later
                    </button>
                </div>
                
                <div style="font-size: 12px; color: #718096; margin-top: 30px;">
                    Demo purchase - No real payment required<br>
                    In production: Stripe, PayPal, App Store integration
                </div>
            </div>
        `;
        
        // Purchase confirmation
        content.querySelector('#confirmPurchase').addEventListener('click', () => {
            this.processPremiumPurchase();
        });
    }
    
    processPremiumPurchase() {
        // Simulate purchase process
        const confirmation = confirm('Demo Purchase: Unlock Premium Battle Pass for $4.99?\n\nIn a real app, this would process payment through:\n• Apple App Store\n• Google Play Store\n• Stripe/PayPal for web');
        
        if (confirmation) {
            // Grant premium pass
            this.battlePassData.hasPremiumPass = true;
            this.battlePassData.purchaseDate = Date.now();
            this.battlePassData.purchaseHistory.push({
                type: 'premium_pass',
                price: 4.99,
                date: Date.now(),
                seasonId: this.battlePassData.seasonId
            });
            
            // Retroactively unlock all premium rewards for completed tiers
            for (let tier = 1; tier <= this.battlePassData.currentTier; tier++) {
                if (!this.battlePassData.premiumRewardsClaimed.includes(tier)) {
                    const reward = this.rewards.find(r => r.tier === tier);
                    this.grantReward(reward.premiumReward);
                    this.battlePassData.premiumRewardsClaimed.push(tier);
                }
            }
            
            this.saveBattlePassData();
            
            // Show success notification
            this.showPurchaseSuccess();
            
            // Close modal and refresh
            document.getElementById('battlePassModal').style.display = 'none';
            this.updateBattlePassButton();
            
            // Track purchase
            this.analytics?.trackPurchase('premium_battle_pass', 4.99, {
                seasonId: this.battlePassData.seasonId,
                tier: this.battlePassData.currentTier
            });
        }
    }
    
    calculatePremiumValue() {
        // Calculate total value of premium rewards
        let totalValue = 0;
        
        this.rewards.forEach(reward => {
            const premiumReward = reward.premiumReward;
            
            switch (premiumReward.type) {
                case 'gems': totalValue += premiumReward.amount * 0.01; break;
                case 'legendary_skin': totalValue += 2.99; break;
                case 'snake_skin': totalValue += 0.99; break;
                case 'trail_effect': totalValue += 1.49; break;
                case 'death_effect': totalValue += 1.99; break;
                default: totalValue += 0.49; break;
            }
        });
        
        return Math.round(totalValue);
    }
    
    showPurchaseSuccess() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 40px 50px;
            border-radius: 20px;
            z-index: 1013;
            text-align: center;
            box-shadow: 0 15px 60px rgba(72, 187, 120, 0.4);
        `;
        
        notification.innerHTML = `
            <div style="font-size: 80px; margin-bottom: 20px;">🎉</div>
            <h2 style="margin: 0 0 15px 0;">Premium Pass Unlocked!</h2>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
                All premium rewards are now available!<br>
                Past tier rewards have been granted automatically.
            </p>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    // Tab switching
    switchBattlePassTab(tabName) {
        const content = document.getElementById('battlePassTabContent');
        const tabs = document.querySelectorAll('.battle-pass-tab');
        const season = this.seasonManager.getCurrentSeason();
        
        // Update tab appearance
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.style.color = 'white';
                tab.style.borderBottomColor = season.colors.primary;
                tab.classList.add('active');
            } else {
                tab.style.color = '#a0aec0';
                tab.style.borderBottomColor = 'transparent';
                tab.classList.remove('active');
            }
        });
        
        // Update content
        switch (tabName) {
            case 'rewards':
                content.innerHTML = this.generateRewardsTab();
                this.addRewardClaimListeners();
                break;
            case 'missions':
                content.innerHTML = this.generateMissionsTab();
                break;
            case 'stats':
                content.innerHTML = this.generateStatsTab();
                break;
        }
    }
    
    generateMissionsTab() {
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div>
                    <h4>Daily Missions</h4>
                    ${this.missionSystem.daily.map(mission => this.generateMissionCard(mission, 'daily')).join('')}
                </div>
                <div>
                    <h4>Weekly Missions</h4>
                    ${this.missionSystem.weekly.map(mission => this.generateMissionCard(mission, 'weekly')).join('')}
                </div>
                <div>
                    <h4>Seasonal Missions</h4>
                    ${this.missionSystem.seasonal.map(mission => this.generateMissionCard(mission, 'seasonal')).join('')}
                </div>
            </div>
        `;
    }
    
    generateMissionCard(mission, category) {
        const progress = Math.min(100, (mission.progress / mission.target) * 100);
        const isCompleted = mission.completed || mission.progress >= mission.target;
        
        return `
            <div style="
                background: rgba(45, 55, 72, 0.3);
                border: 2px solid ${isCompleted ? '#48bb78' : '#2d3748'};
                border-radius: 10px;
                padding: 20px;
                margin: 10px 0;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h5 style="margin: 0; color: ${isCompleted ? '#48bb78' : 'white'};">
                            ${isCompleted ? '✅' : '🎯'} ${mission.name}
                        </h5>
                        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">
                            ${mission.description.replace('{target}', mission.target)}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; color: #f6ad55;">+${mission.xpReward} XP</div>
                    </div>
                </div>
                
                <div style="margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;">
                        <span>Progress</span>
                        <span>${mission.progress}/${mission.target}</span>
                    </div>
                    <div style="background: #2d3748; height: 8px; border-radius: 4px;">
                        <div style="background: ${isCompleted ? '#48bb78' : '#667eea'}; height: 100%; width: ${progress}%; border-radius: 4px; transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    generateStatsTab() {
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div style="background: rgba(45, 55, 72, 0.3); padding: 20px; border-radius: 10px;">
                    <h4>Battle Pass Progress</h4>
                    <div style="margin: 15px 0;">
                        <div>Current Tier: <strong>${this.battlePassData.currentTier}/50</strong></div>
                        <div>Total XP: <strong>${this.formatNumber(this.battlePassData.battlePassXP)}</strong></div>
                        <div>Premium Pass: <strong>${this.battlePassData.hasPremiumPass ? 'Yes' : 'No'}</strong></div>
                    </div>
                </div>
                
                <div style="background: rgba(45, 55, 72, 0.3); padding: 20px; border-radius: 10px;">
                    <h4>XP Sources</h4>
                    <div style="margin: 15px 0;">
                        <div>Games: <strong>${this.formatNumber(this.battlePassData.xpFromGames)}</strong></div>
                        <div>Missions: <strong>${this.formatNumber(this.battlePassData.xpFromMissions)}</strong></div>
                        <div>Challenges: <strong>${this.formatNumber(this.battlePassData.xpFromChallenges)}</strong></div>
                        <div>Events: <strong>${this.formatNumber(this.battlePassData.xpFromEvents)}</strong></div>
                    </div>
                </div>
                
                <div style="background: rgba(45, 55, 72, 0.3); padding: 20px; border-radius: 10px;">
                    <h4>Mission Stats</h4>
                    <div style="margin: 15px 0;">
                        <div>Daily Completed: <strong>${this.battlePassData.dailyMissionsCompleted}</strong></div>
                        <div>Weekly Completed: <strong>${this.battlePassData.weeklyMissionsCompleted}</strong></div>
                        <div>Seasonal Completed: <strong>${this.battlePassData.seasonalMissionsCompleted}</strong></div>
                    </div>
                </div>
                
                <div style="background: rgba(45, 55, 72, 0.3); padding: 20px; border-radius: 10px;">
                    <h4>Rewards Claimed</h4>
                    <div style="margin: 15px 0;">
                        <div>Free Rewards: <strong>${this.battlePassData.freeRewardsClaimed.length}/50</strong></div>
                        <div>Premium Rewards: <strong>${this.battlePassData.premiumRewardsClaimed.length}/50</strong></div>
                        <div>Completion: <strong>${Math.floor((this.battlePassData.currentTier / 50) * 100)}%</strong></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Mission reset logic
    checkMissionResets() {
        const today = this.getDateString();
        const thisWeek = this.getWeekString();
        
        // Daily reset
        if (this.missionSystem.lastDailyRefresh !== today) {
            this.missionSystem.daily = this.generateDailyMissions();
            this.missionSystem.lastDailyRefresh = today;
            this.missionSystem.dailyProgress = {};
            console.log('🔄 Daily missions reset');
        }
        
        // Weekly reset
        if (this.missionSystem.lastWeeklyRefresh !== thisWeek) {
            this.missionSystem.weekly = this.generateWeeklyMissions();
            this.missionSystem.lastWeeklyRefresh = thisWeek;
            this.missionSystem.weeklyProgress = {};
            console.log('🔄 Weekly missions reset');
        }
    }
    
    autoClaimCompletedTiers() {
        // Auto-claim logic would go here if enabled
        // For now, we require manual claiming for engagement
    }
    
    hasUnclaimedRewards() {
        for (let tier = 1; tier <= this.battlePassData.currentTier; tier++) {
            if (!this.battlePassData.freeRewardsClaimed.includes(tier)) {
                return true;
            }
            if (this.battlePassData.hasPremiumPass && !this.battlePassData.premiumRewardsClaimed.includes(tier)) {
                return true;
            }
        }
        return false;
    }
    
    // Integration with game events
    onGameEnd(gameData) {
        // Award base XP for playing
        const baseXP = Math.floor(gameData.score / 10) + 25; // Minimum 25 XP per game
        this.awardBattlePassXP(baseXP, 'games');
        
        // Update mission progress
        this.updateMissionProgress('games_played', 1);
        this.updateMissionProgress('single_score', gameData.score);
        this.updateMissionProgress('apples_eaten', gameData.applesEaten || 0);
        this.updateMissionProgress('total_score', gameData.score);
        
        // Update seasonal tracking
        this.updateMissionProgress('seasonal_games', 1);
        this.updateMissionProgress('battle_pass_tier', this.battlePassData.currentTier);
    }
    
    onAchievementUnlocked(achievement) {
        // Award bonus XP for achievements
        this.awardBattlePassXP(100, 'challenges');
    }
    
    onChallengeCompleted(challenge) {
        // Award XP based on challenge difficulty
        const xpReward = challenge.difficulty === 'hard' ? 300 : challenge.difficulty === 'medium' ? 200 : 100;
        this.awardBattlePassXP(xpReward, 'challenges');
    }
    
    onLoginStreak(streakDays) {
        // Update login streak mission
        this.updateMissionProgress('login_streak', streakDays);
    }
    
    // Utility methods
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
    
    saveBattlePassData() {
        const seasonId = this.seasonManager.getCurrentSeason().id;
        localStorage.setItem(`battlePass_season_${seasonId}`, JSON.stringify(this.battlePassData));
        localStorage.setItem('battlePassMissions', JSON.stringify(this.missionSystem));
    }
    
    // Public API methods
    getCurrentTier() {
        return this.battlePassData.currentTier;
    }
    
    getCurrentXP() {
        return this.battlePassData.battlePassXP;
    }
    
    hasPremiumPass() {
        return this.battlePassData.hasPremiumPass;
    }
    
    getBattlePassData() {
        return { ...this.battlePassData };
    }
    
    // Cleanup
    destroy() {
        this.saveBattlePassData();
        console.log('⚔️ Battle Pass Manager destroyed');
    }
}

// CSS animations for Battle Pass
const battlePassStyle = document.createElement('style');
battlePassStyle.textContent = `
    @keyframes battlePassPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    @keyframes rewardClaimed {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    @keyframes tierUpCelebration {
        0% { transform: translateX(-50%) scale(0.3); opacity: 0; }
        50% { transform: translateX(-50%) scale(1.2); }
        100% { transform: translateX(-50%) scale(1); opacity: 1; }
    }
    
    @keyframes xpGained {
        0% { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        50% { transform: translateX(-50%) translateY(0); opacity: 1; }
        100% { transform: translateX(-50%) translateY(20px); opacity: 0; }
    }
    
    @keyframes missionComplete {
        0% { transform: translateX(100%); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(battlePassStyle);