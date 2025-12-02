const db = require('../../models');
const { validateSocketData } = require('../validators/schemas');
const {
  readNotificationSchema,
  readMultipleSchema,
  getNotificationsSchema
} = require('../validators/schemas');
const logger = require('../../utils/winstonLogger');

/**
 * Socket.io Event Handlers for Notifications
 */
module.exports = (io, socket) => {
  /**
   * Mark single notification as read
   * Event: notification:read
   */
  socket.on('notification:read', async (data) => {
    try {
      console.log(`[Socket.io] notification:read event from user ${socket.userId}`);

      // Validate input
      const validation = await validateSocketData(data, readNotificationSchema);

      if (!validation.valid) {
        console.log(`[Socket.io] Validation failed:`, validation.errors);
        return socket.emit('notification:read:error', {
          errors: validation.errors
        });
      }

      const { notificationId } = validation.value;

      // Find delivery record
      const delivery = await db.NotificationDelivery.findOne({
        where: {
          notificationId,
          userId: socket.userId
        }
      });

      if (!delivery) {
        console.log(`[Socket.io] Delivery not found for notification ${notificationId}`);
        return socket.emit('notification:read:error', {
          error: 'Notification not found'
        });
      }

      // Update status
      await delivery.update({
        status: 'read',
        readAt: new Date()
      });

      console.log(`[Socket.io] ✅ Notification ${notificationId} marked as read`);

      // Emit success to client
      socket.emit('notification:read:success', {
        notificationId,
        readAt: delivery.readAt
      });

      // Broadcast to all user's clients
      io.to(`user:${socket.userId}`).emit('notification:updated', {
        notificationId,
        status: 'read',
        readAt: delivery.readAt
      });

      logger.info('Notification marked as read', { notificationId, userId: socket.userId });
    } catch (error) {
      console.error(`[Socket.io] Error in notification:read:`, error.message);
      logger.error('Socket.io notification:read error', error.message);
      socket.emit('notification:read:error', {
        error: error.message
      });
    }
  });

  /**
   * Mark multiple notifications as read
   * Event: notification:read:multiple
   */
  socket.on('notification:read:multiple', async (data) => {
    try {
      console.log(`[Socket.io] notification:read:multiple event from user ${socket.userId}`);

      // Validate input
      const validation = await validateSocketData(data, readMultipleSchema);

      if (!validation.valid) {
        console.log(`[Socket.io] Validation failed:`, validation.errors);
        return socket.emit('notification:read:multiple:error', {
          errors: validation.errors
        });
      }

      const { notificationIds } = validation.value;

      // Update all deliveries
      const result = await db.NotificationDelivery.update(
        {
          status: 'read',
          readAt: new Date()
        },
        {
          where: {
            notificationId: notificationIds,
            userId: socket.userId
          }
        }
      );

      console.log(`[Socket.io] ✅ ${result[0]} notifications marked as read`);

      // Emit success
      socket.emit('notification:read:multiple:success', {
        count: result[0],
        notificationIds
      });

      // Broadcast to all user's clients
      io.to(`user:${socket.userId}`).emit('notifications:updated', {
        notificationIds,
        status: 'read',
        readAt: new Date()
      });

      logger.info('Multiple notifications marked as read', {
        count: result[0],
        userId: socket.userId
      });
    } catch (error) {
      console.error(`[Socket.io] Error in notification:read:multiple:`, error.message);
      logger.error('Socket.io notification:read:multiple error', error.message);
      socket.emit('notification:read:multiple:error', {
        error: error.message
      });
    }
  });

  /**
   * Get pending notifications for user
   * Event: notifications:pending:fetch
   */
  socket.on('notifications:pending:fetch', async (data) => {
    try {
      console.log(`[Socket.io] notifications:pending:fetch event from user ${socket.userId}`);

      // Validate input (optional pagination)
      const validation = await validateSocketData(data || {}, getNotificationsSchema);

      if (!validation.valid) {
        return socket.emit('notifications:pending:error', {
          errors: validation.errors
        });
      }

      const { limit = 20, offset = 0 } = validation.value;

      // Fetch pending notifications
      const { count, rows } = await db.NotificationDelivery.findAndCountAll({
        where: {
          userId: socket.userId,
          status: 'pending'
        },
        include: [
          {
            model: db.Notification,
            as: 'notification',
            attributes: ['id', 'title', 'body', 'type', 'data']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      console.log(`[Socket.io] ✅ Fetched ${rows.length} pending notifications`);

      // Emit notifications
      socket.emit('notifications:pending', {
        total: count,
        notifications: rows.map(d => ({
          id: d.notification.id,
          title: d.notification.title,
          body: d.notification.body,
          type: d.notification.type,
          data: d.notification.data,
          timestamp: d.createdAt,
          offlinePayload: d.offlinePayload
        }))
      });

      logger.info('Pending notifications fetched', {
        count: rows.length,
        userId: socket.userId
      });
    } catch (error) {
      console.error(`[Socket.io] Error in notifications:pending:fetch:`, error.message);
      logger.error('Socket.io notifications:pending:fetch error', error.message);
      socket.emit('notifications:pending:error', {
        error: error.message
      });
    }
  });

  /**
   * Get unread notification count
   * Event: notifications:unread:count
   */
  socket.on('notifications:unread:count', async () => {
    try {
      console.log(`[Socket.io] notifications:unread:count event from user ${socket.userId}`);

      const count = await db.NotificationDelivery.count({
        where: {
          userId: socket.userId,
          status: 'sent'
        }
      });

      console.log(`[Socket.io] ✅ Unread count: ${count}`);

      socket.emit('notifications:unread:count', {
        unreadCount: count
      });

      logger.debug('Unread count fetched', {
        count,
        userId: socket.userId
      });
    } catch (error) {
      console.error(`[Socket.io] Error in notifications:unread:count:`, error.message);
      logger.error('Socket.io notifications:unread:count error', error.message);
      socket.emit('notifications:unread:count:error', {
        error: error.message
      });
    }
  });

  /**
   * Delete notification
   * Event: notification:delete
   */
  socket.on('notification:delete', async (data) => {
    try {
      console.log(`[Socket.io] notification:delete event from user ${socket.userId}`);

      const { notificationId } = data;

      if (!notificationId) {
        return socket.emit('notification:delete:error', {
          error: 'notificationId is required'
        });
      }

      // Delete delivery record
      const result = await db.NotificationDelivery.destroy({
        where: {
          notificationId,
          userId: socket.userId
        }
      });

      if (result === 0) {
        console.log(`[Socket.io] Notification not found for deletion`);
        return socket.emit('notification:delete:error', {
          error: 'Notification not found'
        });
      }

      console.log(`[Socket.io] ✅ Notification ${notificationId} deleted`);

      // Emit success
      socket.emit('notification:delete:success', {
        notificationId
      });

      // Broadcast to all user's clients
      io.to(`user:${socket.userId}`).emit('notification:deleted', {
        notificationId
      });

      logger.info('Notification deleted', {
        notificationId,
        userId: socket.userId
      });
    } catch (error) {
      console.error(`[Socket.io] Error in notification:delete:`, error.message);
      logger.error('Socket.io notification:delete error', error.message);
      socket.emit('notification:delete:error', {
        error: error.message
      });
    }
  });
};
