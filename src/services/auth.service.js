const { Op } = require("sequelize");
const ERROR_CODES = require("../constants/errorCode");
const { SESSION_MAX } = require("../constants/session");
const { UserRefreshToken, User } = require("../models");
const { hashToken } = require("../utils/token");
const uploadImage = require("./uploadImage.service");

// function service to create user
const createUser = async (
    userData,
    filePath,
    transaction = null
) => {

    const upload = await uploadImage(filePath);

    const normalizedData = {
        ...userData,
        email: userData.email.toLowerCase().trim(),
        avatar_url: upload.url,
        public_id: upload.publicId
    };

    const existingUser = await User.findOne({
        where: {
            [Op.or]: [
                { email: normalizedData.email },
            ],
        },
    });

    if (existingUser) {
        throw new AppError(
            ERROR_CODES.USER_ALREADY_EXISTS,
            "User already exists",
            409
        );
    }

    return await User.create(
        normalizedData,
        transaction ? { transaction } : undefined
    );
};

// service to create user refresh token
const createUserRefreshToken = async (
    req,
    user_id,
    refreshToken,
    transaction = null
) => {
    return await UserRefreshToken.create(
        {
            user_id,
            token_hash: hashToken(refreshToken),
            device_name:
                req.headers["sec-ch-ua-platform"]?.replace(/"/g, "") ||
                "Unknown",
            ip_address: req.ip,
            user_agent: req.get("User-Agent"),
            expires_at: new Date(Date.now() + SESSION_MAX),
        },
        transaction ? { transaction } : undefined
    );
};

module.exports = {
    createUser,
    createUserRefreshToken,
};