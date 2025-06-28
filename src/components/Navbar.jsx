"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Bell, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import GroupManager from "./GroupManager"; // Import the new component

export default function Navbar({ setSelectedChat }) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    if (showModal && session?.user?.id) {
      fetch(`/api/notifications/user`, {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id }),
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setNotifications(data.notifications);
        });
    }
  }, [showModal, session?.user?.id]);

  const handleClear = async () => {
    await fetch("/api/notifications/clear", {
      method: "POST",
      body: JSON.stringify({ userId: session.user.id }),
      headers: { "Content-Type": "application/json" },
    });
    // Refresh notifications after clearing
    fetch(`/api/notifications/user`, {
      method: "POST",
      body: JSON.stringify({ userId: session.user.id }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNotifications(data.notifications);
      });
  };

  const handleNotificationClick = (notif) => {
    setShowModal(false);
    setSelectedChat({
      id: notif.chat_id,
      name: notif.title.split(" - ")[0], // or however you want to get the name
      isGroup: true, // or false if not a group
    });
    setTimeout(() => {
      if (notif.message_id) {
        const el = document.getElementById(`msg-${notif.message_id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 500);
  };

  return (
    <>
      <nav className="w-full h-14 bg-[#075E54] text-white flex items-center justify-between px-6 shadow-md z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">WhatsApp</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-gray-100 text-[#075E54] cursor-pointer font-semibold text-sm shadow transition"
            onClick={() => setShowGroupModal(true)}
            title="Create Group"
            style={{ minWidth: 0 }}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Create Group</span>
          </button>

          {session?.user?.name && (
            <span className="text-sm font-semibold bg-white text-[#075E54] px-3 py-1 rounded-full shadow">
              {session.user.name}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="text-sm bg-white text-red-500 hover:text-red-600 px-3 py-1 rounded-full shadow-md font-semibold transition cursor-pointer flex items-center gap-1"
          >
            Logout
          </button>
        </div>
      </nav>
      {showGroupModal && (
        <GroupManager onClose={() => setShowGroupModal(false)} />
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-xs w-full p-4 relative">
            <button
              className="absolute top-1.5 right-2 text-gray-400 hover:text-gray-700 text-lg"
              onClick={() => setShowModal(false)}
              title="Close"
            >
              ×
            </button>
            <h2 className="text-base font-bold mb-3 text-[#075E54]">
              Notifications
            </h2>
            <button
              className="mb-3 text-xs text-black underline cursor-pointer hover:text-[#075E54]"
              onClick={handleClear}
              disabled={notifications.length === 0}
            >
              Clear All
            </button>
            {notifications.length === 0 ? (
              <div className="text-gray-500 text-xs text-center">
                No notifications yet.
              </div>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {notifications.map((n, i) => (
                  <li
                    key={n.id || i}
                    className="border-b pb-1 last:border-b-0 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="font-semibold text-sm">{n.title}</div>
                    <div className="text-xs text-gray-600 whitespace-pre-line">
                      {n.description}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

{/* <button
            className="relative"
            onClick={() => setShowModal(true)}
            title="Notifications"
          >
            <Bell className="w-6 h-6" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full px-1.5 py-0.5">
                {notifications.length}
              </span>
            )}
          </button> */}
          {/* Show username beside the logout button */}