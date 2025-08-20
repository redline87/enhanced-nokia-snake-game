const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize SQLite database
let db;

function initDb() {
    if (!db) {
        const dbPath = path.join('/tmp', 'scores.db');
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                
                // Create scores table if it doesn't exist
                db.run(`
                    CREATE TABLE IF NOT EXISTS scores (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        score INTEGER NOT NULL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating table:', err.message);
                    } else {
                        console.log('Scores table ready');
                    }
                });
            }
        });
    }
    return db;
}

export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    const database = initDb();
    const score = parseInt(req.query.score);
    
    if (isNaN(score) || score < 0) {
        return res.status(400).json({ error: 'Valid score required' });
    }
    
    const query = `
        SELECT COUNT(*) as count 
        FROM scores 
        WHERE score > ?
    `;
    
    database.get(query, [score], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ error: 'Failed to check score' });
        } else {
            const qualifies = row.count < 10;
            res.json({ 
                qualifies, 
                position: row.count + 1,
                score 
            });
        }
    });
}