import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return Response.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const userId = users[0].userid;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      'INSERT INTO otpverification (userid, otp_code, type, expires_at, used) VALUES (?, ?, ?, ?, ?)',
      [userId, otp, 'reset', expiresAt, 0]
    );

    // Send OTP via email
    const subject = "Your Password Reset OTP";
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Your OTP code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px;">${otp}</h1>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <br>
        <p>If you did not request this, just ignore this email.</p>
        <hr />
        <p style="font-size: 12px; color: gray;">Sporada Secure</p>
      </div>
    `;
    // You must have sendEmail in your lib/client.js
    const { sendEmail } = await import('@/lib/client');
    await sendEmail(email, subject, html);

    return Response.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}