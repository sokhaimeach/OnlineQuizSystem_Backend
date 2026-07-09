const express = require("express");
const router = express.Router();

const validate = require("../../middlewares/validate");
const validators = require("../../validators");
const validationHelpers = require("../../validators/validationHelpers");

const classController = require("../../controllers/teacher/class.controller");

router.post(
    "/",
    validate(validators.classValidator.create),
    classController.createClass,
);
router.put(
    "/:id",
    validate(validators.classValidator.update),
    validate(validationHelpers.uuidParamSchema, "params"),
    classController.updateClass,
);
router.get(
    "/", 
    validate(validationHelpers.paginationSchema, "query"), 
    classController.getAllClasses
);
router.get(
    "/recent",
    classController.getRecentClasses
);
router.get(
    "/:id",
    validate(validationHelpers.uuidParamSchema, "params"),
    classController.getClass,
);
router.delete(
    "/:id",
    validate(validationHelpers.uuidParamSchema, "params"),
    classController.deleteClass,
);

module.exports = router;
