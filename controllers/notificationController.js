const { sendNotificationToUser, sendNotificationToMultipleUsers, markAsRead, getUserNotifications, deleteNotification } = require('../services/notificationService');
const { validateNotificationPayload } = require('../utils/validators');
const logger = require('../utils/winstonLogger');

/**
 * Send notification to a single user
 */
const sendToUser = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    const adminId = req.user.id;

    const validation = validateNotificationPayload({ title, body });
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const result = await sendNotificationToUser(userId, { title, body, type: 'system', data });
    logger.info('Notification sent to user', { userId, notificationId: result.notification.id });

    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notificationId: result.notification.id,
        successCount: result.successCount || 0
      }
    });
  } catch (error) {
    logger.error('Send to user error', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
};

/**
 * Send notification to multiple users
 */
const sendToMultipleUsers = async (req, res) => {
  try {
    const { userIds, title, body, data } = req.body;
    const adminId = req.user.id;

    console.log(`[NOTIFICATION] Admin ${adminId} sending to ${userIds?.length || 0} users`);

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds must be a non-empty array'
      });
    }

    const validation = validateNotificationPayload({ title, body });
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const results = await sendNotificationToMultipleUsers(userIds, { title, body, type: 'system', data });

    console.log(`[NOTIFICATION] ✅ Sent to ${userIds.length} users`);
    logger.info('Bulk notification sent', { userCount: userIds.length, successCount: results.filter(r => r.success).length });

    return res.status(200).json({
      success: true,
      message: 'Notifications sent successfully',
      data: {
        usersNotified: userIds.length,
        successCount: results.filter(r => r.success).length,
        results
      }
    });
  } catch (error) {
    console.error(`[NOTIFICATION] ❌ Error: ${error.message}`);
    logger.error('Send to multiple users error', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send notifications'
    });
  }
};

/**
 * Get notifications for a user
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const { total, notifications } = await getUserNotifications(userId, parseInt(limit), parseInt(offset));

    console.log(`[NOTIFICATION] Fetched ${notifications.length} notifications for user ${userId}`);
    logger.debug('Fetched notifications', { userId, count: total });

    return res.status(200).json({
      success: true,
      data: {
        total,
        notifications
      }
    });
  } catch (error) {
    console.error(`[NOTIFICATION] ❌ Error: ${error.message}`);
    logger.error('Get notifications error', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await markAsRead(notificationId, userId);

    console.log(`[NOTIFICATION] Marked as read: ${notificationId}`);
    logger.info('Notification marked as read', { notificationId });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error(`[NOTIFICATION] ❌ Error: ${error.message}`);
    logger.error('Mark as read error', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

/**
 * Delete notification
 */
const deleteNotificationById = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    await deleteNotification(notificationId, userId);

    console.log(`[NOTIFICATION] Deleted: ${notificationId}`);
    logger.info('Notification deleted', { notificationId });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error(`[NOTIFICATION] ❌ Error: ${error.message}`);
    logger.error('Delete notification error', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

module.exports = {
  sendToUser,
  sendToMultipleUsers,
  getNotifications,
  markNotificationAsRead,
  deleteNotificationById
};
