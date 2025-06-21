"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Bell } from "lucide-react";

export default function Navbar({ userId, setSelectedChat }) {
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (showModal && userId) {
      fetch(`/api/notifications/user`, {
        method: "POST",
        body: JSON.stringify({ userId }),
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setNotifications(data.notifications);
        });
    }
  }, [showModal, userId]);

  const handleClear = async () => {
    await fetch("/api/notifications/clear", {
      method: "POST",
      body: JSON.stringify({ userId }),
      headers: { "Content-Type": "application/json" },
    });
    // Refresh notifications after clearing
    fetch(`${baseUrl}/api/notifications/user`, {
      method: "POST",
      body: JSON.stringify({ userId }),
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
        <h1 className="text-lg font-semibold">WhatsApp Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
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
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="bg-white text-[#075E54] px-3 py-1 rounded-full text-sm font-semibold hover:bg-green-100 transition"
          >
            Logout
          </button>
        </div>
      </nav>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => setShowModal(false)}
              title="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4 text-[#075E54]">
              Notifications
            </h2>
            <button
              className="mb-4  text-xs text-black underline  cursor-pointer hover:text-[#075E54]"
              onClick={handleClear}
              disabled={notifications.length === 0}
            >
              Clear All
            </button>
            {notifications.length === 0 ? (
              <div className="text-gray-500 text-sm text-center">
                No notifications yet.
              </div>
            ) : (
              <ul className="space-y-3 max-h-72 overflow-y-auto">
                {notifications.map((n, i) => (
                  <li
                    key={n.id || i}
                    className="border-b pb-2 last:border-b-0 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="font-semibold">{n.title}</div>
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
