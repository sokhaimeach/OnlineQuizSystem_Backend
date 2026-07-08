/**
 * VALIDATORS USAGE GUIDE
 * 
 * All validators are Joi schemas that validate request data.
 * Each validator exports multiple schemas for different operations:
 * - create: Validation for creating new records
 * - update: Validation for updating records (all fields optional except one)
 * - bulkCreate (where applicable): Validation for bulk operations
 * 
 * Location: src/validators/
 * 
 * USAGE EXAMPLE:
 * ===================================================
 * 
 * // Import validator
 * const { userValidator } = require('../validators');
 * const validate = require('../middlewares/validate');
 * 
 * // In your route
 * router.post('/users', validate(userValidator.create), userController.create);
 * router.patch('/users/:id', validate(userValidator.update), userController.update);
 * 
 * // For query/params validation
 * router.get('/users/:id', validate(userValidator.params, 'params'), userController.getById);
 * 
 * ===================================================
 * 
 * AVAILABLE VALIDATORS:
 * ===================================================
 * 
 * 1. USER VALIDATOR (userValidator)
 *    - create: Required fields - username, email, password, role
 *    - update: All fields optional
 *    - changePassword: Required fields - old_password, new_password, confirm_password
 * 
 * 2. STUDENT VALIDATOR (studentValidator)
 *    - create: Required fields - user_id, student_code
 *    - update: All fields optional
 * 
 * 3. TEACHER VALIDATOR (teacherValidator)
 *    - create: Required fields - user_id, school_name
 *    - update: All fields optional
 * 
 * 4. SUBJECT VALIDATOR (subjectValidator)
 *    - create: Required fields - subject_name
 *    - update: All fields optional
 * 
 * 5. CLASS VALIDATOR (classValidator)
 *    - create: Required fields - teacher_id, subject_id, class_name
 *    - update: All fields optional
 * 
 * 6. QUIZ VALIDATOR (quizValidator)
 *    - create: Required fields - teacher_id, subject_id, title, duration_minutes
 *    - update: All fields optional
 * 
 * 7. QUESTION VALIDATOR (questionValidator)
 *    - create: Required fields - quiz_id, question_text, score
 *    - update: All fields optional
 * 
 * 8. ANSWER OPTION VALIDATOR (answerOptionValidator)
 *    - create: Required fields - question_id, option_text, is_correct
 *    - update: All fields optional
 *    - bulkCreate: Create multiple options at once
 * 
 * 9. ASSIGNMENT VALIDATOR (assignmentValidator)
 *    - create: Required fields - quiz_id, class_id, title, type, start_date, due_date
 *    - update: All fields optional
 * 
 * 10. QUIZ ATTEMPT VALIDATOR (quizAttemptValidator)
 *     - create: Required fields - assignment_id, attempt_number, started_at
 *     - update: For status updates only
 * 
 * 11. STUDENT ANSWER VALIDATOR (studentAnswerValidator)
 *     - create: Required fields - attempt_id, question_id, selected_option_id, is_correct
 *     - update: All fields optional
 *     - bulkCreate: Create multiple answers at once
 * 
 * 12. CLASS STUDENT VALIDATOR (classStudentValidator)
 *     - create: Add single student to class
 *     - bulkCreate: Add multiple students to class
 *     - remove: Remove student from class
 * 
 * 13. USER REFRESH TOKEN VALIDATOR (userRefreshTokenValidator)
 *     - create: Create new refresh token
 *     - revoke: Revoke single token
 *     - revokeAll: Revoke all tokens for a user
 * 
 * ===================================================
 * 
 * MIDDLEWARE VALIDATION SOURCES:
 * ===================================================
 * 
 * validate(schema) // validates req.body (default)
 * validate(schema, 'body') // validates req.body
 * validate(schema, 'query') // validates req.query
 * validate(schema, 'params') // validates req.params
 * validate(schema, 'all') // validates all (body, query, params)
 * 
 * ===================================================
 * 
 * VALIDATION RULES SUMMARY:
 * ===================================================
 * 
 * String Fields:
 * - Most strings have max length limits
 * - Email fields validated as proper email format
 * - Passwords minimum 6 characters
 * 
 * UUID Fields:
 * - All foreign keys validated as UUIDv4
 * 
 * Enum Fields:
 * - Validated against allowed values
 * - Examples: role (ADMIN, TEACHER, STUDENT), status (ACTIVE, INACTIVE, SUSPENDED)
 * 
 * Numeric Fields:
 * - Score fields must be non-negative integers
 * - Percentage fields must be 0-100
 * - Decimal fields limited to 2 decimal places
 * 
 * Date Fields:
 * - Must be valid ISO date format
 * - Some endpoints support null values
 * 
 * Boolean Fields:
 * - Standard boolean validation
 * - Many have default values
 * 
 * ===================================================
 * 
 * EXAMPLE ROUTE IMPLEMENTATIONS:
 * ===================================================
 * 
 * // Create user
 * router.post('/auth/register', 
 *   validate(userValidator.create),
 *   authController.register
 * );
 * 
 * // Update user
 * router.patch('/users/:id',
 *   validate(userValidator.update),
 *   authMiddleware,
 *   userController.update
 * );
 * 
 * // Create assignment
 * router.post('/assignments',
 *   validate(assignmentValidator.create),
 *   authMiddleware,
 *   assignmentController.create
 * );
 * 
 * // Get paginated results
 * router.get('/quizzes',
 *   validate(paginationSchema, 'query'),
 *   quizController.list
 * );
 * 
 * // Bulk add students to class
 * router.post('/classes/:id/students',
 *   validate(classStudentValidator.bulkCreate),
 *   authMiddleware,
 *   classController.addStudents
 * );
 * 
 * ===================================================
 */

module.exports = {
    description: 'Validators documentation and usage guide'
};
