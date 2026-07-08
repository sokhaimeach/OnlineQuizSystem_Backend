const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const validate = require("../middlewares/validate");
const validators = require("../validators");
const upload = require("../utils/upload");
const auth = require("../middlewares/auth.middleware");

router.use(auth);

router.put(
    "/change-image", 
    upload.single("image"), 
    userController.changeUserImage
);

module.exports = router;