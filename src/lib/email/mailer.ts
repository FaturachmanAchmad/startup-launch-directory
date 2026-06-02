// src/lib/email/mailer.ts
// Reusable Nodemailer utility — reads SMTP config from environment variables

import nodemailer from "nodemailer";

// ── Transport ─────────────────────────────────────────────────────────────────

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465, // true for port 465
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

// ── HTML template ─────────────────────────────────────────────────────────────

function buildOTPEmailHTML(params: {
  appName: string;
  otpCode: string;
  expiresInMinutes: number;
  recipientEmail: string;
}): string {
  const { appName, otpCode, expiresInMinutes, recipientEmail } = params;
  const year = new Date().getFullYear();

  // Split the OTP into individual digit spans for visual emphasis
  const digitSpans = otpCode
    .split("")
    .map(
      (d) =>
        `<span style="
          display:inline-block;
          width:48px;
          height:56px;
          line-height:56px;
          text-align:center;
          font-size:28px;
          font-weight:700;
          color:#111827;
          background:#F3F4F6;
          border:2px solid #E5E7EB;
          border-radius:10px;
          margin:0 4px;
          font-family:'Courier New',monospace;
        ">${d}</span>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your password — ${appName}</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#FFFFFF;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E293B 0%,#0F172A 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#F8FAFC;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                ${appName}
              </h1>
              <p style="margin:6px 0 0;color:#94A3B8;font-size:13px;">Password Reset Request</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;color:#374151;font-size:16px;font-weight:600;">Hi there,</p>
              <p style="margin:0 0 28px;color:#6B7280;font-size:15px;line-height:1.6;">
                We received a request to reset the password for your account
                (<strong style="color:#374151;">${recipientEmail}</strong>).
                Use the one-time code below to continue.
              </p>

              <!-- OTP display -->
              <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 16px;color:#6B7280;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">
                  Your verification code
                </p>
                <div>${digitSpans}</div>
                <p style="margin:16px 0 0;color:#9CA3AF;font-size:13px;">
                  ⏱ Expires in <strong>${expiresInMinutes} minutes</strong>
                </p>
              </div>

              <!-- Security notice -->
              <div style="background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:28px;">
                <p style="margin:0;color:#92400E;font-size:13px;line-height:1.5;">
                  <strong>Security notice:</strong> If you did not request a password reset,
                  please ignore this email — your account remains secure. Never share this
                  code with anyone.
                </p>
              </div>

              <p style="margin:0;color:#9CA3AF;font-size:13px;line-height:1.5;">
                This code is valid for one use only and will expire automatically.
                If your code expires, you can request a new one from the login page.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;">
                © ${year} ${appName}. All rights reserved.
              </p>
              <p style="margin:6px 0 0;color:#D1D5DB;font-size:12px;">
                This is an automated email — please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Public send function ──────────────────────────────────────────────────────

export interface SendOTPEmailOptions {
  to: string;
  otpCode: string;
  expiresInMinutes?: number;
  appName?: string;
}

export async function sendPasswordResetOTP(
  options: SendOTPEmailOptions
): Promise<void> {
  const {
    to,
    otpCode,
    expiresInMinutes = 10,
    appName = process.env.NEXT_PUBLIC_APP_NAME ?? "LaunchDir",
  } = options;

  const transporter = createTransport();

  const html = buildOTPEmailHTML({
    appName,
    otpCode,
    expiresInMinutes,
    recipientEmail: to,
  });

  await transporter.sendMail({
    from: `"${appName}" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `Your password reset code — ${appName}`,
    html,
    // Plain-text fallback for email clients that don't render HTML
    text: [
      `Hi,`,
      ``,
      `Your password reset code is: ${otpCode}`,
      ``,
      `This code expires in ${expiresInMinutes} minutes.`,
      ``,
      `If you did not request this, ignore this email — your account is safe.`,
      ``,
      `— ${appName}`,
    ].join("\n"),
  });
}
