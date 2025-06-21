import { query } from '@/lib/db';

export async function POST(req) {
  const { userId } = await req.json();
  if (!userId) {
    return Response.json({ success: false, message: "Missing userId" }, { status: 400 });
  }
  await query('UPDATE notifications SET cleared = 1 WHERE user_id = ?', [userId]);
  return Response.json({ success: true });
}