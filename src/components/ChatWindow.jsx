"use client";
import React, { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react"; // If you have lucide-react or use any plus icon
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // Add at the top

export default function ChatWindow({ selectedChat }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat?.id) return;

      setLoading(true);
      try {
        const res = await fetch(
          `http://192.168.0.169:4444/api/chat-messages?chatId=${encodeURIComponent(
            selectedChat.id
          )}`
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
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 16) {
      toast.error("File size exceeds 16MB limit!");
      e.target.value = null;
      setMediaFile(null);
    } else {
      setMediaFile(file);
      toast.success(`Selected: ${file.name}`);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() && !mediaFile) {
      return toast.error("Can't send empty message!");
    }
    if (!selectedChat?.id) return toast.error("No chat selected!");

    // If media is selected, use /upload-media
    if (mediaFile) {
      try {
        const formData = new FormData();
        formData.append("media", mediaFile);
        formData.append("chatId", selectedChat.id);
        formData.append("caption", messageText.trim());

        const res = await fetch("http://192.168.0.169:4444/upload-media", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.success) {
          // Add the new message to local state immediately
          const newMessage = {
            id: Date.now().toString(),
            body: messageText.trim() || "[Media message]",
            from: selectedChat.id,
            author: "me",
            timestamp: Date.now(),
            sent: 1,
          };
          setMessages((prev) => [...prev, newMessage]);
          setMessageText("");
          setMediaFile(null);
          toast.success("Media sent!");
        } else {
          toast.error("Failed to send media");
        }
      } catch (error) {
        console.error("Send media error", error);
        toast.error("Error sending media");
      }
      return;
    }

    // If no media, use text API as before
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
        const newMessage = {
          id: Date.now().toString(),
          body: messageText.trim(),
          from: selectedChat.id,
          author: "me",
          timestamp: Date.now(),
          sent: 1,
        };

        setMessages((prev) => [...prev, newMessage]);
        setMessageText("");
        toast.success("Message sent!");
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Send message error", error);
      toast.error("Error sending message");
    }
  };

  return (
    <main className="w-[55%] p-4 bg-white flex flex-col justify-between border-r border-gray-300">
      <div className="text-lg font-bold border-b pb-6 mb-6 text-[#075E54]">
        {selectedChat?.name || "Select a chat"}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <AiOutlineLoading3Quarters className="animate-spin text-3xl text-[#075E54]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500 text-sm">No messages found</div>
        ) : (
          messages.map((msg) => {
            const isSender = msg.sent === 1;
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

      <div className="mt-4 flex gap-2 items-center">
        {/* Plus button for media upload */}
        <Button
          type="button"
          className="rounded-full p-0 w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300"
          onClick={() => fileInputRef.current.click()}
          title="Attach media"
        >
          <Plus className="w-6 h-6 text-[#075E54]" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*,video/*,application/pdf"
          onChange={handleMediaChange}
        />
        <Input
          placeholder="Type a message..."
          className="rounded-full flex-1 min-h-[48px] text-base"
          style={{ height: "48px" }}
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
          className="bg-[#25D366] text-white hover:bg-[#20bd5c] rounded-full px-6 h-12"
          onClick={handleSend}
        >
          Send
        </Button>
      </div>
      {mediaFile && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-700 truncate">
            Selected: {mediaFile.name}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMediaFile(null)}
            className="text-red-500"
            title="Remove"
          >
            ×
          </Button>
        </div>
      )}
    </main>
  );
}
