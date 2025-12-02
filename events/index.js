const { handleMaterialAdded } = require('./materialAdded');
const { handleExamPublished } = require('./examPublished');
const logger = require('../utils/winstonLogger');

const EventEmitter = require('events');
const eventEmitter = new EventEmitter();

// Register event listeners
eventEmitter.on('material:added', handleMaterialAdded);
eventEmitter.on('exam:published', handleExamPublished);

logger.info('Event listeners registered');

module.exports = eventEmitter;
