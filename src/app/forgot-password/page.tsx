// src/app/(auth)/forgot-password/page.tsx
// Step 1 — user enters their email address to receive an OTP

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AuthCardLayout, BackToLoginLink } from "@/components/auth/AuthCardLayout";
import { forgotPasswordSchema } from "@/lib/validations/password-reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError("");

    // Client-side validation
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "Something went wrong.");
        return;
      }

      toast.success("Check your email for a verification code.");
      // Pass email to next step via search param (no sensitive data)
      router.push(
        `/verify-reset-code?email=${encodeURIComponent(parsed.data.email)}`
      );
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCardLayout
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      }
      title="Forgot your password?"
      subtitle="Enter the email address linked to your account and we'll send you a one-time verification code."
      footer={<BackToLoginLink />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldError("");
            }}
            disabled={loading}
            aria-describedby={fieldError ? "email-error" : undefined}
            aria-invalid={!!fieldError}
            className={`
              w-full px-4 py-3 rounded-xl text-sm text-white
              bg-white/5 border transition-all duration-150
              placeholder:text-slate-600
              focus:outline-none focus:ring-2 focus:ring-indigo-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${fieldError ? "border-red-500" : "border-white/10"}
            `}
          />
          {fieldError && (
            <p id="email-error" className="mt-1.5 text-xs text-red-400" role="alert">
              {fieldError}
            </p>
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
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Sending code…
            </>
          ) : (
            "Send verification code"
          )}
        </button>
      </form>
    </AuthCardLayout>
  );
}
