/**
 * Modern UI System - 2025 Design Language
 * Features:
 * - Condensed icon-only buttons that expand on hover/click
 * - Glassmorphism effects
 * - Smooth micro-interactions
 * - Floating action bar design
 * - Contextual animations
 */

class ModernUISystem {
    constructor() {
        this.initialized = false;
        this.activePanel = null;
        this.buttons = new Map();
        this.floatingBar = null;
        
        // Design system configuration
        this.config = {
            colors: {
                primary: '#8B5CF6',      // Modern purple
                secondary: '#10B981',     // Emerald green
                accent: '#F59E0B',        // Amber
                glass: 'rgba(255, 255, 255, 0.1)',
                glassHover: 'rgba(255, 255, 255, 0.15)',
                text: '#FFFFFF',
                textMuted: 'rgba(255, 255, 255, 0.7)'
            },
            animation: {
                duration: '300ms',
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            },
            layout: {
                barHeight: 56,
                iconSize: 24,
                expandedWidth: 180,
                gap: 12,
                padding: 16,
                borderRadius: 16
            }
        };
    }
    
    init() {
        if (this.initialized) return;
        
        console.log('🎨 Initializing Modern UI System 2025');
        
        // Clean up old UI elements
        this.cleanupOldUI();
        
        // Create new modern UI
        this.createFloatingActionBar();
        this.createStyles();
        this.setupInteractions();
        
        this.initialized = true;
        console.log('✨ Modern UI System initialized');
    }
    
    cleanupOldUI() {
        // Hide all old buttons
        const oldButtons = document.querySelectorAll('button[id$="Button"], #currencyDisplay, #seasonButton');
        oldButtons.forEach(btn => {
            if (btn && !btn.classList.contains('key')) {
                btn.style.display = 'none';
            }
        });
        
        // Remove duplicate elements
        const duplicates = document.querySelectorAll('.profile-display, .currency-display, .battle-pass-display');
        duplicates.forEach(el => el.remove());
    }
    
    createFloatingActionBar() {
        // Create main floating bar container
        this.floatingBar = document.createElement('div');
        this.floatingBar.className = 'modern-floating-bar';
        this.floatingBar.innerHTML = `
            <div class="floating-bar-container">
                <!-- Left Section: User & Stats -->
                <div class="bar-section bar-left">
                    <button class="icon-btn" data-action="profile" data-tooltip="Profile">
                        <span class="icon">👤</span>
                        <span class="label">Profile</span>
                        <span class="badge" id="levelBadge">1</span>
                    </button>
                    
                    <button class="icon-btn" data-action="achievements" data-tooltip="Achievements">
                        <span class="icon">🏆</span>
                        <span class="label">Achievements</span>
                        <span class="badge pulse" style="display: none;">!</span>
                    </button>
                </div>
                
                <!-- Center Section: Resources -->
                <div class="bar-section bar-center">
                    <div class="resource-display">
                        <span class="resource-icon">🪙</span>
                        <span class="resource-value" id="coinValue">0</span>
                    </div>
                    <div class="resource-display">
                        <span class="resource-icon">💎</span>
                        <span class="resource-value" id="gemValue">0</span>
                    </div>
                </div>
                
                <!-- Right Section: Premium Features -->
                <div class="bar-section bar-right">
                    <button class="icon-btn" data-action="battlepass" data-tooltip="Battle Pass">
                        <span class="icon">⚔️</span>
                        <span class="label">Battle Pass</span>
                        <div class="progress-ring">
                            <svg width="24" height="24">
                                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" stroke-width="2" fill="none"/>
                                <circle cx="12" cy="12" r="10" stroke="#8B5CF6" stroke-width="2" fill="none" 
                                        stroke-dasharray="62.83" stroke-dashoffset="50" 
                                        transform="rotate(-90 12 12)"/>
                            </svg>
                        </div>
                    </button>
                    
                    <button class="icon-btn premium-btn" data-action="premium" data-tooltip="Premium">
                        <span class="icon">✨</span>
                        <span class="label">Premium</span>
                        <span class="shine"></span>
                    </button>
                    
                    <button class="icon-btn menu-btn" data-action="menu" data-tooltip="Menu">
                        <span class="icon">☰</span>
                        <span class="label">Menu</span>
                    </button>
                </div>
            </div>
            
            <!-- Expandable panels for detailed views -->
            <div class="expandable-panel" id="expandablePanel">
                <div class="panel-content" id="panelContent"></div>
            </div>
        `;
        
        document.body.appendChild(this.floatingBar);
        
        // Update resource values from game state
        this.updateResourceDisplay();
    }
    
