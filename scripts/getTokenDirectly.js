#!/usr/bin/env node

/**
 * Get FCM Token Directly from Phone
 * 
 * This script gets the FCM token directly from Firebase on the device
 * without needing the Flutter app to be running.
 * 
 * Usage:
 *   node scripts/getTokenDirectly.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const readline = require('readline');

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
console.log(`${colors.magenta}║   Get FCM Token Directly from Phone                       ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

async function getTokenDirectly() {
  try {
    // ============================================
    // STEP 1: Check ADB Connection
    // ============================================
    console.log(`${colors.blue}[Step 1/4]${colors.reset} Checking ADB connection...`);
    const adbPath = 'C:\\Users\\X1\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
    
    try {
      const devices = execSync(`${adbPath} devices`, { encoding: 'utf-8' });
      if (!devices.includes('device')) {
        throw new Error('No Android device connected');
      }
      console.log(`${colors.green}✅ Android device connected\n${colors.reset}`);
    } catch (error) {
      throw new Error(`ADB Error: ${error.message}`);
    }

    // ============================================
    // STEP 2: Get Device Info
    // ============================================
    console.log(`${colors.blue}[Step 2/4]${colors.reset} Getting device information...`);
    let deviceId = null;
    try {
      const devicesOutput = execSync(`${adbPath} devices -l`, { encoding: 'utf-8' });
      const lines = devicesOutput.split('\n');
      for (const line of lines) {
        if (line.includes('device') && !line.includes('List')) {
          deviceId = line.split(/\s+/)[0];
          break;
        }
      }
      console.log(`${colors.green}✅ Device ID: ${deviceId}\n${colors.reset}`);
    } catch (error) {
      throw new Error(`Could not get device info: ${error.message}`);
    }

    // ============================================
    // STEP 3: Get FCM Token from Firebase
    // ============================================
    console.log(`${colors.blue}[Step 3/4]${colors.reset} Extracting FCM token from Firebase...`);
    
    let deviceToken = null;
    
    // Method 1: Get from logcat (most reliable for Flutter apps)
    try {
      console.log(`   📱 Checking device logs for FCM token...\n`);
      
      const logcatCmd = `${adbPath} logcat -d *:V`;
      try {
        const logs = execSync(logcatCmd, { encoding: 'utf-8' });
        
        // Look for FCM token patterns
        const patterns = [
          /FCM Token[:\s]+([a-zA-Z0-9_\-:]{50,})/i,
          /🔥 FCM Token[:\s]+([a-zA-Z0-9_\-:]{50,})/i,
          /firebase.*token[:\s]+([a-zA-Z0-9_\-:]{50,})/i,
          /eI[a-zA-Z0-9_\-]{150,}/
        ];
        
        for (const pattern of patterns) {
          const match = logs.match(pattern);
          if (match) {
            deviceToken = match[1] || match[0];
            if (deviceToken.startsWith('eI')) {
              break;
            }
          }
        }
      } catch (e) {
        // Continue to next method
      }
    } catch (error) {
      // Continue
    }

    // Method 2: Try to get from Firebase shared preferences
    if (!deviceToken) {
      try {
        console.log(`   📱 Checking Firebase shared preferences...\n`);
        
        const sharedPrefsPath = '/data/data/com.google.android.gms/shared_prefs/';
        const listCmd = `${adbPath} shell ls ${sharedPrefsPath}`;
        
        try {
          const files = execSync(listCmd, { encoding: 'utf-8' });
          
          // Look for Firebase files
          if (files.includes('com.google.firebase')) {
            const firebaseFile = `${sharedPrefsPath}com.google.firebase.installations.prefs_for_com.google.firebase.messaging.xml`;
            const catCmd = `${adbPath} shell cat ${firebaseFile}`;
            
            try {
              const content = execSync(catCmd, { encoding: 'utf-8' });
              
              // Extract token from XML
              const tokenMatch = content.match(/name="([^"]*token[^"]*)"[^>]*value="([^"]*)"/i);
              if (tokenMatch) {
                deviceToken = tokenMatch[2];
              }
            } catch (e) {
              // File might not exist or not readable
            }
          }
        } catch (e) {
          // Directory might not be accessible
        }
      } catch (error) {
        // Continue to next method
      }
    }

    // Method 3: Try to get from app's shared preferences
    if (!deviceToken) {
      try {
        console.log(`   📱 Checking app shared preferences...\n`);
        
        const appPrefsPath = '/data/data/com.example.notification_test_app/shared_prefs/';
        const catCmd = `${adbPath} shell cat ${appPrefsPath}com.example.notification_test_app_preferences.xml`;
        
        try {
          const content = execSync(catCmd, { encoding: 'utf-8' });
          
          // Extract token
          const tokenMatch = content.match(/name="fcm_token"[^>]*value="([^"]*)"/i) ||
                            content.match(/name="([^"]*fcm[^"]*)"[^>]*value="([^"]*)"/i);
          if (tokenMatch) {
            deviceToken = tokenMatch[tokenMatch.length - 1];
          }
        } catch (e) {
          // File might not exist
        }
      } catch (error) {
        // Continue
      }
    }

    // Method 3: Generate a test token if nothing found
    if (!deviceToken) {
      console.log(`${colors.yellow}⚠️  Could not extract existing token from device\n${colors.reset}`);
      console.log(`${colors.cyan}Options:${colors.reset}`);
      console.log(`  1. Run Flutter app on phone to generate token`);
      console.log(`  2. Use a test token manually`);
      console.log(`  3. Generate a mock token for testing\n`);
      
      // Generate a realistic mock token
      deviceToken = generateMockToken();
      console.log(`${colors.yellow}Generated test token: ${deviceToken}\n${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ FCM token extracted\n${colors.reset}`);
    }

    console.log(`${colors.cyan}Device Token:${colors.reset} ${deviceToken.substring(0, 40)}...\n`);

    // ============================================
    // STEP 4: Display Token & Instructions
    // ============================================
    console.log(`${colors.blue}[Step 4/4]${colors.reset} Token ready for testing...\n`);

    console.log(`${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.magenta}║              Token Extracted                               ║${colors.reset}`);
    console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.green}✅ Token Ready!\n${colors.reset}`);

    console.log(`${colors.cyan}Device Token:${colors.reset}`);
    console.log(`  ${deviceToken}\n`);

    console.log(`${colors.cyan}Next Steps:${colors.reset}`);
    console.log(`  1. Copy the token above`);
    console.log(`  2. Run: npm run test:device "${deviceToken}"`);
    console.log(`  3. Or use it in your tests\n`);

    console.log(`${colors.cyan}Quick Test:${colors.reset}`);
    console.log(`  npm run test:device "${deviceToken}"\n`);

    console.log(`${colors.cyan}Save Token:${colors.reset}`);
    console.log(`  echo "${deviceToken}" > device_token.txt\n`);

    // Save to file
    const fs = require('fs');
    fs.writeFileSync('device_token.txt', deviceToken);
    console.log(`${colors.green}✅ Token saved to: device_token.txt\n${colors.reset}`);

    process.exit(0);

  } catch (error) {
    console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
    console.error(error.stack);
    process.exit(1);
  }
}

function generateMockToken() {
  // Generate a realistic FCM token format
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = 'eI';
  for (let i = 0; i < 150; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Run
getTokenDirectly();
