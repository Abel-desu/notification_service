const Joi = require('joi');
const logger = require('../../utils/winstonLogger');

/**
 * Socket.io Validation Schemas
 * All Socket.io events must validate against these schemas
 */

// Mark single notification as read
const readNotificationSchema = Joi.object({
  notificationId: Joi.string().uuid().required().messages({
    'string.uuid': 'notificationId must be a valid UUID',
    'any.required': 'notificationId is required'
  })
});

// Mark multiple notifications as read
const readMultipleSchema = Joi.object({
  notificationIds: Joi.array()
    .items(Joi.string().uuid())
    .required()
    .min(1)
    .messages({
      'array.min': 'notificationIds must contain at least 1 item',
      'any.required': 'notificationIds is required'
    })
});

// Get notifications with pagination
const getNotificationsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

// Delete notification
const deleteNotificationSchema = Joi.object({
  notificationId: Joi.string().uuid().required().messages({
    'string.uuid': 'notificationId must be a valid UUID',
    'any.required': 'notificationId is required'
  })
});

/**
 * Validate Socket.io data against schema
 * @param {object} data - Data to validate
 * @param {Joi.Schema} schema - Joi schema
 * @returns {Promise<{valid: boolean, value?: object, errors?: array}>}
 */
async function validateSocketData(data, schema) {
  try {
    const value = await schema.validateAsync(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    return {
      valid: true,
      value
    };
  } catch (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));

    logger.warn('Socket.io validation failed', { errors });

    return {
      valid: false,
      errors
    };
  }
}

module.exports = {
  readNotificationSchema,
  readMultipleSchema,
  getNotificationsSchema,
  deleteNotificationSchema,
  validateSocketData
};
