const { Assignment, Quiz, Question, QuizAttempt, ClassStudent, sequelize } = require("../models");
const ERROR_CODES = require("../constants/errorCode");
const AppError = require("../utils/AppError");

async function validateQuizForAssignment(quizId, teacherId) {
    const quiz = await Quiz.findOne({
        where: { id: quizId, teacher_id: teacherId },
        include: [
            {
                model: Question,
                as: "questions",
                attributes: ["score"],
            },
        ],
    });

    if (!quiz) {
        throw new AppError(ERROR_CODES.QUIZ_NOT_FOUND, "Quiz not found", 404);
    }

    if (quiz.status === "DRAFT") {
        throw new AppError(
            ERROR_CODES.QUIZ_IS_DRAFT,
            "Draft quizzes cannot be assigned.",
            400,
        );
    }

    return quiz;
}

async function validateAttemptCreation(assignmentId, studentId, guestName) {
    const assignment = await Assignment.findByPk(assignmentId, {
        include: [{ model: Quiz, as: "quiz" }],
    });

    if (!assignment) {
        throw new AppError(
            ERROR_CODES.ASSIGNMENT_NOT_FOUND,
            "Assignment not found",
            404,
        );
    }

    if (assignment.status === "DRAFT") {
        throw new AppError(
            ERROR_CODES.ASSIGNMENT_DRAFT,
            "This assignment is not yet available.",
            400,
        );
    }

    if (assignment.status !== "PUBLISHED") {
        throw new AppError(
            ERROR_CODES.ASSIGNMENT_NOT_PUBLISHED,
            "Assignment is not published",
            400,
        );
    }

    if (assignment.start_date && new Date(assignment.start_date) > new Date()) {
        throw new AppError(
            ERROR_CODES.ASSIGNMENT_NOT_STARTED,
            "This assignment has not started yet.",
            400,
        );
    }

    if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
        throw new AppError(
            ERROR_CODES.ASSIGNMENT_EXPIRED,
            "This assignment is no longer available.",
            400,
        );
    }

    if (!assignment.quiz) {
        throw new AppError(
            ERROR_CODES.QUIZ_NOT_FOUND,
            "Associated quiz has been deleted",
            404,
        );
    }

    if (assignment.quiz.status === "DRAFT") {
        throw new AppError(
            ERROR_CODES.QUIZ_IS_DRAFT,
            "Quiz is in draft mode and cannot be accessed.",
            400,
        );
    }

    if (!studentId && !guestName) {
        throw new AppError(
            ERROR_CODES.GUEST_NAME_REQUIRED,
            "Guest name is required",
            400,
        );
    }

    // For registered students, verify they belong to the class
    if (studentId) {
        const classMember = await ClassStudent.findOne({
            where: {
                class_id: assignment.class_id,
                student_id: studentId,
            },
        });

        if (!classMember) {
            throw new AppError(
                ERROR_CODES.ACCESS_DENIED,
                "You are not a member of the class this assignment belongs to",
                403,
            );
        }
    }

    return assignment;
}

async function recalculateQuizTotalScore(quizId, transaction) {
    const questions = await Question.findAll({
        where: { quiz_id: quizId },
        attributes: ["score"],
        transaction,
    });

    const totalScore = questions.reduce(
        (total, q) => total + Number(q.score || 0),
        0,
    );

    await Quiz.update(
        { total_score: totalScore },
        { where: { id: quizId }, transaction },
    );

    return totalScore;
}

module.exports = {
    validateQuizForAssignment,
    validateAttemptCreation,
    recalculateQuizTotalScore,
};
