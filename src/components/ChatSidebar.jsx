"use client";
import React, { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

export default function ChatSidebar({ onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://192.168.0.169:4444/api/chat-list");
      const data = await res.json();
      if (data.success) {
        setChats(data.chats);
      }
    } catch (err) {
      console.error("Failed to fetch chats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <aside className="w-[20%] border-r border-gray-300 bg-white flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-300 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#075E54]">Chats</h2>
        <button
          onClick={fetchChats}
          className={`text-[#075E54] hover:text-[#0b8b77] transition-all ${
            loading ? "animate-spin" : ""
          }`}
          title="Refresh"
        >
          <FiRefreshCw size={20} />
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => {
          // Show caption for media if present, else show type, else show body
          let previewMsg = null;
          if (chat.lastMessage) {
            if (
              (chat.lastMessage.type === "image" ||
                chat.lastMessage.type === "video" ||
                chat.lastMessage.type === "document" ||
                chat.lastMessage.type === "audio") &&
              chat.lastMessage.body // body is caption in your API
            ) {
              previewMsg = chat.lastMessage.body;
            } else if (
              chat.lastMessage.type === "image" ||
              chat.lastMessage.type === "video" ||
              chat.lastMessage.type === "audio" ||
              chat.lastMessage.type === "document"
            ) {
              previewMsg = `[${chat.lastMessage.type.charAt(0).toUpperCase() + chat.lastMessage.type.slice(1)}]`;
            } else {
              previewMsg = chat.lastMessage.body;
            }
          }

          const previewTime = chat.lastMessage?.timestamp || null;

          return (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className="flex items-center gap-5 px-4 py-3 hover:bg-[#D9FDD3] cursor-pointer transition-all border-b border-gray-200"
            >
              {/* Profile Icon with unread badge */}
              <div className="relative w-10 h-10 bg-[#cfd8dc] rounded-full flex items-center justify-center text-gray-700 font-semibold text-sm">
                {chat.name?.[0]?.toUpperCase() || "?"}
                {chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#25D366] text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center border border-white">
                    {chat.unreadCount}
                  </span>
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {chat.name || chat.id}
                </div>
                <div className="text-xs text-[#075E54] font-semibold truncate">
                  {previewMsg ? (
                    previewMsg
                  ) : (
                    <i className="text-[#075E54] font-semibold">No messages yet</i>
                  )}
                </div>
                {previewTime && (
                  <div className="text-[10px] text-gray-400">
                    {new Date(previewTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* If no chats are found */}
        {chats.length === 0 && (
          <div className="p-4 text-sm text-gray-500 italic text-center">
            No chats available
          </div>
        )}
      </div>
    </aside>
  );
}
