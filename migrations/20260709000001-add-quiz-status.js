module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("quizzes", "status", {
      type: Sequelize.ENUM("DRAFT", "PUBLISHED", "ARCHIVED"),
      defaultValue: "PUBLISHED",
      allowNull: false,
    });

    await queryInterface.sequelize.query(`
      UPDATE quizzes SET status = 'PUBLISHED' WHERE status IS NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("quizzes", "status");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_quizzes_status");
  },
};
