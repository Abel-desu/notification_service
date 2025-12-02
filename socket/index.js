const socketIO = require('socket.io');
const { verifySocketToken } = require('../middleware/auth');
const logger = require('../utils/winstonLogger');

/**
 * Initialize Socket.io
 * Handles real-time communication for notifications
 */
module.exports = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Middleware: Authenticate socket connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('No authentication token provided'));
      }

      // Verify token
      const decoded = verifySocketToken(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userEmail = decoded.email;

      logger.info(`[Socket.io] User ${socket.userId} authenticated`);
      next();
    } catch (error) {
      logger.error('[Socket.io] Authentication failed', error.message);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`[Socket.io] ✅ User ${socket.userId} connected (${socket.id})`);

    // Join user room for targeted broadcasts
    socket.join(`user:${socket.userId}`);

    // Load event handlers
    require('./handlers/notificationHandlers')(io, socket);

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`[Socket.io] ❌ User ${socket.userId} disconnected (${socket.id})`);
      logger.info(`[Socket.io] User ${socket.userId} disconnected`);
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`[Socket.io] Error for user ${socket.userId}:`, error);
      logger.error(`[Socket.io] Socket error`, error);
    });
  });

  console.log('[Socket.io] ✅ Socket.io initialized');
  return io;
};