    createStyles() {
        const style = document.createElement('style');
        style.id = 'modern-ui-styles';
        style.textContent = `
            /* Modern Floating Bar */
            .modern-floating-bar {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 2000;
                width: calc(100% - 40px);
                max-width: 800px;
                pointer-events: none;
            }
            
            .floating-bar-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, 
                    rgba(139, 92, 246, 0.1) 0%, 
                    rgba(16, 185, 129, 0.1) 100%);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: ${this.config.layout.borderRadius}px;
                padding: 8px 12px;
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                pointer-events: auto;
                transition: all ${this.config.animation.duration} ${this.config.animation.easing};
            }
            
            .floating-bar-container:hover {
                box-shadow: 
                    0 12px 48px rgba(139, 92, 246, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }
            
            /* Bar Sections */
            .bar-section {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            /* Icon Buttons */
            .icon-btn {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                color: ${this.config.colors.text};
                cursor: pointer;
                transition: all ${this.config.animation.duration} ${this.config.animation.easing};
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            
            .icon-btn:hover {
                width: auto;
                padding: 0 16px;
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.2);
                transform: translateY(-2px);
                box-shadow: 
                    0 4px 12px rgba(139, 92, 246, 0.3),
                    0 0 0 1px rgba(139, 92, 246, 0.2);
            }
            
            .icon-btn:active {
                transform: translateY(0);
                box-shadow: 
                    0 2px 8px rgba(139, 92, 246, 0.2),
                    inset 0 1px 2px rgba(0, 0, 0, 0.2);
            }
            
            .icon-btn .icon {
                font-size: 20px;
                transition: all ${this.config.animation.duration} ${this.config.animation.spring};
            }
            
            .icon-btn:hover .icon {
                transform: scale(1.1) rotate(5deg);
            }
            
            .icon-btn .label {
                display: none;
                margin-left: 8px;
                font-size: 13px;
                font-weight: 500;
                white-space: nowrap;
                opacity: 0;
                transition: opacity ${this.config.animation.duration} ${this.config.animation.easing};
            }
            
            .icon-btn:hover .label {
                display: inline;
                opacity: 1;
            }
            
            /* Badges */
            .icon-btn .badge {
                position: absolute;
                top: -4px;
                right: -4px;
                min-width: 18px;
                height: 18px;
                padding: 0 4px;
                background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
                border-radius: 9px;
                font-size: 10px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
            }
            
            .badge.pulse {
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { 
                    transform: scale(1);
                    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
                }
                50% { 
                    transform: scale(1.1);
                    box-shadow: 0 2px 12px rgba(245, 158, 11, 0.6);
                }
            }
            
            /* Resource Display */
            .resource-display {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .resource-icon {
                font-size: 16px;
            }
            
            .resource-value {
                font-size: 14px;
                font-weight: 600;
                color: ${this.config.colors.text};
                min-width: 30px;
            }
            
            /* Premium Button Special Effects */
            .premium-btn {
                background: linear-gradient(135deg, 
                    rgba(168, 85, 247, 0.2) 0%, 
                    rgba(236, 72, 153, 0.2) 100%);
                border-color: rgba(168, 85, 247, 0.3);
            }
            
            .premium-btn .shine {
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, 
                    transparent 0%, 
                    rgba(255, 255, 255, 0.3) 50%, 
                    transparent 100%);
                animation: shine 3s infinite;
            }
            
            @keyframes shine {
                0% { left: -100%; }
                20%, 100% { left: 200%; }
            }
            
            /* Progress Ring for Battle Pass */
            .progress-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
            }
            
            /* Expandable Panel */
            .expandable-panel {
                margin-top: 12px;
                max-height: 0;
                overflow: hidden;
                transition: max-height ${this.config.animation.duration} ${this.config.animation.easing};
            }
            
            .expandable-panel.active {
                max-height: 400px;
            }
            
            .panel-content {
                background: linear-gradient(135deg, 
                    rgba(139, 92, 246, 0.1) 0%, 
                    rgba(16, 185, 129, 0.1) 100%);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: ${this.config.layout.borderRadius}px;
                padding: 20px;
                color: ${this.config.colors.text};
            }
            
            /* Mobile Responsive */
            @media (max-width: 768px) {
                .modern-floating-bar {
                    width: calc(100% - 20px);
                }
                
                .floating-bar-container {
                    padding: 6px 8px;
                }
                
                .icon-btn {
                    width: 36px;
                    height: 36px;
                }
                
                .icon-btn .icon {
                    font-size: 18px;
                }
                
                .resource-display {
                    padding: 4px 8px;
                }
                
                .resource-icon {
                    font-size: 14px;
                }
                
                .resource-value {
                    font-size: 12px;
                }
                
                /* Stack sections vertically on very small screens */
                @media (max-width: 480px) {
                    .floating-bar-container {
                        flex-direction: column;
                        gap: 8px;
                        padding: 8px;
                    }
                    
                    .bar-section {
                        width: 100%;
                        justify-content: center;
                    }
                }
            }
            
            /* Tooltip */
            .icon-btn[data-tooltip]:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: -32px;
                left: 50%;
                transform: translateX(-50%);
                padding: 4px 8px;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 6px;
                font-size: 11px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                animation: fadeIn 0.3s 0.5s forwards;
            }
            
            @keyframes fadeIn {
                to { opacity: 1; }
            }
            
            /* Hide old UI elements */
            #profileButton, #premiumButton, #battlePassButton, 
            #achievementButton, #clanButton, #seasonButton,
            #currencyDisplay, #achievementBtn {
                display: none !important;
            }
        `;
        
        // Remove old styles if they exist
        const oldStyle = document.getElementById('modern-ui-styles');
        if (oldStyle) oldStyle.remove();
        
        document.head.appendChild(style);
    }
    
