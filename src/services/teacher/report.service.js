const { Op, fn, col } = require("sequelize");
const {
    Class,
    Student,
    Quiz,
    Assignment,
    QuizAttempt,
    ClassStudent,
    User,
    sequelize,
} = require("../../models");
const AppError = require("../../utils/AppError");
const ERROR_CODES = require("../../constants/errorCode");
const {
    countClasses,
    countQuizzes,
    countAssignments,
    countActiveAssignments,
    countStudents,
    getCompletedAttempts,
    computeAggregates,
} = require("./helpers/queryHelpers");

async function getDashboard(teacherId) {
    const [classCount, quizCount, assignmentCount, activeAssignments, totalStudents, attempts] = await Promise.all([
        countClasses(teacherId),
        countQuizzes(teacherId),
        countAssignments(teacherId),
        countActiveAssignments(teacherId),
        countStudents(teacherId),
        getCompletedAttempts(teacherId),
    ]);

    const { totalAttempts, averageScore, completionRate } = computeAggregates(attempts);

    return {
        total_classes: classCount,
        total_students: totalStudents,
        total_quizzes: quizCount,
        total_assignments: assignmentCount,
        active_assignments: activeAssignments,
        total_attempts: totalAttempts,
        average_score: averageScore,
        completion_rate: completionRate,
    };
}

async function getRecentActivity(teacherId) {
    const attempts = await getCompletedAttempts(teacherId);
    return attempts.slice(0, 10).map(a => ({
        type: "submission",
        description: `${a.student?.user?.first_name || "A student"} submitted "${a.assignment?.title || a.assignment?.quiz?.title || "a quiz"}"`,
        class_name: a.assignment?.class?.class_name || "",
        timestamp: a.submitted_at,
    }));
}

async function getUpcomingDeadlines(teacherId) {
    const now = new Date();

    const assignments = await Assignment.findAll({
        where: { status: "PUBLISHED" },
        attributes: ["id", "title", "due_date", "total_question", "class_id"],
        include: [
            {
                model: Quiz,
                as: "quiz",
                required: true,
                attributes: [],
                where: { teacher_id: teacherId },
            },
            {
                model: Class,
                as: "class",
                attributes: ["id", "class_name"],
            },
            {
                model: QuizAttempt,
                as: "attempts",
                attributes: ["id", "student_id"],
                required: false,
            },
        ],
        order: [["due_date", "ASC"]],
    });

    // Count students per class using Class -> Student through ClassStudent
    const classCounts = await Class.findAll({
        where: { teacher_id: teacherId },
        attributes: [
            "id",
            [fn("COUNT", col("students.id")), "student_count"],
        ],
        include: [{
            model: Student,
            as: "students",
            attributes: [],
            through: { attributes: [] },
        }],
        group: ["Class.id"],
        subQuery: false,
        raw: true,
    });

    const studentCountMap = {};
    classCounts.forEach(row => {
        studentCountMap[row.id] = Number(row.student_count);
    });

    return assignments.map(a => {
        const dueDate = new Date(a.due_date);
        const totalStudents = studentCountMap[a.class_id] || 0;
        const submittedStudents = new Set(
            (a.attempts || []).map(att => att.student_id).filter(Boolean)
        ).size;
        const isOverdue = dueDate < now;

        let status;
        if (isOverdue) {
            status = "danger";
        } else {
            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            status = diffDays <= 2 ? "warning" : "info";
        }

        let dueLabel;
        if (isOverdue) {
            dueLabel = "Overdue";
        } else {
            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) dueLabel = "Today";
            else if (diffDays === 1) dueLabel = "Tomorrow";
            else dueLabel = `In ${diffDays} days`;
        }

        return {
            id: a.id,
            title: a.title,
            class_name: a.class?.class_name || "Unknown",
            due_date: a.due_date,
            due_label: dueLabel,
            status,
            total_students: totalStudents,
            submitted_count: submittedStudents,
        };
    });
}

module.exports = {
    getDashboard,
    getRecentActivity,
    getUpcomingDeadlines,
};
