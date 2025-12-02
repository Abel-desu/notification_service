const express = require('express');
const router = express.Router();
const deviceTokenRoutes = require('./deviceToken');
const notificationRoutes = require('./notifications');

router.use('/device-tokens', deviceTokenRoutes);
router.use('/notifications', notificationRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Service is healthy' });
});

// Firebase configuration endpoint for Flutter app
router.get('/firebase-config', (req, res) => {
  try {
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'entrance-zone',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '116883900469281864215',
      apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyDxxx',
      appId: process.env.FIREBASE_APP_ID || '1:116883900469281864215:android:abc123def456',
      // For web
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'entrance-zone.firebaseapp.com',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'entrance-zone.appspot.com',
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://entrance-zone.firebaseio.com'
    };
    
    res.status(200).json({
      success: true,
      config: firebaseConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get Firebase configuration',
      error: error.message
    });
  }
});

module.exports = router;
