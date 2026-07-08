const ERROR_CODES = require('../../constants/errorCode');
const { asyncHandler } = require('../../middlewares/asyncHandler');
const { Student, Class, ClassStudent, Teacher } = require('../../models');
const { getStudentByUserId } = require('../../services/student.service');
const { getClassById } = require('../../services/teacher.service');
const AppError = require('../../utils/AppError');
const { successResponse } = require('../../utils/response');

// join class
const joinClass = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const student = await getStudentByUserId(req.user.id);

    const existingClass = await getClassById(id);

    const joinedClass = await Class.findOne({
        where: {
            id
        },
        include: [{
            model: Student,
            as: 'students',
            where: { id: student.id },
            required: true,
            attributes: []
        }]
    });
    if (joinedClass) {
        throw new AppError(ERROR_CODES.EXIST, "You alreay join this class", 400);
    }

    const join = await ClassStudent.create({ class_id: id, student_id: student.id });

    return successResponse(res, "Join class successfully", join);
});

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
                as: 'teacher'
            }
        ]
    });

    return successResponse(res, "Fetch classes successfully", classes);
});

module.exports = {
    joinClass,
    getClasses,
    getClassInfo
}
