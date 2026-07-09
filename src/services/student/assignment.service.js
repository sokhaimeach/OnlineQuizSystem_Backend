const { Op } = require("sequelize");
const {
    Assignment,
    QuizAttempt,
    Quiz,
    Class,
    ClassStudent,
    Student,
} = require("../../models");
const AppError = require("../../utils/AppError");
const ERROR_CODES = require("../../constants/errorCode");

function computeAssignmentStatus(assignment, attempt) {
    const now = new Date();
    const startDate = new Date(assignment.start_date);
    const dueDate = new Date(assignment.due_date);

    if (attempt && (attempt.status === "SUBMITTED" || attempt.status === "TIMEOUT")) {
        return "COMPLETED";
    }
    if (dueDate < now) {
        return "OVERDUE";
    }
    if (startDate <= now) {
        return "ACTIVE";
    }
    return "UPCOMING";
}

const statusFilterMap = {
    ACTIVE: { start_date: { [Op.lte]: new Date() }, due_date: { [Op.gte]: new Date() } },
    UPCOMING: { start_date: { [Op.gt]: new Date() } },
    OVERDUE: { due_date: { [Op.lt]: new Date() } },
};

async function getAssignments(studentId, { page = 1, limit = 10, search = "", filter = "" }) {
    const classStudents = await ClassStudent.findAll({
        where: { student_id: studentId },
        attributes: ["class_id"],
    });

    const classIds = classStudents.map((cs) => cs.class_id);
    if (classIds.length === 0) {
        return { data: [], meta: { totalItems: 0, totalPages: 0, currentPage: page, limit } };
    }

    let whereCondition = {
        class_id: { [Op.in]: classIds },
        status: "PUBLISHED",
    };

    if (search) {
        whereCondition[Op.or] = [
            { title: { [Op.like]: `%${search}%` } },
            { "$Quiz.title$": { [Op.like]: `%${search}%` } },
        ];
    }

    if (filter && statusFilterMap[filter]) {
        Object.assign(whereCondition, statusFilterMap[filter]);
    }

    if (filter === "COMPLETED") {
        const completedAttempts = await QuizAttempt.findAll({
            where: {
                student_id: studentId,
                status: { [Op.in]: ["SUBMITTED", "TIMEOUT"] },
            },
            attributes: ["assignment_id"],
        });
        const completedAssignmentIds = completedAttempts.map((a) => a.assignment_id);
        whereCondition.id = { [Op.in]: completedAssignmentIds };
    }

    const { count, rows } = await Assignment.findAndCountAll({
        where: whereCondition,
        include: [
            {
                model: Class,
                as: "class",
                attributes: ["id", "class_name"],
            },
            {
                model: Quiz,
                as: "quiz",
                attributes: ["id", "title", "duration_minutes", "status"],
                where: { status: { [Op.ne]: "DRAFT" } },
                required: true,
            },
            {
                model: QuizAttempt,
                as: "attempts",
                where: { student_id: studentId },
                required: false,
                attributes: ["id", "status", "total_score", "correct_count", "wrong_count", "started_at", "submitted_at"],
                limit: 1,
                order: [["created_at", "DESC"]],
            },
        ],
        order: [["start_date", "ASC"]],
        offset: (page - 1) * limit,
        limit,
    });

    const data = rows.map((a) => {
        const assignmentJson = a.toJSON();
        const attempt = assignmentJson.attempts?.[0] || null;
        const status = computeAssignmentStatus(assignmentJson, attempt);

        return {
            id: assignmentJson.id,
            title: assignmentJson.title,
            instructions: assignmentJson.instructions,
            type: assignmentJson.type,
            start_date: assignmentJson.start_date,
            due_date: assignmentJson.due_date,
            allow_late_submission: assignmentJson.allow_late_submission,
            total_score: assignmentJson.total_score,
            total_question: assignmentJson.total_question,
            status,
            class: assignmentJson.class || null,
            quiz: assignmentJson.quiz
                ? {
                      id: assignmentJson.quiz.id,
                      title: assignmentJson.quiz.title,
                      duration_minutes: assignmentJson.quiz.duration_minutes,
                  }
                : null,
            attempt: attempt
                ? {
                      id: attempt.id,
                      status: attempt.status,
                      score: attempt.total_score,
                      correct_count: attempt.correct_count,
                      wrong_count: attempt.wrong_count,
                      started_at: attempt.started_at,
                      submitted_at: attempt.submitted_at,
                  }
                : null,
        };
    });

    return {
        data,
        meta: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
        },
    };
}

async function getAssignmentById(studentId, assignmentId) {
    const classStudents = await ClassStudent.findAll({
        where: { student_id: studentId },
        attributes: ["class_id"],
    });
    const classIds = classStudents.map((cs) => cs.class_id);

    const assignment = await Assignment.findOne({
        where: {
            id: assignmentId,
            class_id: { [Op.in]: classIds },
            status: "PUBLISHED",
        },
        include: [
            {
                model: Class,
                as: "class",
                attributes: ["id", "class_name"],
            },
            {
                model: Quiz,
                as: "quiz",
                attributes: ["id", "title", "duration_minutes", "description", "total_score", "passing_score", "total_question", "status"],
                where: { status: { [Op.ne]: "DRAFT" } },
                required: true,
            },
            {
                model: QuizAttempt,
                as: "attempts",
                where: { student_id: studentId },
                required: false,
                attributes: ["id", "status", "total_score", "correct_count", "wrong_count", "started_at", "submitted_at"],
                limit: 1,
                order: [["created_at", "DESC"]],
            },
        ],
    });

    if (!assignment) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Assignment not found", 404);
    }

    const json = assignment.toJSON();
    const attempt = json.attempts?.[0] || null;
    const status = computeAssignmentStatus(json, attempt);

    return {
        id: json.id,
        title: json.title,
        instructions: json.instructions,
        type: json.type,
        start_date: json.start_date,
        due_date: json.due_date,
        allow_late_submission: json.allow_late_submission,
        total_score: json.total_score,
        total_question: json.total_question,
        status,
        class: json.class || null,
        quiz: json.quiz || null,
        attempt: attempt
            ? {
                  id: attempt.id,
                  status: attempt.status,
                  score: attempt.total_score,
                  correct_count: attempt.correct_count,
                  wrong_count: attempt.wrong_count,
                  started_at: attempt.started_at,
                  submitted_at: attempt.submitted_at,
              }
            : null,
    };
}

module.exports = {
    getAssignments,
    getAssignmentById,
};
