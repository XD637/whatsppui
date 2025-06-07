import { query } from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendEmail } from '@/lib/client'; // ← add this

export async function POST(req) {
  try {
    const { username, email, password } = await req.json();

    const exists = await query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (exists.length > 0) {
      return Response.json({ message: 'Username or email already exists' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, email, password, is_verified, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hash, 0, 'user']
    );

    const userId = result.insertId;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await query(
      'INSERT INTO otpverification (userid, otp_code, type, expires_at, used) VALUES (?, ?, ?, ?, ?)',
      [userId, otp, 'verify', expiresAt, 0]
    );

    // Send the OTP email
    const subject = "Your Sporada OTP Verification Code";
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome to Sporada Secure</h2>
        <p>Your OTP code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px;">${otp}</h1>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <br>
        <p>Didn't request this? Just ignore this email.</p>
        <hr />
        <p style="font-size: 12px; color: gray;">Sporada Secure</p>
      </div>
    `;

    await sendEmail(email, subject, html);

    return Response.json({ success: true, message: 'User registered. OTP sent.', userId });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
