const { asyncHandler } = require("./asyncHandler");
const { QuizAttempt, Student } = require('../models');
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../constants/errorCode");

const attemptAccess = asyncHandler(async (req, res, next) => {

    // Logged-in student
    if (req.user?.student) {
        const attempt = await QuizAttempt.findOne({
            where: {
                id: req.params.id,
                student_id: req.user.student.id
            }
        });

        if (!attempt) {
            throw new AppError(
                ERROR_CODES.ATTEMPT_NOT_FOUND,
                "Attempt not found or access denied",
                404,
            );
        }

        req.attempt = attempt;
        return next();
    }

    // Guest student
    const token = req.headers["x-attempt-token"];

    if (!token) {
        throw new AppError(
            ERROR_CODES.UNAUTHORIZED,
            "Access token is required for guest access",
            401,
        );
    }

    const attempt = await QuizAttempt.findOne({
        where: {
            id: req.params.id,
            access_token: token,
        },
    });

    if (!attempt) {
        throw new AppError(
            ERROR_CODES.ATTEMPT_NOT_FOUND,
            "Attempt not found or invalid access token",
            404,
        );
    }

    req.attempt = attempt;
    next();
});

module.exports = attemptAccess;