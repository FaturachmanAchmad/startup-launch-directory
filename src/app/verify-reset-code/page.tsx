import { Suspense } from "react";
import VerifyResetCodeContent from "./verify-reset-code-content";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyResetCodeContent />
    </Suspense>
  );
}