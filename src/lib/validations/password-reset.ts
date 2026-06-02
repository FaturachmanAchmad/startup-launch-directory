// src/lib/validations/password-reset.ts
// Zod schemas for all forgot-password endpoints and forms

import { z } from "zod";

// ── Forgot Password ───────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase(),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

// ── Verify OTP ────────────────────────────────────────────────────────────────
export const verifyOTPSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase(),
  code: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

export type VerifyOTPSchema = z.infer<typeof verifyOTPSchema>;

// ── Reset Password ────────────────────────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .toLowerCase(),
    code: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP must contain only digits"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

// ── Password strength helper (used by PasswordStrengthIndicator) ──────────────
export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "",
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-emerald-500",
  ];

  return {
    score,
    label: labels[score] ?? "",
    color: colors[score] ?? "",
    checks,
  };
}
