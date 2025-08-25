require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./lib/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Initialize database connection
database.connect().then(() => {
    console.log('Database initialized');
}).catch(err => {
    console.error('Database initialization error:', err);
});

// API Routes

// Get top 10 high scores
app.get('/api/scores', async (req, res) => {
    try {
        const scores = await database.getTopScores();
        res.json(scores);
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// Add new score
app.post('/api/scores', async (req, res) => {
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
    
    try {
        const newScore = await database.addScore(sanitizedName, score);
        console.log(`New score added: ${sanitizedName} - ${score}`);
        res.status(201).json(newScore);
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// Check if score qualifies for top 10
app.get('/api/scores/check/:score', async (req, res) => {
    const score = parseInt(req.params.score);
    
    if (isNaN(score) || score < 0) {
        return res.status(400).json({ error: 'Valid score required' });
    }
    
    try {
        const result = await database.checkScoreQualifies(score);
        res.json(result);
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ error: 'Failed to check score' });
    }
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