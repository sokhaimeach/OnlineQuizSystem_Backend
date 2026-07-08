const validateCookie = (req, res, next) => {
    const token = req.cookies?.jwt;

    if (!token || typeof token !== "string") {   
        return res.status(401).json({
            message: "Missing or invalid refresh token"
        });
    }

    next();
};

module.exports = validateCookie;