const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeFirebase } = require('./config/firebase');
const { initializeCronJobs } = require('./cron');
const logger = require('./utils/winstonLogger');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Initialize Firebase
initializeFirebase();

// Initialize Cron Jobs
initializeCronJobs();

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
