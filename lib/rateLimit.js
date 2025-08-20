// Simple in-memory rate limiter for serverless functions
class RateLimit {
    constructor(windowMs = 60000, maxAttempts = 5) {
        this.windowMs = windowMs;
        this.maxAttempts = maxAttempts;
        this.attempts = new Map();
        
        // Clean up old entries every 5 minutes
        setInterval(() => {
            const now = Date.now();
            for (const [key, data] of this.attempts) {
                if (now - data.firstAttempt > this.windowMs * 2) {
                    this.attempts.delete(key);
                }
            }
        }, 5 * 60 * 1000);
    }
    
    isAllowed(identifier) {
        const now = Date.now();
        const key = this.getKey(identifier);
        
        if (!this.attempts.has(key)) {
            this.attempts.set(key, {
                count: 1,
                firstAttempt: now,
                lastAttempt: now
            });
            return { allowed: true, remaining: this.maxAttempts - 1 };
        }
        
        const data = this.attempts.get(key);
        
        // Reset window if enough time has passed
        if (now - data.firstAttempt > this.windowMs) {
            this.attempts.set(key, {
                count: 1,
                firstAttempt: now,
                lastAttempt: now
            });
            return { allowed: true, remaining: this.maxAttempts - 1 };
        }
        
        // Check if limit exceeded
        if (data.count >= this.maxAttempts) {
            return { 
                allowed: false, 
                remaining: 0,
                resetTime: data.firstAttempt + this.windowMs
            };
        }
        
        // Increment counter
        data.count++;
        data.lastAttempt = now;
        
        return { 
            allowed: true, 
            remaining: this.maxAttempts - data.count 
        };
    }
    
    getKey(identifier) {
        // Use IP address and a hash for privacy
        return this.hashString(identifier);
    }
    
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
}

// Create rate limiter instances for different endpoints
const scoreSubmissionLimiter = new RateLimit(60000, 5); // 5 submissions per minute
const scoreCheckLimiter = new RateLimit(60000, 20); // 20 checks per minute

module.exports = {
    scoreSubmissionLimiter,
    scoreCheckLimiter
};