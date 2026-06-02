// src/components/auth/PasswordStrengthIndicator.tsx
// Visual password strength bar + requirements checklist

"use client";

import React from "react";
import { getPasswordStrength } from "@/lib/validations/password-reset";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const { score, label, color, checks } = getPasswordStrength(password);

  const requirements = [
    { met: checks.minLength, label: "At least 8 characters" },
    { met: checks.hasUppercase, label: "One uppercase letter" },
    { met: checks.hasLowercase, label: "One lowercase letter" },
    { met: checks.hasNumber, label: "One number" },
  ];

  return (
    <div className="mt-2 space-y-3" aria-live="polite">
      {/* Segmented bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              seg <= score ? color : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      {label && (
        <p className="text-xs text-slate-400">
          Strength:{" "}
          <span
            className={`font-medium ${
              score === 4
                ? "text-emerald-400"
                : score === 3
                ? "text-yellow-400"
                : score === 2
                ? "text-orange-400"
                : "text-red-400"
            }`}
          >
            {label}
          </span>
        </p>
      )}

      {/* Requirements list */}
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li
            key={req.label}
            className={`flex items-center gap-2 text-xs transition-colors ${
              req.met ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            {req.met ? (
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
              </svg>
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
