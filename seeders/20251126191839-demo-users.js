'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { v4: uuidv4 } = require('uuid');
    
    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        notificationPreferences: JSON.stringify({
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: true,
        notificationPreferences: JSON.stringify({
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'user2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'user',
        isActive: true,
        notificationPreferences: JSON.stringify({
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
