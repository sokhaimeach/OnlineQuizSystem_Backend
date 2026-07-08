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
    getAvailableAssignment,
    orderQuestions,
    validateAttempt,
    validateTimeLimit,
    flattenAnswers,
    validateExistingAttempt,
} = require("../../services/quizAttempt.service");
const { shuffleArray } = require("../../utils/shuffleArray");
const crypto = require("crypto");

// create quiz attempt
const createQuizAttempt = asyncHandler(async (req, res) => {
    const { assignment_id } = req.body;

    let student_id = null;
    let guest_name = req.body.guest_name;

    // validate assignment
    const assignment = await getAvailableAssignment(assignment_id, {
        include: [
            {
                model: Quiz,
                as: "quiz",
                include: [
                    {
                        model: Question,
                        as: "questions",
                    },
                ],
            },
        ],
    });

    let student = null;

    if (req.user) {
        student = await Student.findOne({
            where: { user_id: req.user.id },
            include: [
                {
                    model: User,
                    as: "user",
                    required: true,
                },
            ],
        });
    }

    if (student) {
        // prevent student create multiple attempt per quiz
        await validateExistingAttempt(assignment_id, student.id);

        student_id = student.id;
        guest_name = student.user.first_name + " " + student.user.last_name;
    } else if (!guest_name) {
        throw new AppError(ERROR_CODES.BAD_REQUEST, "Guest name is required", 400);
    }

    // map order questions id as array
    const questionOrder = (
        assignment.quiz.randomize_questions
            ? shuffleArray(assignment.quiz.questions)
            : assignment.quiz.questions
    ).map((question) => question.id);

    const quizAttempt = await QuizAttempt.create({
        assignment_id,
        student_id,
        guest_name,
        access_token: crypto.randomBytes(32).toString("hex"),
        question_order: questionOrder,
        started_at: new Date(),
        status: "IN_PROGRESS",
    });

    return successResponse(res, "Quiz attempt created successfully", quizAttempt);
});

// get quiz for student to show at quiz that student have to do
const getQuizForStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const attempt = await QuizAttempt.findOne({
        where: { id, status: "IN_PROGRESS" },
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
                                        attributes: {
                                            exclude: ["is_correct"],
                                        },
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
        throw new AppError(ERROR_CODES.NOT_FOUND, "Quiz not found not found", 404);
    }

    // reorder questions for each student
    attempt.assignment.quiz.questions = orderQuestions(
        attempt.assignment.quiz.questions,
        attempt.question_order,
    );

    return successResponse(res, "get quiz attempt successfully", attempt);
});

const submitQuiz = asyncHandler(async (req, res) => {
    const { id: attemptId } = req.params;
    const { answers = [] } = req.body;

    // Validate attempt
    const attempt = await validateAttempt(attemptId);

    // Get assignment and quiz
    const assignment = await getAvailableAssignment(attempt.assignment_id, {
        include: [
            {
                model: Quiz,
                as: "quiz",
                required: true,
            },
        ],
    });

    // Assignment closed
    if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
        await attempt.update({
            status: "TIMEOUT",
            total_score: 0,
            correct_count: 0,
            wrong_count: assignment.total_question,
            submitted_at: new Date(),
        });

        throw new AppError(
            ERROR_CODES.BAD_REQUEST,
            "Assignment is already closed",
            400,
        );
    }

    // Calculate quiz expiration time and validate
    const isExpired = await validateTimeLimit(assignment, attempt);

    const questionIds = [...new Set(answers.map((answer) => answer.question_id))];

    // Get all quiz questions
    const questions = await Question.findAll({
        where: {
            id: { [Op.in]: questionIds },
            quiz_id: assignment.quiz.id,
        },
        include: [
            {
                model: AnswerOption,
                as: "options",
            },
        ],
    });

    // Ensure all submitted questions belong to this quiz
    if (questions.length !== questionIds.length) {
        throw new AppError(
            ERROR_CODES.BAD_REQUEST,
            "Some questions do not belong to this quiz",
            400,
        );
    }

    // Calculate score and answer counts
    const { totalScore, correctCount, wrongCount } = calculateQuizResult(
        questions,
        answers,
        assignment.total_question,
    );

    const answersData = flattenAnswers(answers, attemptId);

    // save student answers and update attempt
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

    successResponse(res, "Quiz submitted successfully", {
        attempt_id: attempt.id,
        status: attempt.status,
        total_score: attempt.total_score,
        correct_count: attempt.correct_count,
        wrong_count: attempt.wrong_count,
        submitted_at: attempt.submitted_at,
    });
});

// get attempt by id
const getQuizResultByAttemptId = asyncHandler(async (req, res) => {
    const { id: attemptId } = req.params;

    const attempt = await QuizAttempt.findOne({
        where: { id: attemptId, status: { [Op.ne]: "IN_PROGRESS" } },
        // attributes: {exclude: ['question_order']},
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
                                        attributes: {
                                            exclude: ["is_correct"],
                                        },
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
        throw new AppError(ERROR_CODES.NOT_FOUND, "Quiz not found not found", 404);
    }

    const quiz = attempt.assignment.quiz;

    const { questions: _, ...newQuiz } = quiz.toJSON();

    const canShowResult =
        quiz.show_result_immediately || new Date() >= attempt.assignment.end_date;

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
                end_date: attempt.assignment.end_date,
            },
            quiz: newQuiz
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
                end_date: attempt.assignment.end_date,
            },
            quiz: newQuiz
        });
    }

    // show full details
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
