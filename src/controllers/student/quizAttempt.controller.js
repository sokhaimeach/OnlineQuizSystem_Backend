const { Op } = require('sequelize');
const { asyncHandler } = require('../../middlewares/asyncHandler');
const { Student, QuizAttempt, Assignment, Quiz, Class, Teacher } = require('../../models');
const { getStudentByUserId } = require('../../services/student.service');
const { successResponse } = require('../../utils/response');

// get attempt histories for student
const getQuizAttemptsByClassId = asyncHandler(async (req, res) => {
    const { id: class_id } = req.params;

    const student = await getStudentByUserId(req.user.id);

    const attempts = await QuizAttempt.findAll({
        where: {
            student_id: student.id,
            status: {[Op.ne]: 'IN_PROGRESS'}
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
                    },
                    {
                        model: Class,
                        as: 'class',
                        required: true,
                        attributes: ["id", "class_name"],
                        where: {id: class_id},
                        include: [{
                            model: Teacher,
                            as: 'teacher'
                        }]
                    }
                ]
            }
        ],
        attributes: [
            "id",
            "attempt_number",
            "total_score",
            "correct_count",
            "wrong_count",
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

const getAssignmentById = asyncHandler(async (req, res) => {

});

module.exports = {
    getQuizAttemptsByClassId
}
