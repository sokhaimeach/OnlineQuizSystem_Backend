module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("quiz_attempts", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      assignment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "assignments",
          key: "id",
        },
      },

      student_id: {
        type: Sequelize.UUID,
        references: {
          model: "students",
          key: "id",
        },
      },

      guest_name: Sequelize.STRING(255),

      attempt_number: Sequelize.INTEGER,

      access_token: {
        type: Sequelize.STRING,
        allowNull: false
      },

      status: {
        type: Sequelize.ENUM("IN_PROGRESS", "SUBMITTED", "TIMEOUT"),
        defaultValue: "IN_PROGRESS",
      },

      total_score: Sequelize.DECIMAL(10, 2),

      question_order: {
        type: Sequelize.JSON,
        allowNull: true
      },

      started_at: Sequelize.DATE,

      submitted_at: Sequelize.DATE,

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
    await queryInterface.dropTable("quiz_attempts");
  },
};
