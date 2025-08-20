// Monetization and premium features for Snake Game
class MonetizationManager {
    constructor(analytics) {
        this.analytics = analytics;
        this.premiumFeatures = this.loadPremiumFeatures();
        this.adConfig = this.loadAdConfig();
        this.gamesPlayed = 0;
        this.lastAdShown = 0;
        
        this.initializeMonetization();
    }
    
    loadPremiumFeatures() {
        return JSON.parse(localStorage.getItem('premiumFeatures') || '[]');
    }
    
    loadAdConfig() {
        return {
            interstitialFrequency: 3, // Show ad every 3 games
            rewardedVideoEnabled: true,
            bannerEnabled: true,
            adFreeTimeRemaining: this.getAdFreeTimeRemaining()
        };
    }
    
    getAdFreeTimeRemaining() {
        const adFreeUntil = localStorage.getItem('adFreeUntil');
        if (adFreeUntil) {
            const remaining = new Date(adFreeUntil) - new Date();
            return Math.max(0, remaining);
        }
        return 0;
    }
    
    initializeMonetization() {
        this.createPremiumUI();
        this.initializeAds();
        this.createMonetizationEvents();
    }
    
    createPremiumUI() {
        // Create premium button
        const premiumBtn = document.createElement('button');
        premiumBtn.id = 'premiumButton';
        premiumBtn.innerHTML = '✨ Premium';
        premiumBtn.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: linear-gradient(135deg, #ed8936, #dd6b20);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(237, 137, 54, 0.3);
            transition: all 0.3s ease;
        `;
        
        premiumBtn.addEventListener('click', () => this.showPremiumModal());
        document.body.appendChild(premiumBtn);
        
        // Create premium store modal
        this.createPremiumModal();
        
        // Create ad-free indicator
        this.createAdFreeIndicator();
    }
    
    createPremiumModal() {
        const modal = document.createElement('div');
        modal.id = 'premiumModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1003;
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
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        `;
        
        content.innerHTML = `
            <button id="closePremiumModal" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            ">×</button>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 50px; margin-bottom: 15px;">✨</div>
                <h2 style="margin: 0; color: #ed8936;">Snake Premium</h2>
                <p style="color: #666; margin: 10px 0;">Unlock the ultimate Snake experience!</p>
            </div>
            
            <div id="premiumOffers"></div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Event listeners
        content.querySelector('#closePremiumModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    createAdFreeIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'adFreeIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
            display: none;
        `;
        
        document.body.appendChild(indicator);
        this.updateAdFreeIndicator();
    }
    
    updateAdFreeIndicator() {
        const indicator = document.getElementById('adFreeIndicator');
        const timeRemaining = this.getAdFreeTimeRemaining();
        
        if (timeRemaining > 0) {
            const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            
            indicator.textContent = `🚫 Ad-Free: ${hours}h ${minutes}m remaining`;
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    }
    
    initializeAds() {
        // In a real implementation, you would integrate with ad networks like AdMob, Unity Ads, etc.
        // For demo purposes, we'll simulate ad behavior
        console.log('🎯 Ad system initialized (demo mode)');
        
        // Update ad-free status periodically
        setInterval(() => {
            this.updateAdFreeIndicator();
        }, 60000); // Check every minute
    }
    
    createMonetizationEvents() {
        // Listen for game events
        document.addEventListener('gameEnd', (e) => {
            this.onGameEnd(e.detail);
        });
        
        document.addEventListener('scoreSubmitted', (e) => {
            this.onScoreSubmitted(e.detail);
        });
    }
    
    onGameEnd(gameData) {
        this.gamesPlayed++;
        
        // Show interstitial ad based on frequency
        if (this.shouldShowInterstitial()) {
            this.showInterstitialAd();
        }
        
        // Offer rewarded video for bonus points on low scores
        if (gameData.score > 0 && gameData.score < 50) {
            setTimeout(() => {
                this.offerRewardedVideo('bonus_points');
            }, 2000);
        }
    }
    
    onScoreSubmitted(scoreData) {
        // Offer premium features after high scores
        if (scoreData.score > 100 && !this.hasPremiumFeature('ad_free')) {
            setTimeout(() => {
                this.showPremiumOffer('high_score_celebration');
            }, 3000);
        }
    }
    
    shouldShowInterstitial() {
        if (this.getAdFreeTimeRemaining() > 0) return false;
        if (this.gamesPlayed % this.adConfig.interstitialFrequency !== 0) return false;
        if (Date.now() - this.lastAdShown < 60000) return false; // Minimum 1 minute between ads
        
        return true;
    }
    
    showInterstitialAd() {
        this.lastAdShown = Date.now();
        
        // Create ad overlay (demo)
        const adOverlay = document.createElement('div');
        adOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 1004;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        `;
        
        adOverlay.innerHTML = `
            <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; max-width: 400px;">
                <div style="font-size: 40px; margin-bottom: 20px;">📺</div>
                <h3>Demo Advertisement</h3>
                <p style="color: #666; margin: 15px 0;">
                    This is where a real ad would appear.<br>
                    Upgrade to Premium to remove ads!
                </p>
                <div style="margin: 20px 0;">
                    <div style="background: #e2e8f0; height: 4px; border-radius: 2px;">
                        <div id="adProgress" style="background: #4299e1; height: 100%; width: 0%; border-radius: 2px; transition: width 0.1s;"></div>
                    </div>
                    <p style="font-size: 12px; margin-top: 10px; color: #666;">
                        Ad closes in <span id="adCountdown">5</span> seconds
                    </p>
                </div>
                <button id="upgradeFromAd" style="
                    background: #ed8936;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    margin: 10px 5px;
                ">Remove Ads - $2.99</button>
                <button id="skipAd" style="
                    background: #718096;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    margin: 10px 5px;
                    opacity: 0.5;
                    pointer-events: none;
                " disabled>Skip</button>
            </div>
        `;
        
        document.body.appendChild(adOverlay);
        
        // Countdown timer
        let countdown = 5;
        const countdownElement = adOverlay.querySelector('#adCountdown');
        const progressBar = adOverlay.querySelector('#adProgress');
        const skipButton = adOverlay.querySelector('#skipAd');
        
        const timer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            progressBar.style.width = `${((5 - countdown) / 5) * 100}%`;
            
            if (countdown <= 0) {
                clearInterval(timer);
                skipButton.disabled = false;
                skipButton.style.opacity = '1';
                skipButton.style.pointerEvents = 'auto';
                skipButton.textContent = 'Continue';
            }
        }, 1000);
        
        // Event handlers
        skipButton.addEventListener('click', () => {
            clearInterval(timer);
            document.body.removeChild(adOverlay);
        });
        
        adOverlay.querySelector('#upgradeFromAd').addEventListener('click', () => {
            clearInterval(timer);
            document.body.removeChild(adOverlay);
            this.showPremiumModal();
        });
        
        // Track ad view
        this.analytics?.trackAdView('interstitial', 'game_end', 0);
    }
    
    offerRewardedVideo(rewardType) {
        if (this.getAdFreeTimeRemaining() > 0) return;
        
        const offer = document.createElement('div');
        offer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #4299e1, #3182ce);
            color: white;
            padding: 20px;
            border-radius: 15px;
            z-index: 1001;
            text-align: center;
            max-width: 300px;
            box-shadow: 0 4px 20px rgba(66, 153, 225, 0.3);
        `;
        
        const rewards = {
            bonus_points: { icon: '⭐', text: '+20 Bonus Points', value: 20 },
            extra_life: { icon: '❤️', text: 'Extra Life', value: 1 },
            score_multiplier: { icon: '⚡', text: '2x Score for 5 minutes', value: 2 }
        };
        
        const reward = rewards[rewardType] || rewards.bonus_points;
        
        offer.innerHTML = `
            <div style="font-size: 30px; margin-bottom: 10px;">${reward.icon}</div>
            <h4 style="margin: 0 0 10px 0;">Watch Ad for ${reward.text}?</h4>
            <p style="font-size: 12px; opacity: 0.9; margin: 10px 0;">
                Watch a short video to earn rewards!
            </p>
            <div style="margin-top: 15px;">
                <button id="watchRewardedAd" style="
                    background: white;
                    color: #4299e1;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    margin: 5px;
                ">Watch Video</button>
                <button id="skipRewardedAd" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    margin: 5px;
                ">No Thanks</button>
            </div>
        `;
        
        document.body.appendChild(offer);
        
        // Auto-remove after 8 seconds
        const autoRemove = setTimeout(() => {
            if (offer.parentNode) {
                offer.parentNode.removeChild(offer);
            }
        }, 8000);
        
        // Event handlers
        offer.querySelector('#watchRewardedAd').addEventListener('click', () => {
            clearTimeout(autoRemove);
            document.body.removeChild(offer);
            this.showRewardedVideo(rewardType, reward);
        });
        
        offer.querySelector('#skipRewardedAd').addEventListener('click', () => {
            clearTimeout(autoRemove);
            document.body.removeChild(offer);
        });
    }
    
    showRewardedVideo(rewardType, reward) {
        // Simulate rewarded video (in real implementation, this would show actual ads)
        const videoOverlay = document.createElement('div');
        videoOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 1004;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        videoOverlay.innerHTML = `
            <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; max-width: 400px;">
                <div style="font-size: 40px; margin-bottom: 20px;">📹</div>
                <h3>Rewarded Video</h3>
                <p style="color: #666; margin: 15px 0;">
                    Demo rewarded video playing...<br>
                    Watch until the end to earn your reward!
                </p>
                <div style="margin: 20px 0;">
                    <div style="background: #e2e8f0; height: 6px; border-radius: 3px;">
                        <div id="videoProgress" style="background: #48bb78; height: 100%; width: 0%; border-radius: 3px; transition: width 0.1s;"></div>
                    </div>
                    <p style="font-size: 14px; margin-top: 10px;">
                        <span id="videoCountdown">10</span> seconds remaining
                    </p>
                </div>
                <div style="font-size: 20px; color: #48bb78;">
                    ${reward.icon} Reward: ${reward.text}
                </div>
            </div>
        `;
        
        document.body.appendChild(videoOverlay);
        
        // Video countdown
        let countdown = 10;
        const countdownElement = videoOverlay.querySelector('#videoCountdown');
        const progressBar = videoOverlay.querySelector('#videoProgress');
        
        const timer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            progressBar.style.width = `${((10 - countdown) / 10) * 100}%`;
            
            if (countdown <= 0) {
                clearInterval(timer);
                this.grantReward(rewardType, reward);
                document.body.removeChild(videoOverlay);
            }
        }, 1000);
        
        // Track rewarded video view
        this.analytics?.trackAdView('rewarded_video', rewardType, 0);
    }
    
