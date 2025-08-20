// Server-side Security Validation System
// Following King/Blizzard security standards - NEVER trust the client

export default async function handler(req, res) {
    // Enable CORS for game client
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { action, data, playerId, sessionToken } = req.body;
        
        // Validate session token (basic implementation)
        if (!sessionToken || !isValidSession(sessionToken, playerId)) {
            return res.status(401).json({ error: 'Invalid session' });
        }
        
        const validator = new ServerValidator();
        let result;
        
        switch (action) {
            case 'validate_score':
                result = await validator.validateScore(data, playerId);
                break;
            case 'validate_currency_change':
                result = await validator.validateCurrencyChange(data, playerId);
                break;
            case 'validate_progression':
                result = await validator.validateProgression(data, playerId);
                break;
            case 'validate_purchase':
                result = await validator.validatePurchase(data, playerId);
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
        
        if (result.valid) {
            // Update server-side player state
            await updatePlayerState(playerId, result.updates);
            return res.status(200).json({ 
                valid: true, 
                serverState: result.serverState,
                timestamp: Date.now()
            });
        } else {
            // Log suspicious activity
            await logSuspiciousActivity(playerId, action, data, result.reason);
            return res.status(400).json({ 
                valid: false, 
                reason: result.reason,
                correctedState: result.correctedState
            });
        }
        
    } catch (error) {
        console.error('Server validation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

class ServerValidator {
    async validateScore(scoreData, playerId) {
        const { score, duration, applesEaten, gameSession } = scoreData;
        
        // Get player's historical data for behavioral analysis
        const playerHistory = await getPlayerHistory(playerId);
        const antiCheat = new AntiCheatEngine(playerHistory);
        
        // Rule 1: Score must be achievable given time played
        const maxPossibleScore = this.calculateMaxPossibleScore(duration, applesEaten);
        if (score > maxPossibleScore) {
            return {
                valid: false,
                reason: 'IMPOSSIBLE_SCORE',
                correctedState: { score: Math.min(score, maxPossibleScore) }
            };
        }
        
        // Rule 2: Behavioral analysis
        const behaviorAnalysis = antiCheat.analyzeBehavior(gameSession);
        if (behaviorAnalysis.suspiciousActivity) {
            return {
                valid: false,
                reason: 'SUSPICIOUS_BEHAVIOR',
                details: behaviorAnalysis.flags
            };
        }
        
        // Rule 3: Progressive skill analysis
        if (antiCheat.isSkillJumpSuspicious(score, playerHistory.averageScore)) {
            return {
                valid: false,
                reason: 'UNREALISTIC_SKILL_JUMP',
                correctedState: { score: Math.min(score, playerHistory.averageScore * 2) }
            };
        }
        
        return {
            valid: true,
            serverState: {
                validatedScore: score,
                timestamp: Date.now(),
                behaviorRating: behaviorAnalysis.trustScore
            }
        };
    }
    
    async validateCurrencyChange(currencyData, playerId) {
        const { type, amount, source, previousAmount } = currencyData;
        
        // Get server-authoritative currency state
        const serverCurrency = await getPlayerCurrency(playerId);
        
        // Validate the change is from an authorized source
        const authorizedSources = [
            'game_reward', 'level_up', 'login_streak', 'achievement',
            'battle_pass', 'clan_reward', 'purchase', 'daily_mission'
        ];
        
        if (!authorizedSources.includes(source)) {
            return {
                valid: false,
                reason: 'UNAUTHORIZED_SOURCE',
                correctedState: serverCurrency
            };
        }
        
        // Validate the amount is reasonable for the source
        const maxReward = this.getMaxRewardForSource(source, type);
        if (amount > maxReward) {
            return {
                valid: false,
                reason: 'EXCESSIVE_REWARD',
                correctedState: { 
                    ...serverCurrency,
                    [type]: serverCurrency[type] + Math.min(amount, maxReward)
                }
            };
        }
        
        // Check for currency manipulation
        const expectedCurrency = serverCurrency[type] + amount;
        const clientCurrency = previousAmount + amount;
        
        if (Math.abs(clientCurrency - expectedCurrency) > 1) {
            return {
                valid: false,
                reason: 'CURRENCY_MANIPULATION',
                correctedState: serverCurrency
            };
        }
        
        return {
            valid: true,
            updates: { [`currency_${type}`]: expectedCurrency },
            serverState: { ...serverCurrency, [type]: expectedCurrency }
        };
    }
    
    async validateProgression(progressData, playerId) {
        const { level, experience, battlePassTier, battlePassXP } = progressData;
        
        const serverProgression = await getPlayerProgression(playerId);
        
        // Validate level progression
        if (level > serverProgression.level + 1) {
            return {
                valid: false,
                reason: 'LEVEL_SKIP_DETECTED',
                correctedState: serverProgression
            };
        }
        
        // Validate experience is consistent with level
        const requiredXP = this.calculateRequiredXP(level);
        if (experience < requiredXP || experience > requiredXP * 1.5) {
            return {
                valid: false,
                reason: 'EXPERIENCE_INCONSISTENCY',
                correctedState: serverProgression
            };
        }
        
        // Validate Battle Pass progression
        if (battlePassTier > this.calculateTierFromXP(battlePassXP)) {
            return {
                valid: false,
                reason: 'BATTLE_PASS_MANIPULATION',
                correctedState: serverProgression
            };
        }
        
        return {
            valid: true,
            updates: { 
                level, 
                experience, 
                battlePassTier, 
                battlePassXP 
            },
            serverState: { level, experience, battlePassTier, battlePassXP }
        };
    }
    
    async validatePurchase(purchaseData, playerId) {
        const { itemId, price, currency, transactionId } = purchaseData;
        
        // Verify transaction with payment provider (mock implementation)
        const transactionValid = await verifyTransaction(transactionId, price);
        if (!transactionValid) {
            return {
                valid: false,
                reason: 'INVALID_TRANSACTION',
                correctedState: {}
            };
        }
        
        // Verify item exists and price is correct
        const item = await getStoreItem(itemId);
        if (!item || item.price !== price || item.currency !== currency) {
            return {
                valid: false,
                reason: 'ITEM_PRICE_MISMATCH',
                correctedState: {}
            };
        }
        
        // Check if player already owns the item (for non-consumables)
        if (item.type !== 'consumable') {
            const playerInventory = await getPlayerInventory(playerId);
            if (playerInventory.includes(itemId)) {
                return {
                    valid: false,
                    reason: 'ITEM_ALREADY_OWNED',
                    correctedState: {}
                };
            }
        }
        
        return {
            valid: true,
            updates: { 
                [`inventory_${itemId}`]: true,
                [`currency_${currency}`]: -price,
                purchase_history: { itemId, price, currency, timestamp: Date.now() }
            },
            serverState: { purchased: true, item }
        };
    }
    
    calculateMaxPossibleScore(duration, applesEaten) {
        // Conservative estimate: max 10 points per second, with apple bonuses
        const baseScore = Math.floor(duration / 1000) * 10;
        const appleBonus = applesEaten * 10;
        return baseScore + appleBonus;
    }
    
    getMaxRewardForSource(source, type) {
        const limits = {
            'game_reward': { coins: 100, gems: 0 },
            'level_up': { coins: 500, gems: 5 },
            'login_streak': { coins: 200, gems: 1 },
            'achievement': { coins: 1000, gems: 10 },
            'battle_pass': { coins: 2000, gems: 50 },
            'clan_reward': { coins: 1500, gems: 15 },
            'daily_mission': { coins: 300, gems: 2 }
        };
        
        return limits[source]?.[type] || 0;
    }
    
    calculateRequiredXP(level) {
        return Math.floor(100 * Math.pow(1.1, level - 1));
    }
    
    calculateTierFromXP(xp) {
        let tier = 0;
        let totalXP = 0;
        
        for (let i = 1; i <= 50; i++) {
            const tierXP = 1000 + (i * 50) + Math.pow(i * 0.1, 2) * 100;
            totalXP += tierXP;
            if (xp >= totalXP) {
                tier = i;
            } else {
                break;
            }
        }
        
        return tier;
    }
}

class AntiCheatEngine {
    constructor(playerHistory) {
        this.playerHistory = playerHistory;
        this.suspiciousThresholds = {
            perfectAccuracy: 0.98,
            impossibleReactionTime: 50, // ms
            roboticInputPattern: 0.95,
            skillJumpMultiplier: 3.0
        };
    }
    
    analyzeBehavior(gameSession) {
        const flags = [];
        let trustScore = 1.0;
        
        // Check for impossible reaction times
        if (gameSession.averageReactionTime < this.suspiciousThresholds.impossibleReactionTime) {
            flags.push('IMPOSSIBLE_REACTION_TIME');
            trustScore -= 0.5;
        }
        
        // Check for robotic input patterns
        const inputVariance = this.calculateInputVariance(gameSession.inputs);
        if (inputVariance < 0.05) {
            flags.push('ROBOTIC_INPUT_PATTERN');
            trustScore -= 0.3;
        }
        
        // Check for perfect accuracy (suspicious for human players)
        const accuracy = gameSession.correctMoves / gameSession.totalMoves;
        if (accuracy > this.suspiciousThresholds.perfectAccuracy) {
            flags.push('PERFECT_ACCURACY');
            trustScore -= 0.4;
        }
        
        return {
            suspiciousActivity: flags.length > 0,
            flags,
            trustScore: Math.max(0, trustScore)
        };
    }
    
    isSkillJumpSuspicious(currentScore, averageScore) {
        if (averageScore === 0) return false; // New player
        
        const skillJump = currentScore / averageScore;
        return skillJump > this.suspiciousThresholds.skillJumpMultiplier;
    }
    
    calculateInputVariance(inputs) {
        if (!inputs || inputs.length < 10) return 1.0;
        
        const timings = inputs.map((input, i) => 
            i > 0 ? input.timestamp - inputs[i-1].timestamp : 0
        ).filter(t => t > 0);
        
        const mean = timings.reduce((sum, t) => sum + t, 0) / timings.length;
        const variance = timings.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / timings.length;
        
        return Math.sqrt(variance) / mean; // Coefficient of variation
    }
}

// Mock database functions (implement with your database)
async function getPlayerHistory(playerId) {
    // Return player's game history for analysis
    return { averageScore: 500, gamesPlayed: 50, suspiciousActivityCount: 0 };
}

async function getPlayerCurrency(playerId) {
    // Return server-authoritative currency state
    return { coins: 1000, gems: 50, seasonTokens: 25 };
}

async function getPlayerProgression(playerId) {
    // Return server-authoritative progression state
    return { level: 5, experience: 750, battlePassTier: 3, battlePassXP: 2500 };
}

async function getStoreItem(itemId) {
    // Return item details from server
    return { id: itemId, price: 4.99, currency: 'USD', type: 'battle_pass' };
}

async function getPlayerInventory(playerId) {
    // Return player's owned items
    return ['premium_snake_skin', 'extra_life_pack'];
}

async function verifyTransaction(transactionId, amount) {
    // Verify with payment provider (Apple/Google/Stripe)
    return true; // Mock implementation
}

async function updatePlayerState(playerId, updates) {
    // Update server database with validated changes
    console.log(`Updating player ${playerId}:`, updates);
}

async function logSuspiciousActivity(playerId, action, data, reason) {
    // Log for security monitoring and analysis
    console.log(`SECURITY ALERT - Player ${playerId}: ${action} - ${reason}`, data);
}

function isValidSession(sessionToken, playerId) {
    // Validate session token (implement JWT or similar)
    return sessionToken && sessionToken.startsWith(playerId);
}