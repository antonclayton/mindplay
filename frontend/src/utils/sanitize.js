import DOMPurify from 'dompurify';

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

export function validateUsername(username) {
  const sanitized = sanitizeInput(username);
  if (!sanitized || sanitized.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
  if (sanitized.length > 20) {
    throw new Error('Username must be less than 20 characters');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(sanitized)) {
    throw new Error('Username can only contain letters, numbers, and underscores');
  }
  return sanitized;
}

export function validatePassword(password) {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  if (password.length > 100) {
    throw new Error('Password is too long');
  }
  return password;
}
