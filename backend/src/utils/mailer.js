const nodemailer = require('nodemailer');

// Build a transporter lazily so missing SMTP vars don't crash on startup
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null; // Will fall back to console logging
  }

  const cleanPass = SMTP_PASS.replace(/\s+/g, '');
  const isGmail = (SMTP_HOST && SMTP_HOST.includes('gmail')) || (SMTP_USER && SMTP_USER.endsWith('@gmail.com'));

  if (isGmail) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: cleanPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  } else {
    _transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587', 10),
      secure: parseInt(SMTP_PORT || '587', 10) === 465,
      auth: {
        user: SMTP_USER,
        pass: cleanPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return _transporter;
}

/**
 * Send a password reset email.
 * Falls back to console.log if SMTP is not configured (dev mode).
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} resetLink - Full reset URL with token
 * @param {string} userName  - Recipient display name
 */
async function sendPasswordResetEmail(toEmail, resetLink, userName) {
  const senderEmail = process.env.SMTP_USER || 'abidp0189@gmail.com';
  // Use verified sender address as replyTo to guarantee SPF/DKIM alignment and prevent spam filtering
  const replyTo = senderEmail;

  // Generate a distinct 6-digit security reference code for this reset request
  // Having a unique subject prevents Gmail from collapsing or grouping new resets into old conversation threads
  const refCode = Math.floor(100000 + Math.random() * 900000);
  const subject = `Password Reset [Security Code: ${refCode}] - Tomar Kaj`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#13131f,#1a1a2e);border-radius:20px;border:1px solid #2a2a40;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #2a2a40;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
                  Tomar <span style="background:linear-gradient(135deg,#a78bfa,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Kaj</span>
                </span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">Password Reset Request</p>
              <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;line-height:1.6;">
                Hi <strong style="color:#e5e7eb;">${userName}</strong>,<br/>
                We received a request to reset the password for your Tomar Kaj account. 
                Click the button below to set a new password. This link is valid for <strong style="color:#a78bfa;">24 hours</strong>.
              </p>

              <!-- Security Code Banner -->
              <div style="background:#1e1b4b;border:1px solid #4338ca;border-radius:14px;padding:16px;text-align:center;margin:20px 0;">
                <span style="font-size:11px;color:#c7d2fe;text-transform:uppercase;letter-spacing:1.5px;display:block;margin-bottom:6px;font-weight:700;">Security Reference Code</span>
                <span style="font-size:30px;font-weight:900;letter-spacing:8px;color:#ffffff;font-family:monospace;">${refCode}</span>
              </div>

              <div style="text-align:center;margin:28px 0;">
                <a href="${resetLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff;font-size:14px;font-weight:800;text-decoration:none;padding:15px 40px;border-radius:100px;letter-spacing:0.5px;box-shadow:0 8px 24px rgba(124,58,237,0.4);">
                  Reset My Password
                </a>
              </div>

              <p style="margin:0 0 12px;font-size:12px;color:#6b7280;line-height:1.6;">
                Or copy and paste this link into your browser:
              </p>
              <div style="background:#0d0d1a;border:1px solid #2a2a40;border-radius:10px;padding:12px 16px;word-break:break-all;">
                <a href="${resetLink}" style="color:#a78bfa;font-size:12px;text-decoration:none;">${resetLink}</a>
              </div>

              <p style="margin:24px 0 0;font-size:12px;color:#6b7280;line-height:1.6;">
                If you didn't request a password reset, please ignore this email — your account is safe and your password will not change.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2a2a40;text-align:center;">
              <p style="margin:0;font-size:11px;color:#4b5563;">
                © 2026 Tomar Kaj. All rights reserved.<br/>
                Automated security notification.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Hi ${userName},\n\nWe received a password reset request for your Tomar Kaj account.\n\nSecurity Reference Code: ${refCode}\n\nReset link (valid for 24 hours):\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\n— Tomar Kaj Team`;

  const transporter = getTransporter();

  if (!transporter) {
    console.error('❌ Cannot send email: SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are missing in environment variables.');
    throw new Error('Email service (SMTP) is not configured on this server. Please ensure SMTP_HOST, SMTP_USER, and SMTP_PASS are set in your environment variables (e.g. Render Dashboard).');
  }

  const info = await transporter.sendMail({
    from: `"Tomar Kaj" <${senderEmail}>`,
    replyTo,
    to: toEmail,
    subject,
    text,
    html,
  });

  return info;
}

module.exports = { sendPasswordResetEmail };