    grantReward(rewardType, reward) {
        switch (rewardType) {
            case 'bonus_points':
                localStorage.setItem('bonusPoints', reward.value.toString());
                this.showRewardNotification(`${reward.icon} +${reward.value} Bonus Points for your next game!`);
                break;
                
            case 'score_multiplier':
                const multiplierData = {
                    multiplier: reward.value,
                    expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
                };
                localStorage.setItem('scoreMultiplier', JSON.stringify(multiplierData));
                this.showRewardNotification(`${reward.icon} ${reward.value}x Score multiplier active for 5 minutes!`);
                break;
                
            case 'extra_life':
                // Implementation for extra life would go here
                this.showRewardNotification(`${reward.icon} Extra life granted!`);
                break;
        }
        
        // Track reward granted
        this.analytics?.trackEvent('reward_granted', {
            type: rewardType,
            value: reward.value,
            source: 'rewarded_video'
        });
    }
    
    showRewardNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            z-index: 1001;
            font-weight: bold;
            box-shadow: 0 10px 40px rgba(72, 187, 120, 0.3);
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    showPremiumModal() {
        const modal = document.getElementById('premiumModal');
        const offersContainer = modal.querySelector('#premiumOffers');
        
        const offers = [
            {
                id: 'ad_free',
                name: 'Remove Ads',
                description: 'Enjoy uninterrupted gameplay forever',
                icon: '🚫',
                price: '$2.99',
                features: ['No interstitial ads', 'No banner ads', 'Cleaner interface'],
                popular: true
            },
            {
                id: 'premium_skins',
                name: 'Snake Skins Pack',
                description: '10 exclusive snake designs',
                icon: '🐍',
                price: '$1.99',
                features: ['Golden Snake', 'Rainbow Snake', 'Neon Snake', '7 more designs']
            },
            {
                id: 'power_ups',
                name: 'Power-Up Pack',
                description: 'Game-changing abilities',
                icon: '⚡',
                price: '$3.99',
                features: ['Speed Boost', 'Score Multiplier', 'Ghost Mode', 'Magnet Food']
            },
            {
                id: 'premium_bundle',
                name: 'Everything Bundle',
                description: 'All premium features included',
                icon: '✨',
                price: '$6.99',
                originalPrice: '$8.97',
                features: ['All skins unlocked', 'All power-ups', 'Ad-free experience', 'Exclusive themes'],
                discount: '22% OFF',
                popular: true
            }
        ];
        
        offersContainer.innerHTML = offers.map(offer => `
            <div class="premium-offer" data-offer-id="${offer.id}" style="
                border: 3px solid ${offer.popular ? '#ed8936' : '#e2e8f0'};
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                background: ${offer.popular ? 'linear-gradient(135deg, #fffbeb, #fef5e7)' : 'white'};
            ">
                ${offer.popular ? '<div style="position: absolute; top: -10px; left: 20px; background: #ed8936; color: white; padding: 5px 15px; border-radius: 15px; font-size: 12px; font-weight: bold;">POPULAR</div>' : ''}
                ${offer.discount ? '<div style="position: absolute; top: -10px; right: 20px; background: #e53e3e; color: white; padding: 5px 15px; border-radius: 15px; font-size: 12px; font-weight: bold;">' + offer.discount + '</div>' : ''}
                
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="font-size: 30px; margin-right: 15px;">${offer.icon}</div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0; color: #2d3748;">${offer.name}</h3>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${offer.description}</p>
                    </div>
                    <div style="text-align: right;">
                        ${offer.originalPrice ? `<div style="text-decoration: line-through; color: #999; font-size: 12px;">${offer.originalPrice}</div>` : ''}
                        <div style="font-size: 20px; font-weight: bold; color: #ed8936;">${offer.price}</div>
                    </div>
                </div>
                
                <div style="margin: 15px 0;">
                    ${offer.features.map(feature => `
                        <div style="color: #4a5568; font-size: 13px; margin: 3px 0;">
                            ✓ ${feature}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        // Add click handlers for offers
        offersContainer.addEventListener('click', (e) => {
            const offer = e.target.closest('.premium-offer');
            if (offer) {
                const offerId = offer.dataset.offerId;
                this.purchasePremiumOffer(offerId);
            }
        });
        
        modal.style.display = 'flex';
        
        // Track premium modal view
        this.analytics?.trackEvent('premium_modal_view', {
            source: 'premium_button'
        });
    }
    
    purchasePremiumOffer(offerId) {
        // In a real implementation, this would integrate with payment processors
        // For demo purposes, we'll simulate a purchase
        
        const confirmation = confirm(`Demo: Purchase ${offerId}?\n\nIn a real app, this would process payment through:\n• Apple App Store\n• Google Play Store\n• Stripe/PayPal for web`);
        
        if (confirmation) {
            this.processPurchase(offerId);
        }
    }
    
    processPurchase(offerId) {
        // Simulate successful purchase
        this.premiumFeatures.push(offerId);
        localStorage.setItem('premiumFeatures', JSON.stringify(this.premiumFeatures));
        
        // Grant specific features
        switch (offerId) {
            case 'ad_free':
                // Grant 30 days ad-free (demo)
                const adFreeUntil = new Date();
                adFreeUntil.setDate(adFreeUntil.getDate() + 30);
                localStorage.setItem('adFreeUntil', adFreeUntil.toISOString());
                this.updateAdFreeIndicator();
                break;
                
            case 'premium_skins':
                const allSkins = ['golden_snake', 'rainbow_snake', 'neon_snake', 'fire_snake', 'ice_snake', 'cosmic_snake', 'retro_snake', 'pixel_snake', 'chrome_snake', 'shadow_snake'];
                localStorage.setItem('unlockedSkins', JSON.stringify(['classic', ...allSkins]));
                break;
                
            case 'premium_bundle':
                // Grant everything
                const adFreeUntilBundle = new Date();
                adFreeUntilBundle.setDate(adFreeUntilBundle.getDate() + 365); // 1 year
                localStorage.setItem('adFreeUntil', adFreeUntilBundle.toISOString());
                localStorage.setItem('unlockedSkins', JSON.stringify(['classic', 'golden_snake', 'rainbow_snake', 'neon_snake', 'fire_snake', 'ice_snake', 'cosmic_snake', 'retro_snake', 'pixel_snake', 'chrome_snake', 'shadow_snake']));
                localStorage.setItem('powerUpsUnlocked', JSON.stringify(['speed_boost', 'score_multiplier', 'ghost_mode', 'magnet_food']));
                this.updateAdFreeIndicator();
                break;
        }
        
        // Show success message
        this.showPurchaseSuccess(offerId);
        
        // Close modal
        document.getElementById('premiumModal').style.display = 'none';
        
        // Track purchase
        this.analytics?.trackPurchase(offerId, this.getPriceForOffer(offerId));
    }
    
    getPriceForOffer(offerId) {
        const prices = {
            'ad_free': 2.99,
            'premium_skins': 1.99,
            'power_ups': 3.99,
            'premium_bundle': 6.99
        };
        return prices[offerId] || 0;
    }
    
    showPurchaseSuccess(offerId) {
        const success = document.createElement('div');
        success.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            z-index: 1005;
            max-width: 300px;
        `;
        
        success.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 15px;">🎉</div>
            <h3>Purchase Successful!</h3>
            <p>Thank you for supporting Snake Game!</p>
            <p style="font-size: 14px; opacity: 0.9;">Your premium features are now active.</p>
        `;
        
        document.body.appendChild(success);
        
        setTimeout(() => {
            if (success.parentNode) {
                success.parentNode.removeChild(success);
            }
        }, 4000);
    }
    
    showPremiumOffer(context) {
        // Context-specific premium offers
        const offers = {
            'high_score_celebration': {
                title: '🏆 Congratulations on your high score!',
                message: 'Ready to go even further? Unlock premium features!',
                primaryOffer: 'power_ups'
            },
            'frequent_player': {
                title: '🎮 We see you love Snake!',
                message: 'Remove ads for a better experience',
                primaryOffer: 'ad_free'
            }
        };
        
        const offer = offers[context];
        if (offer) {
            // Show contextual premium offer
            setTimeout(() => {
                this.showPremiumModal();
            }, 1000);
        }
    }
    
    // Public API methods
    hasPremiumFeature(feature) {
        return this.premiumFeatures.includes(feature);
    }
    
    isAdFree() {
        return this.getAdFreeTimeRemaining() > 0;
    }
    
    getPremiumCurrency() {
        return parseInt(localStorage.getItem('premiumCurrency') || '0');
    }
    
    spendPremiumCurrency(amount) {
        const current = this.getPremiumCurrency();
        if (current >= amount) {
            localStorage.setItem('premiumCurrency', (current - amount).toString());
            return true;
        }
        return false;
    }
    
    onGameStart() {
        // Apply any active bonuses/multipliers
        this.applyActiveBonus();
    }
    
    applyActiveBonus() {
        // Check for active score multiplier
        const multiplierData = localStorage.getItem('scoreMultiplier');
        if (multiplierData) {
            const data = JSON.parse(multiplierData);
            if (Date.now() < data.expiresAt) {
                // Multiplier is still active
                return { type: 'multiplier', value: data.multiplier };
            } else {
                // Multiplier expired
                localStorage.removeItem('scoreMultiplier');
            }
        }
        
        // Check for bonus points
        const bonusPoints = localStorage.getItem('bonusPoints');
        if (bonusPoints) {
            localStorage.removeItem('bonusPoints'); // One-time use
            return { type: 'bonus_points', value: parseInt(bonusPoints) };
        }
        
        return null;
    }
}