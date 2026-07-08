'use strict';

module.exports = (sequelize, DataTypes) => {
    const AnswerOption = sequelize.define('AnswerOption', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        question_id: DataTypes.UUID,
        option_text: DataTypes.TEXT,
        is_correct: DataTypes.BOOLEAN,
    }, {
        tableName: 'answer_options',
        timestamps: false,
        underscored: true,
    });

    AnswerOption.associate = (models) => {
        AnswerOption.belongsTo(models.Question, {
            foreignKey: 'question_id',
            as: 'question'
        });

        AnswerOption.hasMany(models.StudentAnswer, {
            foreignKey: 'selected_option_id',
        });
    };

    return AnswerOption;
};