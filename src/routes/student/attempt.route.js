const express = require("express");
const router = express.Router();

const validate = require("../../middlewares/validate");
const validators = require("../../validators");
const validationHelpers = require("../../validators/validationHelpers");
const optionalAuth = require("../../middlewares/optionalAuth.middleware");
const attemptAccess = require("../../middlewares/attemptAccess.middleware");

const doQuizController = require("../../controllers/student/doQuiz.controller");

router.use(optionalAuth);

// Quiz attempts flow
router.post(
    "/",
    validate(validators.quizAttemptValidator.create),
    doQuizController.createQuizAttempt,
);
router.get(
    "/:id/quiz",
    validate(validationHelpers.uuidParamSchema, "params"),
    attemptAccess,
    doQuizController.getQuizForStudent,
);
router.post(
    "/:id/submit",
    validate(validationHelpers.uuidParamSchema, "params"),
    validate(validators.studentAnswerValidator.submit),
    attemptAccess,
    doQuizController.submitQuiz,
);
router.get(
    "/:id/result",
    validate(validationHelpers.uuidParamSchema, "params"),
    attemptAccess,
    doQuizController.getQuizResultByAttemptId,
);

module.exports = router;
