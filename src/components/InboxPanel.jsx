"use client";
import React, { useEffect, useState } from "react";
import { useWebSocket } from "@/context/WebSocketContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, X } from "lucide-react";

// Your own full WhatsApp IDs
const myFullIds = [
  "917399750001@c.us",
  "917708238586@c.us",
  "916383629157@c.us",
];

// Check if a message is from a group chat
function isGroup(msg) {
  return msg.chatId?.endsWith("@g.us");
}

// Extract actual sender for group messages
function getSenderFromGroupMessageId(messageId) {
  if (!messageId) return null;
  const parts = messageId.split("_");
  return parts[parts.length - 1]; // This is usually the actual sender
}

// Final filtering logic
function shouldShowInInbox(msg) {
  // Exclude WhatsApp Status
  if (msg.chatId === "status@broadcast") return false;

  const group = isGroup(msg);

  if (!group) return true; // Always show direct messages

  const sender = getSenderFromGroupMessageId(msg.messageId);

  const isFromMe = myFullIds.includes(sender);
  console.log("Filter check:", {
    chatId: msg.chatId,
    messageId: msg.messageId,
    sender,
    isGroup: group,
    isFromMe,
  });

  return !isFromMe;
}

export default function InboxPanel({ setSelectedChat }) {
  const socketRef = useWebSocket();
  const [inbox, setInbox] = useState([]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;

    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "NEW_MESSAGE") {
          const msg = message.data;

          if (shouldShowInInbox(msg)) {
            setInbox((prev) => [
              {
                ...msg,
                receivedAt: Date.now(),
              },
              ...prev,
            ]);
          }
        }
      } catch (err) {
        console.error("InboxPanel WS parse error:", err);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socketRef]);

  const handleClear = () => setInbox([]);
  const handleRemove = (idx) => {
    setInbox((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <aside className="w-[25%] p-4 bg-[#ECE5DD] flex flex-col h-full">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <span className="text-lg font-bold text-[#075E54]">Inbox</span>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:bg-gray-50"
          onClick={handleClear}
          title="Clear Inbox"
          disabled={inbox.length === 0}
        >
          <Trash2 size={18} />
        </Button>
      </div>
      <ScrollArea className="flex-1 max-h-[80vh] pr-2">
        {inbox.length === 0 ? (
          <div className="text-gray-500 text-sm text-center mt-10">
            No messages yet.
          </div>
        ) : (
          <div className="space-y-3">
            {inbox.map((msg, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 relative cursor-pointer hover:bg-[#e7fbe9] transition"
                onClick={() => {
                  setSelectedChat &&
                    setSelectedChat({
                      id: msg.chatId,
                      name: msg.group || msg.from,
                      isGroup: isGroup(msg),
                    });
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[#075E54] truncate max-w-[140px]">
                    {msg.from}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 text-gray-400 hover:text-gray-500"
                    onClick={() => handleRemove(idx)}
                    title="Remove"
                  >
                    <X size={16} />
                  </Button>
                </div>
                <div className="text-gray-700 text-sm break-words">
                  {msg.body}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
