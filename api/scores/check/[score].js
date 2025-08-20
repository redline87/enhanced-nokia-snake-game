const database = require('../../../lib/database');

module.exports = async function handler(req, res) {
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
    
    try {
        const score = parseInt(req.query.score);
        
        if (isNaN(score) || score < 0) {
            return res.status(400).json({ error: 'Valid score required' });
        }
        
        const result = await database.checkScoreQualifies(score);
        res.json(result);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to check score' });
    }
}