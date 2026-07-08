const express = require("express");
const router = express.Router();

const {
    getFullAnalytics,
    getClassPerformance,
    getQuizPerformance,
    getScoreDistribution,
    getCompletionRate,
    getTrends,
    getStudentPerformance,
} = require("../../controllers/teacher/analytics.controller");

// GET /teacher/analytics - Full analytics suite
router.get("/", getFullAnalytics);

// GET /teacher/analytics/performance - Score distribution + trends
router.get("/performance", getTrends);

// GET /teacher/analytics/class-performance - Per-class averages
router.get("/class-performance", getClassPerformance);

// GET /teacher/analytics/quiz-performance - Per-quiz completion & scores
router.get("/quiz-performance", getQuizPerformance);

// GET /teacher/analytics/score-distribution - Score buckets
router.get("/score-distribution", getScoreDistribution);

// GET /teacher/analytics/completion-rate - Overall completion rate
router.get("/completion-rate", getCompletionRate);

// GET /teacher/analytics/trends - Weekly submissions + distribution
router.get("/trends", getTrends);

// GET /teacher/analytics/student-performance - Top performers
router.get("/student-performance", getStudentPerformance);

module.exports = router;
