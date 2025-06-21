// /app/api/notifications/save/route.js
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const { userId, title, description, chatId, messageId } = await req.json();
    if (!userId || !title) {
      return Response.json({ success: false, message: "Missing fields" }, { status: 400 });
    }
    await query(
      'INSERT INTO notifications (user_id, title, description, chat_id, message_id) VALUES (?, ?, ?, ?, ?)',

      [
        userId,
        title,
        description,
        chatId === undefined ? null : chatId,
        messageId === undefined ? null : messageId,
      ]
    );
    return Response.json({ success: true });
  } catch (error) {
    console.error("Notification save error:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
