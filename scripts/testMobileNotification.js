#!/usr/bin/env node

/**
 * Test script to send notification to mobile device
 * Usage: node scripts/testMobileNotification.js
 */

const http = require('http');
const jwt = require('jsonwebtoken');

// Configuration
const API_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';
const USER_ID = 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'; // First demo user

// Generate JWT token
const generateToken = () => {
  return jwt.sign(
    { userId: USER_ID, role: 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Send notification
const sendNotification = (token) => {
  const payload = JSON.stringify({
    userId: USER_ID,
    title: '📱 Mobile Test Notification',
    body: 'This is a test notification from the backend!',
    type: 'test',
    data: {
      timestamp: new Date().toISOString(),
      testId: Math.random().toString(36).substring(7)
    }
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/notifications/send/user',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length,
      'Authorization': `Bearer ${token}`
    }
  };

  console.log('\n' + '='.repeat(80));
  console.log('📤 Sending Test Notification to Mobile Device');
  console.log('='.repeat(80));
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`👤 User ID: ${USER_ID}`);
  console.log(`📝 Title: 📱 Mobile Test Notification`);
  console.log(`📝 Body: This is a test notification from the backend!`);
  console.log('='.repeat(80) + '\n');

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\n' + '='.repeat(80));
      console.log('✅ Response Received');
      console.log('='.repeat(80));
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Response: ${data}`);
      console.log('='.repeat(80));
      console.log('\n📋 Expected FCM Logs in Backend Terminal:');
      console.log('   1. SEND_TO_DEVICE_START');
      console.log('   2. SEND_TO_DEVICE_SUCCESS or SEND_TO_DEVICE_ERROR');
      console.log('   3. Check mobile device for notification\n');
    });
  });

  req.on('error', (error) => {
    console.error('\n❌ Error sending notification:');
    console.error(error.message);
    console.error('\nMake sure:');
    console.error('  1. Backend is running: npm run dev');
    console.error('  2. Database is connected');
    console.error('  3. Device token is registered\n');
  });

  req.write(payload);
  req.end();
};

// Main
console.log('\n🚀 Mobile Notification Test Script\n');

try {
  const token = generateToken();
  console.log(`✅ JWT Token Generated`);
  console.log(`🔑 Token: ${token.substring(0, 50)}...\n`);
  
  sendNotification(token);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
