const express = require("express");
const router = express.Router();

const validate = require("../../middlewares/validate");
const validators = require("../../validators");
const validationHelpers = require("../../validators/validationHelpers");

const quizController = require("../../controllers/teacher/quiz.controller");

router.post(
    "/",
    validate(validators.quizValidator.create),
    quizController.createQuiz,
);
router.put(
    "/:id",
    validate(validators.quizValidator.update),
    validate(validationHelpers.uuidParamSchema, "params"),
    quizController.updateQuiz,
);
router.delete(
    "/:id",
    validate(validationHelpers.uuidParamSchema, "params"),
    quizController.deleteQuiz,
);
router.get(
    "/",
    validate(validationHelpers.paginationSchema, "query"),
    quizController.getAllQuizzes,
);
router.get(
    "/options-selection", 
    quizController.getAllQuizOptions
);
router.get(
    "/:id",
    validate(validationHelpers.uuidParamSchema, "params"),
    quizController.getQuizById,
);
router.get(
    "/:id/quizzes-by-subject",
    validate(validationHelpers.uuidParamSchema, "params"),
    validate(validationHelpers.paginationSchema, "query"),
    quizController.getQuizzesBySubjectId,
);

// questions
router.post(
    '/questions/:id',
    validate(validationHelpers.uuidParamSchema, 'params'),
    validate(validators.questionValidator.bulkCreate),
    quizController.addQuestions
);
router.put(
    "/questions/:id",
    validate(validators.questionValidator.update),
    validate(validationHelpers.uuidParamSchema, "params"),
    quizController.updateQuestion,
);
router.delete(
    "/questions/:id",
    validate(validationHelpers.uuidParamSchema, "params"),
    quizController.deleteQuestion,
);

module.exports = router;
