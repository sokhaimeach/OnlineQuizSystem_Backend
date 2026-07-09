const Joi = require('joi');

// Common fields
const firstNameSchema = Joi.string()
    .trim()
    .min(1)
    .max(30)
    .pattern(/^[a-zA-Z0-9_.-]+$/)
    .messages({
        'string.empty': 'First name is required',
        'string.min': 'First name must be at least 1 character',
        'string.max': 'First name must not exceed 30 characters',
        'string.pattern.base':
            'First name may only contain letters, numbers, underscores, dots, and hyphens',
    });

const lastNameSchema = Joi.string()
    .trim()
    .min(1)
    .max(30)
    .pattern(/^[a-zA-Z0-9_.-]+$/)
    .messages({
        'string.empty': 'Last name is required',
        'string.min': 'Last name must be at least 1 character',
        'string.max': 'Last name must not exceed 30 characters',
        'string.pattern.base':
            'Last name may only contain letters, numbers, underscores, dots, and hyphens',
    });

const emailSchema = Joi.string()
    .trim()
    .lowercase()
    .email()
    .messages({
        'string.empty': 'Email is required',
        'string.email': 'Email must be a valid email address',
    });

const passwordSchema = Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password must not exceed 100 characters',
        'string.pattern.base':
            'Password must contain at least one letter and one number',
    });

const statusSchema = Joi.string()
    .valid('ACTIVE', 'INACTIVE', 'SUSPENDED')
    .messages({
        'any.only':
            'Status must be one of: ACTIVE, INACTIVE, SUSPENDED',
    });

const createSchema = Joi.object({
    first_name: firstNameSchema.required(),
    last_name: lastNameSchema.required(),
    gender: Joi.string()
        .valid('MALE', 'FEMALE', 'OTHER').default('OTHER'),
    email: emailSchema.required(),
    bio: Joi.string().optional().allow(null, ''),
    password: passwordSchema.required(),
    image: Joi.any().optional()
})
    .unknown(false)
    .required();

const updateSchema = Joi.object({
        first_name: firstNameSchema,
        last_name: lastNameSchema,
        gender: Joi.string()
            .valid('MALE', 'FEMALE', 'OTHER').default('OTHER'),
        bio: Joi.string().optional().allow(null, ''),
    })
        .min(1)
        .unknown(false)
        .required()
        .messages({
            'object.min': 'At least one field is required to update',
        });

const userSchemas = {
    // Create user
    create: createSchema,

    // Create teacher
    createUserWithTeacher: createSchema.append({
        school_name: Joi.string()
            .trim()
            .max(100)
            .required()
            .messages({
                'string.empty': 'School name is required',
                'string.max': 'School name must not exceed 100 characters',
            }),
    }),

    // Create student
    createUserWithStudent: createSchema.append({
        phone_number: Joi.string()
            .trim()
            .max(20).optional().allow(null, '')
            .messages({
                'string.max': 'Phone number must not exceed 20 characters',
            }),
        date_of_birth: Joi.date()
            .iso()
            .required()
            .messages({
                'date.base': 'Date of birth must be a valid date',
                'date.format': 'Date of birth must be in ISO format (YYYY-MM-DD)',
                'any.required': 'Date of birth is required',
            }),
        parent_phone_number: Joi.string().trim()
            .max(20).optional().allow(null, '')
            .messages({
                'string.max': 'Parent phone number must not exceed 20 characters',
            }),
        class_id: Joi.string()
            .uuid({ version: 'uuidv4' })
            .optional()
            .messages({
                'string.guid': 'Invalid class ID format',
            }),
    }),

    // Update user
    update: updateSchema,

    updateUserWithTeacher: updateSchema.append({
        school_name: Joi.string()
            .trim()
            .max(100)
            .optional()
            .messages({
                'string.max': 'School name must not exceed 100 characters',
            }),
    }),

    updateUserWithStudent: updateSchema.append({
        phone_number: Joi.string()
            .trim()
            .max(20)
            .messages({
                'string.max': 'Phone number must not exceed 20 characters',
            }),
        date_of_birth: Joi.date()
            .iso()
            .messages({
                'date.base': 'Date of birth must be a valid date',
                'date.format': 'Date of birth must be in ISO format (YYYY-MM-DD)',
                'any.required': 'Date of birth is required',
            }),
        parent_phone_number: Joi.string().trim()
            .max(20).optional().allow(null, '')
            .messages({
                'string.max': 'Parent phone number must not exceed 20 characters',
            }),
    }),

    // Login
    login: Joi.object({
        email: emailSchema.required(),
        password: Joi.string().required().messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required',
        }),
    })
        .unknown(false)
        .required(),

    // Change password
    changePassword: Joi.object({
        old_password: Joi.string()
            .required()
            .messages({
                'string.empty': 'Old password is required',
                'any.required': 'Old password is required',
            }),

        new_password: passwordSchema
            .invalid(Joi.ref('old_password'))
            .required()
            .messages({
                'any.invalid':
                    'New password must be different from old password',
            }),

        confirm_password: Joi.string()
            .valid(Joi.ref('new_password'))
            .required()
            .messages({
                'any.only': 'Passwords do not match',
                'any.required': 'Password confirmation is required',
            }),
    })
        .unknown(false)
        .required(),
};

module.exports = userSchemas;