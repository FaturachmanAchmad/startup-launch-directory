// src/app/(auth)/reset-password/page.tsx
// Step 3 — user sets a new password

"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { AuthCardLayout, BackToLoginLink } from "@/components/auth/AuthCardLayout";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { resetPasswordSchema } from "@/lib/validations/password-reset";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const code = searchParams.get("code") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = resetPasswordSchema.safeParse({ email, code, password, confirmPassword });

    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.errors) {
        const field = issue.path[0] as string;
        if (field === "password" || field === "confirmPassword") {
          fieldErrors[field] = issue.message;
        } else {
          toast.error(issue.message);
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message ?? "Failed to reset password.");
        return;
      }

      toast.success("Password reset successfully! Please sign in.", { duration: 4000 });
      router.push("/login");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // If params are missing, prompt user to restart
  if (!email || !code) {
    return (
      <AuthCardLayout
        title="Link expired"
        subtitle="This link is invalid or has expired. Please restart the password reset process."
        footer={<BackToLoginLink />}
      >
        <div className="text-center">
          <a
            href="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            Start again
          </a>
        </div>
      </AuthCardLayout>
    );
  }

  return (
    <AuthCardLayout
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
          />
        </svg>
      }
      title="Set new password"
      subtitle="Choose a strong password you haven't used before."
      footer={<BackToLoginLink />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* New password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              disabled={loading}
              aria-invalid={!!errors.password}
              className={`
                w-full px-4 py-3 pr-11 rounded-xl text-sm text-white
                bg-white/5 border transition-all duration-150
                placeholder:text-slate-600
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.password ? "border-red-500" : "border-white/10"}
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400" role="alert">{errors.password}</p>
          )}
          <PasswordStrengthIndicator password={password} />
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              disabled={loading}
              aria-invalid={!!errors.confirmPassword}
              className={`
                w-full px-4 py-3 pr-11 rounded-xl text-sm text-white
                bg-white/5 border transition-all duration-150
                placeholder:text-slate-600
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.confirmPassword ? "border-red-500" : "border-white/10"}
              `}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-400" role="alert">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full py-3 rounded-xl text-sm font-semibold text-white
            bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Resetting password…
            </>
          ) : (
            "Reset password"
          )}
        </button>
      </form>
    </AuthCardLayout>
  );
}
