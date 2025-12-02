'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.DeviceToken, {
        foreignKey: 'userId',
        as: 'deviceTokens',
        onDelete: 'CASCADE'
      });
      User.hasMany(models.Notification, {
        foreignKey: 'userId',
        as: 'notifications',
        onDelete: 'CASCADE'
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('user', 'admin', 'moderator'),
        defaultValue: 'user'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      notificationPreferences: {
        type: DataTypes.JSON,
        defaultValue: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true
    }
  );

  return User;
};
