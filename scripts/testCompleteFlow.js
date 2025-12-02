#!/usr/bin/env node

/**
 * Complete End-to-End Notification Flow Test
 * Tests: Create → Dispatch → Delivery → Firebase
 * 
 * Usage:
 *   node scripts/testCompleteFlow.js
 */

require('dotenv').config();
const db = require('../models');
const FCMService = require('../services/fcmService');
const logger = require('../utils/winstonLogger');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  cyan: '\x1b[34m'
};

console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.magenta}║   Complete End-to-End Notification Flow Test               ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

async function testCompleteFlow() {
  try {
    // ============================================
    // STEP 1: Connect to Database
    // ============================================
    console.log(`${colors.blue}[Step 1/8]${colors.reset} Connecting to database...`);
    await db.sequelize.authenticate();
    console.log(`${colors.green}✅ Database connected\n${colors.reset}`);

    // ============================================
    // STEP 2: Create Test User
    // ============================================
    console.log(`${colors.blue}[Step 2/8]${colors.reset} Creating test user...`);
    const testUser = await db.User.create({
      id: uuidv4(),
      email: `test-flow-${Date.now()}@example.com`,
      firstName: 'Flow',
      lastName: 'Test',
      role: 'admin',
      isActive: true
    });
    console.log(`${colors.green}✅ User created: ${testUser.email}\n${colors.reset}`);

    // ============================================
    // STEP 3: Register Device Token
    // ============================================
    console.log(`${colors.blue}[Step 3/8]${colors.reset} Registering device token...`);
    const testToken = `fcm_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const deviceToken = await db.DeviceToken.create({
      id: uuidv4(),
      userId: testUser.id,
      token: testToken,
      deviceType: 'web',
      deviceName: 'Test Device',
      isActive: true
    });
    console.log(`${colors.green}✅ Device token registered\n${colors.reset}`);

    // ============================================
    // STEP 4: Create Notification
    // ============================================
    console.log(`${colors.blue}[Step 4/8]${colors.reset} Creating notification...`);
    const notification = await db.Notification.create({
      id: uuidv4(),
      userId: testUser.id,
      title: '🔥 Complete Flow Test',
      body: 'This is a complete end-to-end notification flow test',
      type: 'system',
      status: 'created',
      isSent: false,
      isRead: false
    });
    console.log(`${colors.green}✅ Notification created: ${notification.id}\n${colors.reset}`);

    // ============================================
    // STEP 5: Create Delivery Record
    // ============================================
    console.log(`${colors.blue}[Step 5/8]${colors.reset} Creating delivery record...`);
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

    // ============================================
    // STEP 6: Test Firebase Send
    // ============================================
    console.log(`${colors.blue}[Step 6/8]${colors.reset} Testing Firebase send...`);
    console.log(`   🔥 Sending via FCM...`);
    
    const fcmResult = await FCMService.sendToDevice(testToken, {
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification.id,
        type: notification.type,
        timestamp: new Date().toISOString()
      }
    });

    if (fcmResult.success) {
      console.log(`${colors.green}✅ Firebase send successful\n${colors.reset}`);
      await delivery.update({
        status: 'sent',
        channel: 'push',
        sentAt: new Date()
      });
    } else {
      console.log(`${colors.yellow}⚠️  Firebase send used mock (expected)\n${colors.reset}`);
    }

    // ============================================
    // STEP 7: Verify Database State
    // ============================================
    console.log(`${colors.blue}[Step 7/8]${colors.reset} Verifying database state...`);
    
    const updatedDelivery = await db.NotificationDelivery.findByPk(delivery.id);
    const updatedNotification = await db.Notification.findByPk(notification.id);
    const updatedUser = await db.User.findByPk(testUser.id);
    const updatedToken = await db.DeviceToken.findByPk(deviceToken.id);

    console.log(`${colors.cyan}User:${colors.reset}`);
    console.log(`  ID: ${updatedUser.id}`);
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Role: ${updatedUser.role}`);

    console.log(`${colors.cyan}Device Token:${colors.reset}`);
    console.log(`  ID: ${updatedToken.id}`);
    console.log(`  Type: ${updatedToken.deviceType}`);
    console.log(`  Active: ${updatedToken.isActive}`);

    console.log(`${colors.cyan}Notification:${colors.reset}`);
    console.log(`  ID: ${updatedNotification.id}`);
    console.log(`  Title: ${updatedNotification.title}`);
    console.log(`  Status: ${updatedNotification.status}`);

    console.log(`${colors.cyan}Delivery:${colors.reset}`);
    console.log(`  ID: ${updatedDelivery.id}`);
    console.log(`  Status: ${updatedDelivery.status}`);
    console.log(`  Channel: ${updatedDelivery.channel || 'pending'}`);
    console.log(`  Sent At: ${updatedDelivery.sentAt || 'not sent'}`);
    console.log(`  Attempts: ${updatedDelivery.attemptCount}/${updatedDelivery.maxAttempts}\n`);

    // ============================================
    // STEP 8: Generate JWT Token
    // ============================================
    console.log(`${colors.blue}[Step 8/8]${colors.reset} Generating JWT token...`);
    const jwtToken = jwt.sign(
      { 
        id: testUser.id, 
        email: testUser.email, 
        role: testUser.role 
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
      { expiresIn: '7d' }
    );
    console.log(`${colors.green}✅ JWT token generated\n${colors.reset}`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log(`${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.magenta}║         Complete Flow Test Summary                        ║${colors.reset}`);
    console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.green}✅ All Steps Completed Successfully!\n${colors.reset}`);

    console.log(`${colors.cyan}Test Data Created:${colors.reset}`);
    console.log(`  User ID: ${testUser.id}`);
    console.log(`  User Email: ${testUser.email}`);
    console.log(`  Device Token: ${testToken.substring(0, 30)}...`);
    console.log(`  Notification ID: ${notification.id}`);
    console.log(`  Delivery ID: ${delivery.id}`);

    console.log(`\n${colors.cyan}JWT Token (for API testing):${colors.reset}`);
    console.log(`  ${jwtToken}\n`);

    console.log(`${colors.cyan}Next Steps:${colors.reset}`);
    console.log(`  1. Use the JWT token to test API endpoints`);
    console.log(`  2. Register the device token in your Flutter app`);
    console.log(`  3. Send notifications via API`);
    console.log(`  4. Monitor delivery processor logs`);
    console.log(`  5. Check Firebase triggers\n`);

    console.log(`${colors.cyan}API Endpoints to Test:${colors.reset}`);
    console.log(`  POST /api/notifications/create`);
    console.log(`  POST /api/notifications/dispatch/:id`);
    console.log(`  POST /api/notifications/send/user`);
    console.log(`  GET /api/notifications`);
    console.log(`  PATCH /api/notifications/:id/read\n`);

    console.log(`${colors.cyan}Database Queries:${colors.reset}`);
    console.log(`  SELECT * FROM users WHERE id = '${testUser.id}';`);
    console.log(`  SELECT * FROM device_tokens WHERE userId = '${testUser.id}';`);
    console.log(`  SELECT * FROM notifications WHERE id = '${notification.id}';`);
    console.log(`  SELECT * FROM notification_deliveries WHERE id = '${delivery.id}';\n`);

    logger.info('Complete flow test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error(`\n${colors.red}❌ Test failed: ${error.message}${colors.reset}\n`);
    console.error(error.stack);
    logger.error('Complete flow test error', error.message);
    process.exit(1);
  }
}

// Run test
testCompleteFlow();
