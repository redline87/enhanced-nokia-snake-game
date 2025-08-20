// UI Fix Manager - Comprehensive Visual Issue Resolution
class UIFixManager {
    constructor() {
        this.zIndexLayers = {
            // Base game elements
            gameBackground: 0,
            gameCanvas: 1,
            gameUI: 100,
            
            // Fixed UI elements (top layer)
            profileButton: 1000,
            currencyDisplay: 1000,
            premiumButton: 1000,
            battlePassButton: 1000,
            clanButton: 1000,
            seasonButton: 1000,
            
            // Floating notifications
            notifications: 1100,
            toasts: 1100,
            xpNotifications: 1100,
            
            // Modals (layered from bottom to top)
            modalBackdrop: 2000,
            achievementModal: 2001,
            profileModal: 2002,
            seasonModal: 2003,
            battlePassModal: 2004,
            clanModal: 2005,
            premiumModal: 2006,
            
            // Critical overlays
            errorDialogs: 9000,
            loadingScreens: 9100,
            systemAlerts: 9999
        };
        
        this.applyUIFixes();
    }
    
    applyUIFixes() {
        console.log('🎨 Applying comprehensive UI fixes...');
        
        // Apply z-index fixes
        this.fixZIndexConflicts();
        
        // Fix positioning issues
        this.fixPositioningIssues();
        
        // Add responsive CSS
        this.addResponsiveStyles();
        
        // Fix modal stacking
        this.fixModalStacking();
        
        // Fix color consistency
        this.standardizeColorScheme();
        
        console.log('✅ UI fixes applied successfully');
    }
    
