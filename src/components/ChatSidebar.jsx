"use client";
import React, { useEffect, useState } from "react";

export default function ChatSidebar({ onSelectChat }) {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch("http://192.168.0.169:4444/api/chat-list");
        const data = await res.json();
        if (data.success) {
          setChats(data.chats);
        }
      } catch (err) {
        console.error("Failed to fetch chats", err);
      }
    };

    fetchChats();
  }, []);

  return (
    <aside className="w-[20%] border-r border-gray-300 bg-white flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-300 mb-6">
        <h2 className="text-xl font-bold text-[#075E54]">Chats</h2>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className="flex items-center gap-5 px-4  py-3 hover:bg-[#D9FDD3] cursor-pointer transition-all border-b border-gray-200"
          >
            {/* Profile Icon */}
            <div className="w-10 h-10 bg-[#cfd8dc] rounded-full flex items-center justify-center text-gray-700 font-semibold text-sm">
              {chat.name?.[0]?.toUpperCase() || "?"}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {chat.name || chat.id}
              </div>
              <div className="text-sm text-gray-600 truncate">
                {chat.lastMessage || <i className="text-gray-400">Select chat to see messages</i>}
              </div>
            </div>
          </div>
        ))}

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
