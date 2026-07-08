'use strict';

module.exports = (sequelize, DataTypes) => {
    const UserRefreshToken = sequelize.define('UserRefreshToken', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: DataTypes.UUID,
        token_hash: DataTypes.STRING,
        device_name: DataTypes.STRING,
        ip_address: DataTypes.STRING,
        user_agent: DataTypes.TEXT,
        expires_at: DataTypes.DATE,
        revoked_at: DataTypes.DATE,
    }, {
        tableName: 'user_refresh_tokens',
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
    });

    UserRefreshToken.associate = (models) => {
        UserRefreshToken.belongsTo(models.User, {
            foreignKey: 'user_id',
        });
    };

    return UserRefreshToken;
};