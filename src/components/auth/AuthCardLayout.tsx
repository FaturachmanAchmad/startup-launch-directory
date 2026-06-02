// src/components/auth/AuthCardLayout.tsx
// Reusable wrapper card used by all auth pages in the forgot-password flow

import React from "react";
import Link from "next/link";

interface AuthCardLayoutProps {
  /** Icon or illustration rendered above the heading */
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Optional footer content (e.g. "Back to login" link) */
  footer?: React.ReactNode;
}

export function AuthCardLayout({
  icon,
  title,
  subtitle,
  children,
  footer,
}: AuthCardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      {/* Subtle grid texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
          {/* Icon */}
          {icon && (
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400">
                {icon}
              </div>
            </div>
          )}

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Main content */}
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="mt-6 text-center text-sm text-slate-500">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Convenience back-to-login link ────────────────────────────────────────────
export function BackToLoginLink() {
  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Back to sign in
    </Link>
  );
}
