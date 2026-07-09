const AppError = require("../utils/AppError");
const ERROR_CODES = require("../constants/errorCode");

const validateCookie = (req, res, next) => {
    const token = req.cookies?.jwt;

    if (!token || typeof token !== "string") {
        return next(
            new AppError(
                ERROR_CODES.UNAUTHORIZED,
                "Missing or invalid refresh token",
                401,
            ),
        );
    }

    next();
};

module.exports = validateCookie;
