module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("assignments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      quiz_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "quizzes",
          key: "id",
        },
      },

      class_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "classes",
          key: "id",
        },
      },

      title: Sequelize.STRING(255),

      type: {
        type: Sequelize.ENUM("QUIZ", "HOMEWORK"),
      },

      instructions: Sequelize.TEXT,

      start_date: Sequelize.DATE,

      due_date: Sequelize.DATE,

      allow_late_submission: Sequelize.BOOLEAN,

      status: {
        type: Sequelize.ENUM("DRAFT", "PUBLISHED", "CLOSED"),
        defaultValue: "DRAFT",
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
    await queryInterface.dropTable("assignments");
  },
};
