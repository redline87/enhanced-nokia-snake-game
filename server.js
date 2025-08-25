require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./lib/database');
const auth = require('./lib/auth');
const battlepass = require('./lib/battlepass');

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

// ============== AUTHENTICATION ENDPOINTS ==============

// Register new user
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, displayName } = req.body;
    
    try {
        const user = await auth.register(username, email, password, displayName);
        res.status(201).json({ 
            success: true, 
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.display_name,
                level: user.level,
                coins: user.coins,
                gems: user.gems
            }
        });
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    try {
        const result = await auth.login(username, password, ipAddress, userAgent);
        res.json({ 
            success: true,
            token: result.token,
            user: result.user
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(401).json({ error: err.message });
    }
});

// Verify token
app.get('/api/auth/verify', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const result = await auth.verifyToken(token);
    if (result.valid) {
        res.json({ valid: true, user: result.user });
    } else {
        res.status(401).json({ valid: false, error: result.error });
    }
});

// Logout
app.post('/api/auth/logout', auth.authMiddleware(), async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    try {
        await auth.logout(token);
        res.json({ success: true });
    } catch (err) {
        console.error('Logout error:', err.message);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

// Get user profile
app.get('/api/auth/profile', auth.authMiddleware(), async (req, res) => {
    try {
        const profile = await auth.getUserProfile(req.user.id);
        res.json({ 
            user: req.user,
            profile
        });
    } catch (err) {
        console.error('Profile error:', err.message);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// ============== BATTLE PASS ENDPOINTS ==============

// Get Battle Pass status
app.get('/api/battlepass/status', auth.authMiddleware(), async (req, res) => {
    try {
        const seasonId = await battlepass.getCurrentSeasonId();
        const season = await battlepass.getSeason(seasonId);
        const userBattlePass = await battlepass.getUserBattlePass(req.user.id, seasonId);
        const rewards = await battlepass.getSeasonRewards(seasonId);
        
        res.json({
            season,
            userProgress: userBattlePass,
            rewards,
            nextTierXP: season.xp_per_tier - userBattlePass.current_xp
        });
    } catch (err) {
        console.error('Battle Pass status error:', err.message);
        res.status(500).json({ error: 'Failed to get Battle Pass status' });
    }
});

// Add XP to Battle Pass
app.post('/api/battlepass/xp', auth.authMiddleware(), async (req, res) => {
    const { amount, source, details } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid XP amount required' });
    }
    
    try {
        const result = await battlepass.addXP(req.user.id, amount, source || 'game', details);
        res.json(result);
    } catch (err) {
        console.error('Battle Pass XP error:', err.message);
        res.status(500).json({ error: 'Failed to add XP' });
    }
});

// Purchase premium Battle Pass
app.post('/api/battlepass/purchase', auth.authMiddleware(), async (req, res) => {
    try {
        // TODO: Integrate payment processing here
        const result = await battlepass.purchasePremium(req.user.id);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Battle Pass purchase error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// Claim Battle Pass reward
app.post('/api/battlepass/claim', auth.authMiddleware(), async (req, res) => {
    const { tier, isPremium } = req.body;
    
    if (!tier || tier < 1) {
        return res.status(400).json({ error: 'Valid tier required' });
    }
    
    try {
        const reward = await battlepass.claimReward(req.user.id, tier, isPremium);
        res.json({ success: true, reward });
    } catch (err) {
        console.error('Battle Pass claim error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// ============== GAME ENDPOINTS ==============

// Submit game result (with Battle Pass XP)
app.post('/api/game/end', auth.authMiddleware(), async (req, res) => {
    const { score, duration, applesEaten } = req.body;
    
    try {
        // Calculate XP based on performance
        let xp = 25; // Base XP
        xp += Math.floor(score / 10); // Bonus XP for score
        xp += Math.min(applesEaten * 2, 50); // Bonus XP for apples (max 50)
        
        // Add XP to Battle Pass
        const battlePassResult = await battlepass.addXP(
            req.user.id, 
            xp, 
            'game_completion',
            JSON.stringify({ score, duration, applesEaten })
        );
        
        // Save score if it's high enough
        if (score > 0) {
            const qualifies = await database.checkScoreQualifies(score);
            if (qualifies.qualifies) {
                await database.addScore(req.user.username, score);
            }
        }
        
        res.json({
            success: true,
            xpEarned: xp,
            battlePass: battlePassResult,
            score
        });
    } catch (err) {
        console.error('Game end error:', err.message);
        res.status(500).json({ error: 'Failed to process game result' });
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