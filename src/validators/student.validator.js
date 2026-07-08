const Joi = require('joi');

const studentSchemas = {
    // Create student validation
    create: Joi.object({
        user_id: Joi.string().uuid().required().messages({
            'string.guid': 'User ID must be a valid UUID',
            'any.required': 'User ID is required',
        }),
        student_code: Joi.string().max(50).required().messages({
            'string.max': 'Student code must not exceed 50 characters',
            'any.required': 'Student code is required',
        }),
    }).unknown(false).required(),

    // Update student validation
    update: Joi.object({
        user_id: Joi.string().uuid().messages({
            'string.guid': 'User ID must be a valid UUID',
        }),
        student_code: Joi.string().max(50).messages({
            'string.max': 'Student code must not exceed 50 characters',
        }),
    }).unknown(false).required().min(1),
};

module.exports = studentSchemas;
