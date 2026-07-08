module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("quizzes", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      teacher_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "teachers",
          key: "id",
        },
      },

      subject_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "subjects",
          key: "id",
        },
      },

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      description: Sequelize.TEXT,

      duration_minutes: Sequelize.INTEGER,

      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      passing_score: Sequelize.INTEGER,

      total_score: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      show_result_immediately: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      show_correct_answers: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      randomize_questions: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable("quizzes");
  },
};
