'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notification_deliveries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      notificationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'notifications',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      deviceTokenId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'device_tokens',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed', 'read'),
        defaultValue: 'pending'
      },
      channel: {
        type: Sequelize.ENUM('inApp', 'push', 'email'),
        allowNull: true
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      failureReason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      attemptCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      maxAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 3
      },
      offlinePayload: {
        type: Sequelize.JSON,
        allowNull: true
      },
      retryScheduledAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('notification_deliveries', ['status', 'createdAt']);
    await queryInterface.addIndex('notification_deliveries', ['userId']);
    await queryInterface.addIndex('notification_deliveries', ['notificationId']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('notification_deliveries');
  }
};