    fixZIndexConflicts() {
        // Apply consistent z-index hierarchy
        const elements = [
            // Fixed UI elements
            { selector: '#profileButton', zIndex: this.zIndexLayers.profileButton },
            { selector: '#currencyDisplay', zIndex: this.zIndexLayers.currencyDisplay },
            { selector: '#premiumButton', zIndex: this.zIndexLayers.premiumButton },
            { selector: '#battlePassButton', zIndex: this.zIndexLayers.battlePassButton },
            { selector: '#clanButton', zIndex: this.zIndexLayers.clanButton },
            { selector: '#seasonButton', zIndex: this.zIndexLayers.seasonButton },
            
            // Modals
            { selector: '.modal-backdrop, [id*="Modal"]', zIndex: this.zIndexLayers.modalBackdrop },
            { selector: '#profileModal', zIndex: this.zIndexLayers.profileModal },
            { selector: '#battlePassModal', zIndex: this.zIndexLayers.battlePassModal },
            { selector: '#clanModal', zIndex: this.zIndexLayers.clanModal },
            { selector: '#premiumModal', zIndex: this.zIndexLayers.premiumModal },
            { selector: '#achievementModal', zIndex: this.zIndexLayers.achievementModal },
            { selector: '#seasonModal', zIndex: this.zIndexLayers.seasonModal }
        ];
        
        elements.forEach(({ selector, zIndex }) => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.zIndex = zIndex;
            }
        });
    }
    
    fixPositioningIssues() {
        // Fix overlapping fixed elements by adjusting their positions
        this.repositionUIElements();
        
        // Add spacing between fixed elements
        this.addElementSpacing();
    }
    
    repositionUIElements() {
        // Create a layout grid for fixed UI elements to prevent overlaps
        const layout = {
            topRight: [
                { id: 'profileButton', offset: 0 },
                { id: 'battlePassButton', offset: 80 },
                { id: 'clanButton', offset: 140 }
            ],
            topLeft: [
                { id: 'premiumButton', offset: 0 },
                { id: 'seasonButton', offset: 80 }
            ],
            rightSide: [
                { id: 'currencyDisplay', offset: 80 }
            ]
        };
        
        // Apply top-right layout
        layout.topRight.forEach(({ id, offset }) => {
            const element = document.getElementById(id);
            if (element) {
                element.style.top = `${20 + offset}px`;
                element.style.right = '20px';
            }
        });
        
        // Apply top-left layout
        layout.topLeft.forEach(({ id, offset }) => {
            const element = document.getElementById(id);
            if (element) {
                element.style.top = `${20 + offset}px`;
                element.style.left = '20px';
            }
        });
        
        // Apply right-side layout
        layout.rightSide.forEach(({ id, offset }) => {
            const element = document.getElementById(id);
            if (element) {
                element.style.top = `${20 + offset}px`;
                element.style.right = '20px';
            }
        });
    }
    
    addElementSpacing() {
        // Add consistent spacing and prevent overlaps
        const style = document.createElement('style');
        style.textContent = `
            /* Prevent UI element overlaps */
            .fixed-ui-element {
                margin: 5px;
                box-sizing: border-box;
            }
            
            /* Ensure buttons don't overlap */
            button[id*="Button"] {
                min-height: 44px; /* Touch-friendly size */
                min-width: 44px;
                margin: 2px;
            }
            
            /* Fix notification positioning */
            .notification, .toast, .xp-notification {
                pointer-events: none;
                animation-fill-mode: forwards;
            }
        `;
        document.head.appendChild(style);
    }
    
    fixModalStacking() {
        // Ensure modals appear in correct order and don't conflict
        const modalStyle = document.createElement('style');
        modalStyle.id = 'modalStackingFix';
        modalStyle.textContent = `
            /* Modal backdrop standardization */
            .modal-overlay, [id*="Modal"] {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.8) !important;
                display: none;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(2px);
            }
            
            /* Modal content standardization */
            .modal-content {
                background: white !important;
                border-radius: 15px !important;
                padding: 30px !important;
                max-width: 90vw !important;
                max-height: 90vh !important;
                overflow-y: auto !important;
                position: relative !important;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4) !important;
            }
            
            /* Close button standardization */
            .modal-close, .close-btn, [id*="close"], [id*="Close"] {
                position: absolute !important;
                top: 15px !important;
                right: 15px !important;
                background: none !important;
                border: none !important;
                font-size: 24px !important;
                cursor: pointer !important;
                color: #666 !important;
                z-index: 1 !important;
            }
            
            .modal-close:hover, .close-btn:hover {
                color: #333 !important;
            }
        `;
        document.head.appendChild(modalStyle);
    }
    
    standardizeColorScheme() {
        // Create consistent color scheme across all components
        const colorStyle = document.createElement('style');
        colorStyle.id = 'colorSchemeStandardization';
        colorStyle.textContent = `
            :root {
                /* Primary brand colors */
                --primary-gradient: linear-gradient(135deg, #667eea, #764ba2);
                --secondary-gradient: linear-gradient(135deg, #48bb78, #38a169);
                --warning-gradient: linear-gradient(135deg, #ed8936, #dd6b20);
                --error-gradient: linear-gradient(135deg, #e53e3e, #c53030);
                
                /* UI colors */
                --bg-primary: #ffffff;
                --bg-secondary: #f7fafc;
                --bg-dark: rgba(0, 0, 0, 0.8);
                --text-primary: #2d3748;
                --text-secondary: #718096;
                --border-color: #e2e8f0;
                
                /* Component specific */
                --premium-color: linear-gradient(135deg, #f6d55c, #ed8936);
                --success-color: #48bb78;
                --clan-color: linear-gradient(135deg, #667eea, #764ba2);
            }
            
            /* Standardize button styles */
            .btn-primary {
                background: var(--primary-gradient) !important;
                color: white !important;
                border: none !important;
                padding: 12px 24px !important;
                border-radius: 25px !important;
                font-weight: bold !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
            }
            
            .btn-secondary {
                background: #718096 !important;
                color: white !important;
                border: none !important;
                padding: 12px 24px !important;
                border-radius: 25px !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
            }
            
            .btn-premium {
                background: var(--premium-color) !important;
                color: white !important;
                border: none !important;
                padding: 12px 24px !important;
                border-radius: 25px !important;
                font-weight: bold !important;
                cursor: pointer !important;
                box-shadow: 0 4px 15px rgba(246, 213, 92, 0.3) !important;
            }
            
            /* Fix purple overlay issue on premium button */
            #premiumButton {
                background: var(--premium-color) !important;
                position: fixed !important;
                top: 20px !important;
                left: 20px !important;
                z-index: ${this.zIndexLayers.premiumButton} !important;
                border: none !important;
                box-shadow: 0 4px 15px rgba(246, 213, 92, 0.3) !important;
            }
            
            /* Prevent background bleeding */
            #premiumButton::before,
            #premiumButton::after {
                display: none !important;
            }
        `;
        document.head.appendChild(colorStyle);
    }
    
    addResponsiveStyles() {
        // Add responsive design for mobile devices
        const responsiveStyle = document.createElement('style');
        responsiveStyle.id = 'responsiveUIFix';
        responsiveStyle.textContent = `
            /* Mobile responsive fixes */
            @media (max-width: 768px) {
                /* Adjust fixed UI elements for mobile */
                #profileButton,
                #premiumButton,
                #battlePassButton,
                #clanButton,
                #seasonButton {
                    padding: 8px 12px !important;
                    font-size: 12px !important;
                }
                
                #currencyDisplay {
                    padding: 8px 12px !important;
                    font-size: 12px !important;
                    min-width: 100px !important;
                }
                
                /* Stack UI elements vertically on small screens */
                .nokia-container {
                    padding: 10px !important;
                }
                
                /* Modal adjustments */
                .modal-content {
                    margin: 20px !important;
                    padding: 20px !important;
                    max-width: calc(100vw - 40px) !important;
                    max-height: calc(100vh - 40px) !important;
                }
                
                /* Notification positioning */
                .notification {
                    left: 10px !important;
                    right: 10px !important;
                    transform: translateX(0) !important;
                    max-width: calc(100vw - 20px) !important;
                }
            }
            
            /* Large screen optimizations */
            @media (min-width: 1200px) {
                /* Better spacing on large screens */
                .nokia-container {
                    padding: 40px !important;
                }
                
                /* Larger modal content */
                .modal-content {
                    max-width: 800px !important;
                }
            }
        `;
        document.head.appendChild(responsiveStyle);
    }
    
    // Public API for fixing specific issues
    fixPremiumButtonOverlay() {
        const premiumBtn = document.getElementById('premiumButton');
        if (premiumBtn) {
            premiumBtn.style.background = 'linear-gradient(135deg, #f6d55c, #ed8936)';
            premiumBtn.style.zIndex = this.zIndexLayers.premiumButton;
            premiumBtn.style.boxShadow = '0 4px 15px rgba(246, 213, 92, 0.3)';
            premiumBtn.style.position = 'fixed';
            premiumBtn.style.border = 'none';
            
            // Remove any pseudo-elements that might be causing overlay
            const style = document.createElement('style');
            style.textContent = `
                #premiumButton::before,
                #premiumButton::after {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    fixModalOverlaps() {
        // Close all modals except the highest priority one
        const modals = document.querySelectorAll('[id*="Modal"]');
        let highestZIndex = 0;
        let topModal = null;
        
        modals.forEach(modal => {
            if (modal.style.display !== 'none') {
                const zIndex = parseInt(modal.style.zIndex) || 0;
                if (zIndex > highestZIndex) {
                    highestZIndex = zIndex;
                    topModal = modal;
                }
            }
        });
        
        // Hide all modals except the top one
        modals.forEach(modal => {
            if (modal !== topModal && modal.style.display !== 'none') {
                modal.style.display = 'none';
            }
        });
    }
    
    // Utility method to check for UI issues
    diagnoseUIIssues() {
        const issues = [];
        
        // Check for z-index conflicts
        const elements = document.querySelectorAll('[style*="z-index"], [style*="position: fixed"]');
        const zIndices = {};
        
        elements.forEach(el => {
            const zIndex = el.style.zIndex;
            if (zIndex) {
                if (zIndices[zIndex]) {
                    issues.push(`Z-index conflict: ${zIndex} used by multiple elements`);
                }
                zIndices[zIndex] = true;
            }
        });
        
        // Check for overlapping elements
        const fixedElements = document.querySelectorAll('[style*="position: fixed"]');
        if (fixedElements.length > 10) {
            issues.push(`Too many fixed elements: ${fixedElements.length} (may cause overlap)`);
        }
        
        return issues;
    }
}

// Auto-initialize UI fixes when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.uiFixManager = new UIFixManager();
        }, 1000); // Wait for other components to initialize
    });
} else {
    // DOM is already ready
    setTimeout(() => {
        window.uiFixManager = new UIFixManager();
    }, 1000);
}