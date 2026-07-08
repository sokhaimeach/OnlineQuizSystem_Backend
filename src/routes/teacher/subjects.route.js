const express = require("express");
const router = express.Router();

const validate = require("../../middlewares/validate");
const validators = require("../../validators");
const validationHelpers = require("../../validators/validationHelpers");

const subjectController = require("../../controllers/teacher/subject.controller");

router.post(
    "/",
    validate(validators.subjectValidator.create),
    subjectController.createSubject,
);
router.put(
    "/:id",
    validate(validators.subjectValidator.update),
    validate(validationHelpers.uuidParamSchema, "params"),
    subjectController.updateSubject,
);
router.get(
    "/", 
    validate(validationHelpers.paginationSchema, "query"), 
    subjectController.getAllSubjects
);
router.get(
    "/options",
    subjectController.getSubjectOptions
);
router.delete(
    "/:id",
    validate(validationHelpers.uuidParamSchema, "params"),
    subjectController.deleteSubject,
);

module.exports = router;
