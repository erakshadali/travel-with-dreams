const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{10,16}$/;

// Mirrors the server-side checks so people get instant feedback; the server still re-validates.
export function validateContact({ name, email, phone }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (!PHONE_RE.test(phone.trim())) errors.phone = 'Please enter a valid phone number (10–15 digits).';
  return errors;
}
