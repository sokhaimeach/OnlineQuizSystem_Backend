'use strict';

module.exports = (sequelize, DataTypes) => {
    const QuizAttempt = sequelize.define('QuizAttempt', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        assignment_id: DataTypes.UUID,
        student_id: DataTypes.UUID,
        guest_name: DataTypes.STRING,
        attempt_number: DataTypes.INTEGER,
        access_token: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM(
                'IN_PROGRESS',
                'SUBMITTED',
                'TIMEOUT'
            ),
            default: 'IN_PROGRESS'
        },
        total_score: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        correct_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        wrong_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        question_order: {
            type: DataTypes.JSON,
            allowNull: true
        },
        started_at: {
            type: DataTypes.DATE,
            default: new Date()
        },
        submitted_at: {
            type: DataTypes.DATE,
            default: null
        }
    }, {
        tableName: 'quiz_attempts',
        timestamps: false,
        underscored: true,
    });

    QuizAttempt.associate = (models) => {
        QuizAttempt.belongsTo(models.Assignment, {
            foreignKey: 'assignment_id',
            as: 'assignment'
        });

        QuizAttempt.belongsTo(models.Student, {
            foreignKey: 'student_id',
            as: 'student'
        });

        QuizAttempt.hasMany(models.StudentAnswer, {
            foreignKey: 'attempt_id',
            as: 'answers'
        });
    };

    return QuizAttempt;
};
