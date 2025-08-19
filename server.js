const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Initialize SQLite database
const db = new sqlite3.Database('./scores.db', (err) => {
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

// API Routes

// Get top 10 high scores
app.get('/api/scores', (req, res) => {
    const query = `
        SELECT name, score, timestamp 
        FROM scores 
        ORDER BY score DESC, timestamp ASC 
        LIMIT 10
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ error: 'Failed to fetch scores' });
        } else {
            res.json(rows);
        }
    });
});

// Add new score
app.post('/api/scores', (req, res) => {
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
    
    db.run(query, [sanitizedName, score], function(err) {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ error: 'Failed to save score' });
        } else {
            console.log(`New score added: ${sanitizedName} - ${score}`);
            
            // Return the new score with ID and timestamp
            db.get(
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
});

// Check if score qualifies for top 10
app.get('/api/scores/check/:score', (req, res) => {
    const score = parseInt(req.params.score);
    
    if (isNaN(score) || score < 0) {
        return res.status(400).json({ error: 'Valid score required' });
    }
    
    const query = `
        SELECT COUNT(*) as count 
        FROM scores 
        WHERE score > ?
    `;
    
    db.get(query, [score], (err, row) => {
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
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server (for local development)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Snake Game Server running on http://localhost:${PORT}`);
        console.log('🐍 Game available at: http://localhost:3000');
        console.log('📊 Scores API: http://localhost:3000/api/scores');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\\nShutting down server...');
        db.close((err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Database connection closed');
            }
        });
        process.exit(0);
    });
}

// Export for Vercel
module.exports = app;