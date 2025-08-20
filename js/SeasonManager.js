// Season Management System for Live Service Content Rotation
class SeasonManager {
    constructor(userProfile, analytics) {
        this.userProfile = userProfile;
        this.analytics = analytics;
        
        this.currentSeason = this.loadCurrentSeason();
        this.seasonConfig = this.loadSeasonConfig();
        this.eventSchedule = this.loadEventSchedule();
        
        this.initializeSeasonSystem();
        this.createSeasonUI();
        
        // Check for season updates every hour
        this.updateInterval = setInterval(() => {
            this.checkSeasonUpdates();
        }, 60 * 60 * 1000);
    }
    
    loadCurrentSeason() {
        const defaultSeason = {
            id: 1,
            name: 'Genesis Season',
            theme: 'classic',
            startDate: Date.now(),
            endDate: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days
            status: 'active',
            
            // Visual theming
            colors: {
                primary: '#667eea',
                secondary: '#764ba2',
                accent: '#f093fb'
            },
            
            // Season rewards and content
            battlePassTiers: 50,
            exclusiveContent: {
                skins: ['genesis_serpent', 'chrome_snake', 'void_viper'],
                trails: ['stardust_trail', 'neon_glow', 'shadow_mist'],
                banners: ['genesis_banner', 'cosmic_frame'],
                titles: ['Genesis Champion', 'First Crawler']
            },
            
            // Special events during season
            events: [],
            
            // Progression requirements
            tierRequirements: this.generateTierRequirements(50),
            
            version: '5.0.0'
        };
        
        const saved = localStorage.getItem('currentSeason');
        const season = saved ? { ...defaultSeason, ...JSON.parse(saved) } : defaultSeason;
        
        // Auto-advance season if expired
        if (Date.now() > season.endDate && season.status === 'active') {
            return this.createNextSeason(season);
        }
        
        return season;
    }
    
    loadSeasonConfig() {
        return {
            seasonDuration: 90, // days
            preSeasonDuration: 7, // days before season starts
            postSeasonDuration: 3, // days after season ends
            
            // Season themes rotation
            themes: [
                {
                    name: 'Genesis',
                    colors: { primary: '#667eea', secondary: '#764ba2', accent: '#f093fb' },
                    description: 'The beginning of legends'
                },
                {
                    name: 'Neon Nights',
                    colors: { primary: '#ff006e', secondary: '#8338ec', accent: '#3a86ff' },
                    description: 'Electric dreams and glowing trails'
                },
                {
                    name: 'Ancient Ruins',
                    colors: { primary: '#d4a574', secondary: '#8b4513', accent: '#ffd700' },
                    description: 'Mysteries of the forgotten serpents'
                },
                {
                    name: 'Cyber Storm',
                    colors: { primary: '#00f5ff', secondary: '#00ff00', accent: '#ff00ff' },
                    description: 'Digital revolution in the grid'
                },
                {
                    name: 'Mystic Forest',
                    colors: { primary: '#228b22', secondary: '#32cd32', accent: '#98fb98' },
                    description: 'Nature reclaims the ancient paths'
                },
                {
                    name: 'Fire & Ice',
                    colors: { primary: '#ff4500', secondary: '#00bfff', accent: '#ffffff' },
                    description: 'Elemental forces clash'
                }
            ],
            
            // Battle Pass Configuration
            battlePass: {
                freeTierRewards: 20,  // Free rewards every N tiers
                premiumCost: 999,     // Cost in gems
                tierXPRequirement: 1000, // Base XP per tier
                maxTiers: 50
            },
            
            // Event frequency
            eventConfig: {
                weeklyEvents: true,
                monthlyMegaEvents: true,
                seasonalFinales: true
            }
        };
    }
    
