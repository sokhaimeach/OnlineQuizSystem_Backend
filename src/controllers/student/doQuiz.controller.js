const { Op } = require("sequelize");
const ERROR_CODES = require("../../constants/errorCode");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const {
    Quiz,
    Question,
    AnswerOption,
    Student,
    Assignment,
    QuizAttempt,
    StudentAnswer,
    User,
    sequelize,
} = require("../../models");
const AppError = require("../../utils/AppError");
const { successResponse } = require("../../utils/response");
const {
    calculateQuizResult,
    getAssignmentWithQuiz,
    orderQuestions,
    validateAttempt,
    validateTimeLimit,
    validateTimeLimitSync,
    isAssignmentOverdue,
    findExistingAttempt,
    buildAttemptState,
    flattenAnswers,
} = require("../../services/quizAttempt.service");
const { validateAttemptCreation } = require("../../services/assignment.service");
const { shuffleArray } = require("../../utils/shuffleArray");
const crypto = require("crypto");

const getStudentFromUser = async (user) => {
    if (!user) return null;
    if (user.student) return user.student;
    return Student.findOne({
        where: { user_id: user.id },
        include: [{ model: User, as: "user", required: true }],
    });
};

// create quiz attempt
const createQuizAttempt = asyncHandler(async (req, res) => {
    const { assignment_id } = req.body;
    let guest_name = req.body.guest_name;

    const student = await getStudentFromUser(req.user);
    const student_id = student?.id || null;

    // Check for existing attempt first
    if (student_id) {
        const existing = await findExistingAttempt(assignment_id, student_id);
        if (existing) {
            const assignment = await getAssignmentWithQuiz(assignment_id);
            if (!assignment) {
                throw new AppError(ERROR_CODES.ASSIGNMENT_NOT_FOUND, "Assignment not found", 404);
            }
            const state = buildAttemptState(existing, assignment);
            return successResponse(res, state.message, state);
        }
    }

    // Validate assignment
    const assignment = await validateAttemptCreation(assignment_id, student_id, guest_name);

    // Fetch quiz with questions for ordering
    const quizWithQuestions = await Quiz.findByPk(assignment.quiz_id, {
        include: [{ model: Question, as: "questions" }],
    });

    if (student_id) {
        guest_name = student.user
            ? student.user.first_name + " " + student.user.last_name
            : guest_name;
    }

    const questionOrder = (
        quizWithQuestions.randomize_questions
            ? shuffleArray(quizWithQuestions.questions)
            : quizWithQuestions.questions
    ).map((q) => q.id);

    const quizAttempt = await QuizAttempt.create({
        assignment_id,
        student_id,
        guest_name,
        access_token: crypto.randomBytes(32).toString("hex"),
        question_order: questionOrder,
        started_at: new Date(),
        status: "IN_PROGRESS",
    });

    const state = buildAttemptState(quizAttempt, assignment);
    return successResponse(res, "Quiz attempt created", {
        ...state,
        attempt_id: quizAttempt.id,
        access_token: quizAttempt.access_token,
    });
});

