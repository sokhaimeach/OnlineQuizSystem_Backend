const {
    register,
    login,
    logout,
    refresh,
    registerAsTeacher,
    registerAsStudent,
    changePassword,
} = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const validateCookie = require("../middlewares/validateCookie");
const loginLimiter = require("../middlewares/loginLimiter");
const { userValidator } = require("../validators");
const upload = require("../utils/upload");
const auth = require("../middlewares/auth.middleware");

const router = require("express").Router();

router.post(
    "/register",
    upload.single("image"),
    validate(userValidator.create),
    register,
);
router.post(
    "/register-as-teacher",
    upload.single('image'),
    validate(userValidator.createUserWithTeacher),
    registerAsTeacher
);
router.post(
    "/register-as-student",
    upload.single('image'),
    validate(userValidator.createUserWithStudent),
    registerAsStudent
);
router.post(
    "/login",
    loginLimiter,
    validate(userValidator.login),
    login,
);
router.delete("/logout", auth, logout);
router.post("/refresh", validateCookie, refresh);

router.put(
    "/change-password",
    auth,
    validate(userValidator.changePassword),
    changePassword
);

module.exports = router;
