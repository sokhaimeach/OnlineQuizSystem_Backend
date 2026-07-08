const Joi = require('joi');

const questionSchemas = {
    // Create question validation
    create: Joi.object({
        question_text: Joi.string().required().messages({
            'any.required': 'Question text is required',
        }),
        question_type: Joi.string().valid('SINGLE_CHOICE', 'MULTIPLE_CHOICE').default('SINGLE_CHOICE'),
        score: Joi.number().integer().min(0).required().messages({
            'number.base': 'Score must be a number',
            'number.min': 'Score must be at least 0',
            'any.required': 'Score is required',
        }),
        options: Joi.array().items(
            Joi.object({
                option_text: Joi.string().required(),
                is_correct: Joi.boolean().required(),
            }),
        ).min(2).required().messages({ 'array.min': 'At least 2 answer options are required' }),
    }).unknown(false).required(),

    // Update question validation
    update: Joi.object({
        quiz_id: Joi.string().uuid().messages({
            'string.guid': 'Quiz ID must be a valid UUID',
        }),
        question_text: Joi.string().messages({
            'string.base': 'Question text must be a string',
        }),
        question_type: Joi.string().valid('SINGLE_CHOICE', 'MULTIPLE_CHOICE'),
        score: Joi.number().integer().min(0).messages({
            'number.base': 'Score must be a number',
            'number.min': 'Score must be at least 0',
        }),
        options: Joi.array().items(
            Joi.object({
                id: Joi.string().uuid().required(),
                option_text: Joi.string().required(),
                is_correct: Joi.boolean().required(),
            }),
        ).min(2).required().messages({ 'array.min': 'At least 2 answer options are required' }),
    }).unknown(false).required().min(1),

    // bulk create questions
    bulkCreate: Joi.object({
        questions: Joi.array().items(
            Joi.object({
                question_text: Joi.string().required().messages({
                    'any.required': 'Question text is required',
                }),
                question_type: Joi.string().valid('SINGLE_CHOICE', 'MULTIPLE_CHOICE').default('SINGLE_CHOICE'),
                score: Joi.number().integer().min(0).required().messages({
                    'number.base': 'Score must be a number',
                    'number.min': 'Score must be at least 0',
                    'any.required': 'Score is required',
                }),
                options: Joi.array().items(
                    Joi.object({
                        option_text: Joi.string().required(),
                        is_correct: Joi.boolean().required(),
                    })
                ).min(2).required().messages({ 'array.min': 'At least 2 answer options are required' }),
            })
        )
    }).unknown(false).required(),
};

module.exports = questionSchemas;
