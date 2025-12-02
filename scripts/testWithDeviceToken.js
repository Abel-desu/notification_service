#!/usr/bin/env node

/**
 * Test FCM with Real Device Token
 * 
 * Usage:
 *   node scripts/testWithDeviceToken.js <device_token>
 *   
 * Example:
 *   node scripts/testWithDeviceToken.js "eIxxx...your_real_fcm_token...xxx"
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

// Get device token from command line
const deviceToken = process.argv[2];

if (!deviceToken) {
  console.log(`\n${colors.red}❌ Error: Device token not provided${colors.reset}\n`);
  console.log(`${colors.cyan}Usage:${colors.reset}`);
  console.log(`  node scripts/testWithDeviceToken.js "<your_device_token>"\n`);
  console.log(`${colors.cyan}Example:${colors.reset}`);
  console.log(`  node scripts/testWithDeviceToken.js "eIxxx...your_real_fcm_token...xxx"\n`);
  process.exit(1);
}

console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.magenta}║   FCM Test with Real Device Token                         ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

async function testWithDeviceToken() {
  try {
    // ============================================
    // STEP 1: Connect to Database
    // ============================================
    console.log(`${colors.blue}[Step 1/6]${colors.reset} Connecting to database...`);
    await db.sequelize.authenticate();
    console.log(`${colors.green}✅ Database connected\n${colors.reset}`);

    // ============================================
    // STEP 2: Create Test User
    // ============================================
    console.log(`${colors.blue}[Step 2/6]${colors.reset} Creating test user...`);
    const testUser = await db.User.create({
      id: uuidv4(),
      email: `device-test-${Date.now()}@example.com`,
      firstName: 'Device',
      lastName: 'Test',
      role: 'admin',
      isActive: true
    });
    console.log(`${colors.green}✅ User created: ${testUser.email}\n${colors.reset}`);

    // ============================================
    // STEP 3: Register Device Token
    // ============================================
    console.log(`${colors.blue}[Step 3/6]${colors.reset} Registering device token...`);
    const registeredToken = await db.DeviceToken.create({
      id: uuidv4(),
      userId: testUser.id,
      token: deviceToken,
      deviceType: 'android',
      deviceName: 'Test Android Device',
      isActive: true
    });
    console.log(`${colors.green}✅ Device token registered\n${colors.reset}`);

    // ============================================
    // STEP 4: Create Notification
    // ============================================
    console.log(`${colors.blue}[Step 4/6]${colors.reset} Creating notification...`);
    const notification = await db.Notification.create({
      id: uuidv4(),
      userId: testUser.id,
      title: '🔥 Device Token Test',
      body: 'Testing with real device token from your phone',
      type: 'system',
      status: 'created',
      isSent: false,
      isRead: false,
      data: JSON.stringify({
        testId: uuidv4(),
        timestamp: new Date().toISOString(),
        source: 'nodejs-test'
      })
    });
    console.log(`${colors.green}✅ Notification created: ${notification.id}\n${colors.reset}`);

    // ============================================
    // STEP 5: Send via FCM
    // ============================================
    console.log(`${colors.blue}[Step 5/6]${colors.reset} Sending notification via FCM...`);
    console.log(`   📱 Device Token: ${deviceToken.substring(0, 30)}...`);
    console.log(`   📤 Sending...\n`);

    const fcmResult = await FCMService.sendToDevice(deviceToken, {
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification.id,
        type: notification.type,
        timestamp: new Date().toISOString()
      }
    });

    if (fcmResult.success) {
      console.log(`${colors.green}✅ FCM send successful\n${colors.reset}`);
      console.log(`${colors.cyan}Message ID:${colors.reset} ${fcmResult.messageId}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  FCM send result:${colors.reset} ${fcmResult.message}\n`);
    }

    // ============================================
    // STEP 6: Create Delivery Record
    // ============================================
    console.log(`${colors.blue}[Step 6/6]${colors.reset} Creating delivery record...`);
    const delivery = await db.NotificationDelivery.create({
      id: uuidv4(),
      notificationId: notification.id,
      userId: testUser.id,
      deviceTokenId: registeredToken.id,
      status: fcmResult.success ? 'sent' : 'pending',
      channel: 'push',
      sentAt: fcmResult.success ? new Date() : null,
      attemptCount: 1,
      maxAttempts: 3,
      metadata: JSON.stringify({
        messageId: fcmResult.messageId,
        source: 'nodejs-test'
      })
    });
    console.log(`${colors.green}✅ Delivery record created\n${colors.reset}`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log(`${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.magenta}║              Test Summary                                  ║${colors.reset}`);
    console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.green}✅ Test Completed Successfully!\n${colors.reset}`);

    console.log(`${colors.cyan}Test Data:${colors.reset}`);
    console.log(`  User ID: ${testUser.id}`);
    console.log(`  User Email: ${testUser.email}`);
    console.log(`  Device Token: ${deviceToken.substring(0, 30)}...`);
    console.log(`  Notification ID: ${notification.id}`);
    console.log(`  Delivery ID: ${delivery.id}`);
    console.log(`  Delivery Status: ${delivery.status}`);

    console.log(`\n${colors.cyan}FCM Result:${colors.reset}`);
    console.log(`  Success: ${fcmResult.success}`);
    console.log(`  Message ID: ${fcmResult.messageId}`);
    console.log(`  Message: ${fcmResult.message}`);

    console.log(`\n${colors.cyan}What to Expect:${colors.reset}`);
    if (fcmResult.success) {
      console.log(`  ✅ Notification should appear on your device`);
      console.log(`  ✅ Check your device notifications`);
      console.log(`  ✅ Tap to open the app`);
    } else {
      console.log(`  ℹ️  Using mock FCM (expected if Firebase not initialized)`);
      console.log(`  📝 Check server logs for 🔥 Firebase triggers`);
    }

    console.log(`\n${colors.cyan}Database Queries:${colors.reset}`);
    console.log(`  SELECT * FROM users WHERE id = '${testUser.id}';`);
    console.log(`  SELECT * FROM device_tokens WHERE token = '${deviceToken.substring(0, 20)}...';`);
    console.log(`  SELECT * FROM notifications WHERE id = '${notification.id}';`);
    console.log(`  SELECT * FROM notification_deliveries WHERE id = '${delivery.id}';\n`);

    logger.info('Device token test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error(`\n${colors.red}❌ Test failed: ${error.message}${colors.reset}\n`);
    console.error(error.stack);
    logger.error('Device token test error', error.message);
    process.exit(1);
  }
}

// Run test
testWithDeviceToken();
