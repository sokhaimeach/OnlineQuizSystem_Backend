'use strict';

module.exports = (sequelize, DataTypes) => {
    const Student = sequelize.define('Student', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: DataTypes.UUID,
        phone_number: DataTypes.STRING,
        date_of_birth: DataTypes.DATEONLY,
        parent_phone_number: DataTypes.STRING,
    }, {
        tableName: 'students',
        underscored: true,
    });

    Student.associate = (models) => {
        Student.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });

        Student.belongsToMany(models.Class, {
            through: models.ClassStudent,
            foreignKey: 'student_id',
            as: 'classes'
        });

        Student.hasMany(models.QuizAttempt, {
            foreignKey: 'student_id',
            as: 'attempts'
        });
    };

    return Student;
};