const { asyncHandler } = require("../../middlewares/asyncHandler");
const { successResponse } = require("../../utils/response");
const { getTeacherByUserId } = require("../../services/teacher.service");
const analyticsService = require("../../services/teacher/analytics.service");

const getFullAnalytics = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);
    const data = await analyticsService.getFullAnalytics(teacher.id);
    return successResponse(res, "Analytics fetched successfully", data);
});

const getClassPerformance = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);
    const data = await analyticsService.getClassPerformance(teacher.id);
    return successResponse(res, "Class performance fetched successfully", data);
});

const getQuizPerformance = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);
    const data = await analyticsService.getQuizPerformance(teacher.id);
    return successResponse(res, "Quiz performance fetched successfully", data);
});

const getScoreDistribution = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);
    const data = await analyticsService.getScoreDistribution(teacher.id);
    return successResponse(res, "Score distribution fetched successfully", data);
});

const getCompletionRate = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);
    const data = await analyticsService.getCompletionRate(teacher.id);
    return successResponse(res, "Completion rate fetched successfully", data);
});

const getTrends = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);
    const data = await analyticsService.getTrends(teacher.id);
    return successResponse(res, "Trends fetched successfully", data);
});

const getStudentPerformance = asyncHandler(async (req, res) => {
    const teacher = await getTeacherByUserId(req.user.id);
    const data = await analyticsService.getStudentPerformance(teacher.id);
    return successResponse(res, "Student performance fetched successfully", data);
});

module.exports = {
    getFullAnalytics,
    getClassPerformance,
    getQuizPerformance,
    getScoreDistribution,
    getCompletionRate,
    getTrends,
    getStudentPerformance,
};
