const { getMessaging, isFirebaseInitialized } = require('../config/firebase');
const logger = require('../utils/winstonLogger');

/**
 * Check if error is retryable
 * Based on Firebase Admin SDK documentation
 * Retryable errors: UNAVAILABLE, INTERNAL, DEADLINE_EXCEEDED, RESOURCE_EXHAUSTED
 */
const isRetryableError = (error) => {
  const retryableErrors = ['UNAVAILABLE', 'INTERNAL', 'DEADLINE_EXCEEDED', 'RESOURCE_EXHAUSTED'];
  return retryableErrors.some(err => error.code?.includes(err));
};
/**
 * Delay utility for exponential backoff
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Resolves after delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get messaging service with validation
 * Returns Firebase messaging instance or null if not initialized
 * @returns {object|null} - Messaging instance or null
 */
const getMessagingService = () => {
  if (isFirebaseInitialized()) {
    return getMessaging();
  }
  logger.warn('Firebase not initialized - FCM features unavailable');
  return null;
};

/**
 * Build message object following Firebase Admin SDK format
 * Includes platform-specific configurations for Android, iOS (APNS), and Web
 * @param {object} notification - { title, body, data }
 * @param {object} options - Additional options (token, topic, etc)
 * @returns {object} - Message object for Firebase
 */
const buildMessage = (notification, options = {}) => ({
  notification: {
    title: notification.title,
    body: notification.body
  },
  data: notification.data || {},
  ...options,
  android: { priority: 'high', ttl: 86400 },
  apns: { headers: { 'apns-priority': '10' } },
  webpush: { ttl: 86400 }
});

/**
 * Send notification to a single device
 * Following Firebase Admin SDK documentation: https://firebase.google.com/docs/cloud-messaging/send/admin-sdk
 * @param {string} deviceToken - FCM device token
 * @param {object} notification - { title, body, data }
 * @param {number} retries - Number of retry attempts (max 3)
 * @returns {Promise<object>} - { success, messageId, error }
 */
const sendToDevice = async (deviceToken, notification, retries = 3) => {
  try {
    const messaging = getMessagingService();
    if (!messaging) {
      logger.error('Messaging service unavailable');
      return { success: false, message: 'Messaging service unavailable' };
    }

    const message = buildMessage(notification, { token: deviceToken });
    const messageId = await messaging.send(message);
    
    logger.info('FCM message sent', { messageId, deviceToken: deviceToken.substring(0, 20) });
    return { success: true, messageId };
  } catch (error) {
    logger.error('FCM send error', { error: error.message, code: error.code });

    // Retry logic for specific errors
    if (retries > 0 && isRetryableError(error)) {
      logger.info('Retrying FCM send', { retriesLeft: retries - 1, errorCode: error.code });
      await delay(1000 * (4 - retries)); // Exponential backoff
      return sendToDevice(deviceToken, notification, retries - 1);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to multiple devices
 * Uses sendEachForMulticast as per Firebase Admin SDK documentation
 * This is more efficient than sending individual messages
 * @param {array} deviceTokens - Array of FCM device tokens
 * @param {object} notification - { title, body, data }
 * @returns {Promise<object>} - { success, successCount, failureCount, failedTokens, responses }
 */
const sendToMultipleDevices = async (deviceTokens, notification) => {
  try {
    if (!deviceTokens || deviceTokens.length === 0) {
      logger.warn('No device tokens provided');
      return { success: false, message: 'No device tokens' };
    }

    const messaging = getMessagingService();
    if (!messaging) {
      logger.error('Messaging service unavailable');
      return { success: false, message: 'Messaging service unavailable' };
    }

    const message = buildMessage(notification);
    const response = await messaging.sendEachForMulticast({
      tokens: deviceTokens,
      ...message
    });

    // Extract failed tokens for analysis
    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push({
          token: deviceTokens[idx].substring(0, 30) + '...',
          error: resp.error?.message
        });
      }
    });

    logger.info('FCM multicast sent', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: deviceTokens.length
    });

    if (failedTokens.length > 0) {
      logger.warn('FCM failed tokens', failedTokens);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
      responses: response.responses
    };
  } catch (error) {
    logger.error('FCM multicast error', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to a topic
 * @param {string} topic - Topic name
 * @param {object} notification - { title, body, data }
 * @returns {Promise<object>} - { success, messageId, error }
 */
const sendToTopic = async (topic, notification) => {
  try {
    const messaging = getMessagingService();
    if (!messaging) {
      logger.error('Messaging service unavailable');
      return { success: false, message: 'Messaging service unavailable' };
    }

    const message = buildMessage(notification, { topic });
    const messageId = await messaging.send(message);
    
    logger.info('FCM topic message sent', { messageId, topic });
    return { success: true, messageId };
  } catch (error) {
    logger.error('FCM topic send error', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe device tokens to a topic
 * @param {array} tokens - Device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<object>} - { success, response, error }
 */
const subscribeToTopic = async (tokens, topic) => {
  try {
    const messaging = getMessagingService();
    if (!messaging) {
      return { success: false, message: 'Messaging service unavailable' };
    }

    const response = await messaging.subscribeToTopic(tokens, topic);
    logger.info('Subscribed to topic', { topic, tokenCount: tokens.length });
    return { success: true, response };
  } catch (error) {
    logger.error('FCM subscribe error', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Unsubscribe device tokens from a topic
 * @param {array} tokens - Device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<object>} - { success, response, error }
 */
const unsubscribeFromTopic = async (tokens, topic) => {
  try {
    const messaging = getMessagingService();
    if (!messaging) {
      return { success: false, message: 'Messaging service unavailable' };
    }

    const response = await messaging.unsubscribeFromTopic(tokens, topic);
    logger.info('Unsubscribed from topic', { topic, tokenCount: tokens.length });
    return { success: true, response };
  } catch (error) {
    logger.error('FCM unsubscribe error', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendToDevice,
  sendToMultipleDevices,
  sendToTopic,
  subscribeToTopic,
  unsubscribeFromTopic
};
