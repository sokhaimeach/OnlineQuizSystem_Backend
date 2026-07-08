'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      gender: {
        type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER'),
        allowNull: false,
        defaultValue: 'OTHER',

      },

      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },

      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      avatar_url: {
        type: Sequelize.STRING(500),
      },

      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      public_id: {
        type: Sequelize.STRING,
        allowNull: true
      },

      role: {
        type: Sequelize.ENUM('ADMIN', 'TEACHER', 'STUDENT'),
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM(
          'ACTIVE',
          'INACTIVE',
          'SUSPENDED'
        ),
        defaultValue: 'ACTIVE',
      },


      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};