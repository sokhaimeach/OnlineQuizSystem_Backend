const successResponse = (res, message, data = {}, statusCode = 200, meta = null) => {
    const response = {
        success: true,
        message,
        data
    }
    if (meta) {
        response.meta = meta;
    }
    
    return res.status(statusCode).json(response);
};

module.exports = {
    successResponse
}
