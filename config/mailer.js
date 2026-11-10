const nodemailer = require('nodemailer');
require('dotenv').config();

const emailUser = process.env.EMAIL_USER || 'midhunrs727@gmail.com';
const rawPass = process.env.EMAIL_PASS || process.env.EMAIL_PASS_SPACED || 'mwdo klwl qkrp rxsy';
// Clean app password (remove spaces if any)
const emailPass = rawPass.replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Send 6-Digit OTP verification code to user email
 */
async function sendOtpVerificationEmail(email, otp, name = 'Art Collector') {
  try {
    const mailOptions = {
      from: `"Midhun Pencil Portraits" <${emailUser}>`,
      to: email,
      subject: `Your Account Verification Code: ${otp}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #0f1217; color: #f1f5f9; border-radius: 12px; overflow: hidden; border: 1px solid #272f3d;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #181d24, #242c38); padding: 28px; text-align: center; border-bottom: 2px solid #d4af37;">
            <h1 style="margin: 0; color: #d4af37; font-size: 24px; letter-spacing: 2px;">MIDHUN PENCIL PORTRAITS</h1>
            <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Fine Handcrafted Pencil & Charcoal Art Studio</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px 28px; text-align: center;">
            <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Verify Your Email Address</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              Hello ${name}, thank you for registering with Midhun Pencil Portraits. Use the one-time verification code below to confirm your account:
            </p>

            <!-- 6-Digit OTP Box -->
            <div style="background: #14171d; border: 2px dashed #d4af37; border-radius: 10px; padding: 20px 30px; display: inline-block; margin: 10px 0 24px;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #f3d068; display: block;">${otp}</span>
            </div>

            <p style="color: #64748b; font-size: 12px; margin: 16px 0 0;">
              <i style="color: #f59e0b;">⏳ This code will expire in 10 minutes.</i><br>
              If you did not request this verification, please safely ignore this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #090b0e; padding: 18px; text-align: center; border-top: 1px solid #1c2028; font-size: 11px; color: #64748b;">
            <p style="margin: 0 0 4px;">Midhun Pencil Portraits Studio | Ernakulam, Kerala</p>
            <p style="margin: 0;">Official Studio Contact: <a href="mailto:${emailUser}" style="color: #d4af37; text-decoration: none;">${emailUser}</a></p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification OTP email sent to ${email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Nodemailer error sending verification OTP:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send order confirmation email to customer with attached PDF invoice
 */
async function sendOrderConfirmationEmail(order, pdfBuffer) {
  try {
    const mailOptions = {
      from: `"Midhun Pencil Portraits Studio" <${emailUser}>`,
      to: order.customer_email,
      subject: `Order Confirmed! Your Custom Pencil Portrait [#${order.order_number}]`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #121212; color: #f0f0f0; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
          <div style="background: linear-gradient(135deg, #1f1f1f, #2d2d2d); padding: 30px; text-align: center; border-bottom: 2px solid #d4af37;">
            <h1 style="margin: 0; color: #d4af37; font-size: 26px; letter-spacing: 2px;">MIDHUN PENCIL PORTRAITS</h1>
            <p style="margin: 5px 0 0 0; color: #aaa; font-size: 14px;">Fine Art & Handcrafted Realistic Sketches</p>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Thank you for your order, ${order.customer_name}!</h2>
            <p style="color: #cccccc; line-height: 1.6;">
              We have received your custom pencil portrait commission. Your reference photograph has been handed over to the artist, and work will begin promptly.
            </p>
            
            <div style="background: #1e1e1e; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #d4af37;">
              <h3 style="margin: 0 0 12px 0; color: #d4af37; font-size: 16px;">ORDER SUMMARY</h3>
              <p style="margin: 4px 0; color: #ddd;"><strong>Order Number:</strong> #${order.order_number}</p>
              <p style="margin: 4px 0; color: #ddd;"><strong>Medium:</strong> ${order.portrait_medium}</p>
              <p style="margin: 4px 0; color: #ddd;"><strong>Size:</strong> ${order.portrait_size}</p>
              <p style="margin: 4px 0; color: #ddd;"><strong>Number of Faces:</strong> ${order.num_faces}</p>
              <p style="margin: 4px 0; color: #ddd;"><strong>Framing:</strong> ${order.frame_type}</p>
              <p style="margin: 4px 0; color: #ddd;"><strong>Total Amount:</strong> <span style="color: #4ade80; font-weight: bold; font-size: 18px;">₹${order.total_amount.toLocaleString()}</span></p>
              <p style="margin: 4px 0; color: #ddd;"><strong>Payment Status:</strong> <span style="background: #14532d; color: #86efac; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${order.payment_status}</span></p>
            </div>

            <div style="background: #1e1e1e; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 10px 0; color: #d4af37; font-size: 16px;">DELIVERY ADDRESS</h3>
              <p style="margin: 2px 0; color: #ccc;">${order.customer_name}</p>
              <p style="margin: 2px 0; color: #ccc;">${order.shipping_address}</p>
              <p style="margin: 2px 0; color: #ccc;">${order.city}, ${order.state} - ${order.pincode}</p>
              <p style="margin: 2px 0; color: #ccc;">Phone: ${order.customer_phone}</p>
            </div>

            <p style="color: #999; font-size: 13px; line-height: 1.5;">
              Your official tax invoice & receipt is attached as a PDF to this email. You may also view and download it directly from your account anytime.
            </p>
          </div>

          <div style="background: #181818; padding: 20px; text-align: center; border-top: 1px solid #282828; color: #777; font-size: 12px;">
            <p style="margin: 0 0 6px 0;">Midhun Pencil Portraits Studio | Hand-sketched with Passion</p>
            <p style="margin: 0;">Contact: <a href="mailto:${emailUser}" style="color: #d4af37; text-decoration: none;">${emailUser}</a></p>
          </div>
        </div>
      `,
      attachments: pdfBuffer ? [
        {
          filename: `Invoice_${order.order_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Nodemailer error sending customer confirmation:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Notify Admin when a new order/commission is placed
 */
async function sendAdminNewOrderAlert(order) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || emailUser;
    const mailOptions = {
      from: `"Studio System" <${emailUser}>`,
      to: adminEmail,
      subject: `🎨 NEW COMMISSION ALERT: Order #${order.order_number} by ${order.customer_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; border-radius: 8px;">
          <h2 style="color: #f59e0b; margin-top: 0;">New Pencil Portrait Order Placed!</h2>
          <p>A new client has commissioned a portrait on your studio website.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; color: #e2e8f0;">
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px;"><strong>Order ID:</strong></td><td style="padding: 8px;">#${order.order_number}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px;"><strong>Client:</strong></td><td style="padding: 8px;">${order.customer_name} (${order.customer_email})</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px;"><strong>Phone:</strong></td><td style="padding: 8px;">${order.customer_phone}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px;"><strong>Medium:</strong></td><td style="padding: 8px;">${order.portrait_medium}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px;"><strong>Size:</strong></td><td style="padding: 8px;">${order.portrait_size}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px;"><strong>Faces:</strong></td><td style="padding: 8px;">${order.num_faces}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px;"><strong>Framing:</strong></td><td style="padding: 8px;">${order.frame_type}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px;"><strong>Total:</strong></td><td style="padding: 8px; color: #10b981; font-weight: bold;">₹${order.total_amount}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px;"><strong>Payment Status:</strong></td><td style="padding: 8px;">${order.payment_status} (${order.payment_method})</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px;"><strong>Delivery Location:</strong></td><td style="padding: 8px;">${order.city}, ${order.state} - ${order.pincode}</td></tr>
            <tr><td style="padding: 8px;"><strong>Special Notes:</strong></td><td style="padding: 8px;">${order.special_instructions || 'None'}</td></tr>
          </table>

          <div style="margin-top: 24px;">
            <p>Log in to your Admin Dashboard to view the uploaded reference photograph and manage this commission.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Admin alert email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Nodemailer error sending admin alert:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  transporter,
  sendOtpVerificationEmail,
  sendOrderConfirmationEmail,
  sendAdminNewOrderAlert
};
