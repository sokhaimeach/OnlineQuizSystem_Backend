const express = require("express");
const router = express.Router();

const validate = require("../../middlewares/validate");
const auth = require("../../middlewares/auth.middleware");
const permission = require("../../middlewares/role.middleware");
const validators = require("../../validators");
const validationHelpers = require("../../validators/validationHelpers");

// All teacher routes require authentication and TEACHER role
router.use(auth, permission("TEACHER"));

// Resource routers
router.use("/classes", require("./classes.route"));
router.use("/subjects", require("./subjects.route"));
router.use("/quizzes", require("./quizzes.route"));
router.use("/assignments", require("./assignments.route"));
router.use("/students", require("./students.route"));
router.use('/accounts', require("./user.route"));

module.exports = router;
