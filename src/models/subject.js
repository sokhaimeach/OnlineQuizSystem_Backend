'use strict';

module.exports = (sequelize, DataTypes) => {
    const Subject = sequelize.define('Subject', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        teacher_id: DataTypes.UUID,
        subject_name: DataTypes.STRING,
        description: DataTypes.TEXT,
    }, {
        tableName: 'subjects',
        underscored: true,
    });

    Subject.associate = (models) => {
        Subject.hasMany(models.Quiz, {
            foreignKey: 'subject_id',
            as: 'quizzes'
        });
    };

    return Subject;
};