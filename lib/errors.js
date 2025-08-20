// Custom error classes for better error handling and monitoring
class GameError extends Error {
    constructor(message, code, recoverable = false, statusCode = 500) {
        super(message);
        this.name = 'GameError';
        this.code = code;
        this.recoverable = recoverable;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
        
        // Capture stack trace
        Error.captureStackTrace(this, GameError);
    }
    
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            recoverable: this.recoverable,
            statusCode: this.statusCode,
            timestamp: this.timestamp
        };
    }
}

class ValidationError extends GameError {
    constructor(message, field = null) {
        super(message, 'VALIDATION_ERROR', true, 400);
        this.name = 'ValidationError';
        this.field = field;
    }
}

class RateLimitError extends GameError {
    constructor(resetTime) {
        super('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', true, 429);
        this.name = 'RateLimitError';
        this.resetTime = resetTime;
    }
}

class DatabaseError extends GameError {
    constructor(message, originalError = null) {
        super(message, 'DATABASE_ERROR', false, 500);
        this.name = 'DatabaseError';
        this.originalError = originalError;
    }
}

// Error handler middleware for API routes
function handleApiError(error, req, res) {
    // Log error for monitoring
    console.error('API Error:', {
        url: req.url,
        method: req.method,
        error: error instanceof GameError ? error.toJSON() : error.message,
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    
    if (error instanceof GameError) {
        return res.status(error.statusCode).json({
            error: error.message,
            code: error.code,
            recoverable: error.recoverable,
            ...(error instanceof RateLimitError && { resetTime: error.resetTime })
        });
    }
    
    // Unknown error - don't expose internal details
    return res.status(500).json({
        error: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR',
        recoverable: true
    });
}

module.exports = {
    GameError,
    ValidationError,
    RateLimitError,
    DatabaseError,
    handleApiError
};