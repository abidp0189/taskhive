const nodemailer = require('nodemailer');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Mailer — dual-mode: Resend API (recommended) → SMTP fallback
 *
 * WHY TWO MODES?
 *  Render's Free tier (and many other cloud hosts) block outbound SMTP ports
 *  25, 465, and 587 entirely to prevent spam. No amount of IPv4 / port
 *  adjustments will bypass a firewall-level block.
 *
 *  The solution is to send via the RESEND HTTP API (port 443, always open).
 *
 * PRIORITY:
 *  1. If RESEND_API_KEY env var is set → use Resend HTTP API  ✅ Works on Render Free
 *  2. Otherwise fall back to SMTP (works on local dev and paid Render)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Resend HTTP API sender ────────────────────────────────────────────────────

async function sendViaResend({ from, to, subject, text, html }) {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const result = await resend.emails.send({ from, to, subject, text, html });

  if (result.error) {
    throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
  }

  return result;
}

// ── SMTP sender (local dev / paid hosting) ────────────────────────────────────

function createSmtpTransporter() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  const cleanPass = SMTP_PASS.replace(/\s+/g, '');
  const port = parseInt(SMTP_PORT || '587', 10);

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    family: 4,                     // Force IPv4 — prevents ENETUNREACH on cloud
    auth: { user: SMTP_USER, pass: cleanPass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

/**
 * Send a password reset email.
 *
 * Automatically chooses Resend API or SMTP depending on available credentials.
 *
 * @param {string} toEmail   - Recipient email address
 * @param {string} resetLink - Full reset URL including token
 * @param {string} userName  - Recipient's display name
 */
async function sendPasswordResetEmail(toEmail, resetLink, userName) {
  const senderEmail = process.env.SMTP_USER || 'abidp0189@gmail.com';

  // Unique 6-digit code per email → prevents Gmail conversation threading
  const refCode = Math.floor(100000 + Math.random() * 900000);
  const subject = `Password Reset [${refCode}] - Tomar Kaj`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#13131f,#1a1a2e);border-radius:20px;border:1px solid #2a2a40;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #2a2a40;">
            <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
              Tomar <span style="background:linear-gradient(135deg,#a78bfa,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Kaj</span>
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">Password Reset Request</p>
            <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;line-height:1.6;">
              Hi <strong style="color:#e5e7eb;">${userName}</strong>,<br/>
              We received a request to reset your Tomar Kaj password.
              This link is valid for <strong style="color:#a78bfa;">24 hours</strong>.
            </p>
            <!-- Security Code -->
            <div style="background:#1e1b4b;border:1px solid #4338ca;border-radius:14px;padding:16px;text-align:center;margin:20px 0;">
              <span style="font-size:11px;color:#c7d2fe;text-transform:uppercase;letter-spacing:1.5px;display:block;margin-bottom:6px;font-weight:700;">Security Reference Code</span>
              <span style="font-size:30px;font-weight:900;letter-spacing:8px;color:#ffffff;font-family:monospace;">${refCode}</span>
            </div>
            <!-- Button -->
            <div style="text-align:center;margin:28px 0;">
              <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff;font-size:14px;font-weight:800;text-decoration:none;padding:15px 40px;border-radius:100px;letter-spacing:0.5px;box-shadow:0 8px 24px rgba(124,58,237,0.4);">
                Reset My Password
              </a>
            </div>
            <p style="margin:0 0 12px;font-size:12px;color:#6b7280;line-height:1.6;">Or copy and paste this link:</p>
            <div style="background:#0d0d1a;border:1px solid #2a2a40;border-radius:10px;padding:12px 16px;word-break:break-all;">
              <a href="${resetLink}" style="color:#a78bfa;font-size:12px;text-decoration:none;">${resetLink}</a>
            </div>
            <p style="margin:24px 0 0;font-size:12px;color:#6b7280;line-height:1.6;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #2a2a40;text-align:center;">
            <p style="margin:0;font-size:11px;color:#4b5563;">© 2026 Tomar Kaj. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const text = `Hi ${userName},\n\nSecurity Code: ${refCode}\n\nReset link (valid 24h):\n${resetLink}\n\nIgnore this if you didn't request it.\n\n— Tomar Kaj Team`;

  // ── Mode 1: Resend API (works on Render Free, no SMTP port needed) ──────────
  if (process.env.RESEND_API_KEY) {
    console.info('[Mailer] Sending via Resend API...');
    // Resend requires a verified domain to use a custom from address.
    // "onboarding@resend.dev" is Resend's built-in verified sender for testing.
    // Once you verify tomarkaj.com in Resend dashboard, switch to:
    //   from: `Tomar Kaj <no-reply@tomarkaj.com>`
    const fromAddress = process.env.RESEND_FROM || 'Tomar Kaj <onboarding@resend.dev>';
    const result = await sendViaResend({
      from: fromAddress,
      to: toEmail,
      subject,
      text,
      html,
    });
    console.info('[Mailer] Resend send success:', result.data?.id);
    return result;
  }

  // ── Mode 2: SMTP (local dev / paid cloud) ───────────────────────────────────
  const transporter = createSmtpTransporter();

  if (!transporter) {
    console.error('[Mailer] No email transport configured. Set RESEND_API_KEY or SMTP_* env vars.');
    throw new Error(
      'Email service is not configured. ' +
      'Set RESEND_API_KEY in your Render environment variables to enable email sending on the free tier.'
    );
  }

  console.info('[Mailer] Sending via SMTP...');
  const info = await transporter.sendMail({
    from: `"Tomar Kaj" <${senderEmail}>`,
    replyTo: senderEmail,
    to: toEmail,
    subject,
    text,
    html,
  });
  console.info('[Mailer] SMTP send success:', info.response);
  return info;
}

module.exports = { sendPasswordResetEmail };
