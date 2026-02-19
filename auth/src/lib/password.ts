import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a plain password with a random salt (bcrypt).
 * Store the returned string in Credential.passwordHash.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verify a plain password against a stored hash.
 * Returns true if the password matches.
 */
export async function verifyPassword(
  plainPassword: string,
  storedHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, storedHash);
}
