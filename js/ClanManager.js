// Clan Wars & Social System - Maximum Retention Engine
class ClanManager {
    constructor(userProfile, seasonManager, analytics) {
        this.userProfile = userProfile;
        this.seasonManager = seasonManager;
        this.analytics = analytics;
        
        this.clanData = this.loadClanData();
        this.clanWars = this.initializeClanWars();
        this.ghostReplays = this.loadGhostReplays();
        this.socialFeatures = this.initializeSocialFeatures();
        
        this.initializeClanSystem();
        this.createClanUI();
        this.setupClanWarSchedule();
    }
    
    loadClanData() {
        const profile = this.userProfile.getProfile();
        
        // Load player's clan membership
        const membership = {
            clanId: profile.clanId,
            joinDate: null,
            role: 'member', // member, officer, leader
            contributions: {
                totalScore: 0,
                gamesPlayed: 0,
                warsParticipated: 0,
                trophiesEarned: 0
            },
            weeklyActivity: {
                score: 0,
                games: 0,
                lastActive: Date.now()
            }
        };
        
        const saved = localStorage.getItem('clanMembership');
        return saved ? { ...membership, ...JSON.parse(saved) } : membership;
    }
    
    initializeClanWars() {
        return {
            currentWar: this.loadCurrentWar(),
            warHistory: this.loadWarHistory(),
            schedule: {
                startDay: 1, // Monday
                duration: 7, // 7 days
                preparationTime: 24 // 24 hours prep
            },
            rewards: this.generateWarRewards()
        };
    }
    
    loadCurrentWar() {
        const currentWeek = this.getWeekString();
        const defaultWar = {
            warId: `war_${currentWeek}`,
            week: currentWeek,
            status: 'active', // preparation, active, completed
            startTime: this.getWeekStartTime(),
            endTime: this.getWeekStartTime() + (7 * 24 * 60 * 60 * 1000),
            
            // War objectives (bite-sized goals)
            objectives: this.generateWarObjectives(),
            
            // Participating clans
            clans: {},
            
            // Rewards
            rewards: {
                winner: { gems: 500, clanTokens: 1000, trophies: 50 },
                participant: { gems: 100, clanTokens: 200, trophies: 10 }
            },
            
            // Progress tracking
            totalParticipants: 0,
            completed: false
        };
        
        const saved = localStorage.getItem(`clanWar_${currentWeek}`);
        return saved ? { ...defaultWar, ...JSON.parse(saved) } : defaultWar;
    }
    
    generateWarObjectives() {
        // Bite-sized, achievable weekly goals
        return [
            {
                id: 'collective_score',
                name: 'Collective Champion',
                description: 'Clan members score {target} points total',
                type: 'accumulate',
                target: 10000,
                current: 0,
                icon: '🏆',
                weight: 3
            },
            {
                id: 'participation_rate',
                name: 'United We Play',
                description: '{target}% of clan members play this week',
                type: 'percentage',
                target: 70,
                current: 0,
                icon: '🤝',
                weight: 2
            },
            {
                id: 'streak_masters',
                name: 'Streak Masters',
                description: '{target} clan members achieve 3+ day streaks',
                type: 'count',
                target: 5,
                current: 0,
                icon: '🔥',
                weight: 2
            },
            {
                id: 'high_scores',
                name: 'Elite Performers',
                description: 'Clan members achieve {target} scores over 200',
                type: 'count',
                target: 20,
                current: 0,
                icon: '⭐',
                weight: 2
            },
            {
                id: 'consistency_challenge',
                name: 'Daily Dedication',
                description: 'All 7 days have clan activity',
                type: 'daily_activity',
                target: 7,
                current: 0,
                icon: '📅',
                weight: 1
            }
        ];
    }
    
    loadGhostReplays() {
        return {
            enabled: true,
            maxReplays: 50,
            replays: this.loadReplayData(),
            viewingEnabled: true,
            recordingEnabled: true
        };
    }
    
    loadReplayData() {
        const saved = localStorage.getItem('clanGhostReplays');
        return saved ? JSON.parse(saved) : [];
    }
    
    initializeSocialFeatures() {
        return {
            chat: {
                enabled: true,
                messages: this.loadClanChat(),
                maxMessages: 100
            },
            leaderboards: {
                weekly: {},
                allTime: {},
                seasonal: {}
            },
            activities: this.loadRecentActivities()
        };
    }
    
    loadClanChat() {
        const clanId = this.clanData.clanId;
        if (!clanId) return [];
        
        const saved = localStorage.getItem(`clanChat_${clanId}`);
        return saved ? JSON.parse(saved) : [];
    }
    
    loadRecentActivities() {
        const clanId = this.clanData.clanId;
        if (!clanId) return [];
        
        const saved = localStorage.getItem(`clanActivities_${clanId}`);
        return saved ? JSON.parse(saved) : [];
    }
    
    initializeClanSystem() {
        // Check if player is in a clan
        if (this.clanData.clanId) {
            console.log(`⚔️ Clan system loaded - Member of clan: ${this.clanData.clanId}`);
            this.loadClanInfo();
            this.updateWeeklyActivity();
        } else {
            console.log('⚔️ Clan system ready - No clan membership');
        }
        
        // Check for war updates
        this.checkWarStatus();
        
        // Clean up old replay data
        this.cleanupOldReplays();
    }
    
    createClanUI() {
        // Clan button in main UI
        const clanBtn = document.createElement('button');
        clanBtn.id = 'clanButton';
        clanBtn.style.cssText = `
            position: fixed;
            top: 80px;
            left: 20px;
            background: linear-gradient(135deg, #e53e3e, #c53030);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(229, 62, 62, 0.3);
            transition: all 0.3s ease;
            min-width: 140px;
        `;
        
        this.updateClanButton();
        
        clanBtn.addEventListener('click', () => this.showClanModal());
        document.body.appendChild(clanBtn);
        
        // Create clan modal
        this.createClanModal();
        
        // Create ghost replay overlay
        this.createGhostReplayOverlay();
        
        // Create clan war notifications
        this.createWarNotifications();
    }
    
