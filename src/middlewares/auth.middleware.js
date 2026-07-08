const jwt = require('jsonwebtoken');
const { asyncHandler } = require('./asyncHandler');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCode');
const { User } = require('../models');

const auth = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(ERROR_CODES.UNAUTHORIZED, "Unauthorized", 401);
    }

    const token = authHeader.split(' ')[1];

    try{
        // verify refresh token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const foundUser = await User.findByPk(decoded.id);
        if (!foundUser) {
            throw new AppError(ERROR_CODES.FORBIDDEN, "Forbidden", 403);
        }

        req.user = foundUser;
        next();
    } catch(error) {
        throw new AppError(ERROR_CODES.TOKEN_EXPIRED, "Token expired", 401);
    }
});

module.exports = auth;