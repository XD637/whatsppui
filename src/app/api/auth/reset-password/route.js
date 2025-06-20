import { query } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return Response.json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const userId = users[0].userid;

    const otps = await query(
      'SELECT * FROM otpverification WHERE userid = ? AND otp_code = ? AND type = ? AND used = 0 AND expires_at > NOW()',
      [userId, otp, 'reset']
    );

    if (otps.length === 0) {
      return Response.json({ success: false, message: "Invalid or expired OTP" }, { status: 400 });
    }

    await query('UPDATE otpverification SET used = 1 WHERE id = ?', [otps[0].id]);
    await query('DELETE FROM otpverification WHERE userid = ? AND type = ?', [userId, 'reset']);

    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = ? WHERE userid = ?', [hash, userId]);

    return Response.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}