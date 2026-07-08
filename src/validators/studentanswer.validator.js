const Joi = require('joi');

const studentAnswerSchemas = {
    // Create student answer validation
    create: Joi.object({
        attempt_id: Joi.string().uuid().required().messages({
            'string.guid': 'Attempt ID must be a valid UUID',
            'any.required': 'Attempt ID is required',
        }),
        question_id: Joi.string().uuid().required().messages({
            'string.guid': 'Question ID must be a valid UUID',
            'any.required': 'Question ID is required',
        }),
        selected_option_id: Joi.string().uuid().required().messages({
            'string.guid': 'Selected option ID must be a valid UUID',
            'any.required': 'Selected option ID is required',
        }),
        is_correct: Joi.boolean().required().messages({
            'any.required': 'is_correct flag is required',
        }),
    }).unknown(false).required(),

    // Update student answer validation
    update: Joi.object({
        attempt_id: Joi.string().uuid().messages({
            'string.guid': 'Attempt ID must be a valid UUID',
        }),
        question_id: Joi.string().uuid().messages({
            'string.guid': 'Question ID must be a valid UUID',
        }),
        selected_option_id: Joi.string().uuid().messages({
            'string.guid': 'Selected option ID must be a valid UUID',
        }),
        is_correct: Joi.boolean().messages({
            'boolean.base': 'is_correct must be a boolean',
        }),
    }).unknown(false).required().min(1),

    // Bulk create student answers validation
    bulkCreate: Joi.object({
        attempt_id: Joi.string().uuid().required().messages({
            'string.guid': 'Attempt ID must be a valid UUID',
            'any.required': 'Attempt ID is required',
        }),
        answers: Joi.array().items(
            Joi.object({
                question_id: Joi.string().uuid().required(),
                selected_option_id: Joi.string().uuid().required(),
                is_correct: Joi.boolean().required(),
            })
        ).min(1).required().messages({
            'array.min': 'At least 1 answer is required',
            'any.required': 'Answers array is required',
        }),
    }).unknown(false).required(),

    // Submit quiz payload (used by student submit endpoint)
    submit: Joi.object({
        answers: Joi.array().items(
            Joi.object({
                question_id: Joi.string().uuid().required(),
                selected_option_id: Joi.array()
                    .items(
                        Joi.string()
                            .uuid()
                            .required()
                    )
                    .min(1)
                    .required()
                    .messages({
                        'array.min': 'At least one option must be selected',
                        'any.required': 'Selected options are required',
                    }),
            }),
        ).min(1).required().messages({
            'array.min': 'At least 1 answer is required',
            'any.required': 'Answers array is required',
        }),
    }).unknown(false).required(),
};

module.exports = studentAnswerSchemas;
