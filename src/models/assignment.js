'use strict';

module.exports = (sequelize, DataTypes) => {
    const Assignment = sequelize.define('Assignment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        quiz_id: DataTypes.UUID,
        class_id: DataTypes.UUID,
        title: DataTypes.STRING,
        type: DataTypes.ENUM('QUIZ', 'HOMEWORK'),
        instructions: DataTypes.TEXT,
        start_date: DataTypes.DATE,
        due_date: DataTypes.DATE,
        allow_late_submission: DataTypes.BOOLEAN,
        total_score: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        passing_score: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        total_question: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        status: DataTypes.ENUM(
            'DRAFT',
            'PUBLISHED',
            'CLOSED'
        ),
    }, {
        tableName: 'assignments',
        underscored: true,
    });

    Assignment.associate = (models) => {
        Assignment.belongsTo(models.Quiz, {
            foreignKey: 'quiz_id',
            as: 'quiz'
        });

        Assignment.belongsTo(models.Class, {
            foreignKey: 'class_id',
            as: 'class'
        });

        Assignment.hasMany(models.QuizAttempt, {
            foreignKey: 'assignment_id',
            as: 'attempts'
        });
    };

    return Assignment;
};
