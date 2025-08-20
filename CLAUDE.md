# **CLAUDE.md - Live Service Game Development Guidelines**

## **🎮 King Digital Entertainment - Engineering Excellence Standards**

*Drawing from 15+ years at King/Blizzard, these are the architectural principles that separate amateur game projects from billion-dollar live service platforms.*

---

## **🏗️ SOLID Principles for Live Service Games**

### **Single Responsibility Principle (SRP)**
```javascript
// ❌ BAD: God class handling everything
class GameManager {
    handleUserInput() { /* ... */ }
    updateBattlePass() { /* ... */ }
    processPayments() { /* ... */ }
    sendNotifications() { /* ... */ }
    manageClanWars() { /* ... */ }
}

// ✅ GOOD: Focused responsibilities
class BattlePassManager { /* Only Battle Pass logic */ }
class PaymentProcessor { /* Only payment logic */ }
class NotificationService { /* Only notifications */ }
class ClanWarEngine { /* Only clan war mechanics */ }
```

**Game-Specific Applications:**
- **Analytics**: Separate event tracking from business logic
- **Monetization**: Payment processing isolated from gameplay
- **Social Features**: Clan management separate from individual progression
- **Content Management**: Seasonal content separate from core game loop

### **Open/Closed Principle (OCP)**
```javascript
// ✅ Extensible reward system without modifying core
class RewardProcessor {
    process(reward) {
        return this.strategies[reward.type].execute(reward);
    }
}

// Add new reward types without changing existing code
class BattlePassReward extends RewardStrategy { /* ... */ }
class ClanWarReward extends RewardStrategy { /* ... */ }
class SeasonalReward extends RewardStrategy { /* ... */ }
```

**Live Service Benefits:**
- Add new monetization strategies without breaking existing systems
- Introduce new game modes without touching core engine
- Extend analytics without modifying gameplay code
- New seasonal content types without architecture changes

### **Liskov Substitution Principle (LSP)**
```javascript
// ✅ All notification types work interchangeably
abstract class Notification {
    abstract send(user: User, message: string): Promise<boolean>
}

class PushNotification extends Notification { /* ... */ }
class EmailNotification extends Notification { /* ... */ }
class InGameNotification extends Notification { /* ... */ }

// Can substitute any notification type
function notifyPlayer(notification: Notification, user: User) {
    notification.send(user, "Your clan war is starting!");
}
```

### **Interface Segregation Principle (ISP)**
```javascript
// ❌ BAD: Monolithic interface forces unnecessary dependencies
interface GameFeature {
    requiresPremium(): boolean;
    updateBattlePass(): void;
    trackAnalytics(): void;
    syncToCloud(): void;
}

// ✅ GOOD: Focused interfaces
interface Monetizable { requiresPremium(): boolean; }
interface Trackable { trackAnalytics(): void; }
interface Syncable { syncToCloud(): void; }
interface BattlePassIntegrated { updateBattlePass(): void; }
```

### **Dependency Inversion Principle (DIP)**
```javascript
// ✅ High-level game logic doesn't depend on specific implementations
class GameSession {
    constructor(
        private analytics: IAnalyticsService,
        private payments: IPaymentProcessor,
        private social: ISocialService
    ) {}
    
    endGame(score: number) {
        this.analytics.trackGameEnd(score);
        this.social.updateLeaderboards(score);
        // Core logic remains stable regardless of implementation changes
    }
}
```

---

## **🎯 Game-Specific Design Principles**

### **ENGAGEMENT Architecture Pattern**

#### **E**vent-Driven Systems
```javascript
// All game systems communicate via events
class EventBus {
    emit(event: GameEvent) { /* Notify all subscribers */ }
    subscribe(eventType: string, handler: Function) { /* ... */ }
}

// Example: Score achieved triggers multiple systems
gameEvents.emit('SCORE_ACHIEVED', { score: 1000, userId });
// → Battle Pass progression
// → Achievement checks  
// → Clan war contribution
// → Analytics tracking
```

