const { Op, fn, col } = require("sequelize");
const {
    Class,
    Assignment,
    QuizAttempt,
    Quiz,
    ClassStudent,
    sequelize,
} = require("../../models");

async function getDashboard(studentId) {
    const now = new Date();

    const [totalClassesResult, classIdsResult, attemptsResult] = await Promise.all([
        ClassStudent.count({ where: { student_id: studentId } }),

        ClassStudent.findAll({
            where: { student_id: studentId },
            attributes: ["class_id"],
        }),

        QuizAttempt.findAll({
            where: { student_id: studentId },
            attributes: [
                "id", "status", "total_score", "correct_count", "wrong_count",
                "started_at", "submitted_at", "assignment_id",
            ],
            include: [
                {
                    model: Assignment,
                    as: "assignment",
                    attributes: ["id", "title", "total_score", "passing_score", "start_date", "due_date", "status"],
                    required: false,
                    include: [
                        {
                            model: Quiz,
                            as: "quiz",
                            attributes: ["id", "title", "duration_minutes", "status"],
                        },
                        {
                            model: Class,
                            as: "class",
                            attributes: ["id", "class_name"],
                        },
                    ],
                },
            ],
            order: [["submitted_at", "DESC"]],
        }),
    ]);

    const classIds = classIdsResult.map((cs) => cs.class_id);

    const completedAttempts = attemptsResult.filter(
        (a) => a.status === "SUBMITTED" || a.status === "TIMEOUT"
    );

    const completedAssignmentIds = new Set(
        completedAttempts.map((a) => a.assignment_id)
    );

    const inProgressByAssignment = {};
    for (const a of attemptsResult) {
        if (a.status === "IN_PROGRESS" && a.assignment_id && !inProgressByAssignment[a.assignment_id]) {
            inProgressByAssignment[a.assignment_id] = { id: a.id, status: a.status };
        }
    }

    const completedAssignments = completedAttempts.length;

    const scores = completedAttempts
        .filter(
            (a) =>
                a.total_score !== null &&
                a.assignment &&
                Number(a.assignment.total_score) > 0
        )
        .map(
            (a) =>
                (Number(a.total_score) / Number(a.assignment.total_score)) * 100
        );

    const averageScore =
        scores.length > 0
            ? Math.round(
                  (scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10
              ) / 10
            : 0;

    const baseAssignmentQuery = classIds.length > 0
        ? Assignment.findAll({
              where: {
                  class_id: { [Op.in]: classIds },
                  status: "PUBLISHED",
              },
              attributes: ["id", "title", "start_date", "due_date", "total_score", "passing_score", "total_question", "allow_late_submission"],
              include: [
                  {
                      model: Quiz,
                      as: "quiz",
                      attributes: ["id", "title", "duration_minutes", "status"],
                      where: { status: { [Op.ne]: "DRAFT" } },
                      required: true,
                  },
                  {
                      model: Class,
                      as: "class",
                      attributes: ["id", "class_name"],
                  },
              ],
              order: [["start_date", "ASC"]],
          })
        : Promise.resolve([]);

    const publishedAssignments = await baseAssignmentQuery;

    const mapAssignment = (a, status) => ({
        id: a.id,
        title: a.title,
        start_date: a.start_date,
        due_date: a.due_date,
        class: a.class || null,
        quiz: a.quiz
            ? { id: a.quiz.id, title: a.quiz.title, duration_minutes: a.quiz.duration_minutes }
            : null,
        status,
    });

    const activeAssignmentsList = [];
    const upcomingList = [];

    for (const a of publishedAssignments) {
        const start = new Date(a.start_date);
        const rawDue = new Date(a.due_date);
        const effectiveDue = a.allow_late_submission
            ? new Date(rawDue.getTime() + 24 * 60 * 60 * 1000)
            : rawDue;
        const completed = completedAssignmentIds.has(a.id);
        const inProgress = inProgressByAssignment[a.id] || null;

        if (!completed && start <= now && effectiveDue >= now) {
            activeAssignmentsList.push({
                ...mapAssignment(a, "ACTIVE"),
                total_question: a.total_question,
                remaining_seconds: Math.max(0, Math.floor((effectiveDue - now) / 1000)),
                attempt: inProgress,
            });
        } else if (!completed && !inProgress && start > now) {
            upcomingList.push(mapAssignment(a, "UPCOMING"));
        }
    }

    const recentAttempts = attemptsResult
        .filter((a) => a.assignment && a.status !== "IN_PROGRESS")
        .slice(0, 5)
        .map((a) => {
            const score =
                a.total_score !== null && a.assignment?.total_score > 0
                    ? Math.round(
                          (Number(a.total_score) /
                              Number(a.assignment.total_score)) *
                              100
                      )
                    : null;
            return {
                id: a.id,
                quiz_title: a.assignment?.quiz?.title || "",
                class_name: a.assignment?.class?.class_name || "",
                score,
                total_score: a.assignment?.total_score,
                submitted_at: a.submitted_at,
                status: a.status,
                assignment_id: a.assignment_id,
            };
        });

    return {
        total_classes: totalClassesResult,
        active_assignments: activeAssignmentsList.length,
        completed_assignments: completedAssignments,
        average_score: averageScore,
        recent_attempts: recentAttempts,
        upcoming_assignments: upcomingList.slice(0, 10),
        active_assignments_list: activeAssignmentsList,
    };
}

async function getAttempts(studentId) {
    const attempts = await QuizAttempt.findAll({
        where: { student_id: studentId },
        attributes: [
            "id", "status", "total_score", "correct_count", "wrong_count",
            "started_at", "submitted_at", "assignment_id",
        ],
        include: [
            {
                model: Assignment,
                as: "assignment",
                attributes: [
                    "id", "title", "total_score", "passing_score",
                    "total_question", "start_date", "due_date",
                ],
                required: false,
                include: [
                    {
                        model: Quiz,
                        as: "quiz",
                        attributes: ["id", "title", "duration_minutes", "status"],
                        where: { status: { [Op.ne]: "DRAFT" } },
                        required: true,
                    },
                    {
                        model: Class,
                        as: "class",
                        attributes: ["id", "class_name"],
                    },
                ],
            },
        ],
        order: [["submitted_at", "DESC"]],
    });

    return attempts
        .filter((a) => a.assignment)
        .map((a) => {
            const percentage =
                a.total_score !== null && Number(a.assignment.total_score) > 0
                    ? Math.round(
                          (Number(a.total_score) /
                              Number(a.assignment.total_score)) *
                              100
                      )
                    : null;
            return {
                id: a.id,
                status: a.status,
                score: a.total_score,
                percentage,
                correct_count: a.correct_count,
                wrong_count: a.wrong_count,
                started_at: a.started_at,
                submitted_at: a.submitted_at,
                assignment: {
                    id: a.assignment.id,
                    title: a.assignment.title,
                    total_score: a.assignment.total_score,
                    total_question: a.assignment.total_question,
                },
                quiz: a.assignment.quiz || null,
                class: a.assignment.class || null,
            };
        });
}

async function getPerformance(studentId) {
    const attempts = await QuizAttempt.findAll({
        where: {
            student_id: studentId,
            status: { [Op.in]: ["SUBMITTED", "TIMEOUT"] },
        },
        attributes: ["id", "total_score", "assignment_id"],
        include: [
            {
                model: Assignment,
                as: "assignment",
                attributes: ["id", "total_score", "passing_score"],
                required: false,
                include: [
                    {
                        model: Quiz,
                        as: "quiz",
                        attributes: ["id", "status"],
                        where: { status: { [Op.ne]: "DRAFT" } },
                        required: true,
                    },
                ],
            },
        ],
    });

    const validAttempts = attempts.filter(
        (a) =>
            a.total_score !== null &&
            a.assignment &&
            Number(a.assignment.total_score) > 0
    );

    const percentages = validAttempts.map(
        (a) => (Number(a.total_score) / Number(a.assignment.total_score)) * 100
    );

    const averageScore =
        percentages.length > 0
            ? Math.round(
                  (percentages.reduce((s, v) => s + v, 0) /
                      percentages.length) *
                      10
              ) / 10
            : 0;

    const highestScore =
        percentages.length > 0 ? Math.round(Math.max(...percentages)) : 0;
    const lowestScore =
        percentages.length > 0 ? Math.round(Math.min(...percentages)) : 0;

    const passedCount = validAttempts.filter(
        (a) =>
            Number(a.total_score) >=
            (Number(a.assignment.passing_score) || 0)
    ).length;

    const passRate =
        validAttempts.length > 0
            ? Math.round((passedCount / validAttempts.length) * 100)
            : 0;

    const quizzesCompleted = validAttempts.length;

    const classIds = (await ClassStudent.findAll({
        where: { student_id: studentId },
        attributes: ["class_id"],
    })).map((cs) => cs.class_id);

    const totalAssignments = classIds.length > 0 ? await Assignment.count({
        where: {
            class_id: { [Op.in]: classIds },
            status: "PUBLISHED",
        },
        include: [
            {
                model: Quiz,
                as: "quiz",
                where: { status: { [Op.ne]: "DRAFT" } },
                required: true,
                attributes: [],
            },
        ],
    }) : 0;

    return {
        average_score: averageScore,
        highest_score: highestScore,
        lowest_score: lowestScore,
        pass_rate: passRate,
        quizzes_completed: quizzesCompleted,
        quizzes_remaining: Math.max(0, totalAssignments - quizzesCompleted),
    };
}

module.exports = {
    getDashboard,
    getAttempts,
    getPerformance,
};
