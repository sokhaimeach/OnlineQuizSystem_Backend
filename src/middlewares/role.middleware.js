const ERROR_CODES = require("../constants/errorCode");
const AppError = require("../utils/AppError");

const permission = (...roles) => {
    return (req, res, next) => {
        const { role: userRole } = req.user;
        if (!userRole) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED, "unauthorized", 401);
        }

        if (!roles.includes(userRole)) {
            throw new AppError(ERROR_CODES.ACCESS_DENIED, 'Access denied', 403);
        }
        next();
    }
};

module.exports = permission;