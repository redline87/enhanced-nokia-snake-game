// Remote Feature Flags API
// King/Blizzard standard: Centralized feature flag management with instant rollback

export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        return getFeatureFlags(req, res);
    } else if (req.method === 'POST') {
        return updateFeatureFlags(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

function getFeatureFlags(req, res) {
    const { player } = req.query;
    const playerHash = parseInt(player) || 0;
    
    // Get current server time for time-based flags
    const now = Date.now();
    const currentHour = new Date().getUTCHours();
    const dayOfWeek = new Date().getUTCDay();
    
    // Feature flags configuration
    const flags = {
        // Battle Pass System
        'BATTLE_PASS_ENABLED': {
            value: true,
            rolloutPercentage: 100,
            description: 'Enable Battle Pass system'
        },
        'BATTLE_PASS_AUTO_CLAIM': {
            value: false,
            rolloutPercentage: 0,
            description: 'Auto-claim Battle Pass rewards'
        },
        
        // Clan System - Progressive rollout
        'CLAN_WARS_ENABLED': {
            value: true,
            rolloutPercentage: 100,
            description: 'Enable Clan Wars feature'
        },
        'CLAN_CHAT_ENABLED': {
            value: true,
            rolloutPercentage: 90, // 90% rollout
            description: 'Enable clan chat system'
        },
        'CLAN_GHOST_REPLAYS': {
            value: true,
            rolloutPercentage: 60, // 60% rollout for testing
            description: 'Enable ghost replay system'
        },
        
        // Monetization - Careful rollout
        'PREMIUM_OFFERS_V2': {
            value: true,
            rolloutPercentage: 15, // 15% A/B test
            description: 'New premium offers system'
        },
        'DYNAMIC_PRICING': {
            value: false,
            rolloutPercentage: 0, // Disabled for now
            description: 'Dynamic pricing based on player segments'
        },
        'VIP_SUBSCRIPTION': {
            value: true,
            rolloutPercentage: 10, // 10% test group
            description: 'VIP monthly subscription'
        },
        
        // Time-based flags (example: weekend bonuses)
        'WEEKEND_BONUS_XP': {
            value: dayOfWeek === 0 || dayOfWeek === 6, // Weekend only
            rolloutPercentage: 100,
            description: 'Weekend bonus XP multiplier'
        },
        'HAPPY_HOUR_REWARDS': {
            value: currentHour >= 18 && currentHour <= 22, // 6-10 PM UTC
            rolloutPercentage: 100,
            description: 'Happy hour increased rewards'
        },
        
        // Performance features
        'WEB_WORKERS': {
            value: true,
            rolloutPercentage: 50, // 50% rollout
            description: 'Use Web Workers for heavy processing'
        },
        'LAZY_LOADING': {
            value: true,
            rolloutPercentage: 100,
            description: 'Lazy load non-critical features'
        },
        
        // Experimental features - Very limited rollout
        'AI_DIFFICULTY_SCALING': {
            value: true,
            rolloutPercentage: 2, // 2% test
            description: 'AI-based difficulty adjustment'
        },
        'MULTIPLAYER_MODE': {
            value: false,
            rolloutPercentage: 0, // Disabled
            description: 'Real-time multiplayer'
        },
        
        // Social features
        'SOCIAL_SHARING_V2': {
            value: true,
            rolloutPercentage: 30, // 30% test
            description: 'Enhanced social sharing'
        },
        'FRIEND_CHALLENGES': {
            value: true,
            rolloutPercentage: 5, // 5% early test
            description: 'Friend challenge system'
        },
        
        // Anti-cheat and security
        'ENHANCED_ANTI_CHEAT': {
            value: true,
            rolloutPercentage: 100,
            description: 'Enhanced anti-cheat validation'
        },
        'REAL_TIME_VALIDATION': {
            value: true,
            rolloutPercentage: 40, // 40% rollout
            description: 'Real-time server validation'
        }
    };
    
    // Kill switches - Emergency disable switches
    const killSwitches = {
        // Currently no active kill switches
        // Example of what an emergency kill switch would look like:
        /*
        'CLAN_WARS_ENABLED': {
            active: true,
            reason: 'Critical bug in clan war calculation',
            activatedAt: Date.now(),
            activatedBy: 'emergency_response_team'
        }
        */
    };
    
    // Player segment-based overrides
    const playerSegment = getPlayerSegment(playerHash);
    const segmentOverrides = getSegmentOverrides(playerSegment);
    
    // Apply segment overrides
    Object.entries(segmentOverrides).forEach(([flagName, override]) => {
        if (flags[flagName]) {
            flags[flagName] = { ...flags[flagName], ...override };
        }
    });
    
    // Response
    res.status(200).json({
        flags,
        killSwitches,
        playerSegment,
        serverTime: now,
        version: '1.0.0',
        refreshInterval: 5 * 60 * 1000 // 5 minutes
    });
}

function updateFeatureFlags(req, res) {
    // This would be used by admin panel to update flags
    // For now, just return success
    const { action, flagName, value, reason } = req.body;
    
    // In production, this would validate admin permissions
    // and update the flag configuration in database
    
    console.log(`Feature flag update: ${action} ${flagName} = ${value} (${reason})`);
    
    res.status(200).json({
        success: true,
        message: `Flag ${flagName} updated successfully`,
        timestamp: Date.now()
    });
}

function getPlayerSegment(playerHash) {
    // Segment players based on hash for consistent assignment
    if (playerHash % 100 < 5) return 'whale';      // 5% whales
    if (playerHash % 100 < 25) return 'dolphin';   // 20% dolphins  
    return 'minnow';                                // 75% minnows
}

function getSegmentOverrides(segment) {
    const overrides = {};
    
    switch (segment) {
        case 'whale':
            // Whales get access to premium features first
            overrides['VIP_SUBSCRIPTION'] = { rolloutPercentage: 100 };
            overrides['PREMIUM_OFFERS_V2'] = { rolloutPercentage: 100 };
            overrides['AI_DIFFICULTY_SCALING'] = { rolloutPercentage: 50 };
            break;
            
        case 'dolphin':
            // Dolphins get gradual access
            overrides['VIP_SUBSCRIPTION'] = { rolloutPercentage: 30 };
            overrides['PREMIUM_OFFERS_V2'] = { rolloutPercentage: 50 };
            break;
            
        case 'minnow':
            // Minnows get basic features first
            overrides['SOCIAL_SHARING_V2'] = { rolloutPercentage: 80 };
            overrides['FRIEND_CHALLENGES'] = { rolloutPercentage: 20 };
            break;
    }
    
    return overrides;
}