const jwt = require('jsonwebtoken');
const logger = require('../utils/winstonLogger');

const generateToken = (user) => {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    logger.debug('Token generated', { userId: user.id });
    return token;
  } catch (error) {
    logger.error('Token generation error', error.message);
    throw error;
  }
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug('Token verified', { userId: decoded.id });
    return decoded;
  } catch (error) {
    logger.error('Token verification error', error.message);
    throw error;
  }
};

const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    logger.error('Token decode error', error.message);
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};
