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
                ERROR_CODES.ACCESS_DENIED,
                "Access denied",
                403
            );
        }

        req.attempt = attempt;
        return next();
    }

    // Guest student
    const token = req.headers["x-attempt-token"];

    const attempt = await QuizAttempt.findOne({
        where: {
            id: req.params.id,
            access_token: token
        }
    });

    if (!attempt) {
        throw new AppError(
            ERROR_CODES.ACCESS_DENIED,
            "Access denied",
            403
        );
    }

    req.attempt = attempt;
    next();
});

module.exports = attemptAccess;