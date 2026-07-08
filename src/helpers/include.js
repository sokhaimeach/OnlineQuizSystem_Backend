const { Quiz, Student, User, Assignment, StudentAnswer, Question, AnswerOption, Class } = require("../models");

// include quiz model to reduce doublicate
const quizOwnershipInclude = (where = {}) => {
    return [
        {
            model: Quiz,
            as: 'quiz',
            required: true,
            where,
        },
    ];
};


// student attempt detail include for query (controller/teacher/student.controller.js)
const studentAttemptDetailInclude = (attemptId, teacherId) => {
    return {
        where: {
            id: attemptId,
        },
        attributes: {exclude: ['question_order']},
        include: [
            {
                model: Student,
                as: 'student',
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "first_name", "last_name", "gender", "email", "avatar_url"],
                    },
                ],
            },
            {
                model: Assignment,
                as: 'assignment',
                include: [{
                    model: Quiz,
                    as: "quiz",
                    where: {teacher_id: teacherId},
                    include: [{
                        model: Question,
                        as: "questions",
                        include: [
                            {
                                model: AnswerOption,
                                as: "options",
                                attributes: {
                                    exclude: ["is_correct"]
                                }
                            },
                            {
                                model: StudentAnswer,
                                as: 'answers',
                                include: [{
                                    model: AnswerOption,
                                    as: "selected_option",
                                    attributes: [["id", "selected_id"], "option_text", "is_correct"],
                                }]
                            }
                        ]
                    }]
                }]
            }
        ],
    }
};

module.exports = {
    quizOwnershipInclude,
    studentAttemptDetailInclude,
};
