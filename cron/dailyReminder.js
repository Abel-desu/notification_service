const cron = require('node-cron');
const db = require('../models');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/winstonLogger');

// Run every day at 8:00 AM
const dailyReminderJob = cron.schedule('0 8 * * *', async () => {
  try {
    logger.info('Starting daily reminder job');

    // Get all active users with unread notifications
    const usersWithUnread = await db.Notification.findAll({
      attributes: ['userId'],
      where: { isRead: false },
      raw: true,
      group: ['userId']
    });

    const userIds = [...new Set(usersWithUnread.map(n => n.userId))];

    for (const userId of userIds) {
      const unreadCount = await db.Notification.count({
        where: { userId, isRead: false }
      });

      if (unreadCount > 0) {
        await NotificationService.sendNotificationToUser(userId, {
          title: 'Daily Reminder',
          body: `You have ${unreadCount} unread notifications`,
          type: 'reminder',
          data: { unreadCount }
        });
      }
    }

    logger.info('Daily reminder job completed', { usersNotified: userIds.length });
  } catch (error) {
    logger.error('Daily reminder job error', error.message);
  }
});

module.exports = dailyReminderJob;
