const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('./database');

// JWT secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'snake-game-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

class AuthService {
    constructor() {
        this.initializeAuthTables();
    }

    async initializeAuthTables() {
        await database.connect();
        
        if (database.isPostgres) {
            // PostgreSQL schema
            await database.db.query(`
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
                )
            `);

            // User profile table
            await database.db.query(`
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
                )
            `);

            // Sessions table for token management
            await database.db.query(`
                CREATE TABLE IF NOT EXISTS sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    token VARCHAR(500) UNIQUE NOT NULL,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    revoked BOOLEAN DEFAULT FALSE
                )
            `);
        } else {
            // SQLite schema for local development
            database.db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    display_name TEXT,
                    level INTEGER DEFAULT 1,
                    experience INTEGER DEFAULT 0,
                    coins INTEGER DEFAULT 0,
                    gems INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    is_premium INTEGER DEFAULT 0,
                    premium_expires DATETIME,
                    banned INTEGER DEFAULT 0
                )
            `);

            database.db.run(`
                CREATE TABLE IF NOT EXISTS user_profiles (
                    user_id INTEGER PRIMARY KEY,
                    avatar_id TEXT DEFAULT 'snake_default',
                    title TEXT,
                    bio TEXT,
                    country TEXT,
                    total_games INTEGER DEFAULT 0,
                    total_score INTEGER DEFAULT 0,
                    high_score INTEGER DEFAULT 0,
                    play_time INTEGER DEFAULT 0,
                    achievements_unlocked INTEGER DEFAULT 0,
                    battle_pass_tier INTEGER DEFAULT 0,
                    battle_pass_xp INTEGER DEFAULT 0,
                    clan_id INTEGER,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `);

            database.db.run(`
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    token TEXT UNIQUE NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME NOT NULL,
                    revoked INTEGER DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `);
        }
    }

    // Register new user
    async register(username, email, password, displayName = null) {
        // Validate input
        if (!username || username.length < 3 || username.length > 50) {
            throw new Error('Username must be between 3 and 50 characters');
        }
        
        if (!email || !this.isValidEmail(email)) {
            throw new Error('Invalid email address');
        }
        
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        // Check if user already exists
        const existingUser = await this.getUserByUsername(username);
        if (existingUser) {
            throw new Error('Username already taken');
        }

        const existingEmail = await this.getUserByEmail(email);
        if (existingEmail) {
            throw new Error('Email already registered');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Insert user
        if (database.isPostgres) {
            const result = await database.db.query(
                `INSERT INTO users (username, email, password_hash, display_name) 
                 VALUES ($1, $2, $3, $4) RETURNING id, username, email, display_name, level, coins, gems`,
                [username, email, passwordHash, displayName || username]
            );
            
            const user = result.rows[0];
            
            // Create user profile
            await database.db.query(
                `INSERT INTO user_profiles (user_id) VALUES ($1)`,
                [user.id]
            );
            
            return user;
        } else {
            return new Promise((resolve, reject) => {
                database.db.run(
                    `INSERT INTO users (username, email, password_hash, display_name) 
                     VALUES (?, ?, ?, ?)`,
                    [username, email, passwordHash, displayName || username],
                    function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            const userId = this.lastID;
                            
                            // Create user profile
                            database.db.run(
                                `INSERT INTO user_profiles (user_id) VALUES (?)`,
                                [userId],
                                (err) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve({
                                            id: userId,
                                            username,
                                            email,
                                            display_name: displayName || username,
                                            level: 1,
                                            coins: 0,
                                            gems: 0
                                        });
                                    }
                                }
                            );
                        }
                    }
                );
            });
        }
    }

    // Login user
    async login(username, password, ipAddress = null, userAgent = null) {
        // Get user
        const user = await this.getUserByUsername(username);
        if (!user) {
            throw new Error('Invalid username or password');
        }

        // Check if banned
        if (user.banned) {
            throw new Error('Account has been banned');
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            throw new Error('Invalid username or password');
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                email: user.email 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Calculate expiration
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Store session
        if (database.isPostgres) {
            await database.db.query(
                `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [user.id, token, ipAddress, userAgent, expiresAt]
            );

            // Update last login
            await database.db.query(
                `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
                [user.id]
            );
        } else {
            await new Promise((resolve, reject) => {
                database.db.run(
                    `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [user.id, token, ipAddress, userAgent, expiresAt.toISOString()],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            await new Promise((resolve, reject) => {
                database.db.run(
                    `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
                    [user.id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Get user profile
        const profile = await this.getUserProfile(user.id);

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.display_name,
                level: user.level,
                experience: user.experience,
                coins: user.coins,
                gems: user.gems,
                isPremium: user.is_premium,
                profile
            }
        };
    }

    // Verify JWT token
    async verifyToken(token) {
        try {
            // Verify JWT signature
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Check if session exists and is valid
            const session = await this.getSession(token);
            if (!session || session.revoked) {
                throw new Error('Invalid session');
            }

            // Check if session expired
            const now = new Date();
            const expiresAt = new Date(session.expires_at);
            if (now > expiresAt) {
                throw new Error('Session expired');
            }

            // Get user
            const user = await this.getUserById(decoded.id);
            if (!user || user.banned) {
                throw new Error('Invalid user');
            }

            return {
                valid: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    displayName: user.display_name,
                    level: user.level,
                    coins: user.coins,
                    gems: user.gems,
                    isPremium: user.is_premium
                }
            };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Logout (revoke token)
    async logout(token) {
        if (database.isPostgres) {
            await database.db.query(
                `UPDATE sessions SET revoked = TRUE WHERE token = $1`,
                [token]
            );
        } else {
            await new Promise((resolve, reject) => {
                database.db.run(
                    `UPDATE sessions SET revoked = 1 WHERE token = ?`,
                    [token],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
    }

    // Helper functions
    async getUserByUsername(username) {
        if (database.isPostgres) {
            const result = await database.db.query(
                `SELECT * FROM users WHERE username = $1`,
                [username]
            );
            return result.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT * FROM users WHERE username = ?`,
                    [username],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });
        }
    }

    async getUserByEmail(email) {
        if (database.isPostgres) {
            const result = await database.db.query(
                `SELECT * FROM users WHERE email = $1`,
                [email]
            );
            return result.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT * FROM users WHERE email = ?`,
                    [email],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });
        }
    }

    async getUserById(id) {
        if (database.isPostgres) {
            const result = await database.db.query(
                `SELECT * FROM users WHERE id = $1`,
                [id]
            );
            return result.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT * FROM users WHERE id = ?`,
                    [id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });
        }
    }

    async getUserProfile(userId) {
        if (database.isPostgres) {
            const result = await database.db.query(
                `SELECT * FROM user_profiles WHERE user_id = $1`,
                [userId]
            );
            return result.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT * FROM user_profiles WHERE user_id = ?`,
                    [userId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });
        }
    }

    async getSession(token) {
        if (database.isPostgres) {
            const result = await database.db.query(
                `SELECT * FROM sessions WHERE token = $1`,
                [token]
            );
            return result.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT * FROM sessions WHERE token = ?`,
                    [token],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Middleware for Express
    authMiddleware() {
        return async (req, res, next) => {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const result = await this.verifyToken(token);
            if (!result.valid) {
                return res.status(401).json({ error: result.error || 'Invalid token' });
            }

            req.user = result.user;
            next();
        };
    }
}

module.exports = new AuthService();