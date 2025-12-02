const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const AdminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorization');

/**
 * FCM Notification Routes
 */

// ============================================
// ADMIN ROUTES (Require admin role)
// ============================================

/**
 * POST /notifications/send/user
 * Send notification to a single user
 * Body: { userId, title, body, data }
 */
router.post('/send/user', authMiddleware, authorize(['admin']), (req, res) => {
  NotificationController.sendToUser(req, res);
});

/**
 * POST /notifications/send/multi
 * Send notification to multiple users
 * Body: { userIds[], title, body, data }
 */
router.post('/send/multi', authMiddleware, authorize(['admin']), (req, res) => {
  NotificationController.sendToMultipleUsers(req, res);
});

/**
 * POST /notifications/send/topic
 * Send notification to a topic
 * Body: { topic, title, body, data }
 */
router.post('/send/topic', authMiddleware, authorize(['admin']), (req, res) => {
  NotificationController.sendToTopic(req, res);
});

// ============================================
// USER ROUTES (Require authentication)
// ============================================

/**
 * GET /notifications/user/:userId
 * Get all notifications for a user
 * Query: limit, offset
 */
router.get('/user/:userId', authMiddleware, (req, res) => {
  NotificationController.getNotifications(req, res);
});

/**
 * GET /notifications
 * Get notifications for authenticated user
 * Query: limit, offset
 */
router.get('/', authMiddleware, (req, res) => {
  NotificationController.getNotifications(req, res);
});

/**
 * PATCH /notifications/:notificationId/read
 * Mark notification as read
 */
router.patch('/:notificationId/read', authMiddleware, (req, res) => {
  NotificationController.markAsRead(req, res);
});

/**
 * DELETE /notifications/:notificationId
 * Delete a notification
 */
router.delete('/:notificationId', authMiddleware, (req, res) => {
  NotificationController.deleteNotification(req, res);
});

/**
 * GET /notifications/unread/count
 * Get unread notification count
 */
router.get('/unread/count', authMiddleware, (req, res) => {
  NotificationController.getUnreadCount(req, res);
});

// ============================================
// ADMIN STATS ROUTES
// ============================================

/**
 * GET /notifications/admin/stats/notifications
 * Get notification statistics
 */
router.get('/admin/stats/notifications', authMiddleware, authorize(['admin']), (req, res) => {
  AdminController.getNotificationStats(req, res);
});

/**
 * GET /notifications/admin/stats/users
 * Get user statistics
 */
router.get('/admin/stats/users', authMiddleware, authorize(['admin']), (req, res) => {
  AdminController.getUserStats(req, res);
});

/**
 * GET /notifications/admin/all
 * Get all notifications (admin)
 */
router.get('/admin/all', authMiddleware, authorize(['admin']), (req, res) => {
  AdminController.getAllNotifications(req, res);
});

module.exports = router;
