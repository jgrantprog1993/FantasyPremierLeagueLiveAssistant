import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
