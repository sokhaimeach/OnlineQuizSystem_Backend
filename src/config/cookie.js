const refreshTokenCookieOptions = {
    httpOnly: true, // accessible only by web server
    secure: process.env.NODE_ENV === 'production', // http in development and https in production
    sameSite: 'Lax', // cross-site cookie *(set to None in production)
    maxAge: 7 * 24 * 60 * 60 * 1000 // cookie expire 7 days
};

module.exports = refreshTokenCookieOptions;