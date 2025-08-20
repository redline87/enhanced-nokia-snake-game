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

module.exports = function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    const database = initDb();
    
    if (req.method === 'GET') {
        // Get top 10 high scores
        const query = `
            SELECT name, score, timestamp 
            FROM scores 
            ORDER BY score DESC, timestamp ASC 
            LIMIT 10
        `;
        
        database.all(query, [], (err, rows) => {
            if (err) {
                console.error('Database error:', err.message);
                res.status(500).json({ error: 'Failed to fetch scores' });
            } else {
                res.json(rows);
            }
        });
    } else if (req.method === 'POST') {
        // Add new score
        const { name, score } = req.body;
        
        // Validate input
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        if (!score || typeof score !== 'number' || score < 0) {
            return res.status(400).json({ error: 'Valid score is required' });
        }
        
        // Sanitize name (max 20 characters, alphanumeric + spaces)
        const sanitizedName = name.trim()
            .substring(0, 20)
            .replace(/[^a-zA-Z0-9\s]/g, '');
        
        if (sanitizedName.length === 0) {
            return res.status(400).json({ error: 'Name must contain valid characters' });
        }
        
        const query = `
            INSERT INTO scores (name, score) 
            VALUES (?, ?)
        `;
        
        database.run(query, [sanitizedName, score], function(err) {
            if (err) {
                console.error('Database error:', err.message);
                res.status(500).json({ error: 'Failed to save score' });
            } else {
                console.log(`New score added: ${sanitizedName} - ${score}`);
                
                // Return the new score with ID and timestamp
                database.get(
                    'SELECT id, name, score, timestamp FROM scores WHERE id = ?',
                    [this.lastID],
                    (err, row) => {
                        if (err) {
                            res.status(201).json({ 
                                id: this.lastID, 
                                name: sanitizedName, 
                                score 
                            });
                        } else {
                            res.status(201).json(row);
                        }
                    }
                );
            }
        });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}