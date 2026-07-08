'use strict';

module.exports = (sequelize, DataTypes) => {
    const Question = sequelize.define('Question', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        quiz_id: DataTypes.UUID,
        question_text: DataTypes.TEXT,
        question_type: {
            type: DataTypes.ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE'),
            default: "SINGLE_CHOICE"
        },
        score: DataTypes.INTEGER,
    }, {
        tableName: 'questions',
        underscored: true,
    });

    Question.associate = (models) => {
        Question.belongsTo(models.Quiz, {
            foreignKey: 'quiz_id',
            as: 'quiz'
        });

        Question.hasMany(models.AnswerOption, {
            foreignKey: 'question_id',
            as: 'options'
        });

        Question.hasMany(models.StudentAnswer, {
            foreignKey: 'question_id',
            as: 'answers'
        });
    };

    return Question;
};