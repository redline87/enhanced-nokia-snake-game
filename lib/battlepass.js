const database = require('./database');

class BattlePassService {
    constructor() {
        this.initializeBattlePassTables();
        this.currentSeasonId = 1; // This should be dynamic in production
    }

    async initializeBattlePassTables() {
        await database.connect();
        
        if (database.isPostgres) {
            // Battle Pass seasons table
            await database.db.query(`
                CREATE TABLE IF NOT EXISTS battle_pass_seasons (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    start_date TIMESTAMP NOT NULL,
                    end_date TIMESTAMP NOT NULL,
                    max_tier INTEGER DEFAULT 50,
                    xp_per_tier INTEGER DEFAULT 1000,
                    premium_price DECIMAL(10,2) DEFAULT 9.99,
                    is_active BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Battle Pass tiers and rewards
            await database.db.query(`
                CREATE TABLE IF NOT EXISTS battle_pass_rewards (
                    id SERIAL PRIMARY KEY,
                    season_id INTEGER REFERENCES battle_pass_seasons(id),
                    tier INTEGER NOT NULL,
                    is_premium BOOLEAN DEFAULT FALSE,
                    reward_type VARCHAR(50) NOT NULL,
                    reward_value VARCHAR(255) NOT NULL,
                    reward_quantity INTEGER DEFAULT 1,
                    reward_name VARCHAR(100),
                    reward_description TEXT,
                    reward_icon VARCHAR(255)
                )
            `);

            // User Battle Pass progression
            await database.db.query(`
                CREATE TABLE IF NOT EXISTS user_battle_pass (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    season_id INTEGER REFERENCES battle_pass_seasons(id),
                    current_tier INTEGER DEFAULT 0,
                    current_xp INTEGER DEFAULT 0,
                    is_premium BOOLEAN DEFAULT FALSE,
                    purchased_at TIMESTAMP,
                    claimed_free_rewards TEXT DEFAULT '[]',
                    claimed_premium_rewards TEXT DEFAULT '[]',
                    total_xp_earned INTEGER DEFAULT 0,
                    games_played INTEGER DEFAULT 0,
                    challenges_completed INTEGER DEFAULT 0,
                    UNIQUE(user_id, season_id)
                )
            `);

            // XP transactions log
            await database.db.query(`
                CREATE TABLE IF NOT EXISTS battle_pass_xp_log (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    season_id INTEGER REFERENCES battle_pass_seasons(id),
                    xp_amount INTEGER NOT NULL,
                    source VARCHAR(50) NOT NULL,
                    source_details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Initialize default season if none exists
            await this.initializeDefaultSeason();
            
        } else {
            // SQLite schema for local development
            database.db.run(`
                CREATE TABLE IF NOT EXISTS battle_pass_seasons (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    start_date DATETIME NOT NULL,
                    end_date DATETIME NOT NULL,
                    max_tier INTEGER DEFAULT 50,
                    xp_per_tier INTEGER DEFAULT 1000,
                    premium_price REAL DEFAULT 9.99,
                    is_active INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            database.db.run(`
                CREATE TABLE IF NOT EXISTS battle_pass_rewards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    season_id INTEGER,
                    tier INTEGER NOT NULL,
                    is_premium INTEGER DEFAULT 0,
                    reward_type TEXT NOT NULL,
                    reward_value TEXT NOT NULL,
                    reward_quantity INTEGER DEFAULT 1,
                    reward_name TEXT,
                    reward_description TEXT,
                    reward_icon TEXT,
                    FOREIGN KEY (season_id) REFERENCES battle_pass_seasons(id)
                )
            `);

            database.db.run(`
                CREATE TABLE IF NOT EXISTS user_battle_pass (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    season_id INTEGER,
                    current_tier INTEGER DEFAULT 0,
                    current_xp INTEGER DEFAULT 0,
                    is_premium INTEGER DEFAULT 0,
                    purchased_at DATETIME,
                    claimed_free_rewards TEXT DEFAULT '[]',
                    claimed_premium_rewards TEXT DEFAULT '[]',
                    total_xp_earned INTEGER DEFAULT 0,
                    games_played INTEGER DEFAULT 0,
                    challenges_completed INTEGER DEFAULT 0,
                    UNIQUE(user_id, season_id),
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (season_id) REFERENCES battle_pass_seasons(id)
                )
            `);

            database.db.run(`
                CREATE TABLE IF NOT EXISTS battle_pass_xp_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    season_id INTEGER,
                    xp_amount INTEGER NOT NULL,
                    source TEXT NOT NULL,
                    source_details TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (season_id) REFERENCES battle_pass_seasons(id)
                )
            `);
        }
    }

    async initializeDefaultSeason() {
        // Check if any season exists
        const existingSeasons = await this.getAllSeasons();
        if (existingSeasons.length === 0) {
            // Create default season
            const seasonId = await this.createSeason(
                'Genesis Season',
                'The first Battle Pass season featuring exclusive snake skins and rewards!',
                new Date(),
                new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
                50,
                1000,
                9.99,
                true
            );

            // Add default rewards
            await this.addDefaultRewards(seasonId);
        }
    }

    async addDefaultRewards(seasonId) {
        const rewards = [
            // Free rewards
            { tier: 1, is_premium: false, type: 'coins', value: '100', name: 'Coin Bundle' },
            { tier: 5, is_premium: false, type: 'skin', value: 'green_snake', name: 'Green Snake Skin' },
            { tier: 10, is_premium: false, type: 'coins', value: '250', name: 'Coin Stack' },
            { tier: 15, is_premium: false, type: 'boost', value: 'xp_boost_1h', name: 'XP Boost (1 Hour)' },
            { tier: 20, is_premium: false, type: 'skin', value: 'blue_snake', name: 'Blue Snake Skin' },
            { tier: 25, is_premium: false, type: 'coins', value: '500', name: 'Coin Pile' },
            { tier: 30, is_premium: false, type: 'avatar', value: 'champion_avatar', name: 'Champion Avatar' },
            { tier: 35, is_premium: false, type: 'boost', value: 'score_boost_30m', name: 'Score Boost (30 min)' },
            { tier: 40, is_premium: false, type: 'skin', value: 'purple_snake', name: 'Purple Snake Skin' },
            { tier: 45, is_premium: false, type: 'coins', value: '1000', name: 'Coin Treasure' },
            { tier: 50, is_premium: false, type: 'skin', value: 'rainbow_snake', name: 'Rainbow Snake Skin' },
            
            // Premium rewards
            { tier: 1, is_premium: true, type: 'gems', value: '50', name: 'Gem Pack' },
            { tier: 5, is_premium: true, type: 'skin', value: 'gold_snake', name: 'Golden Snake Skin' },
            { tier: 10, is_premium: true, type: 'gems', value: '100', name: 'Gem Bundle' },
            { tier: 15, is_premium: true, type: 'skin', value: 'neon_snake', name: 'Neon Snake Skin' },
            { tier: 20, is_premium: true, type: 'boost', value: 'xp_boost_3h', name: 'XP Boost (3 Hours)' },
            { tier: 25, is_premium: true, type: 'gems', value: '200', name: 'Gem Chest' },
            { tier: 30, is_premium: true, type: 'skin', value: 'cyber_snake', name: 'Cyber Snake Skin' },
            { tier: 35, is_premium: true, type: 'title', value: 'Battle Master', name: 'Battle Master Title' },
            { tier: 40, is_premium: true, type: 'gems', value: '500', name: 'Gem Vault' },
            { tier: 45, is_premium: true, type: 'skin', value: 'legendary_dragon', name: 'Dragon Snake Skin' },
            { tier: 50, is_premium: true, type: 'skin', value: 'cosmic_snake', name: 'Cosmic Snake Skin' }
        ];

        for (const reward of rewards) {
            await this.addReward(
                seasonId,
                reward.tier,
                reward.is_premium,
                reward.type,
                reward.value,
                1,
                reward.name,
                `Tier ${reward.tier} ${reward.is_premium ? 'Premium' : 'Free'} Reward`
            );
        }
    }

    // Create a new season
    async createSeason(name, description, startDate, endDate, maxTier, xpPerTier, premiumPrice, isActive) {
        if (database.isPostgres) {
            const result = await database.db.query(
                `INSERT INTO battle_pass_seasons 
                (name, description, start_date, end_date, max_tier, xp_per_tier, premium_price, is_active) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [name, description, startDate, endDate, maxTier, xpPerTier, premiumPrice, isActive]
            );
            return result.rows[0].id;
        } else {
            return new Promise((resolve, reject) => {
                database.db.run(
                    `INSERT INTO battle_pass_seasons 
                    (name, description, start_date, end_date, max_tier, xp_per_tier, premium_price, is_active) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [name, description, startDate.toISOString(), endDate.toISOString(), 
                     maxTier, xpPerTier, premiumPrice, isActive ? 1 : 0],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });
        }
    }

    // Add reward to a season
    async addReward(seasonId, tier, isPremium, rewardType, rewardValue, quantity, name, description) {
        if (database.isPostgres) {
            await database.db.query(
                `INSERT INTO battle_pass_rewards 
                (season_id, tier, is_premium, reward_type, reward_value, reward_quantity, reward_name, reward_description) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [seasonId, tier, isPremium, rewardType, rewardValue, quantity, name, description]
            );
        } else {
            await new Promise((resolve, reject) => {
                database.db.run(
                    `INSERT INTO battle_pass_rewards 
                    (season_id, tier, is_premium, reward_type, reward_value, reward_quantity, reward_name, reward_description) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [seasonId, tier, isPremium ? 1 : 0, rewardType, rewardValue, quantity, name, description],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
    }

    // Get user's Battle Pass progress
    async getUserBattlePass(userId, seasonId = null) {
        if (!seasonId) {
            seasonId = await this.getCurrentSeasonId();
        }

        if (database.isPostgres) {
            const result = await database.db.query(
                `SELECT * FROM user_battle_pass WHERE user_id = $1 AND season_id = $2`,
                [userId, seasonId]
            );
            
            if (result.rows.length === 0) {
                // Create new Battle Pass entry for user
                await database.db.query(
                    `INSERT INTO user_battle_pass (user_id, season_id) VALUES ($1, $2)`,
                    [userId, seasonId]
                );
                return this.getUserBattlePass(userId, seasonId);
            }
            
            return result.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT * FROM user_battle_pass WHERE user_id = ? AND season_id = ?`,
                    [userId, seasonId],
                    async (err, row) => {
                        if (err) {
                            reject(err);
                        } else if (!row) {
                            // Create new Battle Pass entry for user
                            database.db.run(
                                `INSERT INTO user_battle_pass (user_id, season_id) VALUES (?, ?)`,
                                [userId, seasonId],
                                (err) => {
                                    if (err) reject(err);
                                    else resolve(this.getUserBattlePass(userId, seasonId));
                                }
                            );
                        } else {
                            resolve(row);
                        }
                    }
                );
            });
        }
    }

    // Add XP to user's Battle Pass
    async addXP(userId, amount, source, sourceDetails = null) {
        const seasonId = await this.getCurrentSeasonId();
        const battlePass = await this.getUserBattlePass(userId, seasonId);
        const season = await this.getSeason(seasonId);
        
        // Calculate new XP and tier
        const newXP = battlePass.current_xp + amount;
        const newTotalXP = battlePass.total_xp_earned + amount;
        const newTier = Math.floor(newTotalXP / season.xp_per_tier);
        const tierXP = newTotalXP % season.xp_per_tier;
        
        // Update Battle Pass progress
        if (database.isPostgres) {
            await database.db.query(
                `UPDATE user_battle_pass 
                SET current_xp = $1, current_tier = $2, total_xp_earned = $3 
                WHERE user_id = $4 AND season_id = $5`,
                [tierXP, Math.min(newTier, season.max_tier), newTotalXP, userId, seasonId]
            );
            
            // Log XP transaction
            await database.db.query(
                `INSERT INTO battle_pass_xp_log (user_id, season_id, xp_amount, source, source_details) 
                VALUES ($1, $2, $3, $4, $5)`,
                [userId, seasonId, amount, source, sourceDetails]
            );
        } else {
            await new Promise((resolve, reject) => {
                database.db.run(
                    `UPDATE user_battle_pass 
                    SET current_xp = ?, current_tier = ?, total_xp_earned = ? 
                    WHERE user_id = ? AND season_id = ?`,
                    [tierXP, Math.min(newTier, season.max_tier), newTotalXP, userId, seasonId],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
            
            await new Promise((resolve, reject) => {
                database.db.run(
                    `INSERT INTO battle_pass_xp_log (user_id, season_id, xp_amount, source, source_details) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [userId, seasonId, amount, source, sourceDetails],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        
        return {
            oldTier: battlePass.current_tier,
            newTier: Math.min(newTier, season.max_tier),
            currentXP: tierXP,
            totalXP: newTotalXP,
            xpToNextTier: season.xp_per_tier - tierXP,
            tierUp: newTier > battlePass.current_tier
        };
    }

    // Purchase premium Battle Pass
    async purchasePremium(userId) {
        const seasonId = await this.getCurrentSeasonId();
        const battlePass = await this.getUserBattlePass(userId, seasonId);
        
        if (battlePass.is_premium) {
            throw new Error('Premium Battle Pass already purchased');
        }
        
        if (database.isPostgres) {
            await database.db.query(
                `UPDATE user_battle_pass 
                SET is_premium = TRUE, purchased_at = CURRENT_TIMESTAMP 
                WHERE user_id = $1 AND season_id = $2`,
                [userId, seasonId]
            );
        } else {
            await new Promise((resolve, reject) => {
                database.db.run(
                    `UPDATE user_battle_pass 
                    SET is_premium = 1, purchased_at = CURRENT_TIMESTAMP 
                    WHERE user_id = ? AND season_id = ?`,
                    [userId, seasonId],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        
        return { success: true, seasonId };
    }

    // Claim reward
    async claimReward(userId, tier, isPremium) {
        const seasonId = await this.getCurrentSeasonId();
        const battlePass = await this.getUserBattlePass(userId, seasonId);
        
        // Check if user has reached the tier
        if (battlePass.current_tier < tier) {
            throw new Error('Tier not yet reached');
        }
        
        // Check if premium reward and user has premium
        if (isPremium && !battlePass.is_premium) {
            throw new Error('Premium Battle Pass required');
        }
        
        // Check if already claimed
        const claimedList = JSON.parse(isPremium ? battlePass.claimed_premium_rewards : battlePass.claimed_free_rewards);
        if (claimedList.includes(tier)) {
            throw new Error('Reward already claimed');
        }
        
        // Get reward details
        const reward = await this.getReward(seasonId, tier, isPremium);
        if (!reward) {
            throw new Error('Reward not found');
        }
        
        // Mark as claimed
        claimedList.push(tier);
        const columnName = isPremium ? 'claimed_premium_rewards' : 'claimed_free_rewards';
        
        if (database.isPostgres) {
            await database.db.query(
                `UPDATE user_battle_pass SET ${columnName} = $1 WHERE user_id = $2 AND season_id = $3`,
                [JSON.stringify(claimedList), userId, seasonId]
            );
        } else {
            await new Promise((resolve, reject) => {
                database.db.run(
                    `UPDATE user_battle_pass SET ${columnName} = ? WHERE user_id = ? AND season_id = ?`,
                    [JSON.stringify(claimedList), userId, seasonId],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        
        // TODO: Apply reward to user account (coins, gems, skins, etc.)
        
        return reward;
    }

    // Get season details
    async getSeason(seasonId) {
        if (database.isPostgres) {
            const result = await database.db.query(
                `SELECT * FROM battle_pass_seasons WHERE id = $1`,
                [seasonId]
            );
            return result.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT * FROM battle_pass_seasons WHERE id = ?`,
                    [seasonId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });
        }
    }

    // Get current active season ID
    async getCurrentSeasonId() {
        if (database.isPostgres) {
            const result = await database.db.query(
                `SELECT id FROM battle_pass_seasons WHERE is_active = TRUE LIMIT 1`
            );
            return result.rows[0]?.id || 1;
        } else {
            return new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT id FROM battle_pass_seasons WHERE is_active = 1 LIMIT 1`,
                    [],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row?.id || 1);
                    }
                );
            });
        }
    }

    // Get all seasons
    async getAllSeasons() {
        if (database.isPostgres) {
            const result = await database.db.query(
                `SELECT * FROM battle_pass_seasons ORDER BY start_date DESC`
            );
            return result.rows;
        } else {
            return new Promise((resolve, reject) => {
                database.db.all(
                    `SELECT * FROM battle_pass_seasons ORDER BY start_date DESC`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });
        }
    }

    // Get reward
    async getReward(seasonId, tier, isPremium) {
        if (database.isPostgres) {
            const result = await database.db.query(
                `SELECT * FROM battle_pass_rewards 
                WHERE season_id = $1 AND tier = $2 AND is_premium = $3`,
                [seasonId, tier, isPremium]
            );
            return result.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT * FROM battle_pass_rewards 
                    WHERE season_id = ? AND tier = ? AND is_premium = ?`,
                    [seasonId, tier, isPremium ? 1 : 0],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });
        }
    }

    // Get all rewards for a season
    async getSeasonRewards(seasonId) {
        if (database.isPostgres) {
            const result = await database.db.query(
                `SELECT * FROM battle_pass_rewards 
                WHERE season_id = $1 
                ORDER BY tier ASC, is_premium ASC`,
                [seasonId]
            );
            return result.rows;
        } else {
            return new Promise((resolve, reject) => {
                database.db.all(
                    `SELECT * FROM battle_pass_rewards 
                    WHERE season_id = ? 
                    ORDER BY tier ASC, is_premium ASC`,
                    [seasonId],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });
        }
    }
}

module.exports = new BattlePassService();