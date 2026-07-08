module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_refresh_tokens", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      token_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      device_name: Sequelize.STRING(255),

      ip_address: Sequelize.STRING(100),

      user_agent: Sequelize.TEXT,

      expires_at: Sequelize.DATE,

      revoked_at: Sequelize.DATE,

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_refresh_tokens");
  },
};
