const ERROR_CODES = require("../../constants/errorCode");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const {
    Quiz,
    Question,
    AnswerOption,
    Assignment,
    Subject,
    sequelize,
} = require("../../models");
const { validateOptions } = require("../../services/quiz.service");
const { getTeacherByUserId, getSubjectById } = require("../../services/teacher.service");
const AppError = require("../../utils/AppError");
const { successResponse } = require("../../utils/response");

// create quiz, questions and answeroption
const createQuiz = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        duration_minutes,
        is_public,
        passing_score,
        show_result_immediately,
        show_correct_answers,
        randomize_questions,
        questions,
    } = req.body;
    let subject_id = req.body.subject_id;

    const teacher = await getTeacherByUserId(req.user.id);

    if (subject_id) {
        await getSubjectById(subject_id, teacher.id);
    } else {
        subject_id = null;
    }

    // validate options before create
    for (const question of questions) {
        validateOptions(question.options, question.question_type);
    }

    const totalScore = questions.reduce((acc, question) => acc + question.score, 0);

    // use managed transaction
    await sequelize.transaction(async (t) => {
        // create quiz
        const quiz = await Quiz.create(
            {
                teacher_id: teacher.id,
                subject_id,
                title,
                description,
                duration_minutes,
                is_public,
                passing_score,
                show_result_immediately,
                show_correct_answers,
                randomize_questions,
                total_score: totalScore,
            },
            { transaction: t },
        );

        let optionsData = [];
        // create questions and map options data
        for (const question of questions) {
            const createdQuestion = await Question.create(
                {
                    quiz_id: quiz.id,
                    question_text: question.question_text,
                    question_type: question.question_type,
                    score: question.score,
                },
                { transaction: t },
            );

            optionsData.push(
                ...question.options.map((option) => ({
                    question_id: createdQuestion.id,
                    ...option,
                })),
            );
        }

        // bulk create options
        await AnswerOption.bulkCreate(optionsData, { transaction: t });
    });

    return successResponse(res, "Quiz create successfully");
});

const addQuestions = asyncHandler(async (req, res) => {
    const {id: quizId} = req.params;
    const {questions} = req.body;

    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Quiz not found', 404);
    }

    // validate options before create
    for (const question of questions) {
        validateOptions(question.options, question.question_type);
    }

    const addedTotalScore = questions.reduce(
        (total, question) => total + question.score,
        0,
    );

    // use managed transaction
    await sequelize.transaction(async (t) => {
        let optionsData = [];
        // create questions and map options data
        for (const question of questions) {
            const createdQuestion = await Question.create(
                {
                    quiz_id: quiz.id,
                    question_text: question.question_text,
                    question_type: question.question_type,
                    score: question.score,
                },
                { transaction: t },
            );

            optionsData.push(
                ...question.options.map((option) => ({
                    question_id: createdQuestion.id,
                    ...option,
                })),
            );
        }

        // bulk create options
        await AnswerOption.bulkCreate(optionsData, { transaction: t });

        // Atomically add the new questions' scores to the quiz total.
        await quiz.increment("total_score", {
            by: addedTotalScore,
            transaction: t,
        });
    });

    return successResponse(res, "Questions added successfully");
});

// update quiz
const updateQuiz = asyncHandler(async (req, res) => {
    const { id: quizId } = req.params;
    const {
        subject_id,
        title,
        description,
        duration_minutes,
        is_public,
        passing_score,
        show_result_immediately,
        show_correct_answers,
        randomize_questions,
    } = req.body;

    const teacher = await getTeacherByUserId(req.user.id);

    const quiz = await Quiz.findOne({
        where: { id: quizId, teacher_id: teacher.id },
    });
    if (!quiz) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Quiz not found", 404);
    }

    quiz.subject_id = subject_id;
    quiz.title = title;
    quiz.description = description;
    quiz.duration_minutes = duration_minutes;
    quiz.is_public = is_public;
    quiz.passing_score = passing_score;
    quiz.show_correct_answers = show_correct_answers;
    quiz.randomize_questions = randomize_questions;
    quiz.show_result_immediately = show_result_immediately;

    await quiz.save();

    return successResponse(res, "Update quiz successfully", quiz);
});

// update question
const updateQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { question_text, question_type, score, options } = req.body;

    validateOptions(options, question_type);

    const teacher = await getTeacherByUserId(req.user.id);

    await sequelize.transaction(async (t) => {
        const question = await Question.findOne({
            where: { id },
            include: [
                {
                    model: Quiz,
                    as: 'quiz',
                    where: {
                        teacher_id: teacher.id,
                    },
                    required: true,
                },
            ],
            transaction: t,
        });
        if (!question) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "Question not found", 404);
        }

        question.question_text = question_text;
        question.question_type = question_type;
        question.score = score;

        await question.save({ transaction: t });

        // update all options that belong to question
        await Promise.all(
            options.map((option) =>
                AnswerOption.update(
                    {
                        option_text: option.option_text,
                        is_correct: option.is_correct,
                    },
                    {
                        where: {
                            id: option.id,
                            question_id: question.id,
                        },
                        transaction: t,
                    },
                ),
            ),
        );
    });

    return successResponse(res, "Question update successfully");
});

