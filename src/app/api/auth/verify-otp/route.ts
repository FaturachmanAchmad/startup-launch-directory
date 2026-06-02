// src/app/api/auth/verify-otp/route.ts
// POST /api/auth/verify-otp
//
// Validates that:
//  • The OTP exists for the given email
//  • The OTP has not expired
//  • The OTP has not already been used
//  • The plaintext code matches the stored hash
//
// Does NOT mark the OTP as used — that happens in /reset-password so the
// user can still call verify-otp multiple times if needed (e.g. re-check
// before navigating). The OTP is only burned on a successful password reset.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOTPSchema } from "@/lib/validations/password-reset";
import { verifyOTPCode } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate
    const body = await req.json();
    const parsed = verifyOTPSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;

    // 2. Look up the most-recent OTP record for this email
    const otpRecord = await prisma.passwordResetOTP.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    // Use a generic error message to avoid revealing whether the email exists
    const invalidMsg =
      "Invalid or expired verification code. Please request a new one.";

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: invalidMsg },
        { status: 400 }
      );
    }

    // 3. Check expiry
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { success: false, message: invalidMsg },
        { status: 400 }
      );
    }

    // 4. Check already used
    if (otpRecord.used) {
      return NextResponse.json(
        { success: false, message: "This code has already been used. Please request a new one." },
        { status: 400 }
      );
    }

    // 5. Compare plaintext code against stored hash
    const isValid = await verifyOTPCode(code, otpRecord.code);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: invalidMsg },
        { status: 400 }
      );
    }

    // 6. OTP is valid — tell the client it can proceed to reset-password
    return NextResponse.json({
      success: true,
      message: "Code verified successfully.",
    });
  } catch (error) {
    console.error("[verify-otp] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
