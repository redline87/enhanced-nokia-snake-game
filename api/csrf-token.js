const csrfProtection = require('../lib/csrf');

module.exports = function handler(req, res) {
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
        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const identifier = `${clientIP}-${userAgent}`;
        
        const token = csrfProtection.generateToken(identifier);
        
        res.json({ 
            token,
            expires: Date.now() + (30 * 60 * 1000) // 30 minutes from now
        });
    } catch (error) {
        console.error('CSRF token generation error:', error);
        res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
};