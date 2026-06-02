"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { AuthCardLayout, BackToLoginLink } from "@/components/auth/AuthCardLayout";

const LENGTH = 6;

export default function VerifyResetCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";

  const [email] = useState(emailParam);
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");

  useEffect(() => {
    if (secondsLeft <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  function handleDigitChange(index: number, char: string) {
    if (!/^\d*$/.test(char)) return;
    const newDigits = [...digits];
    newDigits[index] = char.slice(-1);
    setDigits(newDigits);
    setCodeError("");
    if (char && index < LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      const newDigits = [...digits];
      if (digits[index]) {
        newDigits[index] = "";
        setDigits(newDigits);
      } else if (index > 0) {
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    const newDigits = pasted.split("").concat(Array(LENGTH).fill("")).slice(0, LENGTH);
    setDigits(newDigits);
    inputRefs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCodeError("");

    if (code.length !== 6 || digits.some(d => d === "")) {
      setCodeError("Please enter all 6 digits.");
      return;
    }
    if (!email) {
      toast.error("Email is missing. Please go back and try again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setCodeError(data.message ?? "Invalid code.");
        return;
      }

      toast.success("Code verified! Set your new password.");
      router.push(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend || !email) return;
    setCanResend(false);
    setSecondsLeft(60);
    setDigits(Array(LENGTH).fill(""));
    setCodeError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast.success("A new code has been sent to your email.");
    } catch {
      toast.error("Failed to resend. Please try again.");
    }
  }

  return (
    <AuthCardLayout
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z" />
        </svg>
      }
      title="Enter verification code"
      subtitle={emailParam ? `We sent a 6-digit code to ${emailParam}. It expires in 10 minutes.` : "Enter the 6-digit code from your email."}
      footer={<BackToLoginLink />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">

        {/* ── OTP boxes ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                disabled={loading}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                style={{
                  width: "48px",
                  height: "56px",
                  textAlign: "center",
                  fontSize: "22px",
                  fontWeight: "700",
                  background: "rgba(255,255,255,0.07)",
                  color: "white",
                  border: `2px solid ${codeError ? "#ef4444" : "rgba(255,255,255,0.15)"}`,
                  borderRadius: "12px",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
              />
            ))}
          </div>
          {codeError && (
            <p style={{ marginTop: "12px", textAlign: "center", fontSize: "13px", color: "#f87171" }} role="alert">
              {codeError}
            </p>
          )}
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={loading || digits.some(d => d === "")}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verifying…
            </>
          ) : "Verify code"}
        </button>

        {/* ── Resend ── */}
        <p className="text-center text-sm text-slate-500">
          Didn&apos;t receive it?{" "}
          {canResend ? (
            <button type="button" onClick={handleResend} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Resend code
            </button>
          ) : (
            <span className="text-slate-600">Resend in {secondsLeft}s</span>
          )}
        </p>

      </form>
    </AuthCardLayout>
  );
}