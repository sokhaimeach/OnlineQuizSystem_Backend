class AppError extends Error {
    constructor(errorCode, message, statusCode, details = null) {
        super(message);

        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.details = details;

        this.isOperational = true;

        Error.captureStackTrace(
            this,
            this.constructor
        );
    } 
}

module.exports = AppError;