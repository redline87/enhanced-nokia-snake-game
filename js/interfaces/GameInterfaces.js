// Game System Interfaces
// King/Blizzard standard: Abstract interfaces for loose coupling

// Core Game Interfaces
class IGameEngine {
    constructor() {
        if (new.target === IGameEngine) {
            throw new Error('Cannot instantiate abstract interface IGameEngine');
        }
    }
    
    start() { throw new Error('Method start() must be implemented'); }
    pause() { throw new Error('Method pause() must be implemented'); }
    stop() { throw new Error('Method stop() must be implemented'); }
    restart() { throw new Error('Method restart() must be implemented'); }
    
    isRunning() { throw new Error('Method isRunning() must be implemented'); }
    isGameOver() { throw new Error('Method isGameOver() must be implemented'); }
    isPaused() { throw new Error('Method isPaused() must be implemented'); }
    
    getScore() { throw new Error('Method getScore() must be implemented'); }
    getState() { throw new Error('Method getState() must be implemented'); }
    
    setDirection(x, y) { throw new Error('Method setDirection() must be implemented'); }
}

// Analytics Interface
class IAnalyticsService {
    constructor() {
        if (new.target === IAnalyticsService) {
            throw new Error('Cannot instantiate abstract interface IAnalyticsService');
        }
    }
    
    trackEvent(eventName, properties = {}) { 
        throw new Error('Method trackEvent() must be implemented'); 
    }
    
    trackGameStart() { throw new Error('Method trackGameStart() must be implemented'); }
    trackGameEnd(score, duration, reason) { 
        throw new Error('Method trackGameEnd() must be implemented'); 
    }
    
    setUserProperties(properties) { 
        throw new Error('Method setUserProperties() must be implemented'); 
    }
    
    getInsights() { throw new Error('Method getInsights() must be implemented'); }
}

// Monetization Interface
class IMonetizationService {
    constructor() {
        if (new.target === IMonetizationService) {
            throw new Error('Cannot instantiate abstract interface IMonetizationService');
        }
    }
    
    isAdFree() { throw new Error('Method isAdFree() must be implemented'); }
    getPremiumCurrency() { throw new Error('Method getPremiumCurrency() must be implemented'); }
    
    purchaseItem(itemId, price) { 
        throw new Error('Method purchaseItem() must be implemented'); 
    }
    
    validatePurchase(transactionId) { 
        throw new Error('Method validatePurchase() must be implemented'); 
    }
    
    applyActiveBonus() { throw new Error('Method applyActiveBonus() must be implemented'); }
    getAvailableOffers() { throw new Error('Method getAvailableOffers() must be implemented'); }
}

// User Profile Interface
class IUserProfileService {
    constructor() {
        if (new.target === IUserProfileService) {
            throw new Error('Cannot instantiate abstract interface IUserProfileService');
        }
    }
    
    getProfile() { throw new Error('Method getProfile() must be implemented'); }
    updateProfile(updates) { throw new Error('Method updateProfile() must be implemented'); }
    
    addCurrency(type, amount, source) { 
        throw new Error('Method addCurrency() must be implemented'); 
    }
    
    spendCurrency(type, amount, source) { 
        throw new Error('Method spendCurrency() must be implemented'); 
    }
    
    hasCurrency(type, amount) { 
        throw new Error('Method hasCurrency() must be implemented'); 
    }
    
    addExperience(amount, source) { 
        throw new Error('Method addExperience() must be implemented'); 
    }
    
    getLevel() { throw new Error('Method getLevel() must be implemented'); }
}

// Battle Pass Interface
class IBattlePassService {
    constructor() {
        if (new.target === IBattlePassService) {
            throw new Error('Cannot instantiate abstract interface IBattlePassService');
        }
    }
    
    getCurrentTier() { throw new Error('Method getCurrentTier() must be implemented'); }
    getCurrentXP() { throw new Error('Method getCurrentXP() must be implemented'); }
    
    awardBattlePassXP(amount, source) { 
        throw new Error('Method awardBattlePassXP() must be implemented'); 
    }
    
    claimReward(tier, track) { 
        throw new Error('Method claimReward() must be implemented'); 
    }
    
