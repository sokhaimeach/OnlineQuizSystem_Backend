const { Op } = require("sequelize");
const { asyncHandler } = require("../middlewares/asyncHandler");
const {
    User,
    Teacher,
    Student,
    UserRefreshToken,
    sequelize,
} = require("../models");
const jwt = require("jsonwebtoken");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../constants/errorCode");
const {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
} = require("../utils/token");
const refreshTokenCookieOptions = require("../config/cookie");
const { SESSION_MAX } = require("../constants/session");
const {
    createUserRefreshToken,
    createUser,
} = require("../services/auth.service");

// sign up as Admin
const register = asyncHandler(async (req, res) => {
    const userData = req.body;

    console.log("userData", userData);
    const user = await createUser({ ...userData, role: "ADMIN" }, req.file?.path || '');
    const { password: _, ...data } = user.toJSON();

    // generate access token and refresh token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // create user refresh token in database
    await createUserRefreshToken(req, user.id, refreshToken);

    // create secure cookie with refresh token
    res.cookie("jwt", refreshToken, refreshTokenCookieOptions);

    successResponse(res, "Register successfully", { ...data, access_token: accessToken }, 201);
});

// sign up as Teacher
const registerAsTeacher = asyncHandler(async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { first_name, last_name, gender, bio, email, password, avatar_url, school_name } = req.body;

        // create user
        const user = await createUser(
            { first_name, last_name, gender, bio, email, password, avatar_url, role: "TEACHER" },
            req.file?.path || '',
            t
        );

        const teacher = await Teacher.create(
            { user_id: user.id, school_name },
            { transaction: t },
        );

        // generate access token and refresh token
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // create user refresh token in database
        await createUserRefreshToken(req, user.id, refreshToken, t);

        // create secure cookie with refresh token
        res.cookie("jwt", refreshToken, refreshTokenCookieOptions);

        await t.commit();

        const { password: _, ...data } = user.toJSON();

        successResponse(
            res,
            "Register successfully",
            { user: data, teacher, access_token: accessToken },
            201,
        );
    } catch (error) {
        await t.rollback();
        throw error;
    }
});

// sign up as Student
const registerAsStudent = asyncHandler(async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { first_name, last_name, gender, bio, email, password, avatar_url, date_of_birth, phone_number, parent_phone_number } = req.body;

        // create user
        const user = await createUser(
            { first_name, last_name, gender, bio, email, password, avatar_url, role: "STUDENT" },
            req.file?.path || '',
            t
        );

        const student = await Student.create(
            { user_id: user.id, date_of_birth, phone_number, parent_phone_number },
            { transaction: t },
        );

        // generate access token and refresh token
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // create user refresh token in database
        await createUserRefreshToken(req, user.id, refreshToken, t);

        // create secure cookie with refresh token
        res.cookie("jwt", refreshToken, refreshTokenCookieOptions);

        await t.commit();

        const { password: _, ...data } = user.toJSON();

        successResponse(
            res,
            "Register successfully",
            { user: data, student, access_token: accessToken },
            201,
        );

    } catch (error) {
        await t.rollback();
        throw error;
    }
});

// login
const login = asyncHandler(async (req, res) => {
    const { password, email } = req.body;
    const cookies = req.cookies;

    // get user
    const user = await User.scope(null).findOne({
        where: { email, status: "ACTIVE" },
    });
    if (!user) {
        throw new AppError(
            ERROR_CODES.INVALID_CREDENTIALS,
            "Invalid credentials",
            401,
        );
    }

    // check if password is match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, "Invalid credentials");
    }

    // clear old refresh token if exist
    if (cookies?.jwt) {
        await UserRefreshToken.destroy({
            where: {token_hash: hashToken(cookies?.jwt)}
        });
    }

    // generate access token and refresh token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // create user refresh token in database
    await createUserRefreshToken(req, user.id, refreshToken);

    // create secure cookie with refresh token
    res.cookie("jwt", refreshToken, refreshTokenCookieOptions);

    // remove password from user before send to client
    const { password: _, ...data } = user.toJSON();

    return successResponse(res, "Login successfully", { ...data, access_token: accessToken });
});

// refresh new access token
const refresh = asyncHandler(async (req, res) => {
    const cookies = req.cookies;

    if (!cookies?.jwt) {
        throw new AppError(ERROR_CODES.UNAUTHORIZED, "Unauthorized", 401);
    }

    const refreshToken = cookies.jwt;
    const hashedToken = hashToken(refreshToken);

    const foundToken = await UserRefreshToken.findOne({
        where: { token_hash: hashedToken },
    });

    if (!foundToken) {
        throw new AppError(ERROR_CODES.FORBIDDEN, "Token reuse detected", 403);
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        // revoke all sessions on suspicious token
        await UserRefreshToken.destroy({ where: { user_id: foundToken.user_id } });

        throw new AppError(ERROR_CODES.FORBIDDEN, "Invalid or expired token", 403);
    }

    const foundUser = await User.findByPk(decoded.id);
    if (!foundUser) {
        throw new AppError(ERROR_CODES.FORBIDDEN, "Forbidden", 403);
    }

    // absolute session expiry
    if (foundToken.expires_at.getTime() < Date.now()) {
        await UserRefreshToken.destroy({ where: { user_id: foundUser.id } });

        throw new AppError(ERROR_CODES.TOKEN_EXPIRED, "Session expired", 401);
    }

    const newRefreshToken = generateRefreshToken(foundUser);
    const accessToken = generateAccessToken(foundUser);

    // create user refresh token in database
    await createUserRefreshToken(req, foundUser.id, newRefreshToken);

    await foundToken.destroy();

    res.cookie("jwt", newRefreshToken, refreshTokenCookieOptions);

    return successResponse(res, "Refresh new token successfully", {
        access_token: accessToken,
    });
});

// logout
const logout = asyncHandler(async (req, res) => {
    const cookies = req.cookies;

    if (!cookies?.jwt) {
        return successResponse(res, "No content", 204);
    }

    await UserRefreshToken.destroy({
        where: { token_hash: hashToken(cookies.jwt) },
    });

    // clear cookie
    res.clearCookie("jwt", refreshTokenCookieOptions);

    return successResponse(res, "Cookie cleared");
});

// change password
const changePassword = asyncHandler(async (req, res) => {
    const {old_password, new_password} = req.body;

    const user = await User.scope(null).findByPk(req.user.id);
    if (!user) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    const isMatch = await user.comparePassword(old_password);
    if (!isMatch) {
        throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, "Invalid credentials");
    }

    user.password = new_password;
    await user.save();

    const {password: _, ...userData } = user.toJSON();

    return successResponse(res, "Change password successfully", userData);
});

module.exports = {
    register,
    registerAsTeacher,
    registerAsStudent,
    login,
    refresh,
    logout,
    changePassword
};
