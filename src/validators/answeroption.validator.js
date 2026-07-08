const Joi = require('joi');

const answerOptionSchemas = {
    // Create answer option validation
    create: Joi.object({
        question_id: Joi.string().uuid().required().messages({
            'string.guid': 'Question ID must be a valid UUID',
            'any.required': 'Question ID is required',
        }),
        option_text: Joi.string().required().messages({
            'any.required': 'Option text is required',
        }),
        is_correct: Joi.boolean().required().messages({
            'any.required': 'is_correct flag is required',
        }),
    }).unknown(false).required(),

    // Update answer option validation
    update: Joi.object({
        question_id: Joi.string().uuid().messages({
            'string.guid': 'Question ID must be a valid UUID',
        }),
        option_text: Joi.string().messages({
            'string.base': 'Option text must be a string',
        }),
        is_correct: Joi.boolean().messages({
            'boolean.base': 'is_correct must be a boolean',
        }),
    }).unknown(false).required().min(1),

    // Bulk create answer options validation
    bulkCreate: Joi.object({
        question_id: Joi.string().uuid().required().messages({
            'string.guid': 'Question ID must be a valid UUID',
            'any.required': 'Question ID is required',
        }),
        options: Joi.array().items(
            Joi.object({
                option_text: Joi.string().required(),
                is_correct: Joi.boolean().required(),
            })
        ).min(2).required().messages({
            'array.min': 'At least 2 answer options are required',
            'any.required': 'Options array is required',
        }),
    }).unknown(false).required(),
};

module.exports = answerOptionSchemas;
