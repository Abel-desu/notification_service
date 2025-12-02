const db = require('../models');
const { sendToDevice } = require('./fcmService');
const logger = require('../utils/winstonLogger');

let processingInterval = null;
let isProcessing = false;
let io = null;

/**
 * Initialize delivery processor with Socket.io instance
 */
const initialize = (socketIO) => {
  io = socketIO;
};

/**
 * Start the delivery processor
 * Runs every 5 seconds
 */
const start = () => {
  logger.info('Starting delivery processor');
  processingInterval = setInterval(() => {
    processPendingDeliveries();
  }, 5000);
};

/**
 * Stop the delivery processor
 */
const stop = () => {
  if (processingInterval) {
    clearInterval(processingInterval);
    logger.info('Stopped delivery processor');
  }
};

/**
 * Process all pending deliveries
 */
const processPendingDeliveries = async () => {
  if (isProcessing) {
    return; // Skip if already processing
  }

  isProcessing = true;

  try {
    // Query pending deliveries (limit 50 per batch)
    const deliveries = await db.NotificationDelivery.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: db.Notification,
          as: 'notification',
          attributes: ['id', 'title', 'body', 'type', 'data']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'email']
        },
        {
          model: db.DeviceToken,
          as: 'deviceToken',
          attributes: ['id', 'token', 'deviceType', 'isActive']
        }
      ],
      limit: 50,
      order: [['createdAt', 'ASC']]
    });

    if (deliveries.length === 0) {
      isProcessing = false;
      return;
    }

    logger.info(`Processing ${deliveries.length} pending deliveries`);

    // Process each delivery
    for (const delivery of deliveries) {
      await processDeliveryRecord(delivery);
    }

    logger.info('Batch processing complete');
  } catch (error) {
    logger.error('DeliveryProcessor error', error.message);
  } finally {
    isProcessing = false;
  }
};

/**
 * Process a single delivery record
 */
const processDeliveryRecord = async (delivery) => {
  try {
    // Check if max attempts reached
    if (delivery.attemptCount >= delivery.maxAttempts) {
      logger.info(`Max attempts reached for delivery ${delivery.id}`);
      await delivery.update({
        status: 'failed',
        failureReason: 'Max attempts exceeded'
      });
      return;
    }

    // Increment attempt count
    await delivery.increment('attemptCount');

    const notification = delivery.notification;
    const user = delivery.user;

    // PRIMARY: Try In-App (Socket.io)
    const inAppResult = await sendInAppNotification(delivery, notification, user);

    if (inAppResult.success) {
      logger.info(`In-App delivery successful for ${user.id}`);
      await delivery.update({
        status: 'sent',
        channel: 'inApp',
        sentAt: new Date()
      });
      return;
    }

    // FALLBACK: Try Push (Firebase FCM)
    if (delivery.deviceToken && delivery.deviceToken.isActive) {
      const pushResult = await sendPushNotification(delivery, notification);

      if (pushResult.success) {
        logger.info(`Push delivery successful for ${user.id}`);
        await delivery.update({
          status: 'sent',
          channel: 'push',
          sentAt: new Date()
        });
        return;
      }
    }

    // RETRY: Schedule retry after 5 seconds
    await delivery.update({
      status: 'pending',
      retryScheduledAt: new Date(Date.now() + 5000)
    });
  } catch (error) {
    logger.error('DeliveryProcessor process error', error.message);

    // Mark as failed if error occurs
    try {
      await delivery.update({
        status: 'failed',
        failureReason: error.message
      });
    } catch (updateError) {
      logger.error('Failed to update delivery status', updateError.message);
    }
  }
};

/**
 * Send in-app notification via Socket.io
 */
const sendInAppNotification = async (delivery, notification, user) => {
  try {
    if (!io) {
      return { success: false, error: 'Socket.io not initialized' };
    }

    // Build payload
    const payload = {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data,
      timestamp: new Date()
    };

    // Check if user is online
    const userSockets = await io.in(`user:${user.id}`).fetchSockets();

    if (userSockets.length > 0) {
      // User is online - emit real-time
      logger.info(`Emitting notification to online user ${user.id}`);
      io.to(`user:${user.id}`).emit('notification:new', payload);
      return { success: true, online: true };
    } else {
      // User is offline - store for later
      logger.info(`User ${user.id} is offline, storing notification`);
      await delivery.update({
        offlinePayload: payload
      });
      return { success: true, online: false, offline: true };
    }
  } catch (error) {
    logger.error('In-app notification error', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification via Firebase FCM
 */
const sendPushNotification = async (delivery, notification) => {
  try {
    const deviceToken = delivery.deviceToken;

    if (!deviceToken || !deviceToken.token) {
      return { success: false, error: 'No device token' };
    }

    const result = await sendToDevice(deviceToken.token, {
      title: notification.title,
      body: notification.body,
      data: notification.data
    });

    return result;
  } catch (error) {
    logger.error('Push notification error', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initialize,
  start,
  stop,
  processPendingDeliveries,
  processDeliveryRecord,
  sendInAppNotification,
  sendPushNotification
};
