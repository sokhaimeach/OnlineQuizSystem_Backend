'use strict';

module.exports = (sequelize, DataTypes) => {
    const ClassStudent = sequelize.define('ClassStudent', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        class_id: DataTypes.UUID,
        student_id: DataTypes.UUID,
        joined_at: {
            type: DataTypes.DATE,
            default: Date.now()
        },
    }, {
        tableName: 'class_students',
        timestamps: false,
        underscored: true,
    });

    return ClassStudent;
};