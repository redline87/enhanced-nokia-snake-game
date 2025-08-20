// Social sharing and viral features for Snake Game
class SocialManager {
    constructor(analytics, achievementManager) {
        this.analytics = analytics;
        this.achievementManager = achievementManager;
        
        this.initializeSharing();
    }
    
    initializeSharing() {
        this.createShareButton();
        this.createShareModal();
    }
    
    createShareButton() {
        // Add share button to game over overlay
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            const shareBtn = document.createElement('button');
            shareBtn.id = 'shareButton';
            shareBtn.innerHTML = '📱 Share Score';
            shareBtn.style.cssText = `
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                margin: 10px;
                transition: all 0.3s ease;
                display: none;
            `;
            
            shareBtn.addEventListener('click', () => this.showShareModal());
            
            // Position it in the overlay
            const overlayContent = overlay.querySelector('.overlay-content');
            if (overlayContent) {
                overlayContent.appendChild(shareBtn);
            }
        }
    }
    
    createShareModal() {
        const modal = document.createElement('div');
        modal.id = 'shareModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1002;
            display: none;
            align-items: center;
            justify-content: center;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 400px;
            position: relative;
            text-align: center;
        `;
        
        content.innerHTML = `
            <button id="closeShareModal" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            ">×</button>
            <div id="shareContent">
                <h2>Share Your Score! 🎉</h2>
                <div id="scoreCard"></div>
                <div id="shareOptions"></div>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Event listeners
        content.querySelector('#closeShareModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    showShareModal(score = 0, isNewRecord = false) {
        const modal = document.getElementById('shareModal');
        const scoreCard = document.getElementById('scoreCard');
        const shareOptions = document.getElementById('shareOptions');
        
        // Generate shareable score card
        scoreCard.innerHTML = this.generateScoreCard(score, isNewRecord);
        
        // Generate share options
        shareOptions.innerHTML = this.generateShareOptions(score, isNewRecord);
        
        modal.style.display = 'flex';
    }
    
    generateScoreCard(score, isNewRecord) {
        const emoji = isNewRecord ? '🏆' : '🐍';
        const title = isNewRecord ? 'NEW RECORD!' : 'GREAT SCORE!';
        const message = isNewRecord ? 'I just set a new personal best!' : 'Check out my Snake game score!';
        
        return `
            <div style="
                background: linear-gradient(135deg, #4a5568, #2d3748);
                color: white;
                padding: 30px;
                border-radius: 15px;
                margin: 20px 0;
                position: relative;
                overflow: hidden;
            ">
                <div style="
                    position: absolute;
                    top: -20px;
                    right: -20px;
                    font-size: 100px;
                    opacity: 0.1;
                ">🐍</div>
                
                <div style="position: relative; z-index: 1;">
                    <div style="font-size: 40px; margin-bottom: 10px;">${emoji}</div>
                    <h3 style="margin: 0; font-size: 18px;">${title}</h3>
                    <div style="font-size: 32px; font-weight: bold; margin: 15px 0;">
                        ${score} POINTS
                    </div>
                    <p style="margin: 10px 0; opacity: 0.9; font-size: 14px;">
                        ${message}
                    </p>
                    <div style="font-size: 12px; opacity: 0.7; margin-top: 15px;">
                        Classic Nokia Snake • Play at snake-game.com
                    </div>
                </div>
            </div>
        `;
    }
    
    generateShareOptions(score, isNewRecord) {
        const shareText = this.generateShareText(score, isNewRecord);
        const gameUrl = window.location.href;
        
        const options = [
            {
                platform: 'twitter',
                name: 'Twitter',
                icon: '🐦',
                url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameUrl)}`,
                color: '#1da1f2'
            },
            {
                platform: 'facebook',
                name: 'Facebook',
                icon: '📘',
                url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(shareText)}`,
                color: '#4267b2'
            },
            {
                platform: 'whatsapp',
                name: 'WhatsApp',
                icon: '💬',
                url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + gameUrl)}`,
                color: '#25d366'
            },
            {
                platform: 'telegram',
                name: 'Telegram',
                icon: '✈️',
                url: `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(shareText)}`,
                color: '#0088cc'
            },
            {
                platform: 'linkedin',
                name: 'LinkedIn',
                icon: '💼',
                url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(gameUrl)}`,
                color: '#0077b5'
            },
            {
                platform: 'copy',
                name: 'Copy Link',
                icon: '📋',
                action: 'copy',
                color: '#6b7280'
            }
        ];
        
        return `
            <div style="margin: 20px 0;">
                <h4>Share on:</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0;">
                    ${options.map(option => `
                        <button 
                            class="share-option" 
                            data-platform="${option.platform}"
                            data-url="${option.url || ''}"
                            style="
                                background: ${option.color};
                                color: white;
                                border: none;
                                padding: 15px;
                                border-radius: 10px;
                                cursor: pointer;
                                font-size: 14px;
                                font-weight: bold;
                                transition: transform 0.2s ease;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            "
                        >
                            <span>${option.icon}</span>
                            ${option.name}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <div style="margin: 20px 0;">
                <h4>Challenge Friends:</h4>
                <input 
                    type="text" 
                    id="challengeText" 
                    value="${this.generateChallengeText(score)}"
                    readonly
                    style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e2e8f0;
                        border-radius: 8px;
                        font-size: 14px;
                        background: #f7fafc;
                    "
                >
                <button id="copyChallengeText" style="
                    background: #48bb78;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    margin-top: 10px;
                    cursor: pointer;
                ">Copy Challenge Text</button>
            </div>
        `;
    }
    
    generateShareText(score, isNewRecord) {
        const texts = isNewRecord ? [
            `🏆 NEW RECORD! I just scored ${score} points on Snake Game! Can you beat it?`,
            `🐍 Just crushed my personal best with ${score} points on Snake! Your turn!`,
            `⚡ ${score} points and counting! Just set a new record on Snake Game!`,
            `🎯 BOOM! ${score} points! I'm the Snake master now! Try to beat this!`
        ] : [
            `🐍 Just scored ${score} points on Snake Game! Can you do better?`,
            `🕹️ ${score} points on the classic Snake game! Beat that!`,
            `🎮 Having fun with Snake! Just got ${score} points. Your turn!`,
            `⚡ ${score} points and still hungry for more! Come play Snake!`
        ];
        
        return texts[Math.floor(Math.random() * texts.length)];
    }
    
    generateChallengeText(score) {
        return `Hey! I just scored ${score} points on Snake Game! 🐍 Think you can beat me? Let's see what you got! 🎮 ${window.location.href}`;
    }
    
    handleShare(platform, score, isNewRecord) {
        const shareButton = document.querySelector(`[data-platform="${platform}"]`);
        const url = shareButton?.dataset.url;
        
        switch (platform) {
            case 'copy':
                this.copyToClipboard(window.location.href);
                this.showCopyFeedback('Link copied to clipboard!');
                break;
                
            default:
                if (url) {
                    window.open(url, '_blank', 'width=600,height=400');
                }
        }
        
        // Track the share
        this.trackShare(platform, score, isNewRecord);
        
        // Update achievement progress
        this.achievementManager?.updateStats({ socialShares: 1, shared: true });
        
        // Close modal after sharing
        setTimeout(() => {
            document.getElementById('shareModal').style.display = 'none';
        }, 500);
    }
    
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(err => {
                console.error('Failed to copy: ', err);
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    }
    
    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed: ', err);
        }
        
        document.body.removeChild(textArea);
    }
    
    showCopyFeedback(message) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #48bb78;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 1003;
            font-size: 14px;
            font-weight: bold;
        `;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2000);
    }
    
    trackShare(platform, score, isNewRecord) {
        // Track in analytics
        this.analytics?.trackSocialShare(platform, score);
        
        // Track locally
        const shareHistory = JSON.parse(localStorage.getItem('shareHistory') || '[]');
        shareHistory.push({
            platform: platform,
            score: score,
            isNewRecord: isNewRecord,
            timestamp: Date.now()
        });
        
        // Keep only last 50 shares
        if (shareHistory.length > 50) {
            shareHistory.splice(0, shareHistory.length - 50);
        }
        
        localStorage.setItem('shareHistory', JSON.stringify(shareHistory));
        
        console.log(`📱 Shared ${score} points on ${platform}`);
    }
    
    // Initialize event listeners after DOM is ready
    initializeEventListeners() {
        // Share option buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('share-option')) {
                const platform = e.target.dataset.platform;
                const score = parseInt(document.getElementById('shareModal')?.dataset.score || '0');
                const isNewRecord = document.getElementById('shareModal')?.dataset.isNewRecord === 'true';
                
                this.handleShare(platform, score, isNewRecord);
            }
        });
        
        // Copy challenge text button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'copyChallengeText') {
                const challengeText = document.getElementById('challengeText').value;
                this.copyToClipboard(challengeText);
                this.showCopyFeedback('Challenge text copied!');
            }
        });
    }
    
    // Public API methods
    showShareButton(show = true) {
        const shareBtn = document.getElementById('shareButton');
        if (shareBtn) {
            shareBtn.style.display = show ? 'inline-block' : 'none';
        }
    }
    
    shareScore(score, isNewRecord = false) {
        // Store score data in modal for event handlers
        const modal = document.getElementById('shareModal');
        if (modal) {
            modal.dataset.score = score.toString();
            modal.dataset.isNewRecord = isNewRecord.toString();
        }
        
        this.showShareModal(score, isNewRecord);
    }
    
    getShareHistory() {
        return JSON.parse(localStorage.getItem('shareHistory') || '[]');
    }
    
    generateShareableImage(score, isNewRecord) {
        // This would generate a canvas-based image for sharing
        // For now, we'll return a placeholder
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 400;
            canvas.height = 300;
            
            // Background
            ctx.fillStyle = isNewRecord ? '#38a169' : '#4a5568';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Title
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            const title = isNewRecord ? 'NEW RECORD!' : 'GREAT SCORE!';
            ctx.fillText(title, canvas.width / 2, 80);
            
            // Score
            ctx.font = 'bold 48px Arial';
            ctx.fillText(`${score} POINTS`, canvas.width / 2, 150);
            
            // Snake emoji (simplified as text)
            ctx.font = '60px Arial';
            ctx.fillText('🐍', canvas.width / 2, 220);
            
            // Game name
            ctx.font = '16px Arial';
            ctx.fillText('Classic Nokia Snake', canvas.width / 2, 270);
            
            canvas.toBlob(resolve, 'image/png');
        });
    }
}

// Initialize after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // This will be initialized by the main game class
    if (window.socialManager) {
        window.socialManager.initializeEventListeners();
    }
});