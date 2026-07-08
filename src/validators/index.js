const userValidator = require('./user.validator');
const studentValidator = require('./student.validator');
const teacherValidator = require('./teacher.validator');
const subjectValidator = require('./subject.validator');
const classValidator = require('./class.validator');
const quizValidator = require('./quiz.validator');
const questionValidator = require('./question.validator');
const answerOptionValidator = require('./answeroption.validator');
const assignmentValidator = require('./assignment.validator');
const quizAttemptValidator = require('./quizattempt.validator');
const studentAnswerValidator = require('./studentanswer.validator');
const classStudentValidator = require('./classstudent.validator');
const userRefreshTokenValidator = require('./userrefreshtoken.validator');

module.exports = {
    userValidator,
    studentValidator,
    teacherValidator,
    subjectValidator,
    classValidator,
    quizValidator,
    questionValidator,
    answerOptionValidator,
    assignmentValidator,
    quizAttemptValidator,
    studentAnswerValidator,
    classStudentValidator,
    userRefreshTokenValidator,
};
