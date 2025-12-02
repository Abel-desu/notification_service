'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('exam', 'material', 'reminder', 'announcement', 'system'),
        defaultValue: 'system'
      },
      relatedId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      relatedType: {
        type: Sequelize.ENUM('exam', 'material', 'course'),
        allowNull: true
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isSent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      data: {
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
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};
