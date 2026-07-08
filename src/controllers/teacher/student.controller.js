const { Op } = require("sequelize");
const ERROR_CODES = require("../../constants/errorCode");
const { studentAttemptDetailInclude } = require("../../helpers/include");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const {
    Student,
    Class,
    ClassStudent,
    User,
    Quiz,
    Assignment,
    QuizAttempt,
    StudentAnswer,
    sequelize,
} = require("../../models");
const {
    getClassById,
    getTeacherByUserId,
} = require("../../services/teacher.service");
const AppError = require("../../utils/AppError");
const { successResponse } = require("../../utils/response");

// get student by class
const getStudentsByClass = asyncHandler(async (req, res) => {
    const { id: class_id } = req.params;

    // pagination
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const search = req.query.search?.trim() || "";
    const status = req.query.filter?.trim() || "";

    const teacher = await getTeacherByUserId(req.user.id);
    await getClassById(class_id, teacher.id);

    let whereCondition = {};
    if (search) {
        whereCondition = {
            [Op.or]: [
                {first_name: {[Op.like]: `%${search}%`,}},
                {last_name: {[Op.like]: `%${search}%`,}},
                {email: {[Op.like]: `%${search}%`,}},
            ]
        }
    }

    const [data, count] = await Promise.all([
        Student.findAll({
            include: [
                {
                    model: User,
                    as: "user",
                    required: true,
                    where: whereCondition
                },
                {
                    model: Class,
                    as: "classes",
                    required: true,
                    where: { id: class_id },
                    attributes: [],
                },
            ],
            subQuery: false,
            order: [[{ model: User, as: "user" }, "first_name", "ASC"]],
            offset: (page - 1) * limit,
            limit,
        }),

        Student.count({
            include: [{
                model: Class,
                as: "classes",
                required: true,
                where: { id: class_id },
                attributes: [],
            }],
        })
    ]);

    return successResponse(res, "Fetch Student successfully", data, 200, {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit: limit
    });
});

// get student by class
const getStudentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teacher = await getTeacherByUserId(req.user.id);

    // get student data
    const student = await Student.findOne({
        where: { id },
        include: [
            {
                model: User,
                as: "user",
                required: true,
            },
            {
                model: Class,
                as: "classes",
                required: true,
                where: { teacher_id: teacher.id },
            },
        ],
    });
    if (!student) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Student not found", 404);
    }

    // get stats for student
    const stats = await QuizAttempt.findOne({
        where: {
            student_id: student.id,
        },
        attributes: [
            [
                sequelize.fn("COUNT", sequelize.col("QuizAttempt.id")),
                "total_quizzes_completed",
            ],
            [sequelize.fn("AVG", sequelize.col("total_score")), "average_score"],
            [sequelize.fn("MAX", sequelize.col("total_score")), "highest_score"],
            [sequelize.fn("MIN", sequelize.col("total_score")), "lowest_score"],
        ],
        include: [
            {
                model: Assignment,
                as: 'assignment',
                required: true,
                attributes: [],
                include: [
                    {
                        model: Class,
                        as: 'class',
                        required: true,
                        attributes: [],
                        where: {
                            teacher_id: teacher.id,
                        },
                    },
                ],
            },
        ],
        raw: true,
    });

    return successResponse(res, "Student get successfully", {
        ...student.toJSON(),
        stats: {
            total_quizzes_completed: Number(stats?.total_quizzes_completed || 0),
            average_score: Number(stats?.average_score || 0),
            highest_score: Number(stats?.highest_score || 0),
            lowest_score: Number(stats?.lowest_score || 0),
        },
    });
});

// GET /students/:id/attempts
const getStudentAttemptHistories = asyncHandler(async (req, res) => {
    const { id: student_id } = req.params;

    const teacher = await getTeacherByUserId(req.user.id);

    const attempts = await QuizAttempt.findAll({
        where: {
            student_id,
            status: { [Op.ne]: 'IN_PROGRESS' }
        },
        include: [
            {
                model: Assignment,
                as: 'assignment',
                required: true,
                attributes: ["id", "title", "type"],
                include: [
                    {
                        model: Quiz,
                        as: 'quiz',
                        required: true,
                        attributes: ["id", "title"],
                        where: {
                            teacher_id: teacher.id
                        }
                    },
                    {
                        model: Class,
                        as: 'class',
                        attributes: ["id", "class_name"]
                    }
                ]
            }
        ],
        attributes: [
            "id",
            "attempt_number",
            "total_score",
            "started_at",
            "submitted_at"
        ],
        order: [["submitted_at", "DESC"]]
    });

    return successResponse(
        res,
        "Fetch student attempt history successfully",
        attempts
    );
});

// GET /attempts/:attemptId
const getStudentAttemptDetail = asyncHandler(async (req, res) => {
    const { id: attemptId } = req.params;

    const teacher = await getTeacherByUserId(req.user.id);

    const attempt = await QuizAttempt.findOne(studentAttemptDetailInclude(attemptId, teacher.id));

    if (!attempt) {
        throw new AppError(
            ERROR_CODES.NOT_FOUND,
            "Attempt not found",
            404
        );
    }

    return successResponse(
        res,
        "Fetch attempt successfully",
        attempt
    );
});

module.exports = {
    getStudentsByClass,
    getStudentById,
    getStudentAttemptHistories,
    getStudentAttemptDetail
}