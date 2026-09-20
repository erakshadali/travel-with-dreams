import { randomBytes } from 'node:crypto';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{10,16}$/;

export const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export const isEmail = (value) => EMAIL_RE.test(value) && value.length <= 120;
export const isPhone = (value) => PHONE_RE.test(value);

export const newReference = (prefix) => `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`;

// Validation errors are returned as { field: message } so the client can show them inline.
export class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.errors = errors;
  }
}

export function requireValid(errors) {
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
}
