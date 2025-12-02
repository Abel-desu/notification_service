
const { initializeApp, applicationDefault, getApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const logger = require('../utils/winstonLogger');

let firebaseApp;
let messaging;


const initializeFirebase = () => {
  try {
    // Check if already initialized
    try {
      firebaseApp = getApp();
      logger.debug('Firebase already initialized');
      return firebaseApp;
    } catch (error) {
      // App not initialized yet, proceed with initialization
    }

    logger.info('🔥 Initializing Firebase Admin SDK...');

    // Initialize using Application Default Credentials (ADC)
    // This is the recommended approach per Firebase documentation
    firebaseApp = initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    logger.info('✅ Firebase Admin SDK initialized successfully');
    logger.info(`🔥 Project: ${firebaseApp.options.projectId || 'unknown'}`);
    
    return firebaseApp;
  } catch (error) {
    logger.error('❌ Firebase initialization error', error.message);
    logger.error('Stack:', error.stack);
    logger.error('Make sure GOOGLE_APPLICATION_CREDENTIALS environment variable is set');
    logger.error('Windows: $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\path\\to\\service-account-file.json"');
    logger.error('Linux/Mac: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-file.json"');
    return null;
  }
};

/**
 * Get Firebase App instance
 * Initializes if not already initialized
 */
const getFirebaseApp = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp;
};

/**
 * Get Firebase Messaging instance
 * Used for Firebase Cloud Messaging (FCM) operations
 */
const getMessagingService = () => {
  if (!messaging) {
    const app = getFirebaseApp();
    if (app) {
      messaging = getMessaging(app);
    }
  }
  return messaging;
};

/**
 * Check if Firebase is initialized
 */
const isFirebaseInitialized = () => {
  try {
    getApp();
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  initializeFirebase,
  getFirebaseApp,
  getMessaging: getMessagingService,
  isFirebaseInitialized
};
