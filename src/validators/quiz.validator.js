const Joi = require('joi');

const quizSchemas = {
    // Create quiz validation
    create: Joi.object({
        subject_id: Joi.string().uuid().allow(null, "").messages({
            'string.guid': 'Subject ID must be a valid UUID',
            'any.required': 'Subject ID is required',
        }),
        title: Joi.string().max(200).required().messages({
            'string.max': 'Title must not exceed 200 characters',
            'any.required': 'Title is required',
        }),
        description: Joi.string().allow(null, '').messages({
            'string.base': 'Description must be a string',
        }),
        duration_minutes: Joi.number().integer().min(1).required().messages({
            'number.base': 'Duration must be a number',
            'number.min': 'Duration must be at least 1 minute',
            'any.required': 'Duration is required',
        }),
        is_public: Joi.boolean().default(false),
        passing_score: Joi.number().integer().min(0).max(100).messages({
            'number.base': 'Passing score must be a number',
            'number.min': 'Passing score must be at least 0',
            'number.max': 'Passing score must not exceed 100',
        }),
        show_result_immediately: Joi.boolean().default(false),
        show_correct_answers: Joi.boolean().default(false),
        randomize_questions: Joi.boolean().default(false),
        questions: Joi.array().items(
            Joi.object({
                question_text: Joi.string().required().messages({ 'any.required': 'Question text is required' }),
                question_type: Joi.string().valid('SINGLE_CHOICE', 'MULTIPLE_CHOICE').required().messages({ 'any.only': 'Invalid question type', 'any.required': 'Question type is required' }),
                score: Joi.number().integer().min(0).required().messages({ 'number.base': 'Score must be a number', 'number.min': 'Score must be at least 0', 'any.required': 'Score is required' }),
                options: Joi.array().items(
                    Joi.object({
                        option_text: Joi.string().required(),
                        is_correct: Joi.boolean().required(),
                    }),
                ).min(2).required().messages({ 'array.min': 'At least 2 answer options are required', 'any.required': 'Options are required' }),
            }),
        ).min(1).required().messages({ 'array.min': 'At least 1 question is required', 'any.required': 'Questions are required' }),
    }).unknown(false).required(),

    // Update quiz validation
    update: Joi.object({
        teacher_id: Joi.string().uuid().messages({
            'string.guid': 'Teacher ID must be a valid UUID',
        }),
        subject_id: Joi.string().uuid().allow(null, "").messages({
            'string.guid': 'Subject ID must be a valid UUID',
            'any.required': 'Subject ID is required',
        }),
        title: Joi.string().max(200).messages({
            'string.max': 'Title must not exceed 200 characters',
        }),
        description: Joi.string().allow(null, '').messages({
            'string.base': 'Description must be a string',
        }),
        duration_minutes: Joi.number().integer().min(1).messages({
            'number.base': 'Duration must be a number',
            'number.min': 'Duration must be at least 1 minute',
        }),
        is_public: Joi.boolean(),
        passing_score: Joi.number().integer().min(0).max(100).messages({
            'number.base': 'Passing score must be a number',
            'number.min': 'Passing score must be at least 0',
            'number.max': 'Passing score must not exceed 100',
        }),
        show_result_immediately: Joi.boolean(),
        show_correct_answers: Joi.boolean(),
        randomize_questions: Joi.boolean(),
    }).unknown(false).required().min(1),
};

module.exports = quizSchemas;