// delete quiz
const deleteQuiz = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teacher = await getTeacherByUserId(req.user.id);

    const quiz = await Quiz.findOne({
        where: {
            id,
            teacher_id: teacher.id,
        },
    });
    if (!quiz) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Quiz not found", 404);
    }

    // count assignment
    const assignmentCount = await Assignment.count({
        where: {
            quiz_id: quiz.id,
        },
    });
    // check if quiz has been assigned
    if (assignmentCount > 0) {
        throw new AppError(
            ERROR_CODES.BAD_REQUEST,
            "Cannot delete a quiz that has been assigned",
        );
    }

    await quiz.destroy();

    return successResponse(res, "Quiz deleted successfully");
});

// delete question
const deleteQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teacher = await getTeacherByUserId(req.user.id);

    const question = await Question.findOne({
        where: { id },
        include: [
            {
                model: Quiz,
                as: 'quiz',
                where: {
                    teacher_id: teacher.id,
                },
            },
        ],
    });

    if (!question) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Question not found", 404);
    }

    const assignmentExists = await Assignment.findOne({
        where: {
            quiz_id: question.quiz_id,
        },
    });

    if (assignmentExists) {
        throw new AppError(
            ERROR_CODES.BAD_REQUEST,
            "Cannot delete a question from an assigned quiz",
        );
    }

    await question.destroy();

    return successResponse(res, "Question deleted successfully");
});

// get all quizes for teacher
const getAllQuizzes = asyncHandler(async (req, res) => {
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const teacher = await getTeacherByUserId(req.user.id);

    const [data, count] = await Promise.all([
        Quiz.findAll({
            where: { teacher_id: teacher.id },
            include: [
                {
                    model: Question,
                    as: "questions",
                    attributes: [],
                },
            ],
            attributes: {
                include: [
                    [
                        sequelize.fn("COUNT", sequelize.col("questions.id")),
                        "question_count",
                    ],
                ],
            },
            group: ["Quiz.id"],
            subQuery: false,
            order: [["created_at", "DESC"]],
            offset: (page - 1) * limit,
            limit
        }),

        Quiz.count({where: { teacher_id: teacher.id }}),
    ]);

    return successResponse(res, "Fetch all quizzes successfully", data, 200, {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit: limit
    });
});

// get quiz options
const getAllQuizOptions = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);

    const quizzes = await Quiz.findAll({
    where: {
        teacher_id: teacher.id
    },
    include: [
        {
            model: Subject,
            as: "subject",
            attributes: [],
            required: false
        }
    ],
    attributes: [
        "id",
        "title",
        [
            sequelize.fn(
                "IFNULL",
                sequelize.col("subject.subject_name"),
                ""
            ),
            "subject_name"
        ]
    ]
});

    return successResponse(res, "Fetch all quizzes successfully", quizzes);
});

// get quiz by id
const getQuizById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teacher = await getTeacherByUserId(req.user.id);

    const quiz = await Quiz.findOne({
        where: {
            id,
            teacher_id: teacher.id,
        },
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
                order: [["created_at", "ASC"]]
            },
        ],
    });

    if (!quiz) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Quiz not found", 404);
    }

    return successResponse(res, "Quiz get by id successfully", quiz);
});

// get quizzes by subject id
const getQuizzesBySubjectId = asyncHandler(async (req, res) => {
    const { id: subject_id } = req.params;
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const teacher = await getTeacherByUserId(req.user.id);

    const [data, count] = await Promise.all([
        Quiz.findAll({
            where: {subject_id, teacher_id: teacher.id},
            include: [
                {
                    model: Assignment,
                    as: "assignments",
                    attributes: []
                },
                {
                    model: Question,
                    as: "questions",
                    attributes: [],
                },
            ],
            attributes: {
                include: [
                    [
                        sequelize.fn("COUNT", sequelize.col("questions.id")),
                        "question_count",
                    ],
                    [
                        sequelize.fn("COUNT", sequelize.col("assignments.id")),
                        "assignment_count",
                    ],
                ],
            },
            group: ["Quiz.id"],
            subQuery: false,
            order: [["created_at", "DESC"]],
            offset: (page - 1) * limit,
            limit
        }),
        Quiz.count({where: {subject_id, teacher_id: teacher.id}})
    ]);

    return successResponse(res, "Fetch all quizzes by subject successfully", data, 200, {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit: limit
    });
});


module.exports = {
    createQuiz,
    addQuestions,
    updateQuiz,
    updateQuestion,
    deleteQuiz,
    deleteQuestion,
    getAllQuizzes,
    getQuizById,
    getQuizzesBySubjectId,
    getAllQuizOptions
};
