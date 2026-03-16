import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hashed = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hashed}`;
}

export function verifyPassword(password: string, savedPassword: string): boolean {
  const [salt, savedHash] = savedPassword.split(":");

  if (!salt || !savedHash) {
    return false;
  }

  const incomingHash = scryptSync(password, salt, KEY_LENGTH);
  const storedHash = Buffer.from(savedHash, "hex");

  if (incomingHash.length !== storedHash.length) {
    return false;
  }

  return timingSafeEqual(incomingHash, storedHash);
}
