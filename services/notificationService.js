const db = require('../models');
const { sendToMultipleDevices } = require('./fcmService');
const logger = require('../utils/winstonLogger');

const createNotification = async (userId, notificationData) => {
  try {
    const notification = await db.Notification.create({
      userId,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type || 'system',
      relatedId: notificationData.relatedId,
      relatedType: notificationData.relatedType,
      data: notificationData.data
    });

    logger.info('Notification created', { notificationId: notification.id, userId });
    return notification;
  } catch (error) {
    logger.error('Create notification error', error.message);
    throw error;
  }
};

const sendNotificationToUser = async (userId, notificationData) => {
  try {
    // Create notification record
    const notification = await createNotification(userId, notificationData);

    // Get user's device tokens
    const deviceTokens = await db.DeviceToken.findAll({
      where: { userId, isActive: true }
    });

    if (deviceTokens.length === 0) {
      logger.warn('No active device tokens found', { userId });
      return { success: true, notification, devicesSent: 0 };
    }

    // Send to all devices
    const tokens = deviceTokens.map(dt => dt.token);
    const fcmResult = await sendToMultipleDevices(tokens, {
      title: notification.title,
      body: notification.body,
      data: notification.data
    });

    // Update notification as sent
    if (fcmResult.success) {
      await notification.update({ isSent: true, sentAt: new Date() });
      logger.info('Notification sent to user', { 
        userId, 
        notificationId: notification.id,
        devicesSent: fcmResult.successCount 
      });
    }

    return { success: true, notification, ...fcmResult };
  } catch (error) {
    logger.error('Send notification error', error.message);
    throw error;
  }
};

const sendNotificationToMultipleUsers = async (userIds, notificationData) => {
  try {
    const results = [];

    for (const userId of userIds) {
      const result = await sendNotificationToUser(userId, notificationData);
      results.push(result);
    }

    logger.info('Bulk notifications sent', { count: results.length });
    return results;
  } catch (error) {
    logger.error('Bulk send error', error.message);
    throw error;
  }
};

const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await db.Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.update({ isRead: true, readAt: new Date() });
    logger.debug('Notification marked as read', { notificationId });
    return notification;
  } catch (error) {
    logger.error('Mark as read error', error.message);
    throw error;
  }
};

const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  try {
    const { count, rows } = await db.Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    logger.debug('Fetched user notifications', { userId, count });
    return { total: count, notifications: rows };
  } catch (error) {
    logger.error('Get notifications error', error.message);
    throw error;
  }
};

const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await db.Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.destroy();
    logger.debug('Notification deleted', { notificationId });
    return { success: true };
  } catch (error) {
    logger.error('Delete notification error', error.message);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  markAsRead,
  getUserNotifications,
  deleteNotification
};