    setupInteractions() {
        // Add click handlers to all icon buttons
        const buttons = this.floatingBar.querySelectorAll('.icon-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                this.handleButtonClick(action);
            });
        });
        
        // Update resources periodically
        setInterval(() => this.updateResourceDisplay(), 1000);
    }
    
    handleButtonClick(action) {
        console.log(`🎯 Action triggered: ${action}`);
        
        // Play click sound if available
        if (window.audioManager) {
            window.audioManager.playSound('click');
        }
        
        switch(action) {
            case 'profile':
                this.showProfilePanel();
                break;
            case 'achievements':
                this.showAchievementsPanel();
                break;
            case 'battlepass':
                this.showBattlePassPanel();
                break;
            case 'premium':
                this.showPremiumPanel();
                break;
            case 'menu':
                this.showMenuPanel();
                break;
        }
    }
    
    showProfilePanel() {
        const profile = window.userProfileManager?.getUserProfile() || {};
        this.showPanel(`
            <h3 style="margin: 0 0 16px 0; font-size: 18px;">
                <span style="font-size: 24px; margin-right: 8px;">👤</span>
                Player Profile
            </h3>
            <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: rgba(255,255,255,0.7);">Username</span>
                    <span style="font-weight: 600;">${profile.username || 'Player'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: rgba(255,255,255,0.7);">Level</span>
                    <span style="font-weight: 600;">${profile.level || 1}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: rgba(255,255,255,0.7);">Total XP</span>
                    <span style="font-weight: 600;">${profile.experience || 0}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: rgba(255,255,255,0.7);">Games Played</span>
                    <span style="font-weight: 600;">${profile.gamesPlayed || 0}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: rgba(255,255,255,0.7);">High Score</span>
                    <span style="font-weight: 600;">${profile.highScore || 0}</span>
                </div>
            </div>
        `);
    }
    
    showAchievementsPanel() {
        this.showPanel(`
            <h3 style="margin: 0 0 16px 0; font-size: 18px;">
                <span style="font-size: 24px; margin-right: 8px;">🏆</span>
                Achievements
            </h3>
            <div style="display: grid; gap: 8px;">
                <div style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px;">🐍</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 500;">First Steps</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Play your first game</div>
                        </div>
                        <span style="color: #10B981;">✓</span>
                    </div>
                </div>
                <div style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; opacity: 0.5;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px;">💯</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 500;">Century</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Score 100 points</div>
                        </div>
                        <span style="color: rgba(255,255,255,0.3);">0/100</span>
                    </div>
                </div>
            </div>
        `);
    }
    
    showBattlePassPanel() {
        const battlePass = window.battlePassManager?.getBattlePassData() || {};
        this.showPanel(`
            <h3 style="margin: 0 0 16px 0; font-size: 18px;">
                <span style="font-size: 24px; margin-right: 8px;">⚔️</span>
                Battle Pass - Season 1
            </h3>
            <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 14px;">Tier ${battlePass.currentTier || 0} / 50</span>
                    <span style="font-size: 14px;">${battlePass.currentXP || 0} XP</span>
                </div>
                <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; background: linear-gradient(90deg, #8B5CF6, #EC4899); 
                                width: ${(battlePass.currentTier || 0) * 2}%; transition: width 0.3s;"></div>
                </div>
            </div>
            <button style="width: 100%; padding: 12px; background: linear-gradient(135deg, #8B5CF6, #EC4899);
                           border: none; border-radius: 8px; color: white; font-weight: 600;
                           cursor: pointer; transition: transform 0.2s;">
                Unlock Premium Pass
            </button>
        `);
    }
    
    showPremiumPanel() {
        this.showPanel(`
            <h3 style="margin: 0 0 16px 0; font-size: 18px;">
                <span style="font-size: 24px; margin-right: 8px;">✨</span>
                Premium Benefits
            </h3>
            <div style="display: grid; gap: 12px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #10B981;">✓</span>
                    <span>2x XP on all games</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #10B981;">✓</span>
                    <span>Exclusive snake skins</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #10B981;">✓</span>
                    <span>Daily premium rewards</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #10B981;">✓</span>
                    <span>Ad-free experience</span>
                </div>
            </div>
            <button style="width: 100%; padding: 12px; background: linear-gradient(135deg, #F59E0B, #EF4444);
                           border: none; border-radius: 8px; color: white; font-weight: 600;
                           cursor: pointer;">
                Get Premium - $4.99/month
            </button>
        `);
    }
    
    showMenuPanel() {
        this.showPanel(`
            <h3 style="margin: 0 0 16px 0; font-size: 18px;">
                <span style="font-size: 24px; margin-right: 8px;">☰</span>
                Menu
            </h3>
            <div style="display: grid; gap: 8px;">
                <button class="menu-option" style="padding: 12px; background: rgba(255,255,255,0.05); 
                        border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; 
                        color: white; text-align: left; cursor: pointer;">
                    <span style="margin-right: 8px;">⚙️</span> Settings
                </button>
                <button class="menu-option" style="padding: 12px; background: rgba(255,255,255,0.05); 
                        border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; 
                        color: white; text-align: left; cursor: pointer;">
                    <span style="margin-right: 8px;">📊</span> Statistics
                </button>
                <button class="menu-option" style="padding: 12px; background: rgba(255,255,255,0.05); 
                        border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; 
                        color: white; text-align: left; cursor: pointer;">
                    <span style="margin-right: 8px;">🏆</span> Leaderboard
                </button>
                <button class="menu-option" style="padding: 12px; background: rgba(255,255,255,0.05); 
                        border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; 
                        color: white; text-align: left; cursor: pointer;">
                    <span style="margin-right: 8px;">❓</span> Help
                </button>
            </div>
        `);
    }
    
    showPanel(content) {
        const panel = document.getElementById('expandablePanel');
        const panelContent = document.getElementById('panelContent');
        
        if (this.activePanel === content) {
            // Close if clicking same button
            panel.classList.remove('active');
            this.activePanel = null;
        } else {
            // Show new content
            panelContent.innerHTML = content;
            panel.classList.add('active');
            this.activePanel = content;
        }
        
        // Add close functionality when clicking outside
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!panel.contains(e.target) && !e.target.closest('.icon-btn')) {
                    panel.classList.remove('active');
                    this.activePanel = null;
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 100);
    }
    
    updateResourceDisplay() {
        // Update coins
        const coinValue = document.getElementById('coinValue');
        if (coinValue && window.userProfileManager) {
            const profile = window.userProfileManager.getUserProfile();
            coinValue.textContent = profile.coins || 0;
        }
        
        // Update gems
        const gemValue = document.getElementById('gemValue');
        if (gemValue && window.userProfileManager) {
            const profile = window.userProfileManager.getUserProfile();
            gemValue.textContent = profile.gems || 0;
        }
        
        // Update level badge
        const levelBadge = document.getElementById('levelBadge');
        if (levelBadge && window.userProfileManager) {
            const profile = window.userProfileManager.getUserProfile();
            levelBadge.textContent = profile.level || 1;
        }
        
        // Update battle pass progress
        if (window.battlePassManager) {
            const battlePass = window.battlePassManager.getBattlePassData();
            const progressCircle = this.floatingBar.querySelector('.progress-ring circle:last-child');
            if (progressCircle && battlePass) {
                const progress = (battlePass.currentTier || 0) / 50;
                const circumference = 2 * Math.PI * 10;
                const offset = circumference - (progress * circumference);
                progressCircle.style.strokeDashoffset = offset;
            }
        }
    }
}

// Initialize the modern UI system
const modernUI = new ModernUISystem();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => modernUI.init(), 1000);
    });
} else {
    setTimeout(() => modernUI.init(), 1000);
}

// Export for global access
window.ModernUISystem = ModernUISystem;
window.modernUI = modernUI;