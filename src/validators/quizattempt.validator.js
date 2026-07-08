const Joi = require('joi');

const quizAttemptSchemas = {
    // Create quiz attempt validation
    create: Joi.object({
        assignment_id: Joi.string().uuid().required().messages({
            'string.guid': 'Assignment ID must be a valid UUID',
            'any.required': 'Assignment ID is required',
        }),
        guest_name: Joi.string().max(100).allow(null, '').messages({
            'string.max': 'Guest name must not exceed 100 characters',
        }),
        attempt_number: Joi.number().integer().min(1).allow(null, "").messages({
            'number.base': 'Attempt number must be a number',
            'number.min': 'Attempt number must be at least 1',
            'any.required': 'Attempt number is required',
        }),
    }).unknown(false).required(),

    // Update quiz attempt validation (mainly for status changes)
    update: Joi.object({
        status: Joi.string().valid('IN_PROGRESS', 'SUBMITTED', 'TIMEOUT').messages({
            'any.only': 'Status must be one of: IN_PROGRESS, SUBMITTED, TIMEOUT',
        }),
        total_score: Joi.number().precision(2).min(0).allow(null).messages({
            'number.base': 'Total score must be a number',
            'number.min': 'Total score must be at least 0',
        }),
        submitted_at: Joi.date().allow(null).messages({
            'date.base': 'Submitted at must be a valid date',
        }),
    }).unknown(false).required().min(1),
};

module.exports = quizAttemptSchemas;
