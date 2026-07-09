const { Teacher, Subject, Class, User } = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCode');

const getTeacherByUserId = async (userId) => {
    const teacher = await Teacher.findOne({
        where: {user_id: userId}
    });

    if (!teacher) {
        throw new AppError(
            ERROR_CODES.NOT_FOUND,
            'Teacher not found',
            404
        );
    }

    return teacher;
};

const getSubjectById = async (id, teacherId) => {
    const subject = await Subject.findOne({
        where: {
            id,
            teacher_id: teacherId
        }
    });

    if (!subject) {
        throw new AppError(
            ERROR_CODES.NOT_FOUND,
            "Subject not found",
            404
        );
    }

    return subject;
};

// get class by class id and teacher id(ownership)
const getClassById = async (id, teacherId = null) => {
    let where = { id };
    // check ownership
    if (teacherId) {
        where.teacher_id = teacherId;
    }
    const existingClass = await Class.findOne({
        where,
        include: [{
            model: Teacher,
            as: 'teacher',
            include: [{
                model: User,
                attributes: ['first_name', 'last_name', 'avatar_url']
            }]
        }]
    });

    if (!existingClass) {
        throw new AppError(
            ERROR_CODES.NOT_FOUND,
            "Class not found",
            404
        );
    }

    return existingClass;
};


module.exports = {
    getTeacherByUserId,
    getSubjectById,
    getClassById
};