#### **N**on-Blocking Operations
```javascript
// Never block gameplay for secondary features
async function updateBattlePass(xp: number) {
    try {
        await battlePassService.addXP(xp);
    } catch (error) {
        // Game continues even if Battle Pass fails
        errorReporter.log('BattlePass update failed', error);
    }
}
```

#### **G**raceful Degradation
```javascript
// Core gameplay works even when live service features fail
class GameEngine {
    start() {
        this.startCoreGame(); // Always works
        
        // Optional enhancements
        this.battlePass?.initialize().catch(this.logError);
        this.clanSystem?.connect().catch(this.logError);
        this.analytics?.startSession().catch(this.logError);
    }
}
```

#### **A**synchronous Everything
```javascript
// Never block the game loop
class AsyncGameSystem {
    async processInBackground(data: GameData) {
        // Use requestIdleCallback or Web Workers
        return new Promise(resolve => {
            requestIdleCallback(() => {
                this.heavyProcessing(data);
                resolve();
            });
        });
    }
}
```

#### **G**uarded Feature Flags
```javascript
// All features behind toggles for safe deployment
class FeatureFlags {
    isEnabled(feature: string): boolean {
        return this.flags[feature] && !this.killSwitches[feature];
    }
}

// Usage throughout codebase
if (featureFlags.isEnabled('CLAN_WARS')) {
    this.initializeClanSystem();
}
```

#### **E**rror Boundary Pattern
```javascript
// Isolate failures to prevent cascading crashes
class SystemBoundary {
    execute(operation: () => void, fallback: () => void) {
        try {
            operation();
        } catch (error) {
            this.reportError(error);
            fallback();
        }
    }
}
```

#### **M**etrics-First Development
```javascript
// Every feature includes measurement from day one
class MetricsDecorator {
    wrap<T>(operation: Function, eventName: string): T {
        return (...args) => {
            const start = performance.now();
            const result = operation(...args);
            
            this.analytics.track(eventName, {
                duration: performance.now() - start,
                success: result !== null,
                args: this.sanitize(args)
            });
            
            return result;
        };
    }
}
```

#### **E**nd-to-End Testing
```javascript
// Test complete user journeys, not just units
describe('Battle Pass Purchase Journey', () => {
    it('should complete purchase flow and unlock content', async () => {
        await user.login();
        await user.openBattlePass();
        await user.purchasePremium();
        await user.claimReward(tier: 5);
        
        expect(user.hasReward('epic_snake_skin')).toBe(true);
        expect(analytics.tracked('premium_purchase')).toBe(true);
    });
});
```

#### **N**etwork Resilience
```javascript
// Handle connectivity issues gracefully
class NetworkManager {
    async request(endpoint: string, data: any) {
        return this.retryWithBackoff(async () => {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(data),
                timeout: 5000
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        }, { maxRetries: 3, backoffMs: 1000 });
    }
}
```

#### **T**ime-Based Systems
```javascript
// All temporal features use server time, never client time
class TimeManager {
    getServerTime(): Promise<Date> {
        return this.syncedServerTime || this.syncWithServer();
    }
    
    isEventActive(event: TimedEvent): boolean {
        const now = this.getServerTime();
        return now >= event.startTime && now <= event.endTime;
    }
}
```

---

## **🏛️ Architectural Patterns**

### **Command Pattern for Actions**
```javascript
// All player actions as commands for undo/replay/analytics
abstract class GameCommand {
    abstract execute(): void;
    abstract undo(): void;
    abstract getAnalyticsData(): object;
}

class PurchaseCommand extends GameCommand {
    execute() { this.paymentProcessor.charge(); }
    undo() { this.paymentProcessor.refund(); }
    getAnalyticsData() { return { item: this.item, price: this.price }; }
}
```

### **Observer Pattern for Cross-System Communication**
```javascript
// Decouple systems using observer pattern
class PlayerProgressSubject {
    private observers: Observer[] = [];
    
    levelUp(newLevel: number) {
        this.notifyObservers('LEVEL_UP', { level: newLevel });
    }
}

// Multiple systems can react to level up
battlePass.subscribe('LEVEL_UP', (data) => this.awardBonusXP(data.level * 10));
clanSystem.subscribe('LEVEL_UP', (data) => this.updateMemberRank(data.level));
analytics.subscribe('LEVEL_UP', (data) => this.trackProgression(data));
```

