const database = require('../../../lib/database');
const { scoreCheckLimiter } = require('../../../lib/rateLimit');
const { ValidationError, RateLimitError, DatabaseError, handleApiError } = require('../../../lib/errors');

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
        // Rate limiting for score checks
        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
        const rateLimitResult = scoreCheckLimiter.isAllowed(clientIP);
        
        if (!rateLimitResult.allowed) {
            throw new RateLimitError(rateLimitResult.resetTime);
        }
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
        
        const score = parseInt(req.query.score);
        
        if (isNaN(score)) {
            throw new ValidationError('Score must be a number', 'score');
        }
        
        if (score < 0) {
            throw new ValidationError('Score cannot be negative', 'score');
        }
        
        if (score > 10000) {
            throw new ValidationError('Score seems unusually high', 'score');
        }
        
        try {
            const result = await database.checkScoreQualifies(score);
            res.json(result);
        } catch (error) {
            throw new DatabaseError('Failed to check score qualification', error);
        }
    } catch (error) {
        handleApiError(error, req, res);
    }
}