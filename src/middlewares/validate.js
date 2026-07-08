const ERROR_CODES = require("../constants/errorCode");
const AppError = require("../utils/AppError");

const validate = (schema, source = 'body') => (req, res, next) => {
    const data = req[source];

    // if data is undifined return error
    if (!data) {
        return next(
            new AppError(
                ERROR_CODES.VALIDATION_ERROR,
                `${source} is required`,
                400
            )
        );
    }

    // check validation
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        return next(
            new AppError(
                ERROR_CODES.VALIDATION_ERROR, 
                "Validation failed", 
                400, 
                error.details.map((d) => d.message)
            )
        );
    }

    req[source] = value;
    next();
}

module.exports = validate;
