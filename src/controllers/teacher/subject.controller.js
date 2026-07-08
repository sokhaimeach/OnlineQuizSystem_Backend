const ERROR_CODES = require('../../constants/errorCode');
const { asyncHandler } = require('../../middlewares/asyncHandler');
const { Subject, Quiz, sequelize } = require('../../models');
const { getTeacherByUserId } = require('../../services/teacher.service');
const AppError = require('../../utils/AppError');
const { successResponse } = require('../../utils/response');

// create subject
const createSubject = asyncHandler(async (req, res) => {
    const { subject_name, description } = req.body;

    const teacher = await getTeacherByUserId(req.user.id);

    const subject = await Subject.create({ teacher_id: teacher.id, subject_name, description });

    return successResponse(res, "Subject create successfully", subject);
});

// update subject
const updateSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { subject_name, description } = req.body;

    const teacher = await getTeacherByUserId(req.user.id);

    const subject = await Subject.findOne({ where: { id, teacher_id: teacher.id } });
    if (!subject) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Subject not found", 404);
    }

    subject.subject_name = subject_name;
    subject.description = description;

    await subject.save();

    return successResponse(res, "Subject update successfully", subject);
});

// get all subjects
const getAllSubjects = asyncHandler(async (req, res) => {
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const teacher = await getTeacherByUserId(req.user.id);

    const [data, count, unassignedQuizCount] = await Promise.all([
        Subject.findAll({
            where: { teacher_id: teacher.id },
            include: [{
                model: Quiz,
                as: 'quizzes',
                attributes: []
            }],
            attributes: {
                include: [[
                    sequelize.fn("COUNT", sequelize.col("quizzes.id")),
                    "quiz_count"
                ]]
            },
            group: ["Subject.id"],
            subQuery: false,
            order: [["created_at", "DESC"]],
            offset: (page - 1) * limit,
            limit
        }),

        Subject.count({ where: { teacher_id: teacher.id } }),

        Quiz.count({
            where: { teacher_id: teacher.id, subject_id: null },
        })
    ]);

    return successResponse(res, "Fetch all subject successfully", {
        subjects: data,
        unassigned_quiz_count: unassignedQuizCount
    }, 200, {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit: limit
    });
});

// get subjects options (get all subject for select dropdown in frontend)
const getSubjectOptions = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);

    const subjects = await Subject.findAll({
        where: { teacher_id: teacher.id },
        attributes: ["id", "subject_name"],      
        order: [["created_at", "DESC"]],
    });

    return successResponse(res, "Fetch subject options successfully", subjects);
});

// delete subject
const deleteSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teacher = await getTeacherByUserId(req.user.id);

    const subject = await Subject.findOne({ where: { id, teacher_id: teacher.id } });
    if (!subject) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Subject not found", 404);
    }

    await subject.destroy();

    return successResponse(res, "Subject delete successfully", subject);
});

module.exports = {
    createSubject,
    updateSubject,
    getAllSubjects,
    deleteSubject,
    getSubjectOptions
}