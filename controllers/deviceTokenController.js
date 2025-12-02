const db = require('../models');
const { validateDeviceToken } = require('../utils/validators');
const logger = require('../utils/winstonLogger');

const registerDeviceToken = async (req, res) => {
    try {
      const { token, deviceType, deviceName } = req.body;
      const userId = req.user.id;

      if (!validateDeviceToken(token)) {
        logger.warn('Invalid device token', { userId });
        return res.status(400).json({
          success: false,
          message: 'Invalid device token'
        });
      }

      if (!['ios', 'android', 'web'].includes(deviceType)) {
        logger.warn('Invalid device type', { deviceType });
        return res.status(400).json({
          success: false,
          message: 'Device type must be ios, android, or web'
        });
      }

      // Check if token already exists
      let deviceToken = await db.DeviceToken.findOne({ where: { token } });

      if (deviceToken) {
        // Update existing token
        await deviceToken.update({
          userId,
          deviceType,
          deviceName,
          isActive: true,
          lastUsedAt: new Date()
        });
        logger.info('Device token updated', { userId, deviceType });
      } else {
        // Create new token
        deviceToken = await db.DeviceToken.create({
          userId,
          token,
          deviceType,
          deviceName,
          isActive: true,
          lastUsedAt: new Date()
        });
        logger.info('Device token registered', { userId, deviceType });
      }

      return res.status(200).json({
        success: true,
        message: 'Device token registered successfully',
        data: deviceToken
      });
    } catch (error) {
      logger.error('Register device token error', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to register device token'
      });
    }
};

const getDeviceTokens = async (req, res) => {
    try {
      const userId = req.user.id;

      const tokens = await db.DeviceToken.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });

      logger.debug('Fetched device tokens', { userId, count: tokens.length });
      return res.status(200).json({
        success: true,
        data: tokens
      });
    } catch (error) {
      logger.error('Get device tokens error', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch device tokens'
      });
    }
};

const removeDeviceToken = async (req, res) => {
    try {
      const { tokenId } = req.params;
      const userId = req.user.id;

      const deviceToken = await db.DeviceToken.findOne({
        where: { id: tokenId, userId }
      });

      if (!deviceToken) {
        logger.warn('Device token not found', { tokenId, userId });
        return res.status(404).json({
          success: false,
          message: 'Device token not found'
        });
      }

      await deviceToken.destroy();
      logger.info('Device token removed', { tokenId, userId });

      return res.status(200).json({
        success: true,
        message: 'Device token removed successfully'
      });
    } catch (error) {
      logger.error('Remove device token error', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove device token'
      });
    }
};

const deactivateAllTokens = async (req, res) => {
    try {
      const userId = req.user.id;

      await db.DeviceToken.update(
        { isActive: false },
        { where: { userId } }
      );

      logger.info('All device tokens deactivated', { userId });
      return res.status(200).json({
        success: true,
        message: 'All device tokens deactivated'
      });
    } catch (error) {
      logger.error('Deactivate tokens error', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to deactivate tokens'
      });
    }
};

module.exports = {
  registerDeviceToken,
  getDeviceTokens,
  removeDeviceToken,
  deactivateAllTokens
};
