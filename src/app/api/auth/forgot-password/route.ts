// src/app/api/auth/forgot-password/route.ts
// POST /api/auth/forgot-password
//
// Security design:
//  • Always returns 200 with a generic message regardless of whether the
//    email exists — prevents email enumeration attacks.
//  • Rate-limited: max 5 requests per email per hour.
//  • OTP is hashed with bcrypt before storage.
//  • Old OTP records for the same email are deleted before creating a new one.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust to your prisma client path
import { forgotPasswordSchema } from "@/lib/validations/password-reset";
import {
  generateOTPCode,
  getOTPExpiry,
  hashOTPCode,
  isRateLimited,
  deleteExistingOTPs,
} from "@/lib/otp";
import { sendPasswordResetOTP } from "@/lib/email/mailer";

// Generic success message — returned regardless of email existence
const SUCCESS_MESSAGE =
  "If an account with that email exists, you will receive a password reset code shortly.";

export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate input
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // 2. Rate limit check — still generic on failure to avoid info leaks
    const rateLimited = await isRateLimited(email);
    if (rateLimited) {
      // Return 200 with the same generic message; don't reveal rate-limiting
      return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
    }

    // 3. Check if user exists — do NOT reveal result in the response
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // 4. If user exists, generate & store OTP, then send email
    if (user) {
      // Delete any previous OTPs for this email
      await deleteExistingOTPs(email);

      // Generate secure 6-digit OTP
      const plainCode = generateOTPCode();
      const hashedCode = await hashOTPCode(plainCode);
      const expiresAt = getOTPExpiry();

      // Persist the hashed OTP
      await prisma.passwordResetOTP.create({
        data: {
          email,
          code: hashedCode,
          expiresAt,
        },
      });

      // Send email with the PLAIN code (never store or log the plain code)
      await sendPasswordResetOTP({
        to: email,
        otpCode: plainCode,
      });
    }

    // 5. Always return the same generic 200 response
    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error("[forgot-password] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
