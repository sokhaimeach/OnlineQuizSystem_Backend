module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("classes", {
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

      class_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      description: Sequelize.TEXT,

      color: {
        type: Sequelize.STRING(7),
        allowNull: true,
      },

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
    await queryInterface.dropTable("classes");
  },
};
