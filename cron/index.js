const weeklySummaryJob = require('./weeklySummary');
const dailyReminderJob = require('./dailyReminder');
const logger = require('../utils/winstonLogger');

const initializeCronJobs = () => {
  try {
    logger.info('Initializing cron jobs');
    // Jobs are automatically scheduled when imported
    logger.info('Cron jobs initialized successfully');
  } catch (error) {
    logger.error('Cron initialization error', error.message);
  }
};

module.exports = {
  initializeCronJobs,
  weeklySummaryJob,
  dailyReminderJob
};
