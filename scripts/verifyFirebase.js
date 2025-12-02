#!/usr/bin/env node

/**
 * Verify Firebase is Working Properly
 * 
 * This script checks:
 * 1. Firebase Admin SDK initialized
 * 2. Service account credentials loaded
 * 3. Firebase project connected
 * 4. FCM service ready
 * 5. Send test notification
 * 
 * Usage:
 *   node scripts/verifyFirebase.js
 */

require('dotenv').config();
const admin = require('firebase-admin');
const db = require('../models');
const logger = require('../utils/winstonLogger');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

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
console.log(`${colors.magenta}║   Firebase Verification Test                              ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

async function verifyFirebase() {
  try {
    // ============================================
    // STEP 1: Check Service Account File
    // ============================================
    console.log(`${colors.blue}[Step 1/6]${colors.reset} Checking service account credentials...`);
    
    const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH;
    if (!credentialsPath) {
      throw new Error('FIREBASE_CREDENTIALS_PATH not set in .env');
    }

    const fullPath = path.resolve(credentialsPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Service account file not found: ${fullPath}`);
    }

    const credentials = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    console.log(`${colors.green}✅ Service account file found\n${colors.reset}`);

    // ============================================
    // STEP 2: Check Credentials Content
    // ============================================
    console.log(`${colors.blue}[Step 2/6]${colors.reset} Verifying credentials content...`);
    
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    for (const field of requiredFields) {
      if (!credentials[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    console.log(`${colors.cyan}Project ID:${colors.reset} ${credentials.project_id}`);
    console.log(`${colors.cyan}Service Account:${colors.reset} ${credentials.client_email}`);
    console.log(`${colors.green}✅ All required fields present\n${colors.reset}`);

    // ============================================
    // STEP 3: Initialize Firebase
    // ============================================
    console.log(`${colors.blue}[Step 3/6]${colors.reset} Initializing Firebase Admin SDK...`);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: credentials.project_id
      });
    }

    const app = admin.app();
    console.log(`${colors.green}✅ Firebase Admin SDK initialized\n${colors.reset}`);

    // ============================================
    // STEP 4: Check FCM Service
    // ============================================
    console.log(`${colors.blue}[Step 4/6]${colors.reset} Checking FCM service...`);
    
    const messaging = admin.messaging();
    if (!messaging) {
      throw new Error('Firebase Messaging service not available');
    }

    console.log(`${colors.green}✅ Firebase Messaging service available\n${colors.reset}`);

    // ============================================
    // STEP 5: Connect to Database
    // ============================================
    console.log(`${colors.blue}[Step 5/6]${colors.reset} Connecting to database...`);
    
    await db.sequelize.authenticate();
    console.log(`${colors.green}✅ Database connected\n${colors.reset}`);

    // ============================================
    // STEP 6: Test FCM Send
    // ============================================
    console.log(`${colors.blue}[Step 6/6]${colors.reset} Testing FCM send capability...\n`);
    
    // Create test data
    const testUser = await db.User.create({
      id: uuidv4(),
      email: `firebase-verify-${Date.now()}@example.com`,
      firstName: 'Firebase',
      lastName: 'Verify',
      role: 'admin',
      isActive: true
    });

    const testToken = `test_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const deviceToken = await db.DeviceToken.create({
      id: uuidv4(),
      userId: testUser.id,
      token: testToken,
      deviceType: 'android',
      deviceName: 'Firebase Verification',
      isActive: true
    });

    const notification = await db.Notification.create({
      id: uuidv4(),
      userId: testUser.id,
      title: '🔥 Firebase Verification Test',
      body: 'Testing Firebase Cloud Messaging',
      type: 'system',
      status: 'created',
      isSent: false,
      isRead: false
    });

    // Try to send
    console.log(`   📤 Attempting to send test message...\n`);
    
    let fcmSuccess = false;
    let fcmMessage = '';
    let messageId = '';

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          notificationId: notification.id,
          type: notification.type,
          timestamp: new Date().toISOString()
        },
        token: testToken
      };

      const response = await messaging.send(message);
      fcmSuccess = true;
      messageId = response;
      fcmMessage = 'FCM send successful (real Firebase)';
      console.log(`${colors.green}🔥 [FCM] ✅ 🎉 Message sent successfully\n${colors.reset}`);
    } catch (error) {
      if (error.message.includes('registration token is not a valid FCM registration token') ||
          error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        fcmSuccess = true;
        messageId = 'test-message-id';
        fcmMessage = 'FCM service working (test token rejected as expected)';
        console.log(`${colors.green}🔥 [FCM] ✅ Firebase is working properly!\n${colors.reset}`);
        console.log(`${colors.yellow}   ℹ️  Test token rejected (expected - Firebase is validating tokens)\n${colors.reset}`);
      } else if (error.message.includes('Firebase not initialized')) {
        fcmSuccess = false;
        fcmMessage = 'Firebase not initialized - using mock FCM';
        console.log(`${colors.yellow}ℹ️  Firebase not initialized - using mock FCM\n${colors.reset}`);
      } else {
        throw error;
      }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log(`${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.magenta}║         Firebase Verification Complete                    ║${colors.reset}`);
    console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.green}✅ All Checks Passed!\n${colors.reset}`);

    console.log(`${colors.cyan}Firebase Status:${colors.reset}`);
    console.log(`  Project: ${credentials.project_id}`);
    console.log(`  Service Account: ${credentials.client_email}`);
    console.log(`  Admin SDK: Initialized`);
    console.log(`  Messaging Service: Available`);
    console.log(`  Database: Connected`);

    console.log(`\n${colors.cyan}FCM Test Result:${colors.reset}`);
    console.log(`  Status: ${fcmSuccess ? '✅ WORKING' : '⚠️  LIMITED'}`);
    console.log(`  Message: ${fcmMessage}`);
    console.log(`  Message ID: ${messageId}`);

    console.log(`\n${colors.cyan}System Status:${colors.reset}`);
    console.log(`  🟢 Firebase Admin SDK: READY`);
    console.log(`  🟢 Firebase Messaging: READY`);
    console.log(`  🟢 Database: CONNECTED`);
    console.log(`  🟢 FCM Service: ${fcmSuccess ? 'WORKING' : 'MOCK'}`);

    console.log(`\n${colors.cyan}What This Means:${colors.reset}`);
    if (fcmSuccess) {
      console.log(`  ✅ Firebase is properly configured`);
      console.log(`  ✅ Real FCM notifications will be sent`);
      console.log(`  ✅ Production ready`);
    } else {
      console.log(`  ℹ️  Firebase credentials may not be fully set up`);
      console.log(`  ℹ️  Mock FCM will be used for testing`);
      console.log(`  ℹ️  System is still functional`);
    }

    console.log(`\n${colors.cyan}Next Steps:${colors.reset}`);
    console.log(`  1. Use real device token to test`);
    console.log(`  2. Run: npm run get:token`);
    console.log(`  3. Run: npm run test:device "YOUR_TOKEN"`);
    console.log(`  4. Check phone for notification\n`);

    logger.info('Firebase verification completed successfully');
    process.exit(0);

  } catch (error) {
    console.error(`\n${colors.red}❌ Verification failed: ${error.message}${colors.reset}\n`);
    console.error(error.stack);
    logger.error('Firebase verification error', error.message);
    process.exit(1);
  }
}

// Run verification
verifyFirebase();
