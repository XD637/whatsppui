import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    console.log('email:', email);
    console.log('otp:', otp);

    if (!email || !otp) {
      return Response.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('users query result:', users);

    if (users.length === 0) {
      return Response.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const userId = users[0].userid; // <---- use userid, not id

    const otps = await query(
      'SELECT * FROM otpverification WHERE userid = ? AND otp_code = ? AND type = ? AND used = 0 AND expires_at > NOW()',
      [userId, otp, 'verify']
    );

    if (otps.length === 0) {
      return Response.json({ success: false, message: 'Invalid or expired OTP' }, { status: 400 });
    }

    await query('UPDATE otpverification SET used = 1 WHERE id = ?', [otps[0].id]);
    await query('UPDATE users SET is_verified = 1 WHERE userid = ?', [userId]); // <---- use userid here too

    return Response.json({ success: true, message: 'OTP verified' });

  } catch (err) {
    console.error('ERROR in /verify-otp:', err);
    return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