    hasPremiumPass() { throw new Error('Method hasPremiumPass() must be implemented'); }
    purchasePremiumPass() { 
        throw new Error('Method purchasePremiumPass() must be implemented'); 
    }
    
    hasUnclaimedRewards() { 
        throw new Error('Method hasUnclaimedRewards() must be implemented'); 
    }
}

// Clan System Interface
class IClanService {
    constructor() {
        if (new.target === IClanService) {
            throw new Error('Cannot instantiate abstract interface IClanService');
        }
    }
    
    getClanId() { throw new Error('Method getClanId() must be implemented'); }
    getClanName() { throw new Error('Method getClanName() must be implemented'); }
    getClanRole() { throw new Error('Method getClanRole() must be implemented'); }
    
    joinClan(clanId) { throw new Error('Method joinClan() must be implemented'); }
    leaveClan() { throw new Error('Method leaveClan() must be implemented'); }
    createClan(name, description) { 
        throw new Error('Method createClan() must be implemented'); 
    }
    
    getCurrentWar() { throw new Error('Method getCurrentWar() must be implemented'); }
    contributeToWar(contribution) { 
        throw new Error('Method contributeToWar() must be implemented'); 
    }
    
    getClanMembers() { throw new Error('Method getClanMembers() must be implemented'); }
    getClanLeaderboard() { 
        throw new Error('Method getClanLeaderboard() must be implemented'); 
    }
}

// Notification Interface
class INotificationService {
    constructor() {
        if (new.target === INotificationService) {
            throw new Error('Cannot instantiate abstract interface INotificationService');
        }
    }
    
    hasNotificationPermission() { 
        throw new Error('Method hasNotificationPermission() must be implemented'); 
    }
    
    requestPermission() { 
        throw new Error('Method requestPermission() must be implemented'); 
    }
    
    scheduleNotification(title, body, delay) { 
        throw new Error('Method scheduleNotification() must be implemented'); 
    }
    
    showInGameNotification(message, type) { 
        throw new Error('Method showInGameNotification() must be implemented'); 
    }
    
    cancelAllNotifications() { 
        throw new Error('Method cancelAllNotifications() must be implemented'); 
    }
}

// Social Features Interface
class ISocialService {
    constructor() {
        if (new.target === ISocialService) {
            throw new Error('Cannot instantiate abstract interface ISocialService');
        }
    }
    
    shareScore(score, isNewRecord) { 
        throw new Error('Method shareScore() must be implemented'); 
    }
    
    getLeaderboard(type = 'global') { 
        throw new Error('Method getLeaderboard() must be implemented'); 
    }
    
    getFriends() { throw new Error('Method getFriends() must be implemented'); }
    addFriend(playerId) { throw new Error('Method addFriend() must be implemented'); }
    
    challengeFriend(friendId, challengeType) { 
        throw new Error('Method challengeFriend() must be implemented'); 
    }
}

// Achievement System Interface
class IAchievementService {
    constructor() {
        if (new.target === IAchievementService) {
            throw new Error('Cannot instantiate abstract interface IAchievementService');
        }
    }
    
    updateStats(stats) { throw new Error('Method updateStats() must be implemented'); }
    getProgress() { throw new Error('Method getProgress() must be implemented'); }
    
    getUnlockedAchievements() { 
        throw new Error('Method getUnlockedAchievements() must be implemented'); 
    }
    
    getCurrentStats() { 
        throw new Error('Method getCurrentStats() must be implemented'); 
    }
}

// Season Management Interface
class ISeasonService {
    constructor() {
        if (new.target === ISeasonService) {
            throw new Error('Cannot instantiate abstract interface ISeasonService');
        }
    }
    
    getCurrentSeason() { 
        throw new Error('Method getCurrentSeason() must be implemented'); 
    }
    
    getTimeUntilSeasonEnd() { 
        throw new Error('Method getTimeUntilSeasonEnd() must be implemented'); 
    }
    
    isSeasonActive() { 
        throw new Error('Method isSeasonActive() must be implemented'); 
    }
    
    getSeasonRewards() { 
        throw new Error('Method getSeasonRewards() must be implemented'); 
    }
}

