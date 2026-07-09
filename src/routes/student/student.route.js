const express = require("express");
const router = express.Router();

const validate = require("../../middlewares/validate");
const auth = require("../../middlewares/auth.middleware");
const permission = require("../../middlewares/role.middleware");
const validators = require("../../validators");
const validationHelpers = require("../../validators/validationHelpers");

const classController = require("../../controllers/student/class.controller");
const quizAttemptController = require("../../controllers/student/quizAttempt.controller");

// Join class and get classes
router.post(
    "/classes/:id/join",
    auth,
    permission("STUDENT"),
    validate(validationHelpers.uuidParamSchema, "params"),
    classController.joinClass,
);
router.get("/classes", auth, permission("STUDENT"), classController.getClasses);

// Public endpoint - no auth required (shows basic class info for invitation links)
router.get(
    "/class/:id", 
    validate(validationHelpers.uuidParamSchema, "params"),
    classController.getClassInfo
);

// Get attempts by class id (student view)
router.get(
    "/classes/:id/attempts",
    auth,
    permission("STUDENT"),
    validate(validationHelpers.uuidParamSchema, "params"),
    quizAttemptController.getQuizAttemptsByClassId,
);

// attempt endpoints
router.use('/attempts', require('./attempt.route'));
router.use('/student-account', auth, require('./user.route'));

// student assignment endpoints
router.use('/assignments', auth, permission("STUDENT"), require('./assignment.route'));

// student report endpoints
router.use('/report', auth, permission("STUDENT"), require('./report.route'));

module.exports = router;
