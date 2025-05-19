"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ChatWindow({ selectedChat }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat?.id) return;

      setLoading(true);
      try {
        const res = await fetch(
          `http://192.168.0.169:4444/api/chat-messages?chatId=${encodeURIComponent(selectedChat.id)}`
        );
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000); // seconds to ms
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSend = async () => {
    if (!messageText.trim()) return toast.error("Can't send empty message!");

    if (!selectedChat?.id) return toast.error("No chat selected!");

    try {
      const payload = {
        chatId: selectedChat.id,
        messageText: messageText.trim(),
      };

      const res = await fetch("http://192.168.0.169:4444/api/send-text-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        // Update local messages state immediately with the new message
        const newMessage = {
          id: Date.now(), // temp id, better if API returns one
          body: messageText.trim(),
          from: selectedChat.id, // assuming you sent it from this chat id
          author: "me", // your client/user indicator
          timestamp: Math.floor(Date.now() / 1000), // current time in seconds
        };

        setMessages((prev) => [...prev, newMessage]);
        setMessageText("");
        toast.success("Message sent via WhatsApp server!");
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Send message error", error);
      toast.error("Error sending message");
    }
  };

  return (
    <main className="w-[55%] p-4 bg-[#FFFFFF] flex flex-col justify-between border-r border-gray-300">
      <div className="text-lg font-bold border-b pb-6 mb-6 text-[#075E54]">
        {selectedChat?.name || "Select a chat"}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {loading ? (
          <div className="text-gray-500 text-sm">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500 text-sm">No messages found</div>
        ) : (
          messages.map((msg) => {
            const isSender =
              msg.from === selectedChat.id || msg.author === "me";

            return (
              <div
                key={msg.id}
                className={`max-w-[70%] px-4 py-2 rounded-lg text-sm relative ${
                  isSender
                    ? "bg-[#DCF8C6] self-end ml-auto"
                    : "bg-[#F0F0F0] self-start"
                }`}
              >
                <div>{msg.body || <i>[Media message]</i>}</div>
                <div className="text-[11px] text-gray-500 mt-1 text-right">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          placeholder="Type a message..."
          className="rounded-full"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          className="bg-[#25D366] text-white hover:bg-[#20bd5c] rounded-full px-6"
          onClick={handleSend}
        >
          Send
        </Button>
      </div>
    </main>
  );
}
