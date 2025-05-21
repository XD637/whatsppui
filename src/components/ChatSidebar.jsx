"use client";
import React, { useEffect, useState } from "react";
import { FiRefreshCw, FiSearch } from "react-icons/fi";

export default function ChatSidebar({ onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedChatId, setSelectedChatId] = useState(null);

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
    const interval = setInterval(fetchChats, 60000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Auto-select first chat only if none is selected
  useEffect(() => {
    if (chats.length > 0 && !selectedChatId) {
      const first = chats[0];
      setSelectedChatId(first.id);
      onSelectChat(first);
    }
  }, [chats]);

  // Filter chats by search (case-insensitive, chat name only, matches any word)
  const filteredChats = chats.filter(chat => {
    const name = (chat.name || "").toLowerCase().trim();
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return true;
    return searchTerm
      .split(/\s+/)
      .every(word => name.includes(word));
  });

  return (
    <aside className="w-[20%] border-r border-gray-300 bg-white flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-300 mb-4 flex justify-between items-center">
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

      {/* Search Bar */}
      <div className="px-4 mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <FiSearch size={18} />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-3 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#25D366] bg-gray-100 text-sm"
            placeholder="Search chats..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map(chat => {
          let previewMsg = null;
          if (chat.lastMessage) {
            if (
              ["image", "video", "document", "audio"].includes(chat.lastMessage.type)
            ) {
              previewMsg = chat.lastMessage.body
                ? chat.lastMessage.body
                : `[${chat.lastMessage.type.charAt(0).toUpperCase() +
                    chat.lastMessage.type.slice(1)}]`;
            } else {
              previewMsg = chat.lastMessage.body;
            }
          }

          const previewTime = chat.lastMessage?.timestamp || null;
          const isSentByMe =
            typeof chat.lastMessage?.from === "string" &&
            (chat.lastMessage.from.startsWith("917399750001") ||
              chat.lastMessage.from.startsWith("917708238586"));

          const isSelected = selectedChatId === chat.id;

          return (
            <div
              key={chat.id}
              onClick={() => {
                setSelectedChatId(chat.id);
                onSelectChat(chat);
              }}
              className={`flex items-center gap-5 px-4 py-3 cursor-pointer transition-all border-b border-gray-200 ${
                isSelected ? "bg-[#D9FDD3]" : "hover:bg-[#f0f0f0]"
              }`}
            >
              {/* Profile Icon with unread badge */}
              <div className="relative w-10 h-10 bg-[#cfd8dc] rounded-full flex items-center justify-center text-gray-700 font-semibold text-sm">
                {chat.name?.[0]?.toUpperCase() || "?"}
                {/* {chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#25D366] text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center border border-white">
                    {chat.unreadCount}
                  </span>
                )} */}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {chat.name || chat.id}
                </div>
                <div className="text-xs truncate text-[#075E54] font-semibold">
                  {previewMsg ? (
                    previewMsg
                  ) : (
                    <i className="text-gray-400">No messages yet</i>
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
        {filteredChats.length === 0 && (
          <div className="p-4 text-sm text-gray-500 italic text-center">
            No chats available
          </div>
        )}
      </div>
    </aside>
  );
}
