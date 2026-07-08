const { Assignment, QuizAttempt } = require("../models");
const ERROR_CODES = require("../constants/errorCode");
const AppError = require("../utils/AppError");

// get and validate assignment
const getAvailableAssignment = async (assignment_id, options = {}) => {
    const assignment = await Assignment.findByPk(assignment_id, options);
    if (!assignment) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Assignment not found", 404);
    }

    // validate status if not published
    if (assignment.status !== "PUBLISHED") {
        throw new AppError(
            ERROR_CODES.BAD_REQUEST,
            "Assignment is not published",
            400,
        );
    }

    // validate start_date::prevent student do before it start
    if (assignment.start_date && assignment.start_date.getTime() > Date.now()) {
        throw new AppError(
            ERROR_CODES.BAD_REQUEST,
            "Assignment is not available yet",
            400,
        );
    }

    // check expired time
    if (assignment.due_date && assignment.due_date.getTime() < Date.now()) {
        throw new AppError(
            ERROR_CODES.BAD_REQUEST,
            "Assignment deadline has passed",
            400,
        );
    }

    return assignment;
};

// order questions by question order
const orderQuestions = (questions, order) => {
    // map question data
    console.log(questions, order);
    const questionMap = new Map(
        questions.map((question) => [question.id, question]),
    );

    // order questions data
    const orderedQuestions = order
        .map((questionId) => questionMap.get(questionId))
        .filter(Boolean);

    return orderedQuestions;
};

const flattenAnswers = (answers, attemptId) => {
    return answers.flatMap((answer) =>
        answer.selected_option_id.map((optionId) => ({
            attempt_id: attemptId,
            question_id: answer.question_id,
            selected_option_id: optionId,
        })),
    );
};

// Grade submitted answers. Questions not submitted are included in wrong_count.
const calculateQuizResult = (questions, answers, totalQuestion) => {
    let totalScore = 0;
    let correctCount = 0;

    const answerMap = new Map(
        answers.map((answer) => [
            answer.question_id,
            [...answer.selected_option_id].sort(),
        ]),
    );

    for (const question of questions) {
        const selectedOptionIds = answerMap.get(question.id) || [];

        const correctOptionIds = question.options
            .filter((option) => option.is_correct)
            .map((option) => option.id)
            .sort();

        const isCorrect =
            selectedOptionIds.length === correctOptionIds.length &&
            selectedOptionIds.every((id, index) => id === correctOptionIds[index]);

        if (isCorrect) {
            totalScore += question.score;
            correctCount += 1;
        }
    }

    return {
        totalScore,
        correctCount,
        wrongCount: Math.max(totalQuestion - correctCount, 0),
    };
};

const validateAttempt = async (attemptId) => {
    const attempt = await QuizAttempt.findByPk(attemptId);

    if (!attempt) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Quiz attempt not found", 404);
    }

    // Prevent resubmission
    if (attempt.status !== "IN_PROGRESS") {
        throw new AppError(ERROR_CODES.BAD_REQUEST, "Quiz already submitted", 400);
    }

    return attempt;
};

const validateTimeLimit = async (assignment, attempt) => {
    const hasTimeLimit = assignment.quiz.duration_minutes > 0;

    const expireTime = hasTimeLimit
        ? new Date(
            new Date(attempt.started_at).getTime() +
            assignment.quiz.duration_minutes * 60 * 1000,
        )
        : null;

    const isExpired = hasTimeLimit && new Date() > expireTime;

    // Reject if late submission is not allowed
    if (isExpired && !assignment.allow_late_submission) {
        await attempt.update({
            status: "TIMEOUT",
            total_score: 0,
            correct_count: 0,
            wrong_count: assignment.total_question,
            submitted_at: new Date(),
        });

        throw new AppError(ERROR_CODES.BAD_REQUEST, "Quiz time has expired", 400);
    }

    return isExpired;
};

// validate quiz attempt already exist
const validateExistingAttempt = async (assignment_id, student_id) => {
    const existingAttempt = await QuizAttempt.findOne({
        where: {
            assignment_id,
            student_id,
        },
    });

    if (existingAttempt) {
        if (existingAttempt.status === "IN_PROGRESS") {
            throw new AppError(
                ERROR_CODES.EXIST,
                "You already have an active quiz attempt",
                400,
            );
        }

        if (["SUBMITTED", "TIMEOUT"].includes(existingAttempt.status)) {
            throw new AppError(
                ERROR_CODES.EXIST,
                "You have already completed this quiz",
                400,
            );
        }
    }

    return existingAttempt;
};

module.exports = {
    calculateQuizResult,
    orderQuestions,
    getAvailableAssignment,
    flattenAnswers,
    validateAttempt,
    validateTimeLimit,
    validateExistingAttempt
};
