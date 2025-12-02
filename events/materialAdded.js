const NotificationService = require('../services/notificationService');
const logger = require('../utils/winstonLogger');

const handleMaterialAdded = async (materialData) => {
  try {
    logger.info('Material added event received', { materialId: materialData.id });

    // Get all active users
    const db = require('../models');
    const users = await db.User.findAll({
      where: { isActive: true }
    });

    const userIds = users.map(u => u.id);

    // Send notification to all users
    await NotificationService.sendNotificationToMultipleUsers(userIds, {
      title: 'New Material Added',
      body: `New material: ${materialData.title}`,
      type: 'material',
      relatedId: materialData.id,
      relatedType: 'material',
      data: {
        materialId: materialData.id,
        courseId: materialData.courseId
      }
    });

    logger.info('Material added notifications sent', { userCount: userIds.length });
  } catch (error) {
    logger.error('Material added event error', error.message);
  }
};

module.exports = {
  handleMaterialAdded
};
