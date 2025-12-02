const db = require('../models');
const { sendNotificationToMultipleUsers } = require('../services/notificationService');
const { validateNotificationPayload } = require('../utils/validators');
const logger = require('../utils/winstonLogger');

const sendBulkNotification = async (req, res) => {
    try {
      const { userIds, title, body, type, data } = req.body;
      const adminId = req.user.id;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        logger.warn('Invalid user IDs', { adminId });
        return res.status(400).json({
          success: false,
          message: 'userIds must be a non-empty array'
        });
      }

      const validation = validateNotificationPayload({ title, body, type });
      if (!validation.valid) {
        logger.warn('Invalid notification payload', { error: validation.error });
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      const results = await sendNotificationToMultipleUsers(userIds, {
        title,
        body,
        type,
        data
      });

      logger.info('Bulk notification sent', { 
        adminId, 
        recipientCount: userIds.length,
        successCount: results.filter(r => r.success).length
      });

      return res.status(200).json({
        success: true,
        message: 'Bulk notification sent successfully',
        data: {
          totalRecipients: userIds.length,
          successCount: results.filter(r => r.success).length,
          results
        }
      });
    } catch (error) {
      logger.error('Bulk notification error', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send bulk notification'
      });
    }
};

const getNotificationStats = async (req, res) => {
    try {
      const adminId = req.user.id;

      const totalNotifications = await db.Notification.count();
      const sentNotifications = await db.Notification.count({ where: { isSent: true } });
      const readNotifications = await db.Notification.count({ where: { isRead: true } });
      const unreadNotifications = await db.Notification.count({ where: { isRead: false } });

      const stats = {
        totalNotifications,
        sentNotifications,
        readNotifications,
        unreadNotifications,
        readRate: totalNotifications > 0 ? ((readNotifications / totalNotifications) * 100).toFixed(2) : 0
      };

      logger.info('Fetched notification stats', { adminId });
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get stats error', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notification stats'
      });
    }
};

const getUserStats = async (req, res) => {
  try {
    const adminId = req.user.id;

    const totalUsers = await db.User.count();
    const activeUsers = await db.User.count({ where: { isActive: true } });
    const totalDevices = await db.DeviceToken.count();
    const activeDevices = await db.DeviceToken.count({ where: { isActive: true } });

    const stats = {
      totalUsers,
      activeUsers,
      totalDevices,
      activeDevices,
      avgDevicesPerUser: totalUsers > 0 ? (totalDevices / totalUsers).toFixed(2) : 0
    };

    logger.info('Fetched user stats', { adminId });
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get user stats error', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats'
    });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { limit = 50, offset = 0, type } = req.query;

    const where = type ? { type } : {};
    const { count, rows } = await db.Notification.findAndCountAll({
      where,
      include: [{ model: db.User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    logger.info('Fetched all notifications', { adminId, count });
    return res.status(200).json({
      success: true,
      data: {
        total: count,
        notifications: rows
      }
    });
  } catch (error) {
    logger.error('Get all notifications error', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

module.exports = {
  sendBulkNotification,
  getNotificationStats,
  getUserStats,
  getAllNotifications
};
