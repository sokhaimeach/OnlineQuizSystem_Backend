const { Op, fn, col, literal } = require("sequelize");
const {
    Class,
    Student,
    Quiz,
    Assignment,
    QuizAttempt,
    User,
    sequelize,
} = require("../../../models");

function countClasses(teacherId) {
    return Class.count({ where: { teacher_id: teacherId } });
}

function countQuizzes(teacherId) {
    return Quiz.count({ where: { teacher_id: teacherId } });
}

function countAssignments(teacherId) {
    return Assignment.count({
        include: [{
            model: Quiz,
            as: "quiz",
            required: true,
            attributes: [],
            where: { teacher_id: teacherId },
        }],
    });
}

function countActiveAssignments(teacherId) {
    return Assignment.count({
        where: { status: "PUBLISHED" },
        include: [{
            model: Quiz,
            as: "quiz",
            required: true,
            attributes: [],
            where: { teacher_id: teacherId },
        }],
    });
}

async function countStudents(teacherId) {
    const [result] = await Class.findAll({
        where: { teacher_id: teacherId },
        attributes: [
            [fn("COUNT", fn("DISTINCT", col("students.id"))), "count"],
        ],
        include: [{
            model: Student,
            as: "students",
            attributes: [],
            through: { attributes: [] },
        }],
        raw: true,
        subQuery: false,
    });
    return Number(result?.count || 0);
}

async function getCompletedAttempts(teacherId) {
    return QuizAttempt.findAll({
        where: { status: { [Op.ne]: "IN_PROGRESS" } },
        attributes: [
            "id", "total_score", "correct_count", "wrong_count",
            "submitted_at", "student_id", "assignment_id", "status",
        ],
        include: [
            {
                model: Assignment,
                as: "assignment",
                required: true,
                attributes: ["id", "title", "total_score", "passing_score"],
                include: [
                    {
                        model: Quiz,
                        as: "quiz",
                        required: true,
                        attributes: ["id", "title"],
                        where: { teacher_id: teacherId },
                    },
                    {
                        model: Class,
                        as: "class",
                        attributes: ["id", "class_name"],
                    },
                ],
            },
            {
                model: Student,
                as: "student",
                attributes: ["id"],
                include: [{
                    model: User,
                    as: "user",
                    attributes: ["first_name", "last_name", "avatar_url"],
                }],
            },
        ],
        order: [["submitted_at", "DESC"]],
    });
}

function computeAggregates(attempts) {
    const totalAttempts = attempts.length;
    const scores = attempts
        .filter(a => a.total_score !== null && a.assignment?.total_score > 0)
        .map(a => (Number(a.total_score) / Number(a.assignment.total_score)) * 100);

    const averageScore = scores.length > 0
        ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
        : 0;

    const passedCount = attempts.filter(a => {
        const score = a.total_score !== null ? Number(a.total_score) : 0;
        return score >= (Number(a.assignment?.passing_score) || 0);
    }).length;

    const completionRate = totalAttempts > 0
        ? Math.round((passedCount / totalAttempts) * 100)
        : 0;

    return { totalAttempts, scores, averageScore, completionRate };
}

function computeClassPerformance(attempts) {
    const map = new Map();
    attempts.forEach(a => {
        const classId = a.assignment?.class?.id;
        if (!classId) return;
        if (!map.has(classId)) {
            map.set(classId, {
                class_id: classId,
                class_name: a.assignment.class.class_name || "Unknown",
                total_attempts: 0,
                total_score_sum: 0,
                max_score_sum: 0,
                unique_students: new Set(),
            });
        }
        const p = map.get(classId);
        p.total_attempts++;
        if (a.total_score !== null) p.total_score_sum += Number(a.total_score);
        if (a.assignment?.total_score > 0) p.max_score_sum += Number(a.assignment.total_score);
        if (a.student_id) p.unique_students.add(a.student_id);
    });

    return Array.from(map.values()).map(p => ({
        class_id: p.class_id,
        class_name: p.class_name,
        total_attempts: p.total_attempts,
        total_students: p.unique_students.size,
        average_score: p.max_score_sum > 0
            ? Math.round((p.total_score_sum / p.max_score_sum) * 100)
            : 0,
    }));
}

function computeQuizPerformance(attempts) {
    const map = new Map();
    attempts.forEach(a => {
        const id = a.assignment_id;
        if (!map.has(id)) {
            map.set(id, {
                assignment_id: id,
                title: a.assignment?.title || a.assignment?.quiz?.title || "Unknown",
                total_attempts: 0,
                completed_attempts: 0,
                score_sum: 0,
                max_score_sum: 0,
            });
        }
        const p = map.get(id);
        p.total_attempts++;
        if (a.status === "SUBMITTED") p.completed_attempts++;
        if (a.total_score !== null) p.score_sum += Number(a.total_score);
        if (a.assignment?.total_score > 0) p.max_score_sum += Number(a.assignment.total_score);
    });

    return Array.from(map.values()).map(p => ({
        assignment_id: p.assignment_id,
        title: p.title,
        total_attempts: p.total_attempts,
        completed_attempts: p.completed_attempts,
        completion_rate: p.total_attempts > 0
            ? Math.round((p.completed_attempts / p.total_attempts) * 100) : 0,
        average_score: p.max_score_sum > 0
            ? Math.round((p.score_sum / p.max_score_sum) * 100) : 0,
    }));
}

function computeTopPerformers(attempts, limit = 10) {
    const map = new Map();
    attempts.forEach(a => {
        if (!a.student_id || !a.student?.user) return;
        if (!map.has(a.student_id)) {
            map.set(a.student_id, {
                student_id: a.student_id,
                name: `${a.student.user.first_name || ""} ${a.student.user.last_name || ""}`.trim(),
                avatar_url: a.student.user.avatar_url,
                scores: [],
                total_attempts: 0,
            });
        }
        const p = map.get(a.student_id);
        if (a.total_score !== null && a.assignment?.total_score > 0) {
            p.scores.push((Number(a.total_score) / Number(a.assignment.total_score)) * 100);
        }
        p.total_attempts++;
    });

    return Array.from(map.values())
        .map(p => ({
            student_id: p.student_id,
            name: p.name,
            avatar_url: p.avatar_url,
            average_score: p.scores.length > 0
                ? Math.round(p.scores.reduce((s, v) => s + v, 0) / p.scores.length) : 0,
            total_attempts: p.total_attempts,
        }))
        .sort((a, b) => b.average_score - a.average_score)
        .slice(0, limit);
}

function computeScoreDistribution(scores) {
    const buckets = [0, 20, 40, 60, 80, 100];
    return buckets.map((bucket, i) => {
        const min = bucket;
        const max = buckets[i + 1] || 100;
        const count = scores.filter(s => s >= min && s < max).length;
        return {
            range: `${min}-${max === 100 ? "100" : max}`,
            count,
            percentage: scores.length > 0 ? Math.round((count / scores.length) * 100) : 0,
        };
    });
}

function computeWeeklySubmissions(attempts) {
    const now = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        const count = attempts.filter(a => {
            const submitted = new Date(a.submitted_at);
            return submitted >= dayStart && submitted <= dayEnd;
        }).length;
        data.push({
            date: dayStart.toISOString().split("T")[0],
            count,
        });
    }
    return data;
}

module.exports = {
    countClasses,
    countQuizzes,
    countAssignments,
    countActiveAssignments,
    countStudents,
    getCompletedAttempts,
    computeAggregates,
    computeClassPerformance,
    computeQuizPerformance,
    computeTopPerformers,
    computeScoreDistribution,
    computeWeeklySubmissions,
};
