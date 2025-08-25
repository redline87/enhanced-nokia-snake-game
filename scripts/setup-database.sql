-- Snake Game Live Service Database Setup
-- Run this script in your PostgreSQL database to set up all tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50),
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires TIMESTAMP,
    banned BOOLEAN DEFAULT FALSE
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    avatar_id VARCHAR(50) DEFAULT 'snake_default',
    title VARCHAR(100),
    bio TEXT,
    country VARCHAR(2),
    total_games INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    high_score INTEGER DEFAULT 0,
    play_time INTEGER DEFAULT 0,
    achievements_unlocked INTEGER DEFAULT 0,
    battle_pass_tier INTEGER DEFAULT 0,
    battle_pass_xp INTEGER DEFAULT 0,
    clan_id INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    score INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Battle Pass seasons
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
);

-- Battle Pass rewards
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
);

-- User Battle Pass progression
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
);

-- Battle Pass XP log
CREATE TABLE IF NOT EXISTS battle_pass_xp_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    season_id INTEGER REFERENCES battle_pass_seasons(id),
    xp_amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL,
    source_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scores_leaderboard ON scores (score DESC, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_battle_pass_user ON user_battle_pass (user_id, season_id);

-- Insert default Battle Pass season
INSERT INTO battle_pass_seasons (name, description, start_date, end_date, max_tier, xp_per_tier, premium_price, is_active)
VALUES (
    'Genesis Season',
    'The first Battle Pass season featuring exclusive snake skins and rewards!',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '90 days',
    50,
    1000,
    9.99,
    true
) ON CONFLICT DO NOTHING;

-- Get the season ID
DO $$
DECLARE
    season_id INTEGER;
BEGIN
    SELECT id INTO season_id FROM battle_pass_seasons WHERE name = 'Genesis Season' LIMIT 1;
    
    -- Insert default rewards if season exists and has no rewards
    IF season_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM battle_pass_rewards WHERE season_id = season_id) THEN
        -- Free rewards
        INSERT INTO battle_pass_rewards (season_id, tier, is_premium, reward_type, reward_value, reward_name, reward_description) VALUES
        (season_id, 1, false, 'coins', '100', 'Coin Bundle', 'Tier 1 Free Reward'),
        (season_id, 5, false, 'skin', 'green_snake', 'Green Snake Skin', 'Tier 5 Free Reward'),
        (season_id, 10, false, 'coins', '250', 'Coin Stack', 'Tier 10 Free Reward'),
        (season_id, 15, false, 'boost', 'xp_boost_1h', 'XP Boost (1 Hour)', 'Tier 15 Free Reward'),
        (season_id, 20, false, 'skin', 'blue_snake', 'Blue Snake Skin', 'Tier 20 Free Reward'),
        (season_id, 25, false, 'coins', '500', 'Coin Pile', 'Tier 25 Free Reward'),
        (season_id, 30, false, 'avatar', 'champion_avatar', 'Champion Avatar', 'Tier 30 Free Reward'),
        (season_id, 35, false, 'boost', 'score_boost_30m', 'Score Boost (30 min)', 'Tier 35 Free Reward'),
        (season_id, 40, false, 'skin', 'purple_snake', 'Purple Snake Skin', 'Tier 40 Free Reward'),
        (season_id, 45, false, 'coins', '1000', 'Coin Treasure', 'Tier 45 Free Reward'),
        (season_id, 50, false, 'skin', 'rainbow_snake', 'Rainbow Snake Skin', 'Tier 50 Free Reward'),
        
        -- Premium rewards
        (season_id, 1, true, 'gems', '50', 'Gem Pack', 'Tier 1 Premium Reward'),
        (season_id, 5, true, 'skin', 'gold_snake', 'Golden Snake Skin', 'Tier 5 Premium Reward'),
        (season_id, 10, true, 'gems', '100', 'Gem Bundle', 'Tier 10 Premium Reward'),
        (season_id, 15, true, 'skin', 'neon_snake', 'Neon Snake Skin', 'Tier 15 Premium Reward'),
        (season_id, 20, true, 'boost', 'xp_boost_3h', 'XP Boost (3 Hours)', 'Tier 20 Premium Reward'),
        (season_id, 25, true, 'gems', '200', 'Gem Chest', 'Tier 25 Premium Reward'),
        (season_id, 30, true, 'skin', 'cyber_snake', 'Cyber Snake Skin', 'Tier 30 Premium Reward'),
        (season_id, 35, true, 'title', 'Battle Master', 'Battle Master Title', 'Tier 35 Premium Reward'),
        (season_id, 40, true, 'gems', '500', 'Gem Vault', 'Tier 40 Premium Reward'),
        (season_id, 45, true, 'skin', 'legendary_dragon', 'Dragon Snake Skin', 'Tier 45 Premium Reward'),
        (season_id, 50, true, 'skin', 'cosmic_snake', 'Cosmic Snake Skin', 'Tier 50 Premium Reward');
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup complete!';
    RAISE NOTICE 'Tables created: users, user_profiles, sessions, scores, battle_pass_seasons, battle_pass_rewards, user_battle_pass, battle_pass_xp_log';
    RAISE NOTICE 'Default Battle Pass season and rewards added';
END $$;