### **Strategy Pattern for Dynamic Content**
```javascript
// Different monetization strategies based on player segment
interface MonetizationStrategy {
    generateOffers(player: Player): Offer[];
}

class WhaleStrategy implements MonetizationStrategy {
    generateOffers(player: Player) {
        return this.premiumOffers.filter(offer => offer.price >= 9.99);
    }
}

class MinnowStrategy implements MonetizationStrategy {
    generateOffers(player: Player) {
        return this.valueOffers.filter(offer => offer.price <= 2.99);
    }
}
```

### **Circuit Breaker for External Services**
```javascript
// Prevent cascading failures from external API dependencies
class CircuitBreaker {
    private failureCount = 0;
    private lastFailure = 0;
    
    async call<T>(operation: () => Promise<T>): Promise<T> {
        if (this.isOpen()) {
            throw new Error('Circuit breaker is OPEN');
        }
        
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
}
```

---

## **📊 Analytics & Metrics Architecture**

### **Funnel Analysis Pattern**
```javascript
// Track complete user journeys for optimization
class ConversionFunnel {
    trackStep(userId: string, step: string, metadata?: object) {
        this.analytics.track(`funnel_${this.name}_${step}`, {
            userId,
            funnelId: this.id,
            stepNumber: this.steps.indexOf(step),
            timestamp: Date.now(),
            ...metadata
        });
    }
}

// Usage
const battlePassFunnel = new ConversionFunnel('battle_pass_purchase', [
    'view_battle_pass', 'click_premium', 'payment_initiated', 'purchase_completed'
]);

battlePassFunnel.trackStep(userId, 'view_battle_pass');
```

### **Cohort Analysis Integration**
```javascript
// Built-in cohort tracking for retention analysis
class CohortTracker {
    trackRetention(userId: string, installDate: Date, action: string) {
        const daysSinceInstall = this.daysBetween(installDate, new Date());
        
        this.analytics.track('retention_action', {
            userId,
            action,
            daysSinceInstall,
            cohort: this.getCohortName(installDate),
            retentionBucket: this.getRetentionBucket(daysSinceInstall) // D1, D7, D30
        });
    }
}
```

---

## **💰 Monetization Architecture**

### **Revenue Stream Composition**
```javascript
interface RevenueStream {
    calculateRevenue(player: Player, timeframe: TimeRange): number;
    getConversionRate(): number;
    getARPPU(): number; // Average Revenue Per Paying User
}

class BattlePassRevenue implements RevenueStream {
    calculateRevenue(player: Player, timeframe: TimeRange) {
        return player.premiumPasses * 4.99;
    }
}

class ConvenienceRevenue implements RevenueStream {
    calculateRevenue(player: Player, timeframe: TimeRange) {
        return player.boosterPurchases.sum() + player.extraLives.sum();
    }
}
```

### **Price Sensitivity Testing**
```javascript
// A/B test pricing for maximum revenue
class DynamicPricing {
    getPrice(item: string, player: Player): number {
        const segment = this.getPlayerSegment(player);
        const testGroup = this.abTest.getGroup(player.id, `pricing_${item}`);
        
        return this.priceMatrix[segment][item][testGroup];
    }
    
    private getPlayerSegment(player: Player): 'whale' | 'dolphin' | 'minnow' {
        if (player.totalSpent > 50) return 'whale';
        if (player.totalSpent > 5) return 'dolphin';
        return 'minnow';
    }
}
```

---

## **🔒 Security & Anti-Cheat Patterns**

### **Server Authority Pattern**
```javascript
// Never trust the client for anything valuable
class ServerAuthorizedAction {
    async purchaseItem(clientRequest: PurchaseRequest): Promise<PurchaseResult> {
        // Validate on server
        const player = await this.getPlayer(clientRequest.playerId);
        const item = await this.getItem(clientRequest.itemId);
        
        if (!player.canAfford(item.price)) {
            throw new Error('Insufficient funds');
        }
        
        // Execute transaction server-side
        return this.transactionService.execute(player, item);
    }
}
```