// Security Interface
class ISecurityService {
    constructor() {
        if (new.target === ISecurityService) {
            throw new Error('Cannot instantiate abstract interface ISecurityService');
        }
    }
    
    validateScore(scoreData) { 
        throw new Error('Method validateScore() must be implemented'); 
    }
    
    validateCurrencyChange(type, amount, source) { 
        throw new Error('Method validateCurrencyChange() must be implemented'); 
    }
    
    validateProgression(progressionData) { 
        throw new Error('Method validateProgression() must be implemented'); 
    }
    
    validatePurchase(purchaseData) { 
        throw new Error('Method validatePurchase() must be implemented'); 
    }
    
    isSecurelyConnected() { 
        throw new Error('Method isSecurelyConnected() must be implemented'); 
    }
    
    trackInput(direction) { 
        throw new Error('Method trackInput() must be implemented'); 
    }
}

// Data Management Interface
class IDataService {
    constructor() {
        if (new.target === IDataService) {
            throw new Error('Cannot instantiate abstract interface IDataService');
        }
    }
    
    save(key, data) { throw new Error('Method save() must be implemented'); }
    load(key) { throw new Error('Method load() must be implemented'); }
    remove(key) { throw new Error('Method remove() must be implemented'); }
    
    backup() { throw new Error('Method backup() must be implemented'); }
    restore(backupData) { throw new Error('Method restore() must be implemented'); }
    
    syncToCloud() { throw new Error('Method syncToCloud() must be implemented'); }
    isCloudSyncEnabled() { 
        throw new Error('Method isCloudSyncEnabled() must be implemented'); 
    }
}

// Event System Interface
class IEventBus {
    constructor() {
        if (new.target === IEventBus) {
            throw new Error('Cannot instantiate abstract interface IEventBus');
        }
    }
    
    emit(eventName, data) { throw new Error('Method emit() must be implemented'); }
    on(eventName, callback) { throw new Error('Method on() must be implemented'); }
    off(eventName, callback) { throw new Error('Method off() must be implemented'); }
    once(eventName, callback) { throw new Error('Method once() must be implemented'); }
    
    removeAllListeners(eventName) { 
        throw new Error('Method removeAllListeners() must be implemented'); 
    }
}

// Feature Flag Interface
class IFeatureFlagService {
    constructor() {
        if (new.target === IFeatureFlagService) {
            throw new Error('Cannot instantiate abstract interface IFeatureFlagService');
        }
    }
    
    isEnabled(flagName) { throw new Error('Method isEnabled() must be implemented'); }
    getValue(flagName, defaultValue) { 
        throw new Error('Method getValue() must be implemented'); 
    }
    
    setFlag(flagName, value) { throw new Error('Method setFlag() must be implemented'); }
    removeFlag(flagName) { throw new Error('Method removeFlag() must be implemented'); }
    
    getAllFlags() { throw new Error('Method getAllFlags() must be implemented'); }
}

// Audio Interface
class IAudioService {
    constructor() {
        if (new.target === IAudioService) {
            throw new Error('Cannot instantiate abstract interface IAudioService');
        }
    }
    
    playSound(soundName) { throw new Error('Method playSound() must be implemented'); }
    playMusic(musicName) { throw new Error('Method playMusic() must be implemented'); }
    
    stopSound(soundName) { throw new Error('Method stopSound() must be implemented'); }
    stopMusic() { throw new Error('Method stopMusic() must be implemented'); }
    
    setVolume(volume) { throw new Error('Method setVolume() must be implemented'); }
    isSoundEnabled() { throw new Error('Method isSoundEnabled() must be implemented'); }
    
    toggleSound() { throw new Error('Method toggleSound() must be implemented'); }
}

// Export all interfaces
const GameInterfaces = {
    IGameEngine,
    IAnalyticsService,
    IMonetizationService,
    IUserProfileService,
    IBattlePassService,
    IClanService,
    INotificationService,
    ISocialService,
    IAchievementService,
    ISeasonService,
    ISecurityService,
    IDataService,
    IEventBus,
    IFeatureFlagService,
    IAudioService
};

// Make interfaces available globally
Object.assign(window, GameInterfaces);

// export default GameInterfaces; // Commented out - using global assignment instead