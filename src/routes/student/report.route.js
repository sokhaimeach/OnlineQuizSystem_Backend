const express = require("express");
const router = express.Router();

const reportController = require("../../controllers/student/report.controller");

router.get("/dashboard", reportController.getDashboard);
router.get("/attempts", reportController.getAttempts);
router.get("/performance", reportController.getPerformance);

module.exports = router;