    updateClanButton() {
        const btn = document.getElementById('clanButton');
        if (!btn) return;
        
        if (this.clanData.clanId) {
            const clanInfo = this.getClanInfo();
            const warActive = this.clanWars.currentWar.status === 'active';
            const hasNotifications = this.hasUnreadNotifications();
            
            btn.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 18px;">${warActive ? '⚔️' : '🏰'}</div>
                    <div style="text-align: left;">
                        <div style="font-size: 12px;">${clanInfo ? clanInfo.name : 'My Clan'}</div>
                        <div style="font-size: 10px; opacity: 0.9;">
                            ${warActive ? 'War Active' : 'Clan Hub'}
                        </div>
                    </div>
                    ${hasNotifications ? '<div style="width: 8px; height: 8px; background: #f6ad55; border-radius: 50%; margin-left: 4px;"></div>' : ''}
                </div>
            `;
            
            if (warActive) {
                btn.style.background = 'linear-gradient(135deg, #ed8936, #c05621)';
                btn.style.animation = 'clanWarPulse 3s infinite';
            } else {
                btn.style.background = 'linear-gradient(135deg, #e53e3e, #c53030)';
                btn.style.animation = 'none';
            }
        } else {
            btn.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 18px;">🏰</div>
                    <div style="text-align: left;">
                        <div style="font-size: 12px;">Join Clan</div>
                        <div style="font-size: 10px; opacity: 0.9;">Find Friends</div>
                    </div>
                </div>
            `;
        }
    }
    
