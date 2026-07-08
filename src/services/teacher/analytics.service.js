const {
    countClasses,
    countQuizzes,
    countAssignments,
    countStudents,
    getCompletedAttempts,
    computeAggregates,
    computeClassPerformance,
    computeQuizPerformance,
    computeTopPerformers,
    computeScoreDistribution,
    computeWeeklySubmissions,
} = require("./helpers/queryHelpers");

async function getFullAnalytics(teacherId) {
    const [classCount, quizCount, assignmentCount, totalStudents, attempts] = await Promise.all([
        countClasses(teacherId),
        countQuizzes(teacherId),
        countAssignments(teacherId),
        countStudents(teacherId),
        getCompletedAttempts(teacherId),
    ]);

    const { totalAttempts, scores, averageScore, completionRate } = computeAggregates(attempts);

    return {
        summary: {
            total_classes: classCount,
            total_students: totalStudents,
            total_quizzes: quizCount,
            total_assignments: assignmentCount,
            total_attempts: totalAttempts,
            average_score: averageScore,
            completion_rate: completionRate,
        },
        class_performance: computeClassPerformance(attempts),
        quiz_performance: computeQuizPerformance(attempts),
        top_performers: computeTopPerformers(attempts, 10),
        recent_activities: attempts.slice(0, 10).map(a => ({
            type: "submission",
            description: `${a.student?.user?.first_name || "A student"} submitted "${a.assignment?.title || a.assignment?.quiz?.title || "a quiz"}"`,
            class_name: a.assignment?.class?.class_name || "",
            timestamp: a.submitted_at,
        })),
        score_distribution: computeScoreDistribution(scores),
        weekly_submissions: computeWeeklySubmissions(attempts),
    };
}

async function getClassPerformance(teacherId) {
    const attempts = await getCompletedAttempts(teacherId);
    return computeClassPerformance(attempts);
}

async function getQuizPerformance(teacherId) {
    const attempts = await getCompletedAttempts(teacherId);
    return computeQuizPerformance(attempts);
}

async function getScoreDistribution(teacherId) {
    const attempts = await getCompletedAttempts(teacherId);
    const { scores } = computeAggregates(attempts);
    return computeScoreDistribution(scores);
}

async function getCompletionRate(teacherId) {
    const attempts = await getCompletedAttempts(teacherId);
    const { completionRate } = computeAggregates(attempts);
    return { completion_rate: completionRate };
}

async function getTrends(teacherId) {
    const attempts = await getCompletedAttempts(teacherId);
    const { scores, totalAttempts, averageScore, completionRate } = computeAggregates(attempts);

    return {
        total_attempts: totalAttempts,
        average_score: averageScore,
        completion_rate: completionRate,
        weekly_submissions: computeWeeklySubmissions(attempts),
        score_distribution: computeScoreDistribution(scores),
    };
}

async function getStudentPerformance(teacherId) {
    const attempts = await getCompletedAttempts(teacherId);
    return computeTopPerformers(attempts, 50);
}

module.exports = {
    getFullAnalytics,
    getClassPerformance,
    getQuizPerformance,
    getScoreDistribution,
    getCompletionRate,
    getTrends,
    getStudentPerformance,
};
