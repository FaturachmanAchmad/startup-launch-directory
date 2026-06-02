// src/app/verify-reset-code/page.tsx
import { Suspense } from "react";
import VerifyResetCodeContent from "./verify-reset-code-content";

export default function VerifyResetCodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <VerifyResetCodeContent />
    </Suspense>
  );
}