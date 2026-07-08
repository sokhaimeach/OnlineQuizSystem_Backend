const Joi = require('joi');

const assignmentSchemas = {
    // Create assignment validation
    create: Joi.object({
        quiz_id: Joi.string().uuid().required().messages({
            'string.guid': 'Quiz ID must be a valid UUID',
            'any.required': 'Quiz ID is required',
        }),
        class_id: Joi.string().uuid().allow(null).messages({
            'string.guid': 'Class ID must be a valid UUID',
        }),
        title: Joi.string().max(200).required().messages({
            'string.max': 'Title must not exceed 200 characters',
            'any.required': 'Title is required',
        }),
        type: Joi.string().valid('QUIZ', 'HOMEWORK').required().messages({
            'any.only': 'Type must be one of: QUIZ, HOMEWORK',
            'any.required': 'Type is required',
        }),
        instructions: Joi.string().allow(null, '').messages({
            'string.base': 'Instructions must be a string',
        }),
        qr_code_url: Joi.string().uri().allow(null, '').messages({
            'string.uri': 'QR code URL must be a valid URI',
        }),
        start_date: Joi.date().required().messages({
            'date.base': 'Start date must be a valid date',
            'any.required': 'Start date is required',
        }),
        due_date: Joi.date().required().messages({
            'date.base': 'Due date must be a valid date',
            'any.required': 'Due date is required',
        }),
        allow_late_submission: Joi.boolean().default(false),
        status: Joi.string().valid('DRAFT', 'PUBLISHED', 'CLOSED').default('DRAFT').messages({
            'any.only': 'Status must be one of: DRAFT, PUBLISHED, CLOSED',
        }),
    }).unknown(false).required(),

    // Update assignment validation
    update: Joi.object({
        quiz_id: Joi.string().uuid().messages({
            'string.guid': 'Quiz ID must be a valid UUID',
        }),
        class_id: Joi.string().uuid().messages({
            'string.guid': 'Class ID must be a valid UUID',
        }),
        title: Joi.string().max(200).messages({
            'string.max': 'Title must not exceed 200 characters',
        }),
        type: Joi.string().valid('QUIZ', 'HOMEWORK').messages({
            'any.only': 'Type must be one of: QUIZ, HOMEWORK',
        }),
        instructions: Joi.string().allow(null, '').messages({
            'string.base': 'Instructions must be a string',
        }),
        qr_code_url: Joi.string().uri().allow(null, '').messages({
            'string.uri': 'QR code URL must be a valid URI',
        }),
        start_date: Joi.date().messages({
            'date.base': 'Start date must be a valid date',
        }),
        due_date: Joi.date().messages({
            'date.base': 'Due date must be a valid date',
        }),
        allow_late_submission: Joi.boolean(),
        status: Joi.string().valid('DRAFT', 'PUBLISHED', 'CLOSED').messages({
            'any.only': 'Status must be one of: DRAFT, PUBLISHED, CLOSED',
        }),
    }).unknown(false).required().min(1),
};

module.exports = assignmentSchemas;
