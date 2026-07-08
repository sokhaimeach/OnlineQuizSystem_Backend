const Joi = require('joi');

const subjectSchemas = {
    // Create subject validation
    create: Joi.object({
        subject_name: Joi.string().max(100).required().messages({
            'string.max': 'Subject name must not exceed 100 characters',
            'any.required': 'Subject name is required',
        }),
        description: Joi.string().allow(null, '').messages({
            'string.base': 'Description must be a string',
        }),
    }).required(),

    // Update subject validation
    update: Joi.object({
        subject_name: Joi.string().max(100).messages({
            'string.max': 'Subject name must not exceed 100 characters',
        }),
        description: Joi.string().allow(null, '').messages({
            'string.base': 'Description must be a string',
        }),
    }).required().min(1),
};

module.exports = subjectSchemas;