### **Anti-Cheat Validation**
```javascript
// Validate all score submissions with behavioral analysis
class ScoreValidator {
    async validateScore(score: number, gameSession: GameSession): Promise<boolean> {
        const analytics = gameSession.getAnalytics();
        
        // Check score is achievable given time played
        const maxPossibleScore = analytics.playtime * this.MAX_SCORE_PER_SECOND;
        if (score > maxPossibleScore) return false;
        
        // Check for typical player behavior patterns
        const inputPattern = analytics.getInputPattern();
        if (this.isBot(inputPattern)) return false;
        
        return true;
    }
}
```

---

## **⚡ Performance & Scalability**

### **Lazy Loading Pattern**
```javascript
// Load expensive features only when needed
class LazyFeatureManager {
    private features = new Map<string, Promise<any>>();
    
    async getFeature(name: string) {
        if (!this.features.has(name)) {
            this.features.set(name, this.loadFeature(name));
        }
        return this.features.get(name);
    }
    
    private async loadFeature(name: string) {
        const module = await import(`./features/${name}.js`);
        return new module.default();
    }
}

// Usage
const clanSystem = await featureManager.getFeature('clan-wars');
```

### **Caching Strategy**
```javascript
// Multi-layer caching for optimal performance
class CacheManager {
    private memoryCache = new Map();
    private persistentCache = new LocalStorageCache();
    
    async get<T>(key: string): Promise<T | null> {
        // L1: Memory cache (fastest)
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key);
        }
        
        // L2: Persistent cache (fast)
        const cached = await this.persistentCache.get(key);
        if (cached && !this.isExpired(cached)) {
            this.memoryCache.set(key, cached.data);
            return cached.data;
        }
        
        // L3: Network (slow)
        const fresh = await this.fetchFromServer(key);
        this.set(key, fresh);
        return fresh;
    }
}
```

---

## **🧪 Testing Strategies**

### **Player Journey Testing**
```javascript
// Test complete player experiences, not just code units
class PlayerJourneyTest {
    async testNewPlayerExperience() {
        const player = await this.createNewPlayer();
        
        // Day 1: Tutorial and first session
        await player.completeTutorial();
        await player.playGames(3);
        expect(player.level).toBe(2);
        expect(player.unlockedFeatures).toContain('daily_rewards');
        
        // Day 2: Return player experience
        await this.simulateTimePass('1 day');
        await player.login();
        expect(player.dailyRewards.available).toBe(true);
        
        // Week 1: Monetization opportunity
        await this.simulateTimePass('7 days');
        await player.login();
        expect(player.offers.length).toBeGreaterThan(0);
    }
}
```

### **Load Testing for Live Events**
```javascript
// Simulate concurrent users during peak events
class LoadTest {
    async testClanWarEvent() {
        const players = await this.createPlayers(10000);
        
        // Simulate clan war start
        const promises = players.map(player => 
            player.joinClanWar().catch(this.logError)
        );
        
        await Promise.allSettled(promises);
        
        expect(this.errorRate).toBeLessThan(0.1);
        expect(this.avgResponseTime).toBeLessThan(200);
    }
}
```

---

## **📱 Development Commands**

```bash
# Code Quality & Architecture
npm run lint:solid          # Check SOLID principle violations
npm run analyze:coupling     # Detect tight coupling issues
npm run test:architecture    # Validate architectural boundaries
npm run metrics:complexity   # Cyclomatic complexity analysis

# Live Service Specific  
npm run test:player-journey  # End-to-end player experience tests
npm run test:monetization    # Revenue flow integration tests
npm run test:load            # Concurrent user simulation
npm run validate:analytics   # Ensure all events are tracked

# Performance & Monitoring
npm run profile:memory       # Memory leak detection
npm run profile:performance  # Frame rate and responsiveness
npm run audit:security       # Security vulnerability scan
npm run monitor:errors       # Real-time error monitoring

# Standard Development
npm run dev                  # Start local development server
npm run build               # Production build
npm run test                # Run test suite
npm run lint                # Code quality check
npm run deploy              # Deploy to staging
npm run deploy:prod         # Production deployment
```

---

