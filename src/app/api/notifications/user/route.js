import { query } from '@/lib/db';

export async function POST(req) {
  const { userId } = await req.json();
  if (!userId) {
    return Response.json({ success: false, message: "Missing userId" }, { status: 400 });
  }
  const rows = await query(
    'SELECT * FROM notifications WHERE user_id = ? AND cleared = 0 ORDER BY created_at DESC',
    [userId]
  );
  return Response.json({ success: true, notifications: rows });
}