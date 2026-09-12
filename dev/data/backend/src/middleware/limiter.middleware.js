const rateLimit = require('express-rate-limit');

// limit request count per client per time frame
function limiterMiddleware(windowMs, limit, message) {
    console.log('[limiter] created: ', windowMs, ' ', limit, ' ', message);
    try {
        const limiter = rateLimit({
            windowMs,
            limit,
            standardHeaders: 'draft-8',
            legacyHeaders: false,
            ...(message ? { message } : {}),
        });

        return limiter;
    } catch (e) {
        console.error('[limiter] Error:', e);
        return (req, res, next) => {
            console.error('⚠️ Rate limiter is not working - check configuration');
            next(); // Allow request through
        };
    }
}

module.exports = { limiterMiddleware };
