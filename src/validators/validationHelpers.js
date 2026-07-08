/**
 * Common Joi validation helper functions and patterns
 */

const Joi = require('joi');
const { search } = require('../config/cloudinary.config');

/**
 * Standard UUID validation pattern
 */
const uuidPattern = Joi.string().uuid({ version: 'uuidv4' }).required();

/**
 * Standard email validation pattern
 */
const emailPattern = Joi.string().email().required();

/**
 * Standard password validation (min 6 characters)
 */
const passwordPattern = Joi.string().min(6).required();

/**
 * Standard date validation pattern
 */
const datePattern = Joi.date().iso().required();

/**
 * Standard pagination validation
 */
const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').optional(),
    filter: Joi.string().allow('').optional(),
    sort_by: Joi.string().default('created_at'),
    order: Joi.string().valid('ASC', 'DESC').default('DESC'),
}).required();

/**
 * Standard UUID parameter validation
 */
const uuidParamSchema = Joi.object({
    id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
        'string.guid': 'Invalid ID format',
        'any.required': 'ID is required',
    }),
}).required();

/**
 * Standard validation result formatter
 */
const formatValidationError = (error) => {
    return error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        type: err.type,
    }));
};

/**
 * Create a combined schema for multiple operations
 * Example: combinedSchema('user', { create: createSchema, update: updateSchema })
 */
const createSchemaRegistry = (name, schemas) => {
    return {
        name,
        schemas,
        validate: (operation, data) => {
            const schema = schemas[operation];
            if (!schema) {
                throw new Error(`Schema for operation '${operation}' not found`);
            }
            return schema.validate(data, { abortEarly: false, stripUnknown: true });
        },
    };
};

module.exports = {
    uuidPattern,
    emailPattern,
    passwordPattern,
    datePattern,
    paginationSchema,
    uuidParamSchema,
    formatValidationError,
    createSchemaRegistry,
};
