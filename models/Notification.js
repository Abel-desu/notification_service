'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  Notification.init(
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
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('exam', 'material', 'reminder', 'announcement', 'system'),
        defaultValue: 'system'
      },
      relatedId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      relatedType: {
        type: DataTypes.ENUM('exam', 'material', 'course'),
        allowNull: true
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      data: {
        type: DataTypes.JSON,
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
      modelName: 'Notification',
      tableName: 'notifications',
      timestamps: true
    }
  );

  return Notification;
};
