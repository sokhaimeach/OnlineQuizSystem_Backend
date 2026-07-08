'use strict';

module.exports = (sequelize, DataTypes) => {
    const Class = sequelize.define('Class', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        teacher_id: DataTypes.UUID,
        class_name: DataTypes.STRING,
        description: DataTypes.TEXT,
        color: {
            type: DataTypes.STRING(7),
            allowNull: true,
        },
    }, {
        tableName: 'classes',
        underscored: true,
    });

    Class.associate = (models) => {
        Class.belongsTo(models.Teacher, {
            foreignKey: 'teacher_id',
            as: 'teacher'
        });

        Class.belongsToMany(models.Student, {
            through: models.ClassStudent,
            foreignKey: 'class_id',
            as: 'students'
        });

        Class.hasMany(models.Assignment, {
            foreignKey: 'class_id',
            as: 'assignments'
        });
    };

    return Class;
};