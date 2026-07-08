const Joi = require('joi');

const teacherSchemas = {
    // Create teacher validation
    create: Joi.object({
        user_id: Joi.string().uuid().required().messages({
            'string.guid': 'User ID must be a valid UUID',
            'any.required': 'User ID is required',
        }),
        school_name: Joi.string().max(100).required().messages({
            'string.max': 'School name must not exceed 100 characters',
            'any.required': 'School name is required',
        }),
    }).unknown(false).required(),

    // Update teacher validation
    update: Joi.object({
        user_id: Joi.string().uuid().messages({
            'string.guid': 'User ID must be a valid UUID',
        }),
        school_name: Joi.string().max(100).messages({
            'string.max': 'School name must not exceed 100 characters',
        }),
    }).unknown(false).required().min(1),
};

module.exports = teacherSchemas;
