require('dotenv').config();
const http = require('http');
const app = require('./app');
const db = require('./models');
const logger = require('./utils/winstonLogger');
const initializeSocketIO = require('./socket');
const deliveryProcessor = require('./services/deliveryProcessor');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established');

    // Skip sync - migrations already handle schema
    // await db.sequelize.sync({ alter: false });
    logger.info('Database connection ready (migrations pre-applied)');

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    const io = initializeSocketIO(server);
    console.log('[Server] Socket.io initialized');

    // Initialize delivery processor
    deliveryProcessor.initialize(io);
    // Start delivery processor (5 second interval)
    setTimeout(() => {
      deliveryProcessor.start();
      console.log('[Server] Delivery processor started');
    }, 1000);

    // Store io instance on app for use in routes
    app.locals.io = io;

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      console.log(`\n✅ Notification Service Ready`);
      console.log(`   API: http://localhost:${PORT}`);
      console.log(`   Socket.io: ws://localhost:${PORT}`);
      console.log(`\n`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[Server] SIGTERM signal received: closing HTTP server');
      deliveryProcessor.stop();
      server.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Server startup error', error.message);
    console.error('[Server] Startup error:', error);
    process.exit(1);
  }
};

startServer();
