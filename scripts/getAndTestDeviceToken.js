#!/usr/bin/env node

/**
 * Get Device Token from Phone and Test FCM
 * 
 * This script:
 * 1. Connects to your phone via ADB
 * 2. Extracts the FCM token from Flutter app logs
 * 3. Automatically tests the token with FCM
 * 
 * Usage:
 *   node scripts/getAndTestDeviceToken.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
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

console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.magenta}║   Get Device Token from Phone & Test FCM                  ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

async function getAndTestDeviceToken() {
  try {
    // ============================================
    // STEP 1: Check ADB Connection
    // ============================================
    console.log(`${colors.blue}[Step 1/7]${colors.reset} Checking ADB connection...`);
    try {
      const adbPath = 'C:\\Users\\X1\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
      const devices = execSync(`${adbPath} devices`, { encoding: 'utf-8' });
      
      if (!devices.includes('device')) {
        throw new Error('No Android device connected');
      }
      
      console.log(`${colors.green}✅ Android device connected\n${colors.reset}`);
    } catch (error) {
      throw new Error(`ADB Error: ${error.message}`);
    }

    // ============================================
    // STEP 2: Clear Previous Logs
    // ============================================
    console.log(`${colors.blue}[Step 2/7]${colors.reset} Clearing device logs...`);
    try {
      const adbPath = 'C:\\Users\\X1\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
      execSync(`${adbPath} logcat -c`, { encoding: 'utf-8' });
      console.log(`${colors.green}✅ Logs cleared\n${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}⚠️  Could not clear logs (continuing)\n${colors.reset}`);
    }

    // ============================================
    // STEP 3: Get Device Token from Logs
    // ============================================
    console.log(`${colors.blue}[Step 3/7]${colors.reset} Extracting FCM token from device...`);
    console.log(`   📱 Waiting for FCM token (make sure Flutter app is running)...\n`);

    let deviceToken = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds

    while (!deviceToken && attempts < maxAttempts) {
      try {
        const adbPath = 'C:\\Users\\X1\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
        const logs = execSync(`${adbPath} logcat -d flutter:V *:S`, { encoding: 'utf-8' });
        
        // Look for FCM token pattern
        const tokenMatch = logs.match(/🔥 FCM Token: ([a-zA-Z0-9_-]+)/);
        if (tokenMatch) {
          deviceToken = tokenMatch[1];
          console.log(`${colors.green}✅ FCM token extracted\n${colors.reset}`);
          break;
        }

        // Also try to find in app logs
        const appMatch = logs.match(/FCM Token[:\s]+([a-zA-Z0-9_-]{50,})/);
        if (appMatch) {
          deviceToken = appMatch[1];
          console.log(`${colors.green}✅ FCM token extracted\n${colors.reset}`);
          break;
        }

        attempts++;
        if (attempts < maxAttempts) {
          process.stdout.write('.');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          process.stdout.write('.');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!deviceToken) {
      throw new Error('Could not extract FCM token from device logs. Make sure Flutter app is running and showing the FCM token.');
    }

    console.log(`${colors.cyan}Device Token:${colors.reset} ${deviceToken.substring(0, 30)}...\n`);

    // ============================================
    // STEP 4: Connect to Database
    // ============================================
    console.log(`${colors.blue}[Step 4/7]${colors.reset} Connecting to database...`);
    await db.sequelize.authenticate();
    console.log(`${colors.green}✅ Database connected\n${colors.reset}`);

    // ============================================
    // STEP 5: Register Device Token
    // ============================================
    console.log(`${colors.blue}[Step 5/7]${colors.reset} Registering device token...`);
    const testUser = await db.User.create({
      id: uuidv4(),
      email: `phone-test-${Date.now()}@example.com`,
      firstName: 'Phone',
      lastName: 'Test',
      role: 'admin',
      isActive: true
    });

    const registeredToken = await db.DeviceToken.create({
      id: uuidv4(),
      userId: testUser.id,
      token: deviceToken,
      deviceType: 'android',
      deviceName: 'Real Phone Device',
      isActive: true
    });
    console.log(`${colors.green}✅ Device token registered\n${colors.reset}`);

    // ============================================
    // STEP 6: Create & Send Notification
    // ============================================
    console.log(`${colors.blue}[Step 6/7]${colors.reset} Creating and sending notification...`);
    const notification = await db.Notification.create({
      id: uuidv4(),
      userId: testUser.id,
      title: '🔥 Real Device Test',
      body: 'This notification was sent from Node.js to your real phone!',
      type: 'system',
      status: 'created',
      isSent: false,
      isRead: false,
      data: JSON.stringify({
        testId: uuidv4(),
        timestamp: new Date().toISOString(),
        source: 'nodejs-auto-test'
      })
    });

    const fcmResult = await FCMService.sendToDevice(deviceToken, {
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification.id,
        type: notification.type,
        timestamp: new Date().toISOString()
      }
    });

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
        source: 'nodejs-auto-test'
      })
    });

    console.log(`${colors.green}✅ Notification sent\n${colors.reset}`);

    // ============================================
    // STEP 7: Summary
    // ============================================
    console.log(`${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.magenta}║              Test Complete                                 ║${colors.reset}`);
    console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.green}✅ Test Completed Successfully!\n${colors.reset}`);

    console.log(`${colors.cyan}Device Information:${colors.reset}`);
    console.log(`  Device Token: ${deviceToken.substring(0, 40)}...`);
    console.log(`  Device Type: Android`);
    console.log(`  Device Name: Real Phone Device`);

    console.log(`\n${colors.cyan}Test Data:${colors.reset}`);
    console.log(`  User ID: ${testUser.id}`);
    console.log(`  User Email: ${testUser.email}`);
    console.log(`  Notification ID: ${notification.id}`);
    console.log(`  Delivery ID: ${delivery.id}`);
    console.log(`  Delivery Status: ${delivery.status}`);

    console.log(`\n${colors.cyan}FCM Result:${colors.reset}`);
    console.log(`  Success: ${fcmResult.success}`);
    console.log(`  Message ID: ${fcmResult.messageId}`);
    console.log(`  Message: ${fcmResult.message}`);

    console.log(`\n${colors.cyan}What to Expect:${colors.reset}`);
    if (fcmResult.success) {
      console.log(`  ✅ Notification should appear on your phone NOW`);
      console.log(`  🔔 Check your notification center`);
      console.log(`  📱 Tap the notification to open the app`);
    } else {
      console.log(`  ℹ️  Using mock FCM (Firebase not initialized)`);
      console.log(`  📝 Check server logs: tail -f logs/all.log | grep "🔥"`);
    }

    console.log(`\n${colors.cyan}Verification:${colors.reset}`);
    console.log(`  SELECT * FROM device_tokens WHERE token = '${deviceToken.substring(0, 20)}...';`);
    console.log(`  SELECT * FROM notifications WHERE id = '${notification.id}';`);
    console.log(`  SELECT * FROM notification_deliveries WHERE id = '${delivery.id}';\n`);

    logger.info('Auto device token test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
    console.error(error.stack);
    logger.error('Auto device token test error', error.message);
    process.exit(1);
  }
}

// Run test
getAndTestDeviceToken();
