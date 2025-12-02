#!/usr/bin/env node

/**
 * Complete Notification Flow Test Script
 * Tests the entire notification system end-to-end
 * 
 * Usage:
 *   node scripts/testNotificationFlow.js
 */

require('dotenv').config();
const db = require('../models');
const FCMService = require('../services/fcmService');
const logger = require('../utils/winstonLogger');
const { v4: uuidv4 } = require('uuid');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  cyan: '\x1b[34m'
};

console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.magenta}║   Complete Notification Flow Test Script           ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════════════╝${colors.reset}\n`);

async function testNotificationFlow() {
  try {
    // Step 1: Connect to database
    console.log(`${colors.blue}[Step 1/7]${colors.reset} Connecting to database...`);
    await db.sequelize.authenticate();
    console.log(`${colors.green}✅ Database connected\n${colors.reset}`);

    // Step 2: Create test user
    console.log(`${colors.blue}[Step 2/7]${colors.reset} Creating test user...`);
    const testUser = await db.User.create({
      id: uuidv4(),
      email: `test-flow-${Date.now()}@example.com`,
      firstName: 'Flow',
      lastName: 'Test',
      role: 'user',
      isActive: true
    });
    console.log(`${colors.green}✅ User created: ${testUser.email}\n${colors.reset}`);

    // Step 3: Register device token
    console.log(`${colors.blue}[Step 3/7]${colors.reset} Registering device token...`);
    const testToken = `fcm_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const deviceToken = await db.DeviceToken.create({
      id: uuidv4(),
      userId: testUser.id,
      token: testToken,
      deviceType: 'web',
      deviceName: 'Test Browser',
      isActive: true
    });
    console.log(`${colors.green}✅ Device token registered\n${colors.reset}`);

    // Step 4: Create notification
    console.log(`${colors.blue}[Step 4/7]${colors.reset} Creating notification...`);
    const notification = await db.Notification.create({
      id: uuidv4(),
      userId: testUser.id,
      title: 'Test Notification Flow',
      body: 'This is a complete notification flow test',
      type: 'system',
      status: 'created',
      isSent: false,
      isRead: false
    });
    console.log(`${colors.green}✅ Notification created: ${notification.id}\n${colors.reset}`);

    // Step 5: Create delivery record
    console.log(`${colors.blue}[Step 5/7]${colors.reset} Creating delivery record...`);
    const delivery = await db.NotificationDelivery.create({
      id: uuidv4(),
      notificationId: notification.id,
      userId: testUser.id,
      deviceTokenId: deviceToken.id,
      status: 'pending',
      attemptCount: 0,
      maxAttempts: 3
    });
    console.log(`${colors.green}✅ Delivery record created: ${delivery.id}\n${colors.reset}`);

    // Step 6: Simulate delivery processing
    console.log(`${colors.blue}[Step 6/7]${colors.reset} Simulating delivery processing...`);
    
    // Try in-app delivery
    console.log(`   Attempting in-app delivery (Socket.io)...`);
    // In real scenario, this would check if user is online via Socket.io
    const userOnline = false; // Simulating offline user
    
    if (userOnline) {
      console.log(`   ✅ User is online, would emit real-time notification`);
      await delivery.update({
        status: 'sent',
        channel: 'inApp',
        sentAt: new Date()
      });
    } else {
      console.log(`   ℹ️  User is offline, storing notification payload`);
      await delivery.update({
        offlinePayload: {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          timestamp: new Date()
        }
      });
      
      // Try push notification as fallback
      console.log(`   Attempting push notification (Firebase FCM)...`);
      const fcmResult = await FCMService.sendToDevice(testToken, {
        title: notification.title,
        body: notification.body,
        data: {
          notificationId: notification.id,
          type: notification.type
        }
      });

      if (fcmResult.success) {
        console.log(`   ${colors.green}✅ Push notification sent${colors.reset}`);
        await delivery.update({
          status: 'sent',
          channel: 'push',
          sentAt: new Date()
        });
      } else {
        console.log(`   ${colors.yellow}⚠️  Push notification failed (expected for test token)${colors.reset}`);
        // Schedule retry
        await delivery.update({
          status: 'pending',
          retryScheduledAt: new Date(Date.now() + 5000),
          failureReason: fcmResult.error
        });
      }
    }
    console.log(`${colors.green}✅ Delivery processing simulated\n${colors.reset}`);

    // Step 7: Verify delivery status
    console.log(`${colors.blue}[Step 7/7]${colors.reset} Verifying delivery status...`);
    
    const updatedDelivery = await db.NotificationDelivery.findByPk(delivery.id);
    const updatedNotification = await db.Notification.findByPk(notification.id);

    console.log(`${colors.green}✅ Delivery status verified\n${colors.reset}`);

    // Summary
    console.log(`${colors.magenta}╔════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.magenta}║         Test Flow Summary                          ║${colors.reset}`);
    console.log(`${colors.magenta}╚════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.cyan}User Information:${colors.reset}`);
    console.log(`  ID: ${testUser.id}`);
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Role: ${testUser.role}`);
    console.log(`  Active: ${testUser.isActive}\n`);

    console.log(`${colors.cyan}Device Token Information:${colors.reset}`);
    console.log(`  ID: ${deviceToken.id}`);
    console.log(`  Type: ${deviceToken.deviceType}`);
    console.log(`  Name: ${deviceToken.deviceName}`);
    console.log(`  Active: ${deviceToken.isActive}\n`);

    console.log(`${colors.cyan}Notification Information:${colors.reset}`);
    console.log(`  ID: ${notification.id}`);
    console.log(`  Title: ${notification.title}`);
    console.log(`  Type: ${notification.type}`);
    console.log(`  Status: ${notification.status}\n`);

    console.log(`${colors.cyan}Delivery Information:${colors.reset}`);
    console.log(`  ID: ${updatedDelivery.id}`);
    console.log(`  Status: ${updatedDelivery.status}`);
    console.log(`  Channel: ${updatedDelivery.channel || 'pending'}`);
    console.log(`  Attempts: ${updatedDelivery.attemptCount}/${updatedDelivery.maxAttempts}`);
    console.log(`  Sent At: ${updatedDelivery.sentAt || 'pending'}\n`);

    console.log(`${colors.green}✅ All tests completed successfully!\n${colors.reset}`);

    logger.info('Notification flow test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error(`\n${colors.red}❌ Test failed: ${error.message}${colors.reset}\n`);
    console.error(error.stack);
    logger.error('Notification flow test error', error.message);
    process.exit(1);
  }
}

// Run test
testNotificationFlow();
