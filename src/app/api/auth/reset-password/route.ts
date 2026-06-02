// src/app/api/auth/reset-password/route.ts
// POST /api/auth/reset-password
//
// Final step: re-verifies the OTP, updates the user's password, marks OTP used.
// All three fields (email, code, password) are validated in one atomic step
// so there is no window between verify-otp and reset-password where the OTP
// could be replayed.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/password-reset";
import { verifyOTPCode } from "@/lib/otp";

const BCRYPT_ROUNDS = 12;

export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, code, password } = parsed.data;

    // 2. Re-verify OTP (same checks as verify-otp endpoint)
    const otpRecord = await prisma.passwordResetOTP.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    const invalidMsg =
      "Invalid or expired verification code. Please restart the password reset process.";

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: invalidMsg },
        { status: 400 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { success: false, message: invalidMsg },
        { status: 400 }
      );
    }

    if (otpRecord.used) {
      return NextResponse.json(
        { success: false, message: "This code has already been used." },
        { status: 400 }
      );
    }

    const isValid = await verifyOTPCode(code, otpRecord.code);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: invalidMsg },
        { status: 400 }
      );
    }

    // 3. Check that the user still exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account not found." },
        { status: 400 }
      );
    }

    // 4. Hash the new password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // 5. Atomically update password and mark OTP as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetOTP.update({
        where: { id: otpRecord.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("[reset-password] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
