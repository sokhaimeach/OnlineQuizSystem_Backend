module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("subjects", {
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
        onDelete: "CASCADE",
      },

      subject_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      description: Sequelize.TEXT,

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("subjects");
  },
};
