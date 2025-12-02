const express = require('express');
const router = express.Router();
const DeviceTokenController = require('../controllers/deviceTokenController');
const authMiddleware = require('../middleware/auth');

// Register or update device token
router.post('/register', authMiddleware, (req, res) => {
  DeviceTokenController.registerDeviceToken(req, res);
});

// Get all device tokens for user
router.get('/', authMiddleware, (req, res) => {
  DeviceTokenController.getDeviceTokens(req, res);
});

// Remove specific device token
router.delete('/:tokenId', authMiddleware, (req, res) => {
  DeviceTokenController.removeDeviceToken(req, res);
});

// Deactivate all device tokens
router.post('/deactivate-all', authMiddleware, (req, res) => {
  DeviceTokenController.deactivateAllTokens(req, res);
});

module.exports = router;
