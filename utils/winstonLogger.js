const winston = require('winston');
const path = require('path');

/**
 * Winston Logger Configuration
 * Logs to console and files with different levels
 */

const logDir = path.join(__dirname, '../logs');

// Define log levels with colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console(),

  // Error log file
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: winston.format.uncolorize()
  }),

  // Combined log file
  new winston.transports.File({
    filename: path.join(logDir, 'all.log'),
    format: winston.format.uncolorize()
  })
];

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format,
  transports
});

module.exports = logger;
