const Joi = require('joi');

const classStudentSchemas = {
    // Create class student association validation
    create: Joi.object({
        class_id: Joi.string().uuid().required().messages({
            'string.guid': 'Class ID must be a valid UUID',
            'any.required': 'Class ID is required',
        }),
        student_id: Joi.string().uuid().required().messages({
            'string.guid': 'Student ID must be a valid UUID',
            'any.required': 'Student ID is required',
        }),
    }).unknown(false).required(),

    // Bulk add students to class validation
    bulkCreate: Joi.object({
        class_id: Joi.string().uuid().required().messages({
            'string.guid': 'Class ID must be a valid UUID',
            'any.required': 'Class ID is required',
        }),
        student_ids: Joi.array().items(
            Joi.string().uuid()
        ).min(1).required().messages({
            'array.min': 'At least 1 student ID is required',
            'any.required': 'Student IDs array is required',
        }),
    }).unknown(false).required(),

    // Remove student from class validation
    remove: Joi.object({
        class_id: Joi.string().uuid().required().messages({
            'string.guid': 'Class ID must be a valid UUID',
            'any.required': 'Class ID is required',
        }),
        student_id: Joi.string().uuid().required().messages({
            'string.guid': 'Student ID must be a valid UUID',
            'any.required': 'Student ID is required',
        }),
    }).unknown(false).required(),
};

module.exports = classStudentSchemas;
