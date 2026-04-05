const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const orderConfirmationEmail = (user, order) => ({
  subject: `✅ Order Confirmed — ${order.orderNumber} | Luxe Library`,
  html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f3ee;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#0d0d1a;padding:32px 40px;text-align:center;">
    <div style="font-size:28px;font-weight:700;letter-spacing:.15em;color:#fff;">✦ LUXE <span style="color:#c9a84c;">LIBRARY</span></div>
    <div style="color:#a0a0c0;font-size:12px;margin-top:6px;font-family:Arial,sans-serif;">WHERE KNOWLEDGE MEETS LUXURY</div>
  </div>
  <div style="background:#c9a84c;padding:20px 40px;text-align:center;">
    <div style="font-size:28px;margin-bottom:6px;">🎉</div>
    <div style="font-size:18px;font-weight:700;color:#000;">Order Placed Successfully!</div>
  </div>
  <div style="padding:36px 40px;">
    <p style="font-size:16px;color:#333;margin:0 0 8px;">Dear <strong>${user.name}</strong>,</p>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 28px;">
      Thank you for your order! We have received your request and our team will confirm it shortly.
    </p>
    <div style="background:#f9f7f2;border:1px solid #e8d9a0;border-radius:8px;padding:24px;margin-bottom:24px;">
      <div style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#c9a84c;margin-bottom:16px;font-family:Arial,sans-serif;">Order Details</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 14px;font-size:13px;color:#777;font-family:Arial,sans-serif;border-bottom:1px solid #eee;width:45%;">Order Number</td><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#c9a84c;border-bottom:1px solid #eee;font-family:monospace;">${order.orderNumber}</td></tr>
        <tr style="background:#f9f7f2;"><td style="padding:10px 14px;font-size:13px;color:#777;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">Member ID</td><td style="padding:10px 14px;font-size:13px;font-weight:600;border-bottom:1px solid #eee;">${user.membershipId || '—'}</td></tr>
        <tr><td style="padding:10px 14px;font-size:13px;color:#777;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">Total Amount</td><td style="padding:10px 14px;font-size:15px;font-weight:700;color:#c9a84c;border-bottom:1px solid #eee;">₹${(order.totalAmount||0).toLocaleString('en-IN')}</td></tr>
        <tr style="background:#f9f7f2;"><td style="padding:10px 14px;font-size:13px;color:#777;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">Payment</td><td style="padding:10px 14px;font-size:13px;font-weight:600;border-bottom:1px solid #eee;text-transform:uppercase;">${order.paymentMethod || '—'}</td></tr>
        <tr><td style="padding:10px 14px;font-size:13px;color:#777;font-family:Arial,sans-serif;">Status</td><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#b8860b;">⏳ Awaiting Confirmation</td></tr>
      </table>
    </div>
    ${order.items && order.items.length > 0 ? `
    <div style="margin-bottom:24px;">
      <div style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#c9a84c;margin-bottom:12px;font-family:Arial,sans-serif;">Books Ordered (${order.items.length})</div>
      ${order.items.map((item,i) => `
      <div style="padding:12px;background:${i%2===0?'#f9f7f2':'#fff'};border-radius:6px;margin-bottom:4px;display:flex;justify-content:space-between;">
        <div>
          <div style="font-size:14px;font-weight:600;color:#1a1a1a;">${item.title}</div>
          <div style="font-size:12px;color:#777;font-family:Arial,sans-serif;">by ${item.author||'—'} • Qty: ${item.quantity||1}</div>
        </div>
        <div style="font-size:14px;font-weight:700;color:#c9a84c;">₹${((item.price||0)*(item.quantity||1)).toLocaleString('en-IN')}</div>
      </div>`).join('')}
    </div>` : ''}
    <div style="background:#1a1a3a;border-radius:8px;padding:20px 24px;text-align:center;">
      <div style="font-size:13px;color:#c9a84c;font-weight:600;margin-bottom:8px;font-family:Arial,sans-serif;">📍 Visit Us To Collect Your Books</div>
      <div style="font-size:13px;color:#a0a0c0;line-height:1.8;font-family:Arial,sans-serif;">
        Atmanand Saraswati Science College, Kapodara, Surat — 395010<br/>
        📞 +91 96246 07410 &nbsp;|&nbsp; 🕐 Mon–Sat: 9AM – 8PM
      </div>
    </div>
  </div>
  <div style="background:#0d0d1a;padding:20px 40px;text-align:center;">
    <div style="font-size:11px;color:#555;font-family:Arial,sans-serif;">© 2026 Luxe Library. All rights reserved.</div>
  </div>
</div>
</body></html>`
});

const contactNotificationEmail = (name, email, phone, message) => ({
  subject: `📩 New Contact Query from ${name} — Luxe Library`,
  html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f3ee;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#0d0d1a;padding:28px 40px;text-align:center;">
    <div style="font-size:24px;font-weight:700;color:#fff;">✦ LUXE <span style="color:#c9a84c;">LIBRARY</span></div>
    <div style="color:#a0a0c0;font-size:11px;margin-top:4px;font-family:Arial,sans-serif;">New Contact Form Submission</div>
  </div>
  <div style="background:#c9a84c;padding:14px 40px;">
    <div style="font-size:16px;font-weight:700;color:#000;">📩 Someone sent you a message!</div>
  </div>
  <div style="padding:32px 40px;">
    <div style="background:#f9f7f2;border:1px solid #e8d9a0;border-radius:8px;padding:24px;margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#c9a84c;margin-bottom:14px;font-family:Arial,sans-serif;">Sender Details</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 14px;font-size:13px;color:#777;font-family:Arial,sans-serif;border-bottom:1px solid #eee;width:30%;">Name</td><td style="padding:10px 14px;font-size:13px;font-weight:600;border-bottom:1px solid #eee;">${name}</td></tr>
        <tr style="background:#f9f7f2;"><td style="padding:10px 14px;font-size:13px;color:#777;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">Email</td><td style="padding:10px 14px;font-size:13px;font-weight:600;border-bottom:1px solid #eee;"><a href="mailto:${email}" style="color:#c9a84c;">${email}</a></td></tr>
        <tr><td style="padding:10px 14px;font-size:13px;color:#777;font-family:Arial,sans-serif;">Phone</td><td style="padding:10px 14px;font-size:13px;font-weight:600;">${phone || 'Not provided'}</td></tr>
      </table>
    </div>
    <div style="background:#1a1a3a;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#c9a84c;margin-bottom:10px;font-family:Arial,sans-serif;">Message</div>
      <div style="font-size:14px;color:#e0e0f0;line-height:1.8;">${message}</div>
    </div>
    <div style="padding:14px;background:#f0f8f0;border-radius:6px;border:1px solid #c3e6cb;">
      <div style="font-size:13px;color:#1e7a4e;font-family:Arial,sans-serif;">💡 Reply directly to: <a href="mailto:${email}" style="color:#c9a84c;font-weight:600;">${email}</a></div>
    </div>
  </div>
  <div style="background:#0d0d1a;padding:16px 40px;text-align:center;">
    <div style="font-size:11px;color:#555;font-family:Arial,sans-serif;">© 2026 Luxe Library</div>
  </div>
</div>
</body></html>`
});

