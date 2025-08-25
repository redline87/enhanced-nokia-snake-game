// Centralized UI Layout Manager for consistent button positioning
// This manager ensures no overlapping UI elements and handles responsive layouts

class UILayoutManager {
    constructor() {
        this.buttons = new Map();
        this.initialized = false;
        this.isMobile = window.innerWidth <= 768;
        
        // Layout configuration
        this.config = {
            buttonHeight: 45,
            buttonSpacing: 10,
            mobileButtonHeight: 40,
            mobileButtonSpacing: 8,
            sideMargin: 20,
            topMargin: 20
        };
        
        // Track window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    init() {
        if (this.initialized) return;
        
        this.cleanupDuplicates();
        this.applyLayoutStyles();
        this.initialized = true;
        
        console.log('🎨 UI Layout Manager initialized');
    }
    
    // Register a button with the layout manager
    registerButton(id, position = 'top-right', priority = 0) {
        this.buttons.set(id, { position, priority });
        this.updateLayout();
    }
    
    // Remove duplicate buttons
    cleanupDuplicates() {
        // Find all profile buttons and keep only one
        const profileButtons = document.querySelectorAll('[id*="profile"]');
        if (profileButtons.length > 1) {
            for (let i = 1; i < profileButtons.length; i++) {
                profileButtons[i].remove();
                console.log('🗑️ Removed duplicate profile button');
            }
        }
        
        // Ensure each button type only exists once
        const buttonIds = ['profileButton', 'premiumButton', 'battlePassButton', 'achievementButton', 'clanButton'];
        buttonIds.forEach(id => {
            const buttons = document.querySelectorAll(`#${id}`);
            if (buttons.length > 1) {
                for (let i = 1; i < buttons.length; i++) {
                    buttons[i].remove();
                    console.log(`🗑️ Removed duplicate ${id}`);
                }
            }
        });
    }
    
