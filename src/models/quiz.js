'use strict';

module.exports = (sequelize, DataTypes) => {
    const Quiz = sequelize.define('Quiz', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        teacher_id: DataTypes.UUID,
        subject_id: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null,
        },
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        duration_minutes: {
            type: DataTypes.INTEGER,
            default: 0
        },
        is_public: DataTypes.BOOLEAN,
        passing_score: DataTypes.INTEGER,
        total_score: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        show_result_immediately: DataTypes.BOOLEAN,
        show_correct_answers: DataTypes.BOOLEAN,
        randomize_questions: DataTypes.BOOLEAN,
    }, {
        tableName: 'quizzes',
        underscored: true,
    });

    Quiz.associate = (models) => {
        Quiz.belongsTo(models.Teacher, {
            foreignKey: 'teacher_id',
            as: 'teacher'
        });

        Quiz.belongsTo(models.Subject, {
            foreignKey: 'subject_id',
            as: 'subject'
        });

        Quiz.hasMany(models.Question, {
            foreignKey: 'quiz_id',
            as: 'questions'
        });

        Quiz.hasMany(models.Assignment, {
            foreignKey: 'quiz_id',
            as: 'assignments'
        });
    };

    return Quiz;
};