    createClanModal() {
        const modal = document.createElement('div');
        modal.id = 'clanModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 1020;
            display: none;
            align-items: center;
            justify-content: center;
            overflow-y: auto;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #2d1b69, #1a1a2e);
            border-radius: 15px;
            padding: 0;
            max-width: 95vw;
            max-height: 95vh;
            overflow: hidden;
            position: relative;
            color: white;
        `;
        
        content.innerHTML = `
            <button id="closeClanModal" style="
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
                z-index: 1021;
            ">×</button>
            
            <div id="clanModalContent"></div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Event listeners
        content.querySelector('#closeClanModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    showClanModal() {
        const modal = document.getElementById('clanModal');
        const content = document.getElementById('clanModalContent');
        
        if (this.clanData.clanId) {
            this.showClanHub();
        } else {
            this.showClanDiscovery();
        }
        
        modal.style.display = 'flex';
        
        // Track clan modal view
        this.analytics?.trackEvent('clan_modal_viewed', {
            hasClan: !!this.clanData.clanId,
            warActive: this.clanWars.currentWar.status === 'active'
        });
    }
    
    showClanHub() {
        const content = document.getElementById('clanModalContent');
        const clanInfo = this.getClanInfo();
        const warStatus = this.getWarStatus();
        const memberStats = this.getClanMemberStats();
        
        content.innerHTML = `
            <!-- Clan Header -->
            <div style="
                background: linear-gradient(135deg, #e53e3e, #c53030);
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
                
                <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 40px;
                    ">${clanInfo.badge || '🏰'}</div>
                    <div style="text-align: left;">
                        <h1 style="margin: 0; font-size: 28px;">${clanInfo.name}</h1>
                        <p style="margin: 5px 0; opacity: 0.9;">${clanInfo.description || 'Elite Snake Warriors'}</p>
                        <div style="font-size: 14px; opacity: 0.8;">
                            ${memberStats.active}/${memberStats.total} active • ${clanInfo.trophies || 1250} 🏆
                        </div>
                    </div>
                </div>
                
                ${warStatus.active ? `
                    <div style="
                        background: rgba(237, 137, 54, 0.8);
                        padding: 15px 25px;
                        border-radius: 15px;
                        margin: 20px auto;
                        max-width: 400px;
                    ">
                        <div style="font-weight: bold; margin-bottom: 5px;">⚔️ CLAN WAR ACTIVE</div>
                        <div style="font-size: 14px;">
                            ${warStatus.timeLeft} remaining • Rank: #${warStatus.rank}
                        </div>
                        <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
                            ${warStatus.progress}% objectives complete
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <!-- Navigation Tabs -->
            <div style="display: flex; border-bottom: 2px solid #2d3748; padding: 0 30px;">
                <button class="clan-tab active" data-tab="war" style="
                    background: none;
                    border: none;
                    color: white;
                    padding: 15px 20px;
                    cursor: pointer;
                    border-bottom: 3px solid #e53e3e;
                    font-weight: bold;
                ">⚔️ War</button>
                <button class="clan-tab" data-tab="members" style="
                    background: none;
                    border: none;
                    color: #a0aec0;
                    padding: 15px 20px;
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                ">👥 Members</button>
                <button class="clan-tab" data-tab="replays" style="
                    background: none;
                    border: none;
                    color: #a0aec0;
                    padding: 15px 20px;
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                ">👻 Replays</button>
                <button class="clan-tab" data-tab="chat" style="
                    background: none;
                    border: none;
                    color: #a0aec0;
                    padding: 15px 20px;
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                ">💬 Chat</button>
            </div>
            
            <!-- Tab Content -->
            <div id="clanTabContent" style="padding: 30px;">
                ${this.generateWarTab()}
            </div>
        `;
        
        // Add tab switching functionality
        content.querySelectorAll('.clan-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchClanTab(tabName);
            });
        });
        
        // Add clan-specific event listeners
        this.addClanEventListeners();
    }
    
    generateWarTab() {
        const war = this.clanWars.currentWar;
        const clanProgress = this.getClanWarProgress();
        
        return `
            <div>
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 30px;">
                    <h2 style="margin: 0;">Clan War Objectives</h2>
                    <div style="text-align: right;">
                        <div style="font-size: 18px; font-weight: bold; color: #e53e3e;">
                            ${clanProgress.totalScore} points
                        </div>
                        <div style="font-size: 14px; opacity: 0.7;">Current rank: #${clanProgress.rank}</div>
                    </div>
                </div>
                
                <!-- War Objectives -->
                <div style="display: grid; gap: 20px; margin-bottom: 30px;">
                    ${war.objectives.map(objective => this.generateObjectiveCard(objective)).join('')}
                </div>
                
                <!-- Clan War Leaderboard -->
                <div style="background: rgba(45, 55, 72, 0.3); padding: 25px; border-radius: 15px;">
                    <h3 style="margin: 0 0 20px 0;">🏆 War Leaderboard</h3>
                    <div style="display: grid; gap: 15px;">
                        ${this.generateWarLeaderboard().slice(0, 10).map((clan, index) => `
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 15px;
                                background: ${clan.id === this.clanData.clanId ? 'rgba(229, 62, 62, 0.2)' : 'rgba(45, 55, 72, 0.5)'};
                                border-radius: 10px;
                                border-left: 4px solid ${index < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][index] : '#4a5568'};
                            ">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: rgba(255,255,255,0.1);
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 20px;
                                    ">
                                        ${index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                                    </div>
                                    <div>
                                        <div style="font-weight: bold;">${clan.name}</div>
                                        <div style="font-size: 12px; opacity: 0.7;">
                                            ${clan.members} members • ${clan.objectivesCompleted}/${war.objectives.length} objectives
                                        </div>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: bold; color: #e53e3e;">${this.formatNumber(clan.score)}</div>
                                    <div style="font-size: 12px; opacity: 0.7;">points</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Clan Chest Progress -->
                <div style="
                    background: linear-gradient(135deg, #48bb78, #38a169);
                    padding: 25px;
                    border-radius: 15px;
                    margin-top: 20px;
                    text-align: center;
                ">
                    <h3 style="margin: 0 0 15px 0;">📦 Clan Chest</h3>
                    <div style="background: rgba(255,255,255,0.2); height: 20px; border-radius: 10px; margin: 15px 0;">
                        <div style="
                            background: rgba(255,255,255,0.8);
                            height: 100%;
                            width: ${clanProgress.chestProgress}%;
                            border-radius: 10px;
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                    <p style="margin: 10px 0;">
                        <strong>${clanProgress.chestProgress}% complete</strong><br>
                        ${clanProgress.chestTimeLeft} until chest ${clanProgress.chestProgress >= 100 ? 'opens' : 'degrades'}
                    </p>
                </div>
            </div>
        `;
    }
    
    generateObjectiveCard(objective) {
        const progress = Math.min(100, (objective.current / objective.target) * 100);
        const isCompleted = objective.current >= objective.target;
        
        return `
            <div style="
                background: rgba(45, 55, 72, 0.3);
                border: 2px solid ${isCompleted ? '#48bb78' : '#2d3748'};
                border-radius: 15px;
                padding: 25px;
                position: relative;
                ${isCompleted ? 'box-shadow: 0 0 20px rgba(72, 187, 120, 0.3);' : ''}
            ">
                ${isCompleted ? `
                    <div style="
                        position: absolute;
                        top: -10px;
                        right: 20px;
                        background: #48bb78;
                        color: white;
                        padding: 5px 15px;
                        border-radius: 15px;
                        font-size: 12px;
                        font-weight: bold;
                    ">COMPLETE</div>
                ` : ''}
                
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                    <div style="font-size: 40px;">${objective.icon}</div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0; color: ${isCompleted ? '#48bb78' : 'white'};">
                            ${objective.name}
                        </h3>
                        <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">
                            ${objective.description.replace('{target}', objective.target)}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 24px; font-weight: bold; color: #e53e3e;">
                            ${objective.type === 'percentage' ? progress.toFixed(0) : objective.current}
                        </div>
                        <div style="font-size: 12px; opacity: 0.7;">
                            ${objective.type === 'percentage' ? '% rate' : `/ ${objective.target}`}
                        </div>
                    </div>
                </div>
                
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;">
                        <span>Progress</span>
                        <span>${progress.toFixed(1)}%</span>
                    </div>
                    <div style="background: #2d3748; height: 8px; border-radius: 4px;">
                        <div style="
                            background: ${isCompleted ? '#48bb78' : 'linear-gradient(90deg, #e53e3e, #ed8936)'};
                            height: 100%;
                            width: ${progress}%;
                            border-radius: 4px;
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <div style="font-size: 12px; opacity: 0.7;">
                        Weight: ${objective.weight}x points
                    </div>
                    ${!isCompleted && this.canContributeToObjective(objective) ? `
                        <button class="contribute-btn" data-objective="${objective.id}" style="
                            background: #e53e3e;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 20px;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: bold;
                        ">Contribute Now</button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    generateWarLeaderboard() {
        // Simulate clan war leaderboard data
        const clans = [
            { id: this.clanData.clanId || 'player_clan', name: 'Elite Serpents', members: 28, score: 45280, objectivesCompleted: 4 },
            { id: 'clan_001', name: 'Viper Squad', members: 35, score: 52150, objectivesCompleted: 5 },
            { id: 'clan_002', name: 'Snake Lords', members: 42, score: 48900, objectivesCompleted: 4 },
            { id: 'clan_003', name: 'Cobra Strike', members: 31, score: 47200, objectivesCompleted: 4 },
            { id: 'clan_004', name: 'Python Pack', members: 25, score: 44800, objectivesCompleted: 3 },
            { id: 'clan_005', name: 'Rattlesnake Raiders', members: 38, score: 43600, objectivesCompleted: 3 },
            { id: 'clan_006', name: 'Anaconda Alliance', members: 29, score: 42100, objectivesCompleted: 3 },
            { id: 'clan_007', name: 'Mamba Masters', members: 33, score: 41500, objectivesCompleted: 3 },
            { id: 'clan_008', name: 'Boa Brotherhood', members: 27, score: 40200, objectivesCompleted: 2 },
            { id: 'clan_009', name: 'Adder Army', members: 36, score: 39800, objectivesCompleted: 2 }
        ];
        
        return clans.sort((a, b) => b.score - a.score);
    }
    
    canContributeToObjective(objective) {
        // Check if player can immediately contribute to this objective
        switch (objective.type) {
            case 'accumulate':
            case 'count':
                return true; // Can always contribute through gameplay
            case 'percentage':
            case 'daily_activity':
                return !this.hasContributedToday(objective.id);
            default:
                return true;
        }
    }
    
    hasContributedToday(objectiveId) {
        const today = this.getDateString();
        const contributions = JSON.parse(localStorage.getItem('dailyClanContributions') || '{}');
        return contributions[today]?.includes(objectiveId);
    }
    
    switchClanTab(tabName) {
        const content = document.getElementById('clanTabContent');
        const tabs = document.querySelectorAll('.clan-tab');
        
        // Update tab appearance
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.style.color = 'white';
                tab.style.borderBottomColor = '#e53e3e';
                tab.classList.add('active');
            } else {
                tab.style.color = '#a0aec0';
                tab.style.borderBottomColor = 'transparent';
                tab.classList.remove('active');
            }
        });
        
        // Update content based on tab
        switch (tabName) {
            case 'war':
                content.innerHTML = this.generateWarTab();
                break;
            case 'members':
                content.innerHTML = this.generateMembersTab();
                break;
            case 'replays':
                content.innerHTML = this.generateReplaysTab();
                break;
            case 'chat':
                content.innerHTML = this.generateChatTab();
                this.initializeChatSystem();
                break;
        }
        
        this.addClanEventListeners();
    }
    
