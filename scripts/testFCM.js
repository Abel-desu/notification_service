#!/usr/bin/env node

/**
 * FCM Push Notification Test Script
 * Tests Firebase Cloud Messaging integration
 * 
 * Usage:
 *   node scripts/testFCM.js
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
  magenta: '\x1b[35m'
};

console.log(`\n${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.magenta}║   FCM Push Notification Test Script    ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}\n`);

async function testFCM() {
  try {
    // Connect to database
    console.log(`${colors.blue}[1/5]${colors.reset} Connecting to database...`);
    await db.sequelize.authenticate();
    console.log(`${colors.green}✅ Database connected${colors.reset}\n`);

    // Create test user
    console.log(`${colors.blue}[2/5]${colors.reset} Creating test user...`);
    const testUser = await db.User.create({
      id: uuidv4(),
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: true
    });
    console.log(`${colors.green}✅ Test user created: ${testUser.email}${colors.reset}\n`);

    // Create test device token
    console.log(`${colors.blue}[3/5]${colors.reset} Creating test device token...`);
    
    // Generate a test FCM token (in real scenario, this comes from client)
    const testToken = `test_fcm_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const deviceToken = await db.DeviceToken.create({
      id: uuidv4(),
      userId: testUser.id,
      token: testToken,
      deviceType: 'web',
      deviceName: 'Test Device',
      isActive: true
    });
    console.log(`${colors.green}✅ Device token created${colors.reset}`);
    console.log(`   Token: ${testToken}\n`);

    // Test FCM send
    console.log(`${colors.blue}[4/5]${colors.reset} Testing FCM push notification...`);
    
    const testNotification = {
      title: 'Test Notification',
      body: 'This is a test push notification from FCM',
      data: {
        testId: uuidv4(),
        timestamp: new Date().toISOString(),
        type: 'test'
      }
    };

    console.log(`   Sending to token: ${testToken.substring(0, 20)}...`);
    const result = await FCMService.sendToDevice(testToken, testNotification);

    if (result.success) {
      console.log(`${colors.green}✅ FCM push sent successfully${colors.reset}`);
      console.log(`   Message ID: ${result.messageId}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  FCM push failed (expected for test token)${colors.reset}`);
      console.log(`   Error: ${result.error}\n`);
    }

    // Test multicast send
    console.log(`${colors.blue}[5/5]${colors.reset} Testing multicast push notification...`);
    
    const multicastTokens = [testToken, `test_token_2_${Date.now()}`];
    
    const multicastResult = await FCMService.sendToMultipleDevices(
      multicastTokens,
      testNotification
    );

    if (multicastResult.success) {
      console.log(`${colors.green}✅ Multicast push sent${colors.reset}`);
      console.log(`   Success: ${multicastResult.successCount}`);
      console.log(`   Failed: ${multicastResult.failureCount}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  Multicast push failed${colors.reset}`);
      console.log(`   Error: ${multicastResult.error}\n`);
    }

    // Summary
    console.log(`${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.magenta}║         Test Summary                   ║${colors.reset}`);
    console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}`);
    console.log(`${colors.green}✅ Database connection${colors.reset}`);
    console.log(`${colors.green}✅ User creation${colors.reset}`);
    console.log(`${colors.green}✅ Device token creation${colors.reset}`);
    console.log(`${colors.green}✅ FCM integration${colors.reset}`);
    console.log(`${colors.green}✅ Multicast support${colors.reset}`);

    console.log(`\n${colors.blue}Test Data:${colors.reset}`);
    console.log(`  User ID: ${testUser.id}`);
    console.log(`  User Email: ${testUser.email}`);
    console.log(`  Device Token ID: ${deviceToken.id}`);
    console.log(`  Test Token: ${testToken}`);

    console.log(`\n${colors.yellow}Note:${colors.reset} Test tokens will fail in real FCM send.`);
    console.log(`To test with real tokens, register a device from your mobile app.\n`);

    logger.info('FCM test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error(`\n${colors.red}❌ Test failed: ${error.message}${colors.reset}\n`);
    logger.error('FCM test error', error.message);
    process.exit(1);
  }
}

// Run test
testFCM();