    // Apply responsive layout styles
    applyLayoutStyles() {
        const style = document.createElement('style');
        style.id = 'ui-layout-manager-styles';
        
        // Remove old styles if exists
        const oldStyle = document.getElementById('ui-layout-manager-styles');
        if (oldStyle) oldStyle.remove();
        
        style.textContent = `
            /* Reset all button positions */
            #profileButton,
            #premiumButton,
            #battlePassButton,
            #achievementButton,
            #clanButton,
            #seasonButton,
            #currencyDisplay {
                position: fixed !important;
                z-index: 1001 !important;
                transition: all 0.3s ease !important;
            }
            
            /* Desktop Layout */
            @media (min-width: 769px) {
                /* Top Left Group */
                #profileButton {
                    top: ${this.config.topMargin}px !important;
                    left: ${this.config.sideMargin}px !important;
                    right: auto !important;
                }
                
                #achievementButton {
                    top: ${this.config.topMargin + this.config.buttonHeight + this.config.buttonSpacing}px !important;
                    left: ${this.config.sideMargin}px !important;
                    right: auto !important;
                }
                
                /* Top Right Group */
                #premiumButton {
                    top: ${this.config.topMargin}px !important;
                    right: ${this.config.sideMargin}px !important;
                    left: auto !important;
                }
                
                #battlePassButton {
                    top: ${this.config.topMargin + this.config.buttonHeight + this.config.buttonSpacing}px !important;
                    right: ${this.config.sideMargin}px !important;
                    left: auto !important;
                    max-width: 200px !important;
                }
                
                /* Center Top Group */
                #currencyDisplay {
                    top: ${this.config.topMargin}px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    right: auto !important;
                }
                
                #seasonButton {
                    top: ${this.config.topMargin + this.config.buttonHeight + this.config.buttonSpacing}px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    right: auto !important;
                }
            }
            
            /* Mobile Layout - Vertical Stack */
            @media (max-width: 768px) {
                /* Stack all buttons vertically on left side */
                #profileButton {
                    top: ${this.config.topMargin}px !important;
                    left: ${this.config.sideMargin}px !important;
                    right: auto !important;
                    max-width: calc(50% - ${this.config.sideMargin * 1.5}px) !important;
                    font-size: 11px !important;
                    padding: 6px 10px !important;
                    height: ${this.config.mobileButtonHeight}px !important;
                }
                
                #premiumButton {
                    top: ${this.config.topMargin}px !important;
                    right: ${this.config.sideMargin}px !important;
                    left: auto !important;
                    max-width: calc(50% - ${this.config.sideMargin * 1.5}px) !important;
                    font-size: 11px !important;
                    padding: 6px 10px !important;
                    height: ${this.config.mobileButtonHeight}px !important;
                }
                
                #achievementButton {
                    top: ${this.config.topMargin + (this.config.mobileButtonHeight + this.config.mobileButtonSpacing)}px !important;
                    left: ${this.config.sideMargin}px !important;
                    right: auto !important;
                    font-size: 11px !important;
                    padding: 6px 10px !important;
                    height: ${this.config.mobileButtonHeight}px !important;
                }
                
                #battlePassButton {
                    top: ${this.config.topMargin + (this.config.mobileButtonHeight + this.config.mobileButtonSpacing)}px !important;
                    right: ${this.config.sideMargin}px !important;
                    left: auto !important;
                    max-width: calc(50% - ${this.config.sideMargin * 1.5}px) !important;
                    font-size: 10px !important;
                    padding: 6px 8px !important;
                    height: ${this.config.mobileButtonHeight}px !important;
                }
                
                #currencyDisplay {
                    top: ${this.config.topMargin + 2 * (this.config.mobileButtonHeight + this.config.mobileButtonSpacing)}px !important;
                    left: ${this.config.sideMargin}px !important;
                    right: auto !important;
                    transform: none !important;
                    font-size: 11px !important;
                    padding: 4px 8px !important;
                }
                
                #seasonButton {
                    top: ${this.config.topMargin + 2 * (this.config.mobileButtonHeight + this.config.mobileButtonSpacing)}px !important;
                    right: ${this.config.sideMargin}px !important;
                    left: auto !important;
                    transform: none !important;
                    font-size: 11px !important;
                    padding: 4px 8px !important;
                }
                
                /* Hide clan button on mobile to save space */
                #clanButton {
                    display: none !important;
                }
                
                /* Adjust button text for mobile */
                #profileButton > div > div > div {
                    display: none !important; /* Hide username on mobile */
                }
                
                #battlePassButton > div > div:last-child {
                    display: none !important; /* Hide tier text on mobile */
                }
            }
            
            /* Ensure no overlapping with game area */
            .game-overlay {
                margin-top: ${this.isMobile ? 150 : 120}px !important;
            }
            
            /* Prevent buttons from blocking game controls */
            @media (max-width: 768px) {
                .nokia-phone {
                    margin-top: ${this.config.topMargin + 3 * (this.config.mobileButtonHeight + this.config.mobileButtonSpacing) + 20}px !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Update layout when buttons are added/removed
    updateLayout() {
        this.cleanupDuplicates();
        this.applyLayoutStyles();
    }
    
    // Handle window resize
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            this.applyLayoutStyles();
            console.log(`📱 Switched to ${this.isMobile ? 'mobile' : 'desktop'} layout`);
        }
    }
    
    // Fix specific overlapping issues
    fixOverlappingButtons() {
        const buttons = document.querySelectorAll('button[id$="Button"], #currencyDisplay, #seasonButton');
        const positions = new Map();
        
        buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            const key = `${Math.round(rect.left)}-${Math.round(rect.top)}`;
            
            if (positions.has(key)) {
                // Found overlapping button, adjust position
                const offset = this.isMobile ? this.config.mobileButtonHeight + this.config.mobileButtonSpacing 
                                             : this.config.buttonHeight + this.config.buttonSpacing;
                button.style.top = `${rect.top + offset}px`;
                console.log(`📐 Adjusted overlapping button: ${button.id}`);
            } else {
                positions.set(key, button);
            }
        });
    }
    
    // Public API to force refresh layout
    refreshLayout() {
        this.cleanupDuplicates();
        this.applyLayoutStyles();
        setTimeout(() => this.fixOverlappingButtons(), 100);
    }
}

// Create and initialize the layout manager
const uiLayoutManager = new UILayoutManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => uiLayoutManager.init(), 500);
    });
} else {
    setTimeout(() => uiLayoutManager.init(), 500);
}

// Export for use in other modules
window.UILayoutManager = UILayoutManager;
window.uiLayoutManager = uiLayoutManager;