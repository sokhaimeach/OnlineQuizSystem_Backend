const jwt = require("jsonwebtoken");
const { User, Student } = require("../models");

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];

            // verify refresh token
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            const foundUser = await User.findByPk(decoded.id, {
                include: {
                    model: Student,
                    as: "student",
                },
            });

            if (foundUser) {
                req.user = foundUser;
            }
        }
    } catch (err) {
        // ignore invalid or missing token
    }

    next();
};

module.exports = optionalAuth;
