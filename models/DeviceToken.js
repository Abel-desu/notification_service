'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DeviceToken extends Model {
    static associate(models) {
      DeviceToken.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  DeviceToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      token: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true
      },
      deviceType: {
        type: DataTypes.ENUM('ios', 'android', 'web'),
        allowNull: false
      },
      deviceName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: true
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
      modelName: 'DeviceToken',
      tableName: 'device_tokens',
      timestamps: true
    }
  );

  return DeviceToken;
};
