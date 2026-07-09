const {
    Assignment,
    Quiz,
    Question,
    AnswerOption,
    QuizAttempt,
} = require("../models");
const ERROR_CODES = require("../constants/errorCode");
const AppError = require("../utils/AppError");

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 1 day

function computeEffectiveDueDate(assignment) {
    if (!assignment.due_date) return null;
    if (assignment.allow_late_submission) {
        return new Date(assignment.due_date.getTime() + GRACE_PERIOD_MS);
    }
    return new Date(assignment.due_date);
}

function isPastEffectiveDueDate(assignment) {
    const effective = computeEffectiveDueDate(assignment);
    return effective ? new Date() > effective : false;
}

function buildAttemptState(attempt, assignment) {
    const id = attempt?.id || null;
    const status = attempt?.status || null;
    const now = new Date();
    const effectiveDueDate = computeEffectiveDueDate(assignment);
    const isOverdue = effectiveDueDate ? now > effectiveDueDate : false;
    const hasTimeLimit = assignment?.quiz?.duration_minutes > 0;

    let canStart = false;
    let canContinue = false;
    let canSubmit = false;
    let canViewResult = false;
    let redirect = null;
    let message = "";

    if (!attempt) {
        canStart = !isOverdue;
        message = !isOverdue ? "Ready to start" : "Assignment deadline has passed";
    } else if (status === "IN_PROGRESS") {
        const timeExpired =
            hasTimeLimit &&
            attempt.started_at &&
            now >
            new Date(
                new Date(attempt.started_at).getTime() +
                assignment.quiz.duration_minutes * 60 * 1000,
            );

        if (timeExpired || isOverdue) {
            canViewResult = true;
            redirect = `/result/${id}`;
            message = timeExpired
                ? "Quiz time has expired"
                : "Assignment deadline has passed";
        } else {
            canContinue = true;
            canSubmit = !isOverdue;
            message = "You have an active quiz attempt";
        }
    } else if (status === "SUBMITTED" || status === "TIMEOUT") {
        canViewResult = true;
        redirect = `/result/${id}`;
        message = "You have already completed this quiz";
    }

    return {
        id,
        status,
        canStart,
        canContinue,
        canSubmit,
        canViewResult,
        redirect,
        message,
    };
}

// get and validate assignment (legacy - prefer assignmentService.validateAttemptCreation)
const getAvailableAssignment = async (assignment_id, options = {}) => {
    const assignment = await Assignment.findByPk(assignment_id, options);
    if (!assignment) {
        throw new AppError(
            ERROR_CODES.ASSIGNMENT_NOT_FOUND,
            "Assignment not found",
            404,
        );
    }

    if (assignment.status !== "PUBLISHED") {
        throw new AppError(
            ERROR_CODES.ASSIGNMENT_NOT_PUBLISHED,
            "Assignment is not published",
            400,
        );
    }

    if (assignment.start_date && assignment.start_date.getTime() > Date.now()) {
        throw new AppError(
            ERROR_CODES.ASSIGNMENT_NOT_STARTED,
            "Assignment is not available yet",
            400,
        );
    }

    return assignment;
};

const getAssignmentWithQuiz = async (assignment_id) => {
    return Assignment.findByPk(assignment_id, {
        include: [
            {
                model: Quiz,
                as: "quiz",
                include: [
                    {
                        model: Question,
                        as: "questions",
                        include: [
                            {
                                model: AnswerOption,
                                as: "options",
                            },
                        ],
                    },
                ],
            },
        ],
    });
};

// order questions by question order
const orderQuestions = (questions, order) => {
    const questionMap = new Map(
        questions.map((question) => [question.id, question]),
    );
    return order.map((questionId) => questionMap.get(questionId)).filter(Boolean);
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
        throw new AppError(
            ERROR_CODES.ATTEMPT_NOT_FOUND,
            "Quiz attempt not found",
            404,
        );
    }
    if (attempt.status !== "IN_PROGRESS") {
        throw new AppError(
            ERROR_CODES.ATTEMPT_ALREADY_SUBMITTED,
            "Quiz already submitted",
            400,
        );
    }
    return attempt;
};

const validateTimeLimitSync = (assignment, attempt) => {
    const hasTimeLimit = assignment.quiz?.duration_minutes > 0;
    const expireTime = hasTimeLimit
        ? new Date(
            new Date(attempt.started_at).getTime() +
            assignment.quiz.duration_minutes * 60 * 1000,
        )
        : null;
    return hasTimeLimit && new Date() > expireTime;
};

const validateTimeLimit = async (assignment, attempt) => {
    return validateTimeLimitSync(assignment, attempt);
};

const isAssignmentOverdue = (assignment) => {
    return isPastEffectiveDueDate(assignment);
};

// Find existing attempt for a student, or return null
const findExistingAttempt = async (assignment_id, student_id) => {
    if (!student_id) return null;
    return QuizAttempt.findOne({ where: { assignment_id, student_id } });
};

const autoTimeoutAttempt = async (attempt, assignment) => {
    return attempt.update({
        status: "TIMEOUT",
        total_score: 0,
        correct_count: 0,
        wrong_count: assignment?.total_question || 0,
        submitted_at: new Date(),
    });
};

module.exports = {
    buildAttemptState,
    getAvailableAssignment,
    getAssignmentWithQuiz,
    orderQuestions,
    flattenAnswers,
    calculateQuizResult,
    validateAttempt,
    validateTimeLimit,
    validateTimeLimitSync,
    isAssignmentOverdue,
    findExistingAttempt,
    autoTimeoutAttempt,
    computeEffectiveDueDate,
    isPastEffectiveDueDate,
};
