const ERROR_CODES = require("../constants/errorCode");
const AppError = require("../utils/AppError");

// validate questions
function validateOptions(options, questionType) {
    if (options.length < 2) {
        throw new AppError(
            ERROR_CODES.BAD_REQUEST,
            "Question must have at least 2 options",
        );
    }

    const correctCount = options.filter((option) => option.is_correct).length;

    if (correctCount === 0) {
        throw new AppError(
            ERROR_CODES.BAD_REQUEST,
            "Question must have at least one correct answer"
        );
    }

    if (
        questionType === "SINGLE_CHOICE" &&
        correctCount !== 1
    ) {
        throw new AppError(
            ERROR_CODES.BAD_REQUEST,
            "Single-choice questions must have exactly one correct answer"
        );
    }
}

module.exports = {
    validateOptions
}