const forgotPasswordEmail = (user, resetLink) => ({
  subject: `🔐 Reset Your Password — Luxe Library`,
  html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f3ee;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#0d0d1a;padding:28px 40px;text-align:center;">
    <div style="font-size:24px;font-weight:700;color:#fff;">✦ LUXE <span style="color:#c9a84c;">LIBRARY</span></div>
  </div>
  <div style="background:#c9a84c;padding:14px 40px;text-align:center;">
    <div style="font-size:16px;font-weight:700;color:#000;">🔐 Password Reset Request</div>
  </div>
  <div style="padding:36px 40px;text-align:center;">
    <div style="font-size:48px;margin-bottom:16px;">🔑</div>
    <h2 style="font-size:22px;color:#1a1a1a;margin:0 0 12px;font-family:Georgia,serif;">Reset Your Password</h2>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 28px;font-family:Arial,sans-serif;">
      Hello <strong>${user.name}</strong>, we received a request to reset your Luxe Library password.<br/>
      Click the button below. This link expires in <strong>1 hour</strong>.
    </p>
    <a href="${resetLink}" style="display:inline-block;padding:14px 40px;background:#c9a84c;color:#000;font-weight:700;font-size:15px;text-decoration:none;border-radius:6px;letter-spacing:.05em;font-family:Arial,sans-serif;">
      Reset My Password →
    </a>
    <p style="font-size:12px;color:#999;margin-top:24px;font-family:Arial,sans-serif;">
      If you did not request this, please ignore this email. Your password will remain unchanged.
    </p>
    <div style="margin-top:16px;padding:12px;background:#f9f7f2;border-radius:6px;word-break:break-all;text-align:left;">
      <div style="font-size:10px;color:#999;font-family:Arial,sans-serif;margin-bottom:4px;">Or copy this link:</div>
      <div style="font-size:11px;color:#c9a84c;font-family:monospace;">${resetLink}</div>
    </div>
  </div>
  <div style="background:#0d0d1a;padding:16px 40px;text-align:center;">
    <div style="font-size:11px;color:#555;font-family:Arial,sans-serif;">© 2026 Luxe Library &nbsp;|&nbsp; Link expires in 1 hour</div>
  </div>
</div>
</body></html>`
});

const sendOrderConfirmation = async (user, order) => {
  try {
    const transporter = createTransporter();
    const { subject, html } = orderConfirmationEmail(user, order);
    await transporter.sendMail({ from: `"Luxe Library" <${process.env.EMAIL_USER}>`, to: user.email, subject, html });
    console.log(`✅ Order email sent to ${user.email}`);
  } catch (err) { console.error('Email error:', err.message); }
};

const sendContactNotification = async (name, email, phone, message) => {
  try {
    const transporter = createTransporter();
    const { subject, html } = contactNotificationEmail(name, email, phone, message);
    await transporter.sendMail({
      from: `"Luxe Library Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject, html, replyTo: email,
    });
    console.log(`✅ Contact email sent`);
  } catch (err) { console.error('Email error:', err.message); }
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  const transporter = createTransporter();
  const { subject, html } = forgotPasswordEmail(user, resetLink);
  await transporter.sendMail({ from: `"Luxe Library" <${process.env.EMAIL_USER}>`, to: user.email, subject, html });
  console.log(`✅ Reset email sent to ${user.email}`);
  return resetLink;
};

