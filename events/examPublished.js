const NotificationService = require('../services/notificationService');
const logger = require('../utils/winstonLogger');

const handleExamPublished = async (examData) => {
  try {
    logger.info('Exam published event received', { examId: examData.id });

    // Get all active users
    const db = require('../models');
    const users = await db.User.findAll({
      where: { isActive: true }
    });

    const userIds = users.map(u => u.id);

    // Send notification to all users
    await NotificationService.sendNotificationToMultipleUsers(userIds, {
      title: 'New Exam Published',
      body: `New exam: ${examData.title}`,
      type: 'exam',
      relatedId: examData.id,
      relatedType: 'exam',
      data: {
        examId: examData.id,
        courseId: examData.courseId,
        startDate: examData.startDate,
        endDate: examData.endDate
      }
    });

    logger.info('Exam published notifications sent', { userCount: userIds.length });
  } catch (error) {
    logger.error('Exam published event error', error.message);
  }
};

module.exports = {
  handleExamPublished
};
