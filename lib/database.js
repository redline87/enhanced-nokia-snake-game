const sqlite3 = require('sqlite3').verbose();

// Database utility that handles both SQLite (local) and PostgreSQL (production)
class Database {
    constructor() {
        this.db = null;
        this.isPostgres = false;
    }

    async connect() {
        if (this.db) return this.db;

        // Check if we have PostgreSQL connection string (production)
        if (process.env.POSTGRES_URL) {
            const { Pool } = require('pg');
            this.isPostgres = true;
            this.db = new Pool({
                connectionString: process.env.POSTGRES_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: 10, // maximum number of clients in the pool
                idle: 30000, // how long a client is allowed to remain idle before being closed
                connectionTimeoutMillis: 2000, // how long to wait when connecting to a client
            });
            
            console.log('Connected to PostgreSQL database with connection pool');
            
            // Create table if it doesn't exist
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS scores (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(20) NOT NULL,
                    score INTEGER NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Create index for optimal leaderboard queries
            await this.db.query(`
                CREATE INDEX IF NOT EXISTS idx_scores_leaderboard 
                ON scores (score DESC, timestamp ASC)
            `);
            
            console.log('Database indexes optimized for leaderboard queries');
            
        } else {
            // Use SQLite for local development
            const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/scores.db' : './scores.db';
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error opening SQLite database:', err.message);
                } else {
                    console.log('Connected to SQLite database');
                }
            });
            
            // Create table if it doesn't exist
            this.db.run(`
                CREATE TABLE IF NOT EXISTS scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Create index for optimal leaderboard queries
            this.db.run(`
                CREATE INDEX IF NOT EXISTS idx_scores_leaderboard 
                ON scores (score DESC, timestamp ASC)
            `);
        }
        
        return this.db;
    }

    async getTopScores() {
        await this.connect();
        
        const query = `
            SELECT name, score, timestamp 
            FROM scores 
            ORDER BY score DESC, timestamp ASC 
            LIMIT 10
        `;

        if (this.isPostgres) {
            const result = await this.db.query(query);
            return result.rows;
        } else {
            return new Promise((resolve, reject) => {
                this.db.all(query, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    }

    async addScore(name, score) {
        await this.connect();
        
        const query = `
            INSERT INTO scores (name, score) 
            VALUES ($1, $2)
            ${this.isPostgres ? 'RETURNING *' : ''}
        `;

        if (this.isPostgres) {
            const result = await this.db.query(query, [name, score]);
            return result.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                this.db.run(query.replace(/\$1/g, '?').replace(/\$2/g, '?'), [name, score], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        // Get the inserted record
                        const selectQuery = 'SELECT id, name, score, timestamp FROM scores WHERE id = ?';
                        this.db.get(selectQuery, [this.lastID], (err, row) => {
                            if (err) {
                                resolve({ id: this.lastID, name, score });
                            } else {
                                resolve(row);
                            }
                        });
                    }
                });
            });
        }
    }

    async checkScoreQualifies(score) {
        await this.connect();
        
        const query = `
            SELECT COUNT(*) as count 
            FROM scores 
            WHERE score > $1
        `;

        if (this.isPostgres) {
            const result = await this.db.query(query, [score]);
            const count = parseInt(result.rows[0].count);
            return {
                qualifies: count < 10,
                position: count + 1,
                score
            };
        } else {
            return new Promise((resolve, reject) => {
                this.db.get(query.replace('$1', '?'), [score], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            qualifies: row.count < 10,
                            position: row.count + 1,
                            score
                        });
                    }
                });
            });
        }
    }

    async close() {
        if (this.db) {
            if (this.isPostgres) {
                await this.db.end(); // This will close all connections in the pool
            } else {
                this.db.close();
            }
            this.db = null;
        }
    }
}

module.exports = new Database();