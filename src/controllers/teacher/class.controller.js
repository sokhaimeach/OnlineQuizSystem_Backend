const { fn, literal, col, Op } = require("sequelize");
const ERROR_CODES = require("../../constants/errorCode");
const { asyncHandler } = require("../../middlewares/asyncHandler");
const {
    Class,
    Teacher,
    Subject,
    Student,
    ClassStudent,
    sequelize,
    Assignment
} = require("../../models");
const {
    getSubjectById,
    getTeacherByUserId,
    getClassById,
} = require("../../services/teacher.service");
const AppError = require("../../utils/AppError");
const { successResponse } = require("../../utils/response");

// create class
const createClass = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { class_name, description, color } = req.body;

    // find teacher
    const teacher = await getTeacherByUserId(userId);

    // craete class
    const newClass = await Class.create({
        teacher_id: teacher.id,
        class_name,
        description,
        color,
    });

    return successResponse(res, "Class create successfully", newClass);
});

// update class
const updateClass = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { class_name, description, color } = req.body;
    const { id: classId } = req.params;

    // find teacher
    const teacher = await getTeacherByUserId(userId);

    // find class
    const existingClass = await getClassById(classId, teacher.id);

    existingClass.class_name = class_name;
    existingClass.description = description;
    existingClass.color = color;

    await existingClass.save();

    return successResponse(res, "Class update successfully", existingClass);
});

const getRecentClasses = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);

    const classes = await Class.findAll({
        where: {
            teacher_id: teacher.id,
        },
        order: [["created_at", "DESC"]],
        limit: 5,
    });

    return successResponse(res, "Recent classes fetched successfully", classes);
});

// get all classes
const getAllClasses = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;

    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const search = req.query.search?.trim() || "";

    const teacher = await getTeacherByUserId(userId);

    const whereCondition = {
        teacher_id: teacher.id,
        ...(search && {
            class_name: {
                [Op.like]: `%${search}%`,
            },
        }),
    };

    const [data, count] = await Promise.all([
        Class.findAll({
            where: whereCondition,
            include: [
                {
                    model: Student,
                    as: "students",
                    attributes: [],
                },
                {
                    model: Assignment,
                    as: "assignments",
                    attributes: [],
                    required: false,
                },
            ],
            attributes: {
                include: [
                    [
                        fn(
                            "COUNT",
                            fn("DISTINCT", col("students.id"))
                        ),
                        "total_student",
                    ],
                    [
                        fn(
                            "COUNT",
                            fn("DISTINCT", col("assignments.id"))
                        ),
                        "assignment_count",
                    ],
                    [
                        literal(`
                            COUNT(DISTINCT CASE
                                WHEN assignments.due_date > NOW()
                                THEN assignments.id
                            END)
                        `),
                        "active_assignment_count",
                    ],
                ],
            },
            group: ["Class.id"],
            subQuery: false,
            order: [["created_at", "DESC"]],
            offset: (page - 1) * limit,
            limit,
        }),

        Class.count({
            where: whereCondition,
        }),
    ]);

    return successResponse(
        res,
        "Classes Fetch successfully",
        data,
        200,
        {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
        }
    );
});

// get class by id
const getClass = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { id: classId } = req.params;

    const teacher = await getTeacherByUserId(userId);
    const existingClass = await getClassById(classId, teacher.id);

    return successResponse(res, "Class fetched successfully", existingClass);
});

// delete class
const deleteClass = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { id: classId } = req.params;

    // find teacher
    const teacher = await getTeacherByUserId(userId);

    // find class that belongs to teacher
    const existingClass = await getClassById(classId, teacher.id);

    await existingClass.destroy();

    return successResponse(res, "Class deleted successfully", null);
});

module.exports = {
    createClass,
    updateClass,
    getAllClasses,
    getRecentClasses,
    getClass,
    deleteClass,
};
