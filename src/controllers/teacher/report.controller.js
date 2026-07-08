const { asyncHandler } = require("../../middlewares/asyncHandler");
const { successResponse } = require("../../utils/response");
const { getTeacherByUserId } = require("../../services/teacher.service");
const reportService = require("../../services/teacher/report.service");

const getDashboard = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);
    const data = await reportService.getDashboard(teacher.id);
    return successResponse(res, "Dashboard data fetched successfully", data);
});

const getRecentActivity = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);
    const data = await reportService.getRecentActivity(teacher.id);
    return successResponse(res, "Recent activities fetched successfully", data);
});

const getUpcomingDeadlines = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);
    const data = await reportService.getUpcomingDeadlines(teacher.id);
    return successResponse(res, "Upcoming deadlines fetched successfully", data);
});

module.exports = {
    getDashboard,
    getRecentActivity,
    getUpcomingDeadlines,
};
