const nodemailer = require('nodemailer');

// Uses Ethereal (fake SMTP) for dev — no config needed.
// Replace with real SMTP credentials in production via .env
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  } else {
    // Auto-create free Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    console.log('📧 Using Ethereal test email. Preview at: https://ethereal.email');
  }
  return transporter;
}

async function sendVoucherEmail({ to, name, brandName, couponCode, rupeesValue, pointsUsed, category }) {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: '"EcoManage 🌿" <noreply@ecomanage.gov.in>',
    to,
    subject: `🎁 Your ${brandName} Voucher – ₹${rupeesValue} | EcoManage`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#0f1117;color:#e6edf3;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#166534,#15803d);padding:2rem;text-align:center;">
          <h1 style="margin:0;font-size:1.8rem;">🌿 EcoManage</h1>
          <p style="margin:.5rem 0 0;opacity:.8;">Waste to Value – Green Rewards</p>
        </div>
        <div style="padding:2rem;">
          <h2 style="color:#4ade80;">Hi ${name}! Your voucher is here 🎉</h2>
          <p style="color:#8b949e;">You've redeemed <strong style="color:#4ade80;">${pointsUsed} green points</strong> for a <strong>${brandName}</strong> voucher worth <strong style="color:#4ade80;">₹${rupeesValue}</strong>.</p>
          
          <div style="background:#161b22;border:2px dashed #22c55e;border-radius:12px;padding:1.5rem;text-align:center;margin:1.5rem 0;">
            <p style="margin:0 0 .5rem;color:#8b949e;font-size:.85rem;">YOUR COUPON CODE</p>
            <h2 style="margin:0;font-size:2rem;letter-spacing:4px;color:#4ade80;font-family:monospace;">${couponCode}</h2>
            <p style="margin:.75rem 0 0;color:#8b949e;font-size:.8rem;">Valid for 30 days from issue</p>
          </div>

          <div style="background:#1c2333;border-radius:10px;padding:1rem 1.5rem;">
            <h3 style="margin:0 0 .75rem;font-size:.9rem;color:#8b949e;">VOUCHER DETAILS</h3>
            <table style="width:100%;font-size:.9rem;">
              <tr><td style="color:#8b949e;padding:.3rem 0;">Brand</td><td style="text-align:right;"><strong>${brandName}</strong></td></tr>
              <tr><td style="color:#8b949e;padding:.3rem 0;">Category</td><td style="text-align:right;">${category}</td></tr>
              <tr><td style="color:#8b949e;padding:.3rem 0;">Value</td><td style="text-align:right;color:#4ade80;"><strong>₹${rupeesValue}</strong></td></tr>
              <tr><td style="color:#8b949e;padding:.3rem 0;">Points Used</td><td style="text-align:right;">${pointsUsed} pts</td></tr>
            </table>
          </div>

          <p style="color:#8b949e;font-size:.8rem;margin-top:1.5rem;">Thank you for contributing to a greener planet! Keep recycling to earn more rewards.</p>
        </div>
        <div style="background:#161b22;padding:1rem 2rem;text-align:center;font-size:.75rem;color:#8b949e;">
          © 2024 EcoManage – Government of India Initiative
        </div>
      </div>
    `
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Email preview: ${previewUrl}`);
  }
  return { messageId: info.messageId, previewUrl };
}

module.exports = { sendVoucherEmail };
