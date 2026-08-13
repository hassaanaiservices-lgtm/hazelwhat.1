import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt.
 * Never stores or writes plaintext passwords.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  if (!plainPassword || !passwordHash) return false;
  try {
    return await bcrypt.compare(plainPassword, passwordHash);
  } catch (error) {
    return false;
  }
}

/**
 * Generate a genuinely random and long password.
 * Minimum 12 characters, containing uppercase, lowercase, numbers, and special symbols.
 */
export function generateSecureRandomPassword(length = 16): string {
  const minLength = 12;
  const actualLength = Math.max(length, minLength);

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + digits + symbols;

  // Guarantee at least one character from each set
  const getRandomChar = (charset: string) => {
    const randomIndex = crypto.randomInt(0, charset.length);
    return charset[randomIndex];
  };

  const passwordChars = [
    getRandomChar(uppercase),
    getRandomChar(lowercase),
    getRandomChar(digits),
    getRandomChar(symbols),
  ];

  // Fill remaining length with random choices from all character sets
  for (let i = passwordChars.length; i < actualLength; i++) {
    passwordChars.push(getRandomChar(allChars));
  }

  // Cryptographically shuffle array elements (Fisher-Yates)
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join('');
}
