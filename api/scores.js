const database = require('../lib/database');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        if (req.method === 'GET') {
            // Get top 10 high scores
            const scores = await database.getTopScores();
            res.json(scores);
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
            
            const result = await database.addScore(sanitizedName, score);
            console.log(`New score added: ${sanitizedName} - ${score}`);
            res.status(201).json(result);
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database operation failed' });
    }
}