// ── STATUS UPDATES EMAIL ──
const orderStatusEmailTemplate = (user, order) => {
  const statusLabels = {
    confirmed: 'Confirmed! ✅',
    processing: 'Processing ⚙️',
    ready: 'Ready for Collection 📦',
    completed: 'Completed 🎉',
    cancelled: 'Cancelled ❌'
  };
  
  const statusMsg = statusLabels[order.orderStatus] || order.orderStatus;
  
  return {
    subject: `Order Update: ${statusMsg} — ${order.orderNumber}`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f3ee;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#0d0d1a;padding:28px 40px;text-align:center;">
    <div style="font-size:24px;font-weight:700;color:#fff;">✦ LUXE <span style="color:#c9a84c;">LIBRARY</span></div>
  </div>
  <div style="background:#c9a84c;padding:14px 40px;text-align:center;">
    <div style="font-size:16px;font-weight:700;color:#000;">Order Status Update</div>
  </div>
  <div style="padding:36px 40px;">
    <p style="font-size:16px;color:#333;">Dear <strong>${user.name}</strong>,</p>
    <p style="font-size:14px;color:#555;line-height:1.7;">
      The status of your order <strong>${order.orderNumber}</strong> has been updated to:
    </p>
    <div style="background:#f9f7f2;border:1px solid #e8d9a0;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
      <div style="font-size:22px;color:#c9a84c;font-weight:700;">${statusMsg}</div>
    </div>
    ${order.adminNote ? `
    <div style="background:#f0f8f0;border-left:4px solid #5acea0;padding:12px 16px;margin-bottom:24px;">
      <div style="font-size:12px;color:#555;font-weight:600;margin-bottom:4px;">Note from Admin:</div>
      <div style="font-size:14px;color:#333;">"${order.adminNote}"</div>
    </div>` : ''}
    <div style="background:#1a1a3a;border-radius:8px;padding:20px 24px;text-align:center;">
      <div style="font-size:13px;color:#c9a84c;font-weight:600;margin-bottom:8px;font-family:Arial,sans-serif;">Login to view your full order details.</div>
    </div>
  </div>
</div>
</body></html>`
  };
};

const sendOrderStatusEmail = async (user, order) => {
  try {
    const transporter = createTransporter();
    const { subject, html } = orderStatusEmailTemplate(user, order);
    await transporter.sendMail({ from: `"Luxe Library Updates" <${process.env.EMAIL_USER}>`, to: user.email, subject, html });
    console.log(`✅ Status update email sent to ${user.email} (${order.orderStatus})`);
  } catch (err) { console.error('Status Email error:', err.message); }
};

module.exports = { sendOrderConfirmation, sendContactNotification, sendPasswordResetEmail, sendOrderStatusEmail };