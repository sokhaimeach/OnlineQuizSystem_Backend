const express = require("express");
const router = express.Router();

const validate = require("../../middlewares/validate");
const validationHelpers = require("../../validators/validationHelpers");

const studentController = require("../../controllers/teacher/student.controller");

router.get(
    "/:id/class",
    validate(validationHelpers.uuidParamSchema, "params"),
    studentController.getStudentsByClass,
);
router.get(
    "/:id",
    validate(validationHelpers.uuidParamSchema, "params"),
    studentController.getStudentById,
);
router.get(
    "/:id/attempts-histories",
    validate(validationHelpers.uuidParamSchema, "params"),
    studentController.getStudentAttemptHistories,
);
router.get(
    "/attempts/:id",
    validate(validationHelpers.uuidParamSchema, "params"),
    studentController.getStudentAttemptDetail,
);

module.exports = router;
