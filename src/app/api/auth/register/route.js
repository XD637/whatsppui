import { query } from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendEmail } from '@/lib/client';

export async function POST(req) {
  try {
    const { username, email, password, userId } = await req.json();

    // Check if username, email, or userId already exist
    const exists = await query(
      'SELECT * FROM users WHERE email = ? OR username = ? OR uuid = ?',
      [email, username, userId]
    );
    
    if (exists.length > 0) {
      return Response.json({ message: 'Username, email, or User ID already exists' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    // First insert without uuid
    const result = await query(
      'INSERT INTO users (username, email, password, is_verified, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hash, 0, 'user']
    );

    const insertedUserId = result.insertId;

    // Now update the uuid field with the given userId (which is like a custom ID you're setting)
    await query(
      'UPDATE users SET uuid = ? WHERE id = ?',
      [userId, insertedUserId]
    );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      'INSERT INTO otpverification (userid, otp_code, type, expires_at, used) VALUES (?, ?, ?, ?, ?)',
      [insertedUserId, otp, 'verify', expiresAt, 0]
    );

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

    return Response.json({
      success: true,
      message: 'User registered. OTP sent.',
      userId: insertedUserId,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