## **🎯 Success Metrics**

### **Technical Health**
- **Code Coverage**: >85% for revenue-critical paths
- **Cyclomatic Complexity**: <10 for all functions
- **Dependency Coupling**: <20% coupling between modules
- **Performance Budget**: 60fps gameplay, <200ms API responses

### **Architectural Quality**
- **Feature Independence**: Each system deployable separately
- **Error Isolation**: Failures don't cascade between systems
- **Extensibility**: New monetization strategies added without core changes
- **Testability**: 100% of user journeys have automated tests

### **Business KPIs**
```
DAU (Daily Active Users): Target 100K+
ARPDAU: Target $0.15+ (mobile game standard)
Retention D1/D7/D30: 40%/20%/10% minimum
LTV (Lifetime Value): $5+ per player
ROAS (Return on Ad Spend): 3:1 minimum
```

### **Technical KPIs** 
```
API Response Time: <200ms p95
Error Rate: <0.1% for critical paths
Crash Rate: <0.01% per session
Loading Time: <3 seconds initial load
Battery Impact: <2% per 30min session
```

---

## **⚠️ Anti-Patterns to Avoid**

### **Architecture Smells**
```javascript
// ❌ God Objects
class GameManager {
    // 2000+ lines managing everything
}

// ❌ Leaky Abstractions  
class PaymentSystem {
    processPayment(details) {
        // Exposes Apple/Google payment implementation details
    }
}

// ❌ Tight Coupling
class BattlePass {
    updateProgress() {
        ClansSystem.updateContribution(); // Direct dependency
        Analytics.track(); // Another direct dependency  
    }
}
```

### **Performance Killers**
```javascript
// ❌ Blocking Operations
function loadPlayerData() {
    const data = synchronousAPICall(); // Freezes game
    return data;
}

// ❌ Memory Leaks
class EventManager {
    subscribe(callback) {
        this.callbacks.push(callback); // Never cleaned up
    }
}
```

### **Design Failures**
- **Pay-to-Win**: Ruins long-term retention for short-term revenue
- **Complexity Creep**: Each new feature should be learnable in <30 seconds
- **Neglecting F2P**: 95% of players are free - don't alienate them
- **Static Content**: No evergreen content = rapid churn

### **Technical Debt**
- **Client-Side Validation**: Security nightmare for any valuable resources
- **Monolithic Architecture**: Live service needs independent component deployment  
- **Missing Analytics**: Can't optimize what you can't measure
- **No A/B Testing**: Every feature should be data-validated

---

## **🎖️ King's Engineering Excellence Standards**

*At King, we ship code that serves 250M+ players daily. Every architectural decision is measured against these standards:*

1. **Revenue Impact**: Does this architecture support or hinder monetization?
2. **Player Experience**: Will this create lag, crashes, or confusion?
3. **Scalability**: Can this handle 10x our current player base?
4. **Maintainability**: Can any engineer understand and modify this in 6 months?
5. **Testability**: Can we validate this works through automation?

---

## **🏆 Success Patterns from King's Hit Games**

### **Candy Crush Saga Lessons**
- **Simple Core Loop**: Easy to learn, impossible to master
- **Social Pressure**: Friend leaderboards drove 40% of daily engagement
- **Seasonal Events**: Limited-time content creates urgency and FOMO
- **Progression Gating**: Strategic difficulty spikes encourage monetization

### **Implementation for Snake Game**
```javascript
// Apply King's proven patterns:
const successFormula = {
    coreLoop: "Simple gameplay + Progressive difficulty",
    socialFeatures: "Clan wars + Leaderboards + Ghost replays", 
    monetization: "Battle Pass + Convenience + Cosmetics",
    retention: "Daily rewards + FOMO events + Social pressure",
    analytics: "Every interaction tracked + A/B tested"
};
```

---

**Remember: Architecture is not about perfect code. It's about sustainable systems that generate player joy and business value at scale.**

*— Senior Principal Engineer, King Digital Entertainment*

*"We don't build games. We build engagement platforms that happen to be games."*

---

*This document should evolve with our technical stack and business learnings. Update quarterly based on production metrics and engineering retrospectives.*