const jwt = require('jsonwebtoken');
const logger = require('../utils/winstonLogger');

/**
 * Express Middleware: Verify JWT token from Authorization header
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      logger.warn('No token provided');
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.debug('Token verified', { userId: decoded.id });
    next();
  } catch (error) {
    logger.error('Auth middleware error', error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

/**
 * Socket.io: Verify JWT token from socket handshake
 */
const verifySocketToken = (token) => {
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.error('Socket.io token verification failed', error.message);
    throw new Error('Invalid or expired token');
  }
};

module.exports = authMiddleware;
module.exports.verifySocketToken = verifySocketToken;