    loadEventSchedule() {
        return {
            weekly: [
                {
                    name: 'Double XP Weekend',
                    type: 'multiplier',
                    duration: 48, // hours
                    frequency: 'weekly',
                    day: 'friday', // starts on Friday
                    rewards: { xpMultiplier: 2.0 }
                },
                {
                    name: 'Coin Rush Tuesday',
                    type: 'currency',
                    duration: 24,
                    frequency: 'weekly', 
                    day: 'tuesday',
                    rewards: { coinMultiplier: 1.5 }
                }
            ],
            
            monthly: [
                {
                    name: 'Legendary Hunt',
                    type: 'special_rewards',
                    duration: 168, // 7 days
                    frequency: 'monthly',
                    week: 2, // Second week of month
                    rewards: {
                        exclusiveSkin: true,
                        bonusGems: 500,
                        specialTitle: true
                    }
                }
            ],
            
            seasonal: [
                {
                    name: 'Season Finale',
                    type: 'tournament',
                    duration: 72, // 3 days
                    timing: 'season_end',
                    daysBeforeEnd: 7,
                    rewards: {
                        topPlayerRewards: true,
                        exclusiveCosmetics: true,
                        nextSeasonPreview: true
                    }
                }
            ]
        };
    }
    
    initializeSeasonSystem() {
        // Check if we need to start a new season
        this.checkSeasonTransition();
        
        // Initialize current season theme
        this.applySeasonTheme();
        
        // Schedule upcoming events
        this.scheduleEvents();
        
        console.log(`🏛️ Season ${this.currentSeason.id}: ${this.currentSeason.name} active`);
        console.log(`📅 Season ends: ${new Date(this.currentSeason.endDate).toLocaleDateString()}`);
    }
    
