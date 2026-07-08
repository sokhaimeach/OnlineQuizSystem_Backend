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
    attemptAccess,
    validate(validationHelpers.uuidParamSchema, "params"),
    doQuizController.getQuizForStudent,
);
router.post(
    "/:id/submit",
    attemptAccess,
    validate(validators.studentAnswerValidator.submit),
    validate(validationHelpers.uuidParamSchema, "params"),
    doQuizController.submitQuiz,
);
router.get(
    "/:id/result",
    attemptAccess,
    validate(validationHelpers.uuidParamSchema, "params"),
    doQuizController.getQuizResultByAttemptId,
);

module.exports = router;
