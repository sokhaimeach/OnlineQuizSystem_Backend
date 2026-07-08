const ERROR_CODES = require("../constants/errorCode");

const errorHandler = (error, req, res, next) => {
    const statusCode = error.statusCode || 500;

    // validation error
    if (error.errorCode === ERROR_CODES.VALIDATION_ERROR) {
        return res.status(400).json({
            success: false,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
            message: error.message,
            details: error.details || {}
        });
    }

    const response = {
        success: false,
        errorCode:
            error.errorCode ||
            ERROR_CODES.INTERNAL_SERVER_ERROR,
        message:
            error.message ||
            "Something went wrong"
    };
    if (process.env.NODE_ENV === "development") {
        response.stack = error.stack;
    }

    return res.status(statusCode).json(response);
}

module.exports = errorHandler;