    createSeasonUI() {
        // Season info display in top-left corner
        const seasonDisplay = document.createElement('div');
        seasonDisplay.id = 'seasonDisplay';
        seasonDisplay.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: linear-gradient(135deg, ${this.currentSeason.colors.primary}, ${this.currentSeason.colors.secondary});
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        `;
        
        this.updateSeasonDisplay();
        
        seasonDisplay.addEventListener('click', () => this.showSeasonModal());
        document.body.appendChild(seasonDisplay);
        
        // Create season modal
        this.createSeasonModal();
        
        // Create event notifications area
        this.createEventNotifications();
    }
    
    updateSeasonDisplay() {
        const display = document.getElementById('seasonDisplay');
        if (display) {
            const timeLeft = this.getTimeUntilSeasonEnd();
            
            display.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="font-size: 18px;">🏛️</div>
                    <div>
                        <div style="font-size: 12px; opacity: 0.9;">Season ${this.currentSeason.id}</div>
                        <div style="font-size: 11px; opacity: 0.7;">${timeLeft}</div>
                    </div>
                </div>
            `;
        }
    }
    
    createSeasonModal() {
        const modal = document.createElement('div');
        modal.id = 'seasonModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1005;
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
            max-width: 700px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            margin: 20px;
        `;
        
        content.innerHTML = `
            <button id="closeSeasonModal" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            ">×</button>
            
            <div id="seasonModalContent"></div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Event listeners
        content.querySelector('#closeSeasonModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    showSeasonModal() {
        const modal = document.getElementById('seasonModal');
        const content = document.getElementById('seasonModalContent');
        
        const timeLeft = this.getTimeUntilSeasonEnd();
        const progressPercentage = this.getSeasonProgress();
        const activeEvents = this.getActiveEvents();
        const upcomingEvents = this.getUpcomingEvents();
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="
                    background: linear-gradient(135deg, ${this.currentSeason.colors.primary}, ${this.currentSeason.colors.secondary});
                    color: white;
                    padding: 30px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                ">
                    <div style="font-size: 40px; margin-bottom: 15px;">🏛️</div>
                    <h1 style="margin: 0; font-size: 28px;">Season ${this.currentSeason.id}</h1>
                    <h2 style="margin: 10px 0; font-size: 20px; opacity: 0.9;">${this.currentSeason.name}</h2>
                    <p style="opacity: 0.8; margin: 15px 0;">${this.getSeasonDescription()}</p>
                </div>
                
                <div style="background: #f7fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3>Season Progress</h3>
                    <div style="background: #e2e8f0; height: 20px; border-radius: 10px; margin: 10px 0;">
                        <div style="
                            background: linear-gradient(90deg, ${this.currentSeason.colors.primary}, ${this.currentSeason.colors.secondary});
                            height: 100%;
                            width: ${progressPercentage}%;
                            border-radius: 10px;
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                    <p><strong>Time Remaining:</strong> ${timeLeft}</p>
                    <p><strong>Season Progress:</strong> ${progressPercentage.toFixed(1)}%</p>
                </div>
            </div>
            
            ${activeEvents.length > 0 ? `
                <div style="background: #fff5f5; border: 2px solid #feb2b2; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #c53030; margin: 0 0 15px 0;">🔥 Active Events</h3>
                    ${activeEvents.map(event => `
                        <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 8px;">
                            <strong>${event.name}</strong>
                            <p style="margin: 5px 0; font-size: 14px; color: #666;">${event.description || 'Special event active now!'}</p>
                            <p style="font-size: 12px; color: #999;">Ends: ${event.endsAt}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div style="background: #f7fafc; padding: 20px; border-radius: 10px;">
                    <h4>Exclusive Rewards</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 10px; margin: 15px 0;">
                        ${this.currentSeason.exclusiveContent.skins.slice(0, 4).map(skin => `
                            <div style="text-align: center;">
                                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, ${this.currentSeason.colors.primary}, ${this.currentSeason.colors.secondary}); border-radius: 50%; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🐍</div>
                                <div style="font-size: 10px;">${skin.replace('_', ' ')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="background: #f7fafc; padding: 20px; border-radius: 10px;">
                    <h4>Upcoming Events</h4>
                    ${upcomingEvents.length > 0 ? upcomingEvents.map(event => `
                        <div style="margin: 8px 0; font-size: 14px;">
                            <strong>${event.name}</strong>
                            <div style="font-size: 12px; color: #666;">${event.startsIn}</div>
                        </div>
                    `).join('') : '<p style="font-size: 14px; color: #666;">No upcoming events</p>'}
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button id="battlePassBtn" style="
                    background: linear-gradient(135deg, ${this.currentSeason.colors.primary}, ${this.currentSeason.colors.secondary});
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    margin: 0 10px;
                ">Battle Pass</button>
                <button id="seasonRewardsBtn" style="
                    background: #718096;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 0 10px;
                ">Season Rewards</button>
            </div>
        `;
        
        // Add event listeners for season actions
        content.querySelector('#battlePassBtn')?.addEventListener('click', () => {
            this.showBattlePassPreview();
        });
        
        content.querySelector('#seasonRewardsBtn')?.addEventListener('click', () => {
            this.showSeasonRewards();
        });
        
        modal.style.display = 'flex';
    }
    
    createEventNotifications() {
        const container = document.createElement('div');
        container.id = 'eventNotifications';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 1001;
            max-width: 300px;
        `;
        
        document.body.appendChild(container);
    }
    
    showEventNotification(event) {
        const container = document.getElementById('eventNotifications');
        const notification = document.createElement('div');
        
        notification.style.cssText = `
            background: linear-gradient(135deg, ${this.currentSeason.colors.primary}, ${this.currentSeason.colors.secondary});
            color: white;
            padding: 15px 20px;
            border-radius: 15px;
            margin-bottom: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: slideInLeft 0.5s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 24px;">🎉</div>
                <div>
                    <div style="font-weight: bold; margin-bottom: 4px;">${event.name}</div>
                    <div style="font-size: 12px; opacity: 0.9;">${event.description || 'Event is now active!'}</div>
                </div>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutLeft 0.5s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }
        }, 8000);
    }
    
    // Season Management Logic
    checkSeasonTransition() {
        const now = Date.now();
        
        if (now > this.currentSeason.endDate && this.currentSeason.status === 'active') {
            this.endSeason();
            this.currentSeason = this.createNextSeason(this.currentSeason);
            this.startNewSeason();
        }
    }
    
    createNextSeason(prevSeason) {
        const nextTheme = this.seasonConfig.themes[prevSeason.id % this.seasonConfig.themes.length];
        const seasonDuration = this.seasonConfig.seasonDuration * 24 * 60 * 60 * 1000;
        
        return {
            id: prevSeason.id + 1,
            name: `${nextTheme.name} Season`,
            theme: nextTheme.name.toLowerCase().replace(' ', '_'),
            startDate: Date.now(),
            endDate: Date.now() + seasonDuration,
            status: 'active',
            colors: nextTheme.colors,
            battlePassTiers: this.seasonConfig.battlePass.maxTiers,
            exclusiveContent: this.generateSeasonContent(nextTheme),
            events: [],
            tierRequirements: this.generateTierRequirements(this.seasonConfig.battlePass.maxTiers),
            version: '5.0.0'
        };
    }
    
    generateSeasonContent(theme) {
        const themePrefix = theme.name.toLowerCase().replace(' ', '_');
        
        return {
            skins: [
                `${themePrefix}_serpent`,
                `${themePrefix}_viper`,
                `${themePrefix}_cobra`,
                `legendary_${themePrefix}`
            ],
            trails: [
                `${themePrefix}_trail`,
                `${themePrefix}_aura`,
                `${themePrefix}_particles`
            ],
            banners: [
                `${themePrefix}_banner`,
                `${themePrefix}_frame`
            ],
            titles: [
                `${theme.name} Champion`,
                `${theme.name} Master`,
                `${theme.name} Legend`
            ]
        };
    }
    
    generateTierRequirements(maxTiers) {
        const requirements = [];
        for (let i = 1; i <= maxTiers; i++) {
            requirements.push({
                tier: i,
                xp: Math.floor(1000 * Math.pow(1.05, i - 1)),
                totalXP: requirements.reduce((sum, req) => sum + req.xp, 0) + Math.floor(1000 * Math.pow(1.05, i - 1))
            });
        }
        return requirements;
    }
    
    endSeason() {
        // Season end rewards and cleanup
        this.currentSeason.status = 'ended';
        this.currentSeason.endedAt = Date.now();
        
        // Save season to history
        const seasonHistory = JSON.parse(localStorage.getItem('seasonHistory') || '[]');
        seasonHistory.push({ ...this.currentSeason });
        localStorage.setItem('seasonHistory', JSON.stringify(seasonHistory));
        
        // Trigger season end event
        this.analytics?.trackEvent('season_ended', {
            seasonId: this.currentSeason.id,
            seasonName: this.currentSeason.name,
            duration: this.currentSeason.endedAt - this.currentSeason.startDate
        });
        
        console.log(`🏁 Season ${this.currentSeason.id} ended`);
    }
    
    startNewSeason() {
        this.currentSeason.status = 'active';
        this.saveCurrentSeason();
        
        // Apply new theme
        this.applySeasonTheme();
        
        // Update UI
        this.updateSeasonDisplay();
        
        // Show season start notification
        this.showEventNotification({
            name: `${this.currentSeason.name} Begins!`,
            description: `New rewards, challenges, and content await!`
        });
        
        // Track new season start
        this.analytics?.trackEvent('season_started', {
            seasonId: this.currentSeason.id,
            seasonName: this.currentSeason.name,
            theme: this.currentSeason.theme
        });
        
        console.log(`🚀 Season ${this.currentSeason.id} started: ${this.currentSeason.name}`);
    }
    
    applySeasonTheme() {
        // Update CSS custom properties for season colors
        document.documentElement.style.setProperty('--season-primary', this.currentSeason.colors.primary);
        document.documentElement.style.setProperty('--season-secondary', this.currentSeason.colors.secondary);
        document.documentElement.style.setProperty('--season-accent', this.currentSeason.colors.accent);
        
        // Update season display colors
        const seasonDisplay = document.getElementById('seasonDisplay');
        if (seasonDisplay) {
            seasonDisplay.style.background = `linear-gradient(135deg, ${this.currentSeason.colors.primary}, ${this.currentSeason.colors.secondary})`;
        }
    }
    
    scheduleEvents() {
        // This would integrate with a more sophisticated event scheduling system
        // For now, we'll simulate some active events based on day/time
        
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hour = now.getHours();
        
        // Weekend double XP
        if (dayOfWeek === 5 && hour >= 18) { // Friday 6 PM
            this.startEvent({
                name: 'Double XP Weekend',
                type: 'multiplier',
                duration: 48,
                rewards: { xpMultiplier: 2.0 },
                description: 'Earn double XP all weekend long!'
            });
        }
        
        // Tuesday coin rush
        if (dayOfWeek === 2) {
            this.startEvent({
                name: 'Coin Rush Tuesday',
                type: 'currency',
                duration: 24,
                rewards: { coinMultiplier: 1.5 },
                description: 'Extra coins for all your games today!'
            });
        }
    }
    
    startEvent(eventData) {
        const event = {
            ...eventData,
            id: `event_${Date.now()}`,
            startTime: Date.now(),
            endTime: Date.now() + (eventData.duration * 60 * 60 * 1000),
            active: true
        };
        
        // Add to current season events
        this.currentSeason.events.push(event);
        this.saveCurrentSeason();
        
        // Show notification
        this.showEventNotification(event);
        
        // Track event start
        this.analytics?.trackEvent('event_started', {
            eventId: event.id,
            eventName: event.name,
            eventType: event.type,
            seasonId: this.currentSeason.id
        });
    }
    
    // Utility Methods
    getTimeUntilSeasonEnd() {
        const timeLeft = this.currentSeason.endDate - Date.now();
        
        if (timeLeft <= 0) return 'Season Ended';
        
        const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
        const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        
        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    }
    
    getSeasonProgress() {
        const elapsed = Date.now() - this.currentSeason.startDate;
        const total = this.currentSeason.endDate - this.currentSeason.startDate;
        return Math.min(100, (elapsed / total) * 100);
    }
    
    getSeasonDescription() {
        const descriptions = {
            'genesis': 'The beginning of legends',
            'neon_nights': 'Electric dreams and glowing trails', 
            'ancient_ruins': 'Mysteries of the forgotten serpents',
            'cyber_storm': 'Digital revolution in the grid',
            'mystic_forest': 'Nature reclaims the ancient paths',
            'fire_&_ice': 'Elemental forces clash'
        };
        
        return descriptions[this.currentSeason.theme] || 'A new chapter begins';
    }
    
    getActiveEvents() {
        const now = Date.now();
        return this.currentSeason.events.filter(event => 
            event.active && event.endTime > now
        ).map(event => ({
            ...event,
            endsAt: this.formatEventTime(event.endTime)
        }));
    }
    
    getUpcomingEvents() {
        // Simulate upcoming events
        return [
            {
                name: 'Legendary Hunt',
                startsIn: 'In 3 days'
            },
            {
                name: 'Season Finale',
                startsIn: this.getTimeUntilSeasonEnd()
            }
        ];
    }
    
    formatEventTime(timestamp) {
        const timeLeft = timestamp - Date.now();
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }
    
    showBattlePassPreview() {
        // Placeholder for battle pass modal (Phase 5B)
        alert('Battle Pass coming in Phase 5B! 🎯');
    }
    
    showSeasonRewards() {
        // Show season-specific rewards
        const modal = document.getElementById('seasonModal');
        const content = document.getElementById('seasonModalContent');
        
        content.innerHTML = `
            <h2 style="text-align: center; margin-bottom: 30px;">Season ${this.currentSeason.id} Rewards</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div style="background: #f7fafc; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4>Snake Skins</h4>
                    ${this.currentSeason.exclusiveContent.skins.map(skin => `
                        <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 8px;">
                            🐍 ${skin.replace('_', ' ')}
                        </div>
                    `).join('')}
                </div>
                
                <div style="background: #f7fafc; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4>Trail Effects</h4>
                    ${this.currentSeason.exclusiveContent.trails.map(trail => `
                        <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 8px;">
                            ✨ ${trail.replace('_', ' ')}
                        </div>
                    `).join('')}
                </div>
                
                <div style="background: #f7fafc; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4>Titles & Banners</h4>
                    ${this.currentSeason.exclusiveContent.titles.map(title => `
                        <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 8px;">
                            🏆 ${title}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="document.getElementById('seasonModal').style.display='none'" style="
                    background: #718096;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                ">Back to Season</button>
            </div>
        `;
    }
    
    checkSeasonUpdates() {
        this.checkSeasonTransition();
        this.updateSeasonDisplay();
        
        // Check for event updates
        this.scheduleEvents();
    }
    
    saveCurrentSeason() {
        localStorage.setItem('currentSeason', JSON.stringify(this.currentSeason));
    }
    
    // Public API
    getCurrentSeason() {
        return { ...this.currentSeason };
    }
    
    getSeasonTimeRemaining() {
        return this.currentSeason.endDate - Date.now();
    }
    
    isEventActive(eventType) {
        const now = Date.now();
        return this.currentSeason.events.some(event => 
            event.type === eventType && event.active && event.endTime > now
        );
    }
    
    getEventMultiplier(type) {
        const activeEvent = this.getActiveEvents().find(event => event.type === type);
        return activeEvent?.rewards?.[`${type}Multiplier`] || 1.0;
    }
    
    // Cleanup
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.saveCurrentSeason();
    }
}

// Add CSS animations for event notifications
const seasonStyle = document.createElement('style');
seasonStyle.textContent = `
    @keyframes slideInLeft {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutLeft {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-100%); opacity: 0; }
    }
`;
document.head.appendChild(seasonStyle);