const express = require("express");
const router = express.Router();

const validate = require("../../middlewares/validate");
const validators = require("../../validators");

const userController = require('../../controllers/user.controller')

router.get('/', 
    userController.getStudentAccount
);

router.put(
    '/',
    validate(validators.userValidator.updateUserWithStudent),
    userController.updateUserAndStudent
);

module.exports = router;