    generateMembersTab() {
        const members = this.getClanMembers();
        
        return `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2 style="margin: 0;">Clan Members (${members.length}/50)</h2>
                    <div style="display: flex; gap: 10px;">
                        <button id="inviteMemberBtn" style="
                            background: #48bb78;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 20px;
                            cursor: pointer;
                            font-size: 14px;
                        ">👥 Invite</button>
                        ${this.canManageClan() ? `
                            <button id="manageClanBtn" style="
                                background: #ed8936;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 20px;
                                cursor: pointer;
                                font-size: 14px;
                            ">⚙️ Manage</button>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Member List -->
                <div style="display: grid; gap: 15px;">
                    ${members.map(member => `
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            background: rgba(45, 55, 72, 0.3);
                            padding: 20px;
                            border-radius: 10px;
                            border-left: 4px solid ${this.getMemberRoleColor(member.role)};
                        ">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="
                                    width: 50px;
                                    height: 50px;
                                    background: linear-gradient(135deg, #667eea, #764ba2);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 20px;
                                ">🐍</div>
                                <div>
                                    <div style="font-weight: bold; display: flex; align-items: center; gap: 8px;">
                                        ${member.username}
                                        ${member.role === 'leader' ? '👑' : member.role === 'officer' ? '⭐' : ''}
                                        ${member.online ? '<div style="width: 8px; height: 8px; background: #48bb78; border-radius: 50%;"></div>' : ''}
                                    </div>
                                    <div style="font-size: 12px; opacity: 0.7;">
                                        Level ${member.level} • ${member.role}
                                        ${!member.online ? `• Last seen ${member.lastSeen}` : ''}
                                    </div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #e53e3e;">${this.formatNumber(member.weeklyScore)}</div>
                                <div style="font-size: 12px; opacity: 0.7;">this week</div>
                                <div style="font-size: 12px; margin-top: 5px;">
                                    🏆 ${member.trophies} • 🎮 ${member.gamesPlayed} games
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    generateReplaysTab() {
        const replays = this.getTopReplays();
        
        return `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2 style="margin: 0;">👻 Ghost Replays</h2>
                    <div style="display: flex; gap: 10px;">
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
                            <input type="checkbox" id="enableGhostViewing" ${this.ghostReplays.viewingEnabled ? 'checked' : ''}>
                            Show ghost trails during gameplay
                        </label>
                    </div>
                </div>
                
                <p style="opacity: 0.8; margin-bottom: 30px;">
                    Watch abstract trails of your clanmates' best runs. Ghost trails appear as semi-transparent paths during your games.
                </p>
                
                <!-- Top Replays -->
                <div style="display: grid; gap: 20px;">
                    ${replays.map(replay => `
                        <div style="
                            background: rgba(45, 55, 72, 0.3);
                            border-radius: 15px;
                            padding: 25px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <div style="display: flex; align-items: center; gap: 20px;">
                                <div style="
                                    width: 60px;
                                    height: 60px;
                                    background: linear-gradient(135deg, #667eea, #764ba2);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 24px;
                                ">👻</div>
                                <div>
                                    <div style="font-weight: bold; font-size: 16px;">${replay.playerName}</div>
                                    <div style="font-size: 14px; opacity: 0.7; margin: 5px 0;">
                                        Score: ${replay.score} • Duration: ${this.formatDuration(replay.duration)}
                                    </div>
                                    <div style="font-size: 12px; opacity: 0.6;">
                                        ${this.formatTimeAgo(replay.timestamp)} • ${replay.pathLength} moves
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button class="watch-replay-btn" data-replay-id="${replay.id}" style="
                                    background: #667eea;
                                    color: white;
                                    border: none;
                                    padding: 10px 20px;
                                    border-radius: 20px;
                                    cursor: pointer;
                                    font-size: 14px;
                                ">👁️ Watch</button>
                                <button class="race-ghost-btn" data-replay-id="${replay.id}" style="
                                    background: #e53e3e;
                                    color: white;
                                    border: none;
                                    padding: 10px 20px;
                                    border-radius: 20px;
                                    cursor: pointer;
                                    font-size: 14px;
                                ">🏁 Race</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${replays.length === 0 ? `
                    <div style="text-align: center; padding: 60px 20px; opacity: 0.6;">
                        <div style="font-size: 60px; margin-bottom: 20px;">👻</div>
                        <p>No ghost replays yet.<br>Play some games to start recording!</p>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    generateChatTab() {
        const messages = this.socialFeatures.chat.messages.slice(-20);
        
        return `
            <div style="height: 400px; display: flex; flex-direction: column;">
                <h2 style="margin: 0 0 20px 0;">💬 Clan Chat</h2>
                
                <!-- Messages Container -->
                <div id="clanChatMessages" style="
                    flex: 1;
                    background: rgba(45, 55, 72, 0.3);
                    border-radius: 10px;
                    padding: 20px;
                    overflow-y: auto;
                    margin-bottom: 15px;
                    min-height: 300px;
                ">
                    ${messages.length > 0 ? messages.map(msg => `
                        <div style="margin: 10px 0; display: flex; align-items: flex-start; gap: 12px;">
                            <div style="
                                width: 35px;
                                height: 35px;
                                background: linear-gradient(135deg, #667eea, #764ba2);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 16px;
                                flex-shrink: 0;
                            ">🐍</div>
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                    <span style="font-weight: bold; font-size: 14px;">${msg.username}</span>
                                    ${msg.role === 'leader' ? '<span style="font-size: 12px;">👑</span>' : ''}
                                    <span style="font-size: 12px; opacity: 0.6;">${this.formatTimeAgo(msg.timestamp)}</span>
                                </div>
                                <div style="font-size: 14px; line-height: 1.4;">${msg.message}</div>
                            </div>
                        </div>
                    `).join('') : `
                        <div style="text-align: center; padding: 60px 20px; opacity: 0.6;">
                            <div style="font-size: 40px; margin-bottom: 15px;">💬</div>
                            <p>No messages yet.<br>Be the first to say hello!</p>
                        </div>
                    `}
                </div>
                
                <!-- Message Input -->
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="clanChatInput" placeholder="Type a message..." maxlength="200" style="
                        flex: 1;
                        padding: 12px 20px;
                        border-radius: 25px;
                        border: 2px solid #2d3748;
                        background: rgba(45, 55, 72, 0.5);
                        color: white;
                        font-size: 14px;
                    ">
                    <button id="sendChatMessage" style="
                        background: #e53e3e;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">Send</button>
                </div>
            </div>
        `;
    }
    
    addClanEventListeners() {
        // Contribute to war objectives
        document.querySelectorAll('.contribute-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const objectiveId = e.target.dataset.objective;
                this.showContributeModal(objectiveId);
            });
        });
        
        // Watch replays
        document.querySelectorAll('.watch-replay-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const replayId = e.target.dataset.replayId;
                this.watchReplay(replayId);
            });
        });
        
        // Race against ghost
        document.querySelectorAll('.race-ghost-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const replayId = e.target.dataset.replayId;
                this.raceAgainstGhost(replayId);
            });
        });
        
        // Ghost viewing toggle
        const ghostToggle = document.getElementById('enableGhostViewing');
        if (ghostToggle) {
            ghostToggle.addEventListener('change', (e) => {
                this.ghostReplays.viewingEnabled = e.target.checked;
                this.saveGhostReplays();
            });
        }
    }
    
    // Show clan discovery for players without clans
    showClanDiscovery() {
        const content = document.getElementById('clanModalContent');
        const recommendedClans = this.getRecommendedClans();
        
        content.innerHTML = `
            <!-- Discovery Header -->
            <div style="
                background: linear-gradient(135deg, #667eea, #764ba2);
                padding: 40px 30px 30px;
                text-align: center;
            ">
                <div style="font-size: 80px; margin-bottom: 20px;">🏰</div>
                <h1 style="margin: 0; font-size: 28px;">Find Your Clan</h1>
                <p style="margin: 15px 0; opacity: 0.9;">
                    Join forces with other Snake players for weekly wars, shared rewards, and epic battles!
                </p>
            </div>
            
            <!-- Benefits Section -->
            <div style="padding: 30px;">
                <h2 style="margin: 0 0 20px 0; text-align: center;">Why Join a Clan?</h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0;">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 40px; margin-bottom: 15px;">⚔️</div>
                        <h4>Weekly Wars</h4>
                        <p style="font-size: 14px; opacity: 0.8;">Compete with your clan in weekly objectives and climb the leaderboards.</p>
                    </div>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 40px; margin-bottom: 15px;">👻</div>
                        <h4>Ghost Replays</h4>
                        <p style="font-size: 14px; opacity: 0.8;">Watch and race against your clanmates' best runs.</p>
                    </div>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 40px; margin-bottom: 15px;">🎁</div>
                        <h4>Clan Rewards</h4>
                        <p style="font-size: 14px; opacity: 0.8;">Earn exclusive rewards through clan chest progression.</p>
                    </div>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 40px; margin-bottom: 15px;">💬</div>
                        <h4>Social Features</h4>
                        <p style="font-size: 14px; opacity: 0.8;">Chat with friends and coordinate strategies.</p>
                    </div>
                </div>
                
                <!-- Recommended Clans -->
                <h3 style="margin: 40px 0 20px 0;">🌟 Recommended for You</h3>
                <div style="display: grid; gap: 20px;">
                    ${recommendedClans.map(clan => `
                        <div style="
                            background: rgba(45, 55, 72, 0.3);
                            border-radius: 15px;
                            padding: 25px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <div style="display: flex; align-items: center; gap: 20px;">
                                <div style="
                                    width: 60px;
                                    height: 60px;
                                    background: linear-gradient(135deg, #e53e3e, #c53030);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 30px;
                                ">${clan.badge}</div>
                                <div>
                                    <h4 style="margin: 0; font-size: 18px;">${clan.name}</h4>
                                    <p style="margin: 5px 0; opacity: 0.8; font-size: 14px;">${clan.description}</p>
                                    <div style="font-size: 12px; opacity: 0.6;">
                                        ${clan.members}/50 members • ${clan.trophies} 🏆 • ${clan.warWins} war wins
                                    </div>
                                </div>
                            </div>
                            <div>
                                <button class="join-clan-btn" data-clan-id="${clan.id}" style="
                                    background: #48bb78;
                                    color: white;
                                    border: none;
                                    padding: 12px 25px;
                                    border-radius: 25px;
                                    cursor: pointer;
                                    font-size: 14px;
                                    font-weight: bold;
                                ">Join Clan</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Create Clan Option -->
                <div style="
                    text-align: center;
                    margin: 40px 0;
                    padding: 30px;
                    background: rgba(102, 126, 234, 0.1);
                    border: 2px dashed #667eea;
                    border-radius: 15px;
                ">
                    <h3>Want to Lead?</h3>
                    <p style="opacity: 0.8; margin: 15px 0;">Create your own clan and recruit the best Snake players!</p>
                    <button id="createClanBtn" style="
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                    ">🏰 Create Clan</button>
                </div>
            </div>
        `;
        
        // Add join clan event listeners
        document.querySelectorAll('.join-clan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clanId = e.target.dataset.clanId;
                this.joinClan(clanId);
            });
        });
        
        document.getElementById('createClanBtn')?.addEventListener('click', () => {
            this.showCreateClanModal();
        });
    }
    
    // Game integration methods
    onGameEnd(gameData) {
        if (!this.clanData.clanId) return;
        
        // Update weekly activity
        this.clanData.weeklyActivity.score += gameData.score;
        this.clanData.weeklyActivity.games++;
        this.clanData.weeklyActivity.lastActive = Date.now();
        
        // Update total contributions
        this.clanData.contributions.totalScore += gameData.score;
        this.clanData.contributions.gamesPlayed++;
        
        // Record ghost replay if it's a good score
        if (gameData.score >= 100) {
            this.recordGhostReplay(gameData);
        }
        
        // Update clan war objectives
        this.updateWarObjectives(gameData);
        
        // Save data
        this.saveClanData();
        
        // Add to clan activity feed
        this.addClanActivity({
            type: 'game_completed',
            playerId: this.userProfile.getProfile().playerId,
            playerName: this.userProfile.getProfile().username,
            score: gameData.score,
            timestamp: Date.now()
        });
        
        // Update button
        this.updateClanButton();
    }
    
    updateWarObjectives(gameData) {
        const war = this.clanWars.currentWar;
        if (war.status !== 'active') return;
        
        let progressMade = false;
        
        war.objectives.forEach(objective => {
            switch (objective.id) {
                case 'collective_score':
                    objective.current += gameData.score;
                    progressMade = true;
                    break;
                    
                case 'high_scores':
                    if (gameData.score > 200) {
                        objective.current++;
                        progressMade = true;
                    }
                    break;
                    
                case 'participation_rate':
                    // This gets updated when we track daily activity
                    if (!this.hasContributedToday('participation_rate')) {
                        this.markContribution('participation_rate');
                        this.updateParticipationRate();
                        progressMade = true;
                    }
                    break;
                    
                case 'daily_activity':
                    if (!this.hasContributedToday('daily_activity')) {
                        objective.current++;
                        this.markContribution('daily_activity');
                        progressMade = true;
                    }
                    break;
            }
        });
        
        if (progressMade) {
            this.saveWarData();
            
            // Show war progress notification
            this.showWarProgressNotification(gameData.score);
        }
    }
    
    recordGhostReplay(gameData) {
        if (!this.ghostReplays.recordingEnabled) return;
        
        const replay = {
            id: `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            playerId: this.userProfile.getProfile().playerId,
            playerName: this.userProfile.getProfile().username,
            score: gameData.score,
            duration: gameData.duration,
            timestamp: Date.now(),
            pathLength: gameData.pathLength || 0,
            
            // Abstract path data (simplified for demo)
            path: this.generateAbstractPath(gameData),
            
            // Metadata
            snake: this.userProfile.getProfile().equippedCosmetics?.snake || 'classic_snake',
            level: this.userProfile.getProfile().level,
            season: this.seasonManager.getCurrentSeason().id
        };
        
        // Add to replays
        this.ghostReplays.replays.push(replay);
        
        // Keep only top replays
        this.ghostReplays.replays.sort((a, b) => b.score - a.score);
        this.ghostReplays.replays = this.ghostReplays.replays.slice(0, this.ghostReplays.maxReplays);
        
        this.saveGhostReplays();
        
        console.log(`👻 Ghost replay recorded: ${gameData.score} points`);
    }
    
    generateAbstractPath(gameData) {
        // Generate a simplified abstract path for the ghost trail
        // In a real implementation, this would be the actual snake movement path
        const path = [];
        const steps = Math.min(100, gameData.score / 5); // Limit path complexity
        
        for (let i = 0; i < steps; i++) {
            path.push({
                x: Math.random() * 320, // Canvas width
                y: Math.random() * 240, // Canvas height
                timestamp: i * (gameData.duration / steps)
            });
        }
        
        return path;
    }
    
    // Utility methods
    getClanInfo() {
        // Simulate clan information
        return {
            id: this.clanData.clanId,
            name: 'Elite Serpents',
            description: 'Elite Snake Warriors conquering the leaderboards',
            badge: '🏰',
            trophies: 1250,
            level: 8,
            members: 28,
            warWins: 15,
            created: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
        };
    }
    
    getWarStatus() {
        const war = this.clanWars.currentWar;
        const completedObjectives = war.objectives.filter(obj => obj.current >= obj.target).length;
        const totalObjectives = war.objectives.length;
        const progress = Math.floor((completedObjectives / totalObjectives) * 100);
        
        return {
            active: war.status === 'active',
            timeLeft: this.getTimeUntilWeekEnd(),
            rank: 3, // Simulated rank
            progress: progress
        };
    }
    
    getClanMemberStats() {
        return {
            total: 28,
            active: 21, // Active this week
            online: 7   // Currently online
        };
    }
    
    getClanMembers() {
        // Simulate clan member data
        const members = [];
        const playerProfile = this.userProfile.getProfile();
        
        // Add current player
        members.push({
            id: playerProfile.playerId,
            username: playerProfile.username,
            level: playerProfile.level,
            role: 'member',
            online: true,
            lastSeen: 'now',
            weeklyScore: 2150,
            trophies: 156,
            gamesPlayed: 45,
            joined: Date.now() - (7 * 24 * 60 * 60 * 1000)
        });
        
        // Add simulated members
        const names = ['ViperKing', 'SnakeQueen', 'CobraMaster', 'PythonPro', 'RattleRanger', 'MambaElite'];
        names.forEach((name, index) => {
            members.push({
                id: `member_${index}`,
                username: name,
                level: 15 + Math.floor(Math.random() * 30),
                role: index === 0 ? 'leader' : index === 1 ? 'officer' : 'member',
                online: Math.random() > 0.7,
                lastSeen: Math.random() > 0.5 ? '2h ago' : '1d ago',
                weeklyScore: Math.floor(Math.random() * 3000) + 500,
                trophies: Math.floor(Math.random() * 300) + 100,
                gamesPlayed: Math.floor(Math.random() * 100) + 20,
                joined: Date.now() - (Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000)
            });
        });
        
        return members.sort((a, b) => b.weeklyScore - a.weeklyScore);
    }
    
    getClanWarProgress() {
        const war = this.clanWars.currentWar;
        const totalScore = war.objectives.find(obj => obj.id === 'collective_score')?.current || 0;
        const completedObjectives = war.objectives.filter(obj => obj.current >= obj.target).length;
        
        return {
            totalScore: totalScore,
            rank: 3,
            chestProgress: Math.min(100, (completedObjectives / war.objectives.length) * 100),
            chestTimeLeft: this.getTimeUntilWeekEnd()
        };
    }
    
    getTopReplays() {
        return this.ghostReplays.replays
            .filter(replay => replay.score >= 50) // Only show decent scores
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    
    getRecommendedClans() {
        return [
            {
                id: 'clan_001',
                name: 'Viper Squad',
                description: 'Competitive players seeking glory',
                badge: '🐍',
                members: 35,
                trophies: 2150,
                warWins: 23,
                matchScore: 95
            },
            {
                id: 'clan_002', 
                name: 'Snake Lords',
                description: 'Friendly community for all skill levels',
                badge: '👑',
                members: 42,
                trophies: 1890,
                warWins: 18,
                matchScore: 88
            },
            {
                id: 'clan_003',
                name: 'Cobra Strike',
                description: 'Strategic players who coordinate well',
                badge: '⚡',
                members: 31,
                trophies: 2050,
                warWins: 21,
                matchScore: 91
            }
        ].sort((a, b) => b.matchScore - a.matchScore);
    }
    
    hasUnreadNotifications() {
        // Check for war updates, new messages, etc.
        const war = this.clanWars.currentWar;
        const hasWarUpdates = war.status === 'active' && this.hasNewWarProgress();
        const hasNewMessages = this.socialFeatures.chat.messages.some(msg => 
            msg.timestamp > (localStorage.getItem('lastChatRead') || 0)
        );
        
        return hasWarUpdates || hasNewMessages;
    }
    
    hasNewWarProgress() {
        const lastCheck = parseInt(localStorage.getItem('lastWarProgressCheck') || '0');
        return this.clanWars.currentWar.objectives.some(obj => 
            (obj.lastUpdated || 0) > lastCheck
        );
    }
    
    getMemberRoleColor(role) {
        const colors = {
            leader: '#ffd700',
            officer: '#c0c0c0', 
            member: '#4a5568'
        };
        return colors[role] || colors.member;
    }
    
    canManageClan() {
        // Check if player can manage clan (leader or officer)
        return this.clanData.role === 'leader' || this.clanData.role === 'officer';
    }
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
    
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'just now';
    }
    
    getTimeUntilWeekEnd() {
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + (7 - now.getDay()));
        nextWeek.setHours(23, 59, 59, 999);
        
        const timeLeft = nextWeek - now;
        const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
        const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
    }
    
    getWeekStartTime() {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek.getTime();
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
    
    // Save/load methods
    saveClanData() {
        localStorage.setItem('clanMembership', JSON.stringify(this.clanData));
    }
    
    saveWarData() {
        const currentWeek = this.getWeekString();
        localStorage.setItem(`clanWar_${currentWeek}`, JSON.stringify(this.clanWars.currentWar));
    }
    
    saveGhostReplays() {
        localStorage.setItem('clanGhostReplays', JSON.stringify(this.ghostReplays.replays));
    }
    
    markContribution(objectiveId) {
        const today = this.getDateString();
        const contributions = JSON.parse(localStorage.getItem('dailyClanContributions') || '{}');
        
        if (!contributions[today]) {
            contributions[today] = [];
        }
        
        if (!contributions[today].includes(objectiveId)) {
            contributions[today].push(objectiveId);
            localStorage.setItem('dailyClanContributions', JSON.stringify(contributions));
        }
    }
    
    // Public API methods
    getClanId() {
        return this.clanData.clanId;
    }
    
    isInClan() {
        return !!this.clanData.clanId;
    }
    
    getCurrentWar() {
        return this.clanWars.currentWar;
    }
    
    getGhostReplaysEnabled() {
        return this.ghostReplays.viewingEnabled;
    }
    
    // Placeholder methods for complex features
    joinClan(clanId) {
        // Simulate joining clan
        const confirmation = confirm(`Join clan? This is a demo - no real clan system yet.`);
        if (confirmation) {
            this.clanData.clanId = clanId;
            this.clanData.joinDate = Date.now();
            this.clanData.role = 'member';
            
            // Update user profile
            const profile = this.userProfile.getProfile();
            profile.clanId = clanId;
            this.userProfile.saveProfile();
            
            this.saveClanData();
            this.updateClanButton();
            
            // Close modal and show success
            document.getElementById('clanModal').style.display = 'none';
            
            this.analytics?.trackEvent('clan_joined', {
                clanId: clanId
            });
        }
    }
    
    showContributeModal(objectiveId) {
        alert(`Contribute to ${objectiveId}? Play more games to help your clan win!`);
    }
    
    watchReplay(replayId) {
        alert(`Watching replay ${replayId} - Ghost trail visualization coming soon!`);
    }
    
    raceAgainstGhost(replayId) {
        alert(`Racing against ghost ${replayId} - Start a game to compete against this run!`);
    }
    
    showCreateClanModal() {
        alert('Create Clan feature coming soon! For now, join an existing clan.');
    }
    
    initializeChatSystem() {
        const input = document.getElementById('clanChatInput');
        const sendBtn = document.getElementById('sendChatMessage');
        
        if (input && sendBtn) {
            const sendMessage = () => {
                const message = input.value.trim();
                if (message) {
                    this.sendChatMessage(message);
                    input.value = '';
                }
            };
            
            sendBtn.addEventListener('click', sendMessage);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
    }
    
    sendChatMessage(message) {
        const profile = this.userProfile.getProfile();
        const chatMessage = {
            id: `msg_${Date.now()}`,
            username: profile.username,
            role: this.clanData.role,
            message: message,
            timestamp: Date.now()
        };
        
        this.socialFeatures.chat.messages.push(chatMessage);
        
        // Keep only recent messages
        if (this.socialFeatures.chat.messages.length > this.socialFeatures.chat.maxMessages) {
            this.socialFeatures.chat.messages = this.socialFeatures.chat.messages.slice(-this.socialFeatures.chat.maxMessages);
        }
        
        // Save and refresh chat
        this.saveChatMessages();
        this.refreshChatDisplay();
        
        this.analytics?.trackEvent('clan_message_sent', {
            messageLength: message.length
        });
    }
    
    refreshChatDisplay() {
        const messagesContainer = document.getElementById('clanChatMessages');
        if (messagesContainer) {
            const messages = this.socialFeatures.chat.messages.slice(-20);
            // Update messages display
            // Implementation would refresh the chat content
        }
    }
    
    saveChatMessages() {
        const clanId = this.clanData.clanId;
        if (clanId) {
            localStorage.setItem(`clanChat_${clanId}`, JSON.stringify(this.socialFeatures.chat.messages));
        }
    }
    
    showWarProgressNotification(score) {
        // Show brief notification about war progress
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #e53e3e, #c53030);
            color: white;
            padding: 15px 20px;
            border-radius: 15px;
            z-index: 1001;
            font-weight: bold;
            animation: slideInRight 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 20px;">⚔️</div>
                <div>
                    <div>Clan War Progress!</div>
                    <div style="font-size: 12px; opacity: 0.9;">+${score} points for your clan</div>
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
    
    // System setup methods
    checkWarStatus() {
        const currentWeek = this.getWeekString();
        const war = this.clanWars.currentWar;
        
        if (war.week !== currentWeek) {
            // New war week started
            this.startNewWar();
        }
    }
    
    startNewWar() {
        // Archive current war
        const warHistory = this.loadWarHistory();
        warHistory.push(this.clanWars.currentWar);
        localStorage.setItem('clanWarHistory', JSON.stringify(warHistory.slice(-10))); // Keep last 10 wars
        
        // Create new war
        this.clanWars.currentWar = this.loadCurrentWar();
        this.saveWarData();
        
        console.log(`⚔️ New clan war started: Week ${this.clanWars.currentWar.week}`);
    }
    
    loadWarHistory() {
        const saved = localStorage.getItem('clanWarHistory');
        return saved ? JSON.parse(saved) : [];
    }
    
    setupClanWarSchedule() {
        // Set up periodic checks for war status
        this.warCheckInterval = setInterval(() => {
            this.checkWarStatus();
            this.updateClanButton();
        }, 60 * 60 * 1000); // Check every hour
    }
    
    cleanupOldReplays() {
        // Remove replays older than 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        this.ghostReplays.replays = this.ghostReplays.replays.filter(replay => 
            replay.timestamp > thirtyDaysAgo
        );
        this.saveGhostReplays();
    }
    
    updateWeeklyActivity() {
        // Reset weekly activity if new week
        const currentWeek = this.getWeekString();
        const lastWeek = localStorage.getItem('lastWeeklyReset');
        
        if (lastWeek !== currentWeek) {
            this.clanData.weeklyActivity = {
                score: 0,
                games: 0,
                lastActive: Date.now()
            };
            localStorage.setItem('lastWeeklyReset', currentWeek);
        }
    }
    
    addClanActivity(activity) {
        if (!this.socialFeatures.activities) {
            this.socialFeatures.activities = [];
        }
        
        this.socialFeatures.activities.push(activity);
        
        // Keep only recent activities
        if (this.socialFeatures.activities.length > 50) {
            this.socialFeatures.activities = this.socialFeatures.activities.slice(-50);
        }
        
        const clanId = this.clanData.clanId;
        if (clanId) {
            localStorage.setItem(`clanActivities_${clanId}`, JSON.stringify(this.socialFeatures.activities));
        }
    }
    
    updateParticipationRate() {
        // Update participation rate objective
        const war = this.clanWars.currentWar;
        const participationObj = war.objectives.find(obj => obj.id === 'participation_rate');
        
        if (participationObj) {
            // Simulate participation calculation
            const activeMembersThisWeek = 21; // From getClanMemberStats
            const totalMembers = 28;
            participationObj.current = Math.floor((activeMembersThisWeek / totalMembers) * 100);
        }
    }
    
    generateWarRewards() {
        return {
            tier1: { gems: 100, clanTokens: 200, trophies: 10 },
            tier2: { gems: 250, clanTokens: 400, trophies: 20 },
            tier3: { gems: 500, clanTokens: 800, trophies: 40 },
            winner: { gems: 1000, clanTokens: 1500, trophies: 100 }
        };
    }
    
    createGhostReplayOverlay() {
        // Ghost replay overlay for during gameplay
        const overlay = document.createElement('div');
        overlay.id = 'ghostReplayOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            pointer-events: none;
            z-index: 100;
            display: none;
        `;
        
        document.body.appendChild(overlay);
    }
    
    createWarNotifications() {
        // War notification system placeholder
        console.log('📢 War notification system initialized');
    }
    
    // Cleanup
    destroy() {
        if (this.warCheckInterval) {
            clearInterval(this.warCheckInterval);
        }
        
        this.saveClanData();
        this.saveWarData();
        this.saveGhostReplays();
        
        console.log('⚔️ Clan Manager destroyed');
    }
}

// CSS animations for Clan UI
const clanStyle = document.createElement('style');
clanStyle.textContent = `
    @keyframes clanWarPulse {
        0%, 100% { 
            box-shadow: 0 4px 20px rgba(229, 62, 62, 0.3);
        }
        50% { 
            box-shadow: 0 4px 20px rgba(237, 137, 54, 0.6);
        }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(clanStyle);