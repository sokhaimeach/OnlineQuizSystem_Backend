'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        gender: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        avatar_url: DataTypes.STRING,
        bio: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        public_id: {
            type: DataTypes.STRING,
            default: null
        },
        role: DataTypes.ENUM('ADMIN', 'TEACHER', 'STUDENT'),
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
            default: "ACTIVE"
        },
    }, {
        tableName: 'users',
        underscored: true,
        defaultScope: {
            attributes: { exclude: ['password'] }
        },
        // hash password before craete and update
        hooks: {
            // create
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            },
            // update
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        }
    });

    User.associate = (models) => {
        User.hasOne(models.Teacher, { foreignKey: 'user_id', as: 'teacher' });
        User.hasOne(models.Student, { foreignKey: 'user_id', as: 'student' });

        User.hasMany(models.UserRefreshToken, {
            foreignKey: 'user_id',
            as: 'refresh_token'
        });
    };

    // function to verify password
    User.prototype.comparePassword = async function (plainPassword) {
        return bcrypt.compare(plainPassword, this.password);
    }

    return User;
};