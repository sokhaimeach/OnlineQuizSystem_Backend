const express = require("express");
const router = express.Router();

const validate = require("../../middlewares/validate");
const validators = require("../../validators");
const validationHelpers = require("../../validators/validationHelpers");

const assignmentController = require("../../controllers/teacher/assignment.controller");

router.post(
    "/",
    validate(validators.assignmentValidator.create),
    assignmentController.createAssignment,
);
router.put(
    "/:id",
    validate(validators.assignmentValidator.update),
    validate(validationHelpers.uuidParamSchema, "params"),
    assignmentController.updateAssignment,
);
router.delete(
    "/:id",
    validate(validationHelpers.uuidParamSchema, "params"),
    assignmentController.deleteAssignment,
);
router.get(
    "/:id/assignments-by-class",
    validate(validationHelpers.uuidParamSchema, "params"),
    validate(validationHelpers.paginationSchema, "query"),
    assignmentController.getAssignmentsByClassId,
);
router.get(
    "/:id/attempt-by-assignment-id",
    validate(validationHelpers.uuidParamSchema, "params"),
    validate(validationHelpers.paginationSchema, "query"),
    assignmentController.getAttemptByAssignmentId,
);

module.exports = router;
