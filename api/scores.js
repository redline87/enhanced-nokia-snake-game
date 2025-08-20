const database = require('../lib/database');
const { scoreSubmissionLimiter } = require('../lib/rateLimit');
const { ValidationError, RateLimitError, DatabaseError, handleApiError } = require('../lib/errors');

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
            // Get top 10 high scores - no rate limiting needed for reads
            try {
                const scores = await database.getTopScores();
                res.json(scores);
            } catch (error) {
                throw new DatabaseError('Failed to fetch scores', error);
            }
        } else if (req.method === 'POST') {
            // Rate limiting for score submissions
            const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
            const rateLimitResult = scoreSubmissionLimiter.isAllowed(clientIP);
            
            if (!rateLimitResult.allowed) {
                throw new RateLimitError(rateLimitResult.resetTime);
            }
            
            // Add rate limit headers
            res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
            
            // Validate and sanitize input
            const { name, score } = req.body;
            
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                throw new ValidationError('Name is required', 'name');
            }
            
            if (!score || typeof score !== 'number' || score < 0) {
                throw new ValidationError('Valid score is required', 'score');
            }
            
            if (score > 10000) {
                throw new ValidationError('Score seems unusually high - please verify', 'score');
            }
            
            // Sanitize name (max 20 characters, alphanumeric + spaces)
            const sanitizedName = name.trim()
                .substring(0, 20)
                .replace(/[^a-zA-Z0-9\s]/g, '');
            
            if (sanitizedName.length === 0) {
                throw new ValidationError('Name must contain valid characters (letters, numbers, spaces only)', 'name');
            }
            
            try {
                const result = await database.addScore(sanitizedName, score);
                console.log(`New score added: ${sanitizedName} - ${score} (IP: ${clientIP})`);
                res.status(201).json(result);
            } catch (error) {
                throw new DatabaseError('Failed to save score', error);
            }
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        handleApiError(error, req, res);
    }
}