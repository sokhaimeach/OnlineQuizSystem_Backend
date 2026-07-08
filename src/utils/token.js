const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// function to generate access token
const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });
};

// function to generate refresh token
const generateRefreshToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });
};

// function to has refresh token before store in DB
const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
};
