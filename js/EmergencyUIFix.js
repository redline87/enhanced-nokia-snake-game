// Emergency UI Fix - Remove problematic overlay elements
(function() {
    'use strict';
    
    function emergencyCleanup() {
        console.log('🚨 Running emergency UI cleanup...');
        
        // Remove any full-screen overlays that shouldn't be there
        const suspiciousElements = document.querySelectorAll('*');
        
        suspiciousElements.forEach(element => {
            const style = window.getComputedStyle(element);
            
            // Remove elements that are:
            // 1. Full width/height 
            // 2. Have colored backgrounds
            // 3. Are positioned fixed/absolute at top: 0
            if (
                (style.width === '100vw' || style.width.includes('100%')) &&
                (style.height === '100vh' || style.height.includes('100%')) &&
                (style.position === 'fixed' || style.position === 'absolute') &&
                style.top === '0px' &&
                !element.id.includes('Modal') && // Don't remove actual modals
                !element.id.includes('gameCanvas') && // Don't remove game canvas
                !element.classList.contains('nokia-container') && // Don't remove game container
                element.tagName !== 'BODY' &&
                element.tagName !== 'HTML'
            ) {
                console.log('🗑️ Removing suspicious overlay element:', element);
                element.remove();
            }
            
            // Also check for elements with gradients that might be bars
            if (
                style.background.includes('linear-gradient') &&
                (style.width.includes('100%') || parseInt(style.width) > 800) &&
                (parseInt(style.height) > 50 && parseInt(style.height) < 200) &&
                !element.id.includes('Button') &&
                !element.classList.contains('modal-content')
            ) {
                console.log('🗑️ Removing suspicious bar element:', element);
                element.remove();
            }
        });
        
        // Specifically hide any visible modal backdrops that shouldn't be showing
        const modals = document.querySelectorAll('#profileModal, #battlePassModal, #clanModal, #premiumModal, #achievementModal, #seasonModal');
        modals.forEach(modal => {
            if (modal && modal.style.display !== 'none') {
                console.log('🗑️ Hiding visible modal:', modal.id);
                modal.style.display = 'none';
            }
        });
        
        // Remove any rogue elements with the problematic gradients
        const purpleElements = document.querySelectorAll('*');
        purpleElements.forEach(element => {
            const style = window.getComputedStyle(element);
            if (
                style.background.includes('#667eea') ||
                style.background.includes('#764ba2')
            ) {
                const rect = element.getBoundingClientRect();
                // If it's a big element (not just a small button/avatar)
                if (rect.width > 300 || rect.height > 100) {
                    console.log('🗑️ Removing large purple element:', element);
                    element.remove();
                }
            }
        });
        
        // Force hide any elements that might be creating the red bar
        const redElements = document.querySelectorAll('*');
        redElements.forEach(element => {
            const style = window.getComputedStyle(element);
            if (
                (style.backgroundColor.includes('rgb(255') || 
                 style.background.includes('red') ||
                 style.background.includes('#e53e3e') ||
                 style.background.includes('#ed8936')) &&
                !element.id.includes('Button')
            ) {
                const rect = element.getBoundingClientRect();
                if (rect.width > 300 || rect.height > 50) {
                    console.log('🗑️ Removing large red/orange element:', element);
                    element.remove();
                }
            }
        });
        
        console.log('✅ Emergency cleanup completed');
    }
    
    // Run cleanup immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(emergencyCleanup, 500);
        });
    } else {
        setTimeout(emergencyCleanup, 500);
    }
    
    // Also run cleanup every few seconds as a safety net
    setInterval(emergencyCleanup, 5000);
    
})();