// get quiz for student to show at quiz that student have to do
const getQuizForStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const attempt = await QuizAttempt.findByPk(id, {
        include: [
            {
                model: Assignment,
                as: "assignment",
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
                                        attributes: { exclude: ["is_correct"] },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    });

    if (!attempt) {
        return successResponse(res, "Attempt not found", {
            status: "NOT_FOUND",
            canStart: false,
            canContinue: false,
            canSubmit: false,
            canViewResult: false,
            redirect: "/student/assignments",
            message: "Quiz attempt not found",
        });
    }

    const assignment = attempt.assignment;
    const quiz = assignment?.quiz;

    if (!quiz) {
        return successResponse(res, "Quiz not found", {
            status: "QUIZ_DELETED",
            canStart: false,
            canContinue: false,
            canSubmit: false,
            canViewResult: false,
            redirect: "/student/assignments",
            message: "The associated quiz has been deleted.",
        });
    }

    if (quiz.status === "DRAFT") {
        return successResponse(res, "Quiz is not available", {
            status: "QUIZ_DRAFT",
            canStart: false,
            canContinue: false,
            canSubmit: false,
            canViewResult: false,
            redirect: "/student/assignments",
            message: "This quiz is currently in draft mode.",
        });
    }

    if (assignment.status !== "PUBLISHED") {
        return successResponse(res, "Assignment not available", {
            status: "ASSIGNMENT_UNPUBLISHED",
            canStart: false,
            canContinue: false,
            canSubmit: false,
            canViewResult: false,
            redirect: "/student/assignments",
            message: "This assignment is no longer available.",
        });
    }

    const overdue = isAssignmentOverdue(assignment);
    const timeExpired = validateTimeLimitSync(assignment, attempt);

    // Already finished
    if (attempt.status === "SUBMITTED" || attempt.status === "TIMEOUT") {
        return successResponse(res, "Quiz already completed", {
            status: attempt.status,
            canStart: false,
            canContinue: false,
            canSubmit: false,
            canViewResult: true,
            redirect: `/result/${attempt.id}`,
            message: "This quiz has already been submitted.",
        });
    }

    // Attempt expired while in progress - due date passed
    if (overdue) {
        await attempt.update({
            status: "TIMEOUT",
            total_score: 0,
            correct_count: 0,
            wrong_count: assignment.total_question,
            submitted_at: new Date(),
        });
        return successResponse(res, "Quiz time has expired", {
            status: "TIMEOUT",
            canStart: false,
            canContinue: false,
            canSubmit: false,
            canViewResult: true,
            redirect: `/result/${attempt.id}`,
            message: "Assignment deadline has passed.",
        });
    }

    // Time limit exceeded
    if (timeExpired) {
        return successResponse(res, "Time limit exceeded", {
            status: "TIMEOUT",
            canStart: false,
            canContinue: false,
            canSubmit: true,
            canViewResult: false,
            message: "Your time is running out. Please submit your answers.",
        });
    }

    // Reorder questions
    if (attempt.question_order && quiz.questions) {
        quiz.questions = orderQuestions(
            quiz.questions,
            attempt.question_order,
        );
    }

    return successResponse(res, "Quiz loaded successfully", {
        status: "IN_PROGRESS",
        canSubmit: !overdue,
        canViewResult: false,
        ...attempt.toJSON(),
    });
});

const submitQuiz = asyncHandler(async (req, res) => {
    const { id: attemptId } = req.params;
    const { answers = [] } = req.body;

    let attempt = await validateAttempt(attemptId);

    const assignment = await getAssignmentWithQuiz(attempt.assignment_id);
    if (!assignment) {
        await attempt.update({
            status: "TIMEOUT",
            submitted_at: new Date(),
        });
        throw new AppError(
            ERROR_CODES.ASSIGNMENT_NOT_FOUND,
            "Assignment not found",
            404,
        );
    }

    if (!assignment.quiz) {
        await attempt.update({
            status: "TIMEOUT",
            submitted_at: new Date(),
        });
        throw new AppError(
            ERROR_CODES.QUIZ_NOT_FOUND,
            "Associated quiz has been deleted",
            404,
        );
    }

    if (assignment.quiz.status === "DRAFT") {
        throw new AppError(
            ERROR_CODES.QUIZ_IS_DRAFT,
            "Cannot submit to a draft quiz",
            400,
        );
    }

    const overdue = isAssignmentOverdue(assignment);
    if (overdue) {
        await attempt.update({
            status: "TIMEOUT",
            total_score: 0,
            correct_count: 0,
            wrong_count: assignment.total_question,
            submitted_at: new Date(),
        });
        return successResponse(res, "Assignment is already closed", {
            status: "TIMEOUT",
            attempt_id: attempt.id,
            canViewResult: true,
            redirect: `/result/${attempt.id}`,
            message: "Assignment deadline has passed.",
        });
    }

    const isExpired = await validateTimeLimit(assignment, attempt);

    const questionIds = [...new Set(answers.map((a) => a.question_id))];

    const questions = await Question.findAll({
        where: { id: { [Op.in]: questionIds }, quiz_id: assignment.quiz.id },
        include: [{ model: AnswerOption, as: "options" }],
    });

    if (questions.length !== questionIds.length) {
        throw new AppError(
            ERROR_CODES.BAD_REQUEST,
            "Some questions do not belong to this quiz",
            400,
        );
    }

    const { totalScore, correctCount, wrongCount } = calculateQuizResult(
        questions,
        answers,
        assignment.total_question,
    );
    const answersData = flattenAnswers(answers, attemptId);

    await sequelize.transaction(async (t) => {
        await StudentAnswer.bulkCreate(answersData, { transaction: t });
        await attempt.update(
            {
                status: isExpired ? "TIMEOUT" : "SUBMITTED",
                submitted_at: new Date(),
                total_score: totalScore,
                correct_count: correctCount,
                wrong_count: wrongCount,
            },
            { transaction: t },
        );
    });

    return successResponse(res, "Quiz submitted successfully", {
        attempt_id: attempt.id,
        status: isExpired ? "TIMEOUT" : "SUBMITTED",
        total_score: totalScore,
        correct_count: correctCount,
        wrong_count: wrongCount,
        submitted_at: attempt.submitted_at,
        canViewResult: true,
        redirect: `/result/${attempt.id}`,
    });
});

