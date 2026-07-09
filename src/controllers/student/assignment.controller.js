const { asyncHandler } = require("../../middlewares/asyncHandler");
const { successResponse } = require("../../utils/response");
const { getStudentByUserId } = require("../../services/student.service");
const assignmentService = require("../../services/student/assignment.service");

const getAssignments = asyncHandler(async (req, res) => {
    const student = await getStudentByUserId(req.user.id);

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const search = req.query.search?.trim() || "";
    const filter = req.query.filter?.trim() || "";

    const result = await assignmentService.getAssignments(student.id, {
        page,
        limit,
        search,
        filter,
    });

    return successResponse(
        res,
        "Assignments fetched successfully",
        result.data,
        200,
        result.meta
    );
});

const getAssignmentById = asyncHandler(async (req, res) => {
    const student = await getStudentByUserId(req.user.id);
    const { id } = req.params;

    const data = await assignmentService.getAssignmentById(student.id, id);

    return successResponse(res, "Assignment fetched successfully", data);
});

module.exports = {
    getAssignments,
    getAssignmentById,
};
