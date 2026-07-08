const express = require("express");
const router = express.Router();

const userController = require("../../controllers/user.controller");
const validate = require("../../middlewares/validate");
const validators = require("../../validators");

router.get('/', userController.getTeacherAccount);
router.put('/',
    validate(validators.userValidator.updateUserWithTeacher),
    userController.updateUserAndTeacher
);

module.exports = router;