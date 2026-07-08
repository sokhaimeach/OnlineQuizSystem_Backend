module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("questions", {
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
        onDelete: "CASCADE",
      },

      question_text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      question_type: {
        type: Sequelize.ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE'),
        default: "SINGLE_CHOICE"
      },

      score: Sequelize.INTEGER,

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
    await queryInterface.dropTable("questions");
  },
};
