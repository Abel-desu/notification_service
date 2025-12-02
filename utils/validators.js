const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const validateDeviceToken = (token) => {
  return token && typeof token === 'string' && token.length > 0;
};

const validateNotificationPayload = (payload) => {
  const { title, body, type } = payload;
  
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return { valid: false, error: 'Title is required and must be a non-empty string' };
  }
  
  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    return { valid: false, error: 'Body is required and must be a non-empty string' };
  }
  
  const validTypes = ['exam', 'material', 'reminder', 'announcement', 'system'];
  if (type && !validTypes.includes(type)) {
    return { valid: false, error: `Type must be one of: ${validTypes.join(', ')}` };
  }
  
  return { valid: true };
};

const validateUserPayload = (payload) => {
  const { email, firstName, lastName } = payload;
  
  if (!email || !validateEmail(email)) {
    return { valid: false, error: 'Valid email is required' };
  }
  
  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
    return { valid: false, error: 'First name is required' };
  }
  
  if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
    return { valid: false, error: 'Last name is required' };
  }
  
  return { valid: true };
};

module.exports = {
  validateEmail,
  validateUUID,
  validateDeviceToken,
  validateNotificationPayload,
  validateUserPayload
};
