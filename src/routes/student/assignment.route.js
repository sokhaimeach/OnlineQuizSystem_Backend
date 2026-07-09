const express = require("express");
const router = express.Router();

const validate = require("../../middlewares/validate");
const validationHelpers = require("../../validators/validationHelpers");
const assignmentController = require("../../controllers/student/assignment.controller");

router.get(
    "/",
    validate(validationHelpers.paginationSchema, "query"),
    assignmentController.getAssignments,
);

router.get(
    "/:id",
    validate(validationHelpers.uuidParamSchema, "params"),
    assignmentController.getAssignmentById,
);

module.exports = router;
