module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("student_answers", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      attempt_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "quiz_attempts",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      question_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "questions",
          key: "id",
        },
      },

      selected_option_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "answer_options",
          key: "id",
        },
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("student_answers");
  },
};
