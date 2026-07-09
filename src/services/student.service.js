const { Student } = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCode');

// get student by user id
const getStudentByUserId = async (userId) => {
    const student = await Student.findOne({
        where: { user_id: userId }
    });
    if (!student) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Student not found", 404);
    }

    return student;
}

module.exports = {
    getStudentByUserId
}