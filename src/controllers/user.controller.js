const ERROR_CODES = require("../constants/errorCode");
const { asyncHandler } = require("../middlewares/asyncHandler");
const {
    Quiz,
    QuizAttempt,
    Subject,
    Teacher,
    Class,
    Student,
    User,
    Assignment,
    sequelize,
} = require("../models");
const deleteImage = require("../services/deleteImage.service");
const { getTeacherByUserId } = require("../services/teacher.service");
const uploadImage = require("../services/uploadImage.service");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");

// get teacher account
const getTeacherAccount = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;

    const user = await User.findOne({
        where: { id: userId },
        include: [
            {
                model: Teacher,
                as: "teacher",
            },
        ],
    });

    if (!user) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    const classesCount = await Class.count({
        where: {
            teacher_id: user.teacher.id,
        },
    });

    const quizzesCount = await Quiz.count({
        where: {
            teacher_id: user.teacher.id,
        },
    });

    const totalStudents = await Student.count({
        distinct: true,
        col: "id",
        include: [
            {
                model: Class,
                as: "classes",
                where: {
                    teacher_id: user.teacher.id,
                },
                through: {
                    attributes: [],
                },
            },
        ],
    });

    return successResponse(res, "Get Teacher account successfully", {
        ...user.toJSON(),

        stats: {
            classes_taught: classesCount,
            total_students: totalStudents,
            quizzes_created: quizzesCount,
        },
    });
});

// update user teacher data
const updateUserAndTeacher = asyncHandler(async (req, res) => {
    const {
        first_name,
        last_name,
        gender,
        bio,
        school_name,
    } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    const teacher = await getTeacherByUserId(req.user.id);

    user.first_name = first_name;
    user.last_name = last_name;
    user.gender = gender;
    user.bio = bio;

    teacher.school_name = school_name;

    await sequelize.transaction(async (t) => {
        await user.save({transaction: t});
        await teacher.save({transaction: t});
    });

    return successResponse(res, "Update user info successfully", {user, teacher});
});

// get student account
const getStudentAccount = asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    
    const user = await User.findOne({
        where: {id: userId},
        include: [{
            model: Student,
            as: 'student',
            required: true
        }]
    });
    if (!user) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    return successResponse(res, "Fetch user account successfully", user);
});

// update user and student
const updateUserAndStudent = asyncHandler(async(req, res) => {
    const {
        first_name,
        last_name,
        gender,
        bio,
        date_of_birth, phone_number, parent_phone_number
    } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    const student = await Student.findOne({where: {user_id: user.id}});
    if (!student) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Student not found", 404);
    }

    user.first_name = first_name;
    user.last_name = last_name;
    user.gender = gender;
    user.bio = bio;

    student.date_of_birth = date_of_birth;
    student.phone_number = phone_number;
    student.parent_phone_number = parent_phone_number;

    await sequelize.transaction(async (t) => {
        await user.save({transaction: t});
        await student.save({transaction: t});
    });

    return successResponse(res, "Update user and student successfully", {user, student});
});

// change user image
const changeUserImage = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    const upload = await uploadImage(req.file.path);
    if (!upload.url || !upload.publicId) {
        throw new AppError(ERROR_CODES.BAD_REQUEST, "Some thing when wrong, please try again later", 400);
    }
    await deleteImage(user.public_id);

    user.avatar_url = upload.url;
    user.public_id = upload.publicId;

    await user.save();

    return successResponse(res, "Change user image successfully", user);
});

module.exports = {
    getTeacherAccount,
    updateUserAndTeacher,
    updateUserAndStudent,
    changeUserImage,
    getStudentAccount
};
