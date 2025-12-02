'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NotificationDelivery extends Model {
    static associate(models) {
      NotificationDelivery.belongsTo(models.Notification, {
        foreignKey: 'notificationId',
        as: 'notification'
      });
      NotificationDelivery.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      NotificationDelivery.belongsTo(models.DeviceToken, {
        foreignKey: 'deviceTokenId',
        as: 'deviceToken'
      });
    }
  }

  NotificationDelivery.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      notificationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'notifications',
          key: 'id'
        }
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      deviceTokenId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'device_tokens',
          key: 'id'
        }
      },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'),
        defaultValue: 'pending'
      },
      channel: {
        type: DataTypes.ENUM('inApp', 'push', 'email'),
        allowNull: true
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      failureReason: {
        type: DataTypes.STRING,
        allowNull: true
      },
      attemptCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      maxAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 3
      },
      offlinePayload: {
        type: DataTypes.JSON,
        allowNull: true
      },
      retryScheduledAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      metadata: {
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
      modelName: 'NotificationDelivery',
      tableName: 'notification_deliveries',
      timestamps: true,
      indexes: [
        {
          fields: ['status', 'createdAt']
        },
        {
          fields: ['userId']
        },
        {
          fields: ['notificationId']
        }
      ]
    }
  );

  return NotificationDelivery;
};
