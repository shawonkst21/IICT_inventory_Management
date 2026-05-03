const nodemailer = require('nodemailer');

function getMailerConfig() {
  const host = process.env.EMAIL_HOST;
  const port = Number.parseInt(process.env.EMAIL_PORT || '587', 10);
  const secure = (process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  if (!host || !user || !pass || !from) {
    throw new Error(
      'Email configuration is missing. Set EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM.'
    );
  }

  return {
    transport: {
      host,
      port,
      secure,
      auth: { user, pass },
    },
    from,
  };
}

async function sendOtpEmail(to, otpCode, expiryMinutes) {
  const { transport, from } = getMailerConfig();
  const transporter = nodemailer.createTransport(transport);

  const appName = process.env.APP_NAME || 'IICT Inventory';

  await transporter.sendMail({
    from,
    to,
    subject: `${appName} - Verify your email`,
    text: `Your OTP is ${otpCode}. It expires in ${expiryMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2 style="margin-bottom: 8px;">Verify your email</h2>
        <p style="margin-top: 0;">Use this OTP to verify your ${appName} account:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${otpCode}</div>
        <p>This OTP expires in ${expiryMinutes} minutes.</p>
        <p style="color: #666; font-size: 13px;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

module.exports = {
  sendOtpEmail,
};
