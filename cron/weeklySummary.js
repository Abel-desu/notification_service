const cron = require('node-cron');
const db = require('../models');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/winstonLogger');

// Run every Monday at 9:00 AM
const weeklySummaryJob = cron.schedule('0 9 * * 1', async () => {
  try {
    logger.info('Starting weekly summary job');

    // Get all active users
    const users = await db.User.findAll({
      where: { isActive: true }
    });

    // Get notifications from the past week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const user of users) {
      const notificationCount = await db.Notification.count({
        where: {
          userId: user.id,
          createdAt: { [db.Sequelize.Op.gte]: oneWeekAgo }
        }
      });

      if (notificationCount > 0) {
        await NotificationService.sendNotificationToUser(user.id, {
          title: 'Weekly Summary',
          body: `You received ${notificationCount} notifications this week`,
          type: 'announcement',
          data: { notificationCount }
        });
      }
    }

    logger.info('Weekly summary job completed', { usersProcessed: users.length });
  } catch (error) {
    logger.error('Weekly summary job error', error.message);
  }
});

module.exports = weeklySummaryJob;
