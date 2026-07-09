const ERROR_CODES = require('../../constants/errorCode');
const { asyncHandler } = require('../../middlewares/asyncHandler');
const { Student, Class, ClassStudent, Teacher, User, sequelize } = require('../../models');
const { getStudentByUserId } = require('../../services/student.service');
const { getClassById } = require('../../services/teacher.service');
const AppError = require('../../utils/AppError');
const { successResponse } = require('../../utils/response');

// join class (idempotent)
const joinClass = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const student = await getStudentByUserId(req.user.id);

    // verify class exists
    await getClassById(id);

    // idempotent: check if already joined
    const existing = await ClassStudent.findOne({
        where: { class_id: id, student_id: student.id }
    });
    if (existing) {
        return successResponse(res, "You are already a member of this class", {
            alreadyJoined: true,
            class_id: id,
            student_id: student.id
        });
    }

    const join = await ClassStudent.create({ class_id: id, student_id: student.id });

    return successResponse(res, "Join class successfully", join, 201);
});

// join class within a transaction (used during registration)
const joinClassTransactional = async (classId, studentId, transaction) => {
    const existing = await ClassStudent.findOne({
        where: { class_id: classId, student_id: studentId },
        transaction
    });
    if (existing) {
        return existing;
    }
    return ClassStudent.create(
        { class_id: classId, student_id: studentId },
        { transaction }
    );
};

const getClassInfo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const data = await getClassById(id);

    return successResponse(res, "Get class info successfully", data);
});

// get class
const getClasses = asyncHandler(async (req, res) => {

    const student = await getStudentByUserId(req.user.id);

    const classes = await Class.findAll({
        include: [
            {
                model: Student,
                as: 'students',
                where: { id: student.id },
                required: true,
                attributes: []
            },
            {
                model: Teacher,
                as: 'teacher',
                include: [{
                    model: User,
                    attributes: ['first_name', 'last_name', 'avatar_url']
                }]
            }
        ]
    });

    return successResponse(res, "Fetch classes successfully", classes);
});

module.exports = {
    joinClass,
    joinClassTransactional,
    getClasses,
    getClassInfo
}
