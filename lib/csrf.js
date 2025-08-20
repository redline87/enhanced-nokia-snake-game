// Simple CSRF protection for the Snake game
const crypto = require('crypto');

class CSRFProtection {
    constructor() {
        this.tokens = new Map();
        this.secretKey = process.env.CSRF_SECRET || 'snake-game-csrf-secret-key';
        
        // Clean up expired tokens every 10 minutes
        setInterval(() => {
            const now = Date.now();
            for (const [token, data] of this.tokens) {
                if (now - data.created > 30 * 60 * 1000) { // 30 minutes expiry
                    this.tokens.delete(token);
                }
            }
        }, 10 * 60 * 1000);
    }
    
    generateToken(identifier) {
        const token = crypto.randomBytes(32).toString('hex');
        const hash = crypto.createHmac('sha256', this.secretKey)
            .update(token + identifier)
            .digest('hex');
            
        this.tokens.set(token, {
            hash,
            identifier,
            created: Date.now()
        });
        
        return token;
    }
    
    validateToken(token, identifier) {
        if (!token || !this.tokens.has(token)) {
            return false;
        }
        
        const data = this.tokens.get(token);
        
        // Check if token is expired (30 minutes)
        if (Date.now() - data.created > 30 * 60 * 1000) {
            this.tokens.delete(token);
            return false;
        }
        
        // Validate the hash
        const expectedHash = crypto.createHmac('sha256', this.secretKey)
            .update(token + identifier)
            .digest('hex');
            
        if (data.hash !== expectedHash || data.identifier !== identifier) {
            return false;
        }
        
        // Token is valid, remove it (one-time use)
        this.tokens.delete(token);
        return true;
    }
}

const csrfProtection = new CSRFProtection();

module.exports = csrfProtection;