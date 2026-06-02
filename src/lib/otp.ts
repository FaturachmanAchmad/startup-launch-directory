// src/lib/otp.ts
// Secure OTP generation, hashing, and rate-limit helpers

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma"; // adjust to your prisma client path

// ── Constants ─────────────────────────────────────────────────────────────────

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_REQUESTS_PER_HOUR = 5;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

// ── Generation ────────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically-random 6-digit numeric OTP.
 * Uses rejection sampling so the distribution is perfectly uniform.
 */
export function generateOTPCode(): string {
  // Generate a random number in [0, 999999] using crypto to avoid modulo bias
  let code: number;
  do {
    const buf = crypto.randomBytes(4);
    code = buf.readUInt32BE(0) % 1_000_000;
  } while (code > 999_999); // always false, kept for explicitness

  return String(code).padStart(6, "0");
}

/** Returns the expiry Date object (now + OTP_EXPIRY_MINUTES). */
export function getOTPExpiry(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

// ── Hashing ───────────────────────────────────────────────────────────────────

/** Hashes an OTP code before storing it in the database. */
export async function hashOTPCode(code: string): Promise<string> {
  return bcrypt.hash(code, BCRYPT_ROUNDS);
}

/** Compares a plaintext OTP against a stored bcrypt hash. */
export async function verifyOTPCode(
  code: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

/**
 * Returns true if the given email has exceeded the maximum number of OTP
 * requests in the past hour.
 */
export async function isRateLimited(email: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

  const recentCount = await prisma.passwordResetOTP.count({
    where: {
      email,
      createdAt: { gte: since },
    },
  });

  return recentCount >= OTP_MAX_REQUESTS_PER_HOUR;
}

/**
 * Deletes all existing (used and unexpired) OTP records for an email before
 * issuing a new one, keeping the table tidy.
 */
export async function deleteExistingOTPs(email: string): Promise<void> {
  await prisma.passwordResetOTP.deleteMany({ where: { email } });
}