// get attempt by id
const getQuizResultByAttemptId = asyncHandler(async (req, res) => {
    const { id: attemptId } = req.params;

    const attempt = await QuizAttempt.findOne({
        where: { id: attemptId, status: { [Op.ne]: "IN_PROGRESS" } },
        include: [
            {
                model: Assignment,
                as: "assignment",
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
                                        attributes: { exclude: ["is_correct"] },
                                    },
                                    {
                                        model: StudentAnswer,
                                        as: "answers",
                                        include: [
                                            {
                                                model: AnswerOption,
                                                as: "selected_option",
                                                attributes: [
                                                    ["id", "selected_id"],
                                                    "option_text",
                                                    "is_correct",
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    });

    if (!attempt) {
        throw new AppError(ERROR_CODES.ATTEMPT_NOT_FOUND, "Result not found", 404);
    }

    if (!attempt.assignment || !attempt.assignment.quiz) {
        throw new AppError(ERROR_CODES.QUIZ_NOT_FOUND, "Associated quiz has been deleted", 404);
    }

    const quiz = attempt.assignment.quiz;
    const { questions: _, ...newQuiz } = quiz.toJSON();

    // Fix: use due_date instead of non-existent end_date
    const canShowResult =
        quiz.show_result_immediately ||
        new Date() >= new Date(attempt.assignment.due_date);

    if (!canShowResult) {
        return successResponse(res, "Result is not available yet", {
            result_available: false,
            available_at: attempt.assignment.due_date,
            attempt: {
                id: attempt.id,
                student_id: attempt.student_id,
                guest_name: attempt.guest_name,
                attempt_number: attempt.attempt_number,
                access_token: attempt.access_token,
                status: attempt.status,
                started_at: attempt.started_at,
                submitted_at: attempt.submitted_at,
            },
            assignment: {
                id: attempt.assignment.id,
                title: attempt.assignment.title,
                due_date: attempt.assignment.due_date,
            },
            quiz: newQuiz,
        });
    }

    if (!quiz.show_correct_answers) {
        return successResponse(res, "Get quiz summary successfully", {
            result_available: true,
            show_correct_answers: false,
            score: attempt.total_score,
            total_score: attempt.assignment.total_score,
            total_question: attempt.assignment.total_question,
            correct_count: attempt.correct_count,
            wrong_count: attempt.wrong_count,
            passing_score: attempt.assignment.passing_score,
            attempt: {
                id: attempt.id,
                student_id: attempt.student_id,
                guest_name: attempt.guest_name,
                attempt_number: attempt.attempt_number,
                access_token: attempt.access_token,
                status: attempt.status,
                started_at: attempt.started_at,
                submitted_at: attempt.submitted_at,
            },
            assignment: {
                id: attempt.assignment.id,
                title: attempt.assignment.title,
                due_date: attempt.assignment.due_date,
            },
            quiz: newQuiz,
        });
    }

    attempt.assignment.quiz.questions = orderQuestions(
        attempt.assignment.quiz.questions,
        attempt.question_order,
    );

    return successResponse(res, "Get student result successfully", {
        result_available: true,
        show_correct_answers: true,
        ...attempt.toJSON(),
    });
});

module.exports = {
    createQuizAttempt,
    getQuizForStudent,
    submitQuiz,
    getQuizResultByAttemptId,
};
