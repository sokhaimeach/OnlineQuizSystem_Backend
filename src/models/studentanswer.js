'use strict';

module.exports = (sequelize, DataTypes) => {
    const StudentAnswer = sequelize.define('StudentAnswer', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        attempt_id: DataTypes.UUID,
        question_id: DataTypes.UUID,
        selected_option_id: DataTypes.UUID
    }, {
        tableName: 'student_answers',
        timestamps: false,
        underscored: true,
    });

    StudentAnswer.associate = (models) => {
        StudentAnswer.belongsTo(models.QuizAttempt, {
            foreignKey: 'attempt_id',
            as: 'attempt'
        });

        StudentAnswer.belongsTo(models.Question, {
            foreignKey: 'question_id',
            as: 'question'
        });

        StudentAnswer.belongsTo(models.AnswerOption, {
            foreignKey: 'selected_option_id',
            as: 'selected_option'
        });
    };

    return StudentAnswer;
};