const rateLimit = require('express-rate-limit');
const ERROR_CODES = require('../constants/errorCode');

const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 login requests per window per minute
    skipSuccessfulRequests: true,
    handler: (req, res, next, options) => {
        return res.status(options.statusCode).json({
            success: false,
            errorCode: ERROR_CODES.TOO_MANY_REQUESTS,
            message: "Too many login attempts from this IP, please try again after a 60 second pause"
        });
    },
    standardHeaders: 'draft-8',
    legacyHeaders: false,
});

module.exports = loginLimiter;
