const Joi = require('joi');

const studentSchemas = {
    update: Joi.object({
        phone_number: Joi.string().max(20).messages({
            'string.max': 'Phone number must not exceed 20 characters',
        }),
        date_of_birth: Joi.date().iso().messages({
            'date.iso': 'Date of birth must be a valid ISO date',
        }),
        parent_phone_number: Joi.string().max(20).allow(null, '').messages({
            'string.max': 'Parent phone number must not exceed 20 characters',
        }),
    }).unknown(false).required().min(1),
};

module.exports = studentSchemas;
