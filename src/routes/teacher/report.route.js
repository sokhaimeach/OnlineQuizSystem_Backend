const express = require("express");
const router = express.Router();

const {
    getDashboard,
    getRecentActivity,
    getUpcomingDeadlines,
} = require("../../controllers/teacher/report.controller");

// GET /teacher/report/dashboard - Summary dashboard cards
router.get("/dashboard", getDashboard);

// GET /teacher/report/activity - Recent activity feed
router.get("/activity", getRecentActivity);

// GET /teacher/report/upcoming-deadlines - Upcoming assignment deadlines
router.get("/upcoming-deadlines", getUpcomingDeadlines);

module.exports = router;
