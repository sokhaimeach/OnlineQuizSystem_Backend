'use strict';

module.exports = (sequelize, DataTypes) => {
    const Teacher = sequelize.define('Teacher', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: DataTypes.UUID,
        school_name: DataTypes.STRING,
    }, {
        tableName: 'teachers',
        underscored: true,
    });

    Teacher.associate = (models) => {
        Teacher.belongsTo(models.User, {
            foreignKey: 'user_id',
        });

        Teacher.hasMany(models.Class, {
            foreignKey: 'teacher_id',
        });

        Teacher.hasMany(models.Quiz, {
            foreignKey: 'teacher_id',
        });
    };

    return Teacher;
};