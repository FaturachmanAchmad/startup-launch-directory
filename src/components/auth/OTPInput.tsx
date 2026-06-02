"use client";

import React, { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

const LENGTH = 6;

export function OTPInput({ value, onChange, disabled, error }: OTPInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(LENGTH, "").slice(0, LENGTH).split("");

  function handleChange(index: number, char: string) {
    if (!/^\d*$/.test(char)) return;
    const newDigits = [...digits];
    newDigits[index] = char.slice(-1);
    onChange(newDigits.join("").trimEnd());
    if (char && index < LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      const newDigits = [...digits];
      if (digits[index]) {
        newDigits[index] = "";
        onChange(newDigits.join("").trimEnd());
      } else if (index > 0) {
        newDigits[index - 1] = "";
        onChange(newDigits.join("").trimEnd());
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

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    onChange(pasted);
    const nextIndex = Math.min(pasted.length, LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={{
            width: "48px",
            height: "56px",
            textAlign: "center",
            fontSize: "20px",
            fontWeight: "bold",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            border: `2px solid ${error ? "#ef4444" : "rgba(255,255,255,0.15)"}`,
            borderRadius: "12px",
            outline: "none",
          }}
        />
      ))}
    </div>
  );
}