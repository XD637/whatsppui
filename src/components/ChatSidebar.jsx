"use client";
import React, { useEffect, useState, useRef } from "react";
import { FiRefreshCw, FiSearch } from "react-icons/fi";
import { useWebSocket } from "@/context/WebSocketContext";

export default function ChatSidebar({ onSelectChat, onIncomingMessage }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedChatId, setSelectedChatId] = useState(null);
  const selectedChatIdRef = useRef(null);
  const socketRef = useWebSocket();
  const chatsRef = useRef(chats);
  chatsRef.current = chats;

  var base_api_url = process.env.NEXT_PUBLIC_BASE_API_URL;
  var base_api_port = process.env.NEXT_PUBLIC_BASE_API_PORT;
  console.log("Base API URL:", base_api_url);

  // Helper function to convert base64 profile pic to data URL
  const getProfilePicUrl = (profilePic) => {
    if (!profilePic || !profilePic.data || !profilePic.mimeType) {
      console.log("No profile pic data:", profilePic); // Debug log
      return null;
    }
    const dataUrl = `data:${profilePic.mimeType};base64,${profilePic.data}`;
    console.log("Profile pic URL created:", dataUrl.substring(0, 50) + "..."); // Debug log
    return dataUrl;
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${base_api_url}:${base_api_port}/api/chat-list`);
      const data = await res.json();
      console.log("Chat data received:", data); // Debug log
      if (data.success) {
        const enriched = data.chats.map((chat) => ({
          ...chat,
          unreadCount: 0,
          // Convert profilePic to data URL if available
          profilePicUrl: getProfilePicUrl(chat.profilePic),
        }));
        console.log("Enriched chats:", enriched); // Debug log
        setChats(enriched);
      }
    } catch (err) {
      console.error("Failed to fetch chats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 1800000); // Fetch every 30 minutes
    return () => clearInterval(interval);
  }, []);

  const handleSelectChat = (chat) => {
    setSelectedChatId(chat.id);
    selectedChatIdRef.current = chat.id;
    onSelectChat(chat);
    setChats((prev) =>
      prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  useEffect(() => {
    if (!socketRef?.current) return;

    const handleMessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "NEW_MESSAGE") {
          const { group, body, from, timestamp, chatId, message } = msg.data;
          const newLastMessage = {
            body,
            type: "chat",
            from,
            timestamp: new Date(timestamp).getTime(),
            fromMe: false,
          };

          setChats((prevChats) => {
            const existingChat = prevChats.find((chat) => chat.id === chatId);
            if (existingChat) {
              const isUnread = selectedChatIdRef.current !== chatId;
              const updated = {
                ...existingChat,
                lastMessage: newLastMessage,
                unreadCount: isUnread ? (existingChat.unreadCount || 0) + 1 : 0,
              };
              return [
                updated,
                ...prevChats.filter((c) => c.id !== chatId),
              ];
            } else {
              const newChat = {
                id: chatId,
                name: group,
                isGroup: true,
                unreadCount: 1,
                lastMessage: newLastMessage,
              };
              return [newChat, ...prevChats];
            }
          });

          if (selectedChatIdRef.current === chatId && onIncomingMessage) {
            onIncomingMessage(message || {
              id: msg.data.message_id,
              body,
              from,
              timestamp: new Date(timestamp).getTime(),
            });
          }
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    const ws = socketRef.current;
    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [socketRef]);

  const sortedChats = [...chats].sort((a, b) => {
    const timeA = new Date(a.lastMessage?.timestamp || 0).getTime();
    const timeB = new Date(b.lastMessage?.timestamp || 0).getTime();
    return timeB - timeA;
  });

  const filteredChats = sortedChats
    .filter((chat) => chat.id !== "status@broadcast")
    .filter((chat) => {
      const name = (chat.name || "").toLowerCase().trim();
      const searchTerm = search.toLowerCase().trim();
      return searchTerm.split(/\s+/).every((word) => name.includes(word));
    });

  return (
    <aside className="w-[20%] border-r border-gray-300 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-300 mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#075E54]">Chats</h2>
        <button
          onClick={fetchChats}
          className={`text-[#075E54] hover:text-[#0b8b77] transition-all ${loading ? "animate-spin" : ""}`}
        >
          <FiRefreshCw size={20} />
        </button>
      </div>

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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => {
          const isSelected = selectedChatId === chat.id;
          const previewMsg = chat.lastMessage?.body || "No messages yet";
          const previewTime = chat.lastMessage?.timestamp;
          const hasProfilePic = chat.profilePicUrl && chat.profilePicUrl !== "";

          console.log(`Chat ${chat.name}: hasProfilePic=${hasProfilePic}, profilePicUrl=${chat.profilePicUrl?.substring(0, 50)}...`); // Debug log

          return (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-all border-b border-gray-200 ${
                isSelected ? "bg-[#D9FDD3]" : "hover:bg-[#f0f0f0]"
              }`}
            >
              <div className="relative w-10 h-10 flex-shrink-0">
                {hasProfilePic ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#cfd8dc]">
                    {/* Use regular img tag instead of Next.js Image */}
                    <img
                      src={chat.profilePicUrl}
                      alt={chat.name || "Profile"}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        console.log("Image load error for chat:", chat.name);
                        // Hide the image and show fallback
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement.querySelector('.fallback-initials');
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                      onLoad={(e) => {
                        console.log("Image loaded successfully for chat:", chat.name);
                        // Hide fallback when image loads
                        const fallback = e.currentTarget.parentElement.querySelector('.fallback-initials');
                        if (fallback) {
                          fallback.style.display = 'none';
                        }
                      }}
                    />
                    {/* Fallback initials */}
                    <div 
                      className="fallback-initials absolute inset-0 bg-[#cfd8dc] rounded-full flex items-center justify-center text-gray-700 font-semibold text-sm"
                      style={{ display: 'none' }}
                    >
                      {chat.name?.[0]?.toUpperCase() || chat.id.replace(/^91/, "").replace(/@c\.us$/, "")[0] || "?"}
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-[#cfd8dc] rounded-full flex items-center justify-center text-gray-700 font-semibold text-sm">
                    {chat.name?.[0]?.toUpperCase() || chat.id.replace(/^91/, "").replace(/@c\.us$/, "")[0] || "?"}
                  </div>
                )}
                
                {/* Unread count badge */}
                {chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#25D366] text-white text-[10px] px-[6px] py-[2px] rounded-full min-w-[16px] h-4 flex items-center justify-center">
                    {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {chat.name
                    ? chat.name
                    : chat.id.replace(/^91/, "").replace(/@c\.us$/, "")}
                </div>
                <div className="text-xs truncate text-[#075E54] font-semibold">
                  {previewMsg}
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
        {filteredChats.length === 0 && (
          <div className="p-4 text-sm text-gray-500 italic text-center">
            No chats available
          </div>
        )}
      </div>
    </aside>
  );
}
