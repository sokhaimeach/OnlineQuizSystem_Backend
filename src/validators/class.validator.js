const Joi = require('joi');

const classSchemas = {
    // Create class validation
    create: Joi.object({
        class_name: Joi.string().max(100).required().messages({
            'string.max': 'Class name must not exceed 100 characters',
            'any.required': 'Class name is required',
        }),
        description: Joi.string().allow(null, '').messages({
            'string.base': 'Description must be a string',
        }),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow(null, '').messages({
            'string.pattern.base': 'Color must be a valid hex color code',
        }),
    }).unknown(false).required(),

    // Update class validation
    update: Joi.object({
        class_name: Joi.string().max(100).messages({
            'string.max': 'Class name must not exceed 100 characters',
        }),
        description: Joi.string().allow(null, '').messages({
            'string.base': 'Description must be a string',
        }),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow(null, '').messages({
            'string.pattern.base': 'Color must be a valid hex color code',
        }),
    }).unknown(false).required().min(1),
};

module.exports = classSchemas;
