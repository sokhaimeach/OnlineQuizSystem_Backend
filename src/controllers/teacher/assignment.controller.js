const { Op, col } = require("sequelize");
const ERROR_CODES = require("../../constants/errorCode");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const {
    Assignment,
    Quiz,
    Question,
    QuizAttempt,
    sequelize,
} = require("../../models");
const {
    getClassById,
    getTeacherByUserId,
} = require("../../services/teacher.service");
const assignmentService = require("../../services/assignment.service");
const AppError = require("../../utils/AppError");
const { successResponse } = require("../../utils/response");
const { quizOwnershipInclude } = require("../../helpers/include");

// create assignment
const createAssignment = asyncHandler(async (req, res) => {
    const {
        quiz_id,
        class_id,
        title,
        type,
        instructions,
        start_date,
        due_date,
        allow_late_submission,
        status,
    } = req.body;

    const teacher = await getTeacherByUserId(req.user.id);

    if (class_id) {
        await getClassById(class_id, teacher.id);
    }

    await assignmentService.validateQuizForAssignment(quiz_id, teacher.id);

    const existingQuiz = await Quiz.findOne({
        where: { id: quiz_id, teacher_id: teacher.id },
        include: [
            {
                model: Question,
                as: "questions",
                attributes: ["score"],
            },
        ],
    });

    const assignment = await Assignment.create({
        quiz_id,
        class_id,
        title,
        type,
        instructions,
        start_date,
        due_date,
        allow_late_submission,
        status,
        total_score: existingQuiz.questions.reduce(
            (total, question) => total + Number(question.score || 0),
            0,
        ),
        passing_score: existingQuiz.passing_score ?? 0,
        total_question: existingQuiz.questions.length,
    });

    return successResponse(res, "Assignment create successfully");
});

// update assignment
const updateAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        class_id,
        title,
        type,
        instructions,
        start_date,
        due_date,
        allow_late_submission,
        status,
    } = req.body;

    const teacher = await getTeacherByUserId(req.user.id);

    // find quiz
    const assignment = await Assignment.findOne({
        where: {
            id,
            [Op.or]: [
                { status: "DRAFT" },
                {
                    [Op.and]: [
                        { status: "PUBLISHED" },
                        { start_date: { [Op.gt]: new Date() } },
                    ],
                },
            ],
        },
        include: quizOwnershipInclude({ teacher_id: teacher.id }),
    });
    if (!assignment) {
        throw new AppError(ERROR_CODES.ASSIGNMENT_NOT_FOUND, "Assignment not found or cannot be updated", 404);
    }

    // check if class exist
    if (class_id) {
        await getClassById(class_id, teacher.id);
    }

    assignment.class_id = class_id;
    assignment.title = title;
    assignment.type = type;
    assignment.instructions = instructions;
    assignment.start_date = start_date;
    assignment.due_date = due_date;
    assignment.allow_late_submission = allow_late_submission;
    assignment.status = status;

    await assignment.save();

    return successResponse(res, "Assignment update successfully");
});

// delete assignment
const deleteAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teacher = await getTeacherByUserId(req.user.id);

    // find quiz
    const assignment = await Assignment.findOne({
        where: { id, status: "DRAFT" },
        include: quizOwnershipInclude({ teacher_id: teacher.id }),
    });
    if (!assignment) {
        throw new AppError(ERROR_CODES.ASSIGNMENT_NOT_FOUND, "Assignment not found or cannot be deleted", 404);
    }

    await assignment.destroy();

    return successResponse(res, "Assignment delete successfully");
});

const getAssignmentsByClassId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const search = req.query.search?.trim() || "";
    const filter = req.query.filter?.trim() || "";

    const teacher = await getTeacherByUserId(req.user.id);

    let whereCondition = {
        class_id: id,
    };
    if (search) {
        whereCondition[Op.or] = [
            {
                title: {
                    [Op.like]: `%${search}%`,
                },
            },
            {
                "$Quiz.title$": {
                    [Op.like]: `%${search}%`,
                },
            },
        ];
    }

    if (filter) {
        whereCondition.status = filter;
    }

    // get data and count from database
    const [data, count] = await Promise.all([
        Assignment.findAll({
            where: whereCondition,
            order: [["created_at", "DESC"]],
            offset: (page - 1) * limit,
            limit,
            include: quizOwnershipInclude({ teacher_id: teacher.id }),
        }),
        Assignment.count({
            where: whereCondition,
            include: quizOwnershipInclude({ teacher_id: teacher.id }),
        }),
    ]);

    return successResponse(
        res,
        "Fetch all assignment by class id successfully",
        data,
        200,
        {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit: limit,
        },
    );
});

// get all attempt by assignment id
const getAttemptByAssignmentId = asyncHandler(async (req, res) => {
    const { id: assignmentId } = req.params;
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const teacher = await getTeacherByUserId(req.user.id);

    const ownershipInclude = [
        {
            model: Assignment,
            as: "assignment",
            required: true,
            attributes: [],
            include: [
                {
                    model: Quiz,
                    as: "quiz",
                    required: true,
                    attributes: [],
                    where: { teacher_id: teacher.id },
                },
            ],
        },
    ];

    const [data, count] = await Promise.all([
        QuizAttempt.findAll({
            where: { assignment_id: assignmentId },
            attributes: { exclude: ["question_order"] },
            include: ownershipInclude,
            order: [["submitted_at", "DESC"]],
            offset: (page - 1) * limit,
            limit,
        }),

        QuizAttempt.count({
            where: { assignment_id: assignmentId },
            include: ownershipInclude,
        }),
    ]);

    return successResponse(
        res,
        "Fetch all attempt by assignment id successfully",
        data,
        200,
        {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit: limit,
        },
    );
});

module.exports = {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentsByClassId,
    getAttemptByAssignmentId,
};
