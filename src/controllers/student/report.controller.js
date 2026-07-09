const { asyncHandler } = require("../../middlewares/asyncHandler");
const { successResponse } = require("../../utils/response");
const { getStudentByUserId } = require("../../services/student.service");
const reportService = require("../../services/student/report.service");

const getDashboard = asyncHandler(async (req, res) => {
    const student = await getStudentByUserId(req.user.id);
    const data = await reportService.getDashboard(student.id);
    return successResponse(res, "Dashboard data fetched successfully", data);
});

const getAttempts = asyncHandler(async (req, res) => {
    const student = await getStudentByUserId(req.user.id);
    const data = await reportService.getAttempts(student.id);
    return successResponse(res, "Attempts fetched successfully", data);
});

const getPerformance = asyncHandler(async (req, res) => {
    const student = await getStudentByUserId(req.user.id);
    const data = await reportService.getPerformance(student.id);
    return successResponse(res, "Performance data fetched successfully", data);
});

module.exports = {
    getDashboard,
    getAttempts,
    getPerformance,
};
