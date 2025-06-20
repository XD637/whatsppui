import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const { email, otp, type = "verify" } = await req.json();

    if (!email || !otp) {
      return Response.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return Response.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const userId = users[0].userid;

    const otps = await query(
      'SELECT * FROM otpverification WHERE userid = ? AND otp_code = ? AND type = ? AND used = 0 AND expires_at > NOW()',
      [userId, otp, type]
    );

    if (otps.length === 0) {
      return Response.json({ success: false, message: 'Invalid or expired OTP' }, { status: 400 });
    }

    if (type === "verify") {
      await query('UPDATE otpverification SET used = 1 WHERE id = ?', [otps[0].id]);
      await query('UPDATE users SET is_verified = 1 WHERE userid = ?', [userId]);
      await query('DELETE FROM otpverification WHERE userid = ? AND type = ?', [userId, type]);
    }
    // For type === "reset", do NOT mark as used here!

    return Response.json({ success: true, message: 'OTP verified' });

  } catch (err) {
    console.error('ERROR in /verify-otp:', err);
    return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
