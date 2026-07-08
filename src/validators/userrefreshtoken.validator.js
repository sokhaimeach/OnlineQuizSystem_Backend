const Joi = require('joi');

const userRefreshTokenSchemas = {
    create: Joi.object({
        user_id: Joi.string().uuid().required().messages({
            'string.guid': 'User ID must be a valid UUID',
            'any.required': 'User ID is required',
        }),
        token: Joi.string().required().messages({
            'any.required': 'Token is required',
        }),
        expires_at: Joi.date().required().messages({
            'date.base': 'Expires at must be a valid date',
            'any.required': 'Expires at is required',
        }),
    }).unknown(false).required(),

    revoke: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Token ID must be a valid UUID',
            'any.required': 'Token ID is required',
        }),
    }).unknown(false).required(),

    revokeAll: Joi.object({
        user_id: Joi.string().uuid().required().messages({
            'string.guid': 'User ID must be a valid UUID',
            'any.required': 'User ID is required',
        }),
    }).unknown(false).required(),
};

module.exports = userRefreshTokenSchemas;
