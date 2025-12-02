const logger = require('../utils/winstonLogger');

const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('No user in request');
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        logger.warn('Unauthorized access attempt', { 
          userId: req.user.id, 
          userRole: req.user.role,
          allowedRoles 
        });
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }

      logger.debug('Authorization passed', { userId: req.user.id, role: req.user.role });
      next();
    } catch (error) {
      logger.error('Authorization middleware error', error.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Authorization error' 
      });
    }
  };
};

module.exports = authorize;
