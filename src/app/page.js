"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import ActionsPanel from "@/components/ActionsPanel";
import InboxPanel from "@/components/InboxPanel";
import Navbar from "@/components/Navbar";
import { useChat } from "./ChatContext";
import { toast } from "sonner";
import { useWebSocket } from "@/context/WebSocketContext"; // <-- import the hook

export default function Home() {
  const { selectedChat, setSelectedChat } = useChat();
  const router = useRouter();
  const { status, data: session } = useSession();
  const [delayed, setDelayed] = useState(true);
  const [toasterReady, setToasterReady] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useWebSocket(); // <-- use the context

  const userId = session?.user?.uuid;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayed(false);
      setToasterReady(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated" && !delayed) {
      router.push("/auth/login");
    }
  }, [status, router, delayed]);

  useEffect(() => {
    if (status === "authenticated" && socketRef?.current) {
      const socket = socketRef.current;

      socket.onopen = () => {
        console.log("WebSocket connected");
      };

      socket.onmessage = (event) => {
        console.log("New message from WS:", event.data);
        try {
          const message = JSON.parse(event.data);

          console.log("WS message.data:", message.data);

          if (message.type === "NEW_MESSAGE" && toasterReady) {
            const { from, group, body, timestamp, replyTo } = message.data;

            const userTag = `U${userId}`;
            const bodyMatches = body.match(/U\d+/g);
            const replyBodyMatches = replyTo?.body?.match(/U\d+/g);

            const isTaggedInBody = !bodyMatches || bodyMatches.includes(userTag);
            const isTaggedInReply = replyBodyMatches && replyBodyMatches.includes(userTag);

            const shouldShow = isTaggedInBody || isTaggedInReply;

            if (shouldShow) {
              let toastDescription = `${body}\n${timestamp}`;
              if (replyTo?.body) {
                toastDescription = `Replying to: "${replyTo.body}"\n\n${body}\n${timestamp}`;
              }

              // Save notification
              setNotifications((prev) => [
                ...prev,
                {
                  title: `${group} - ${from}`,
                  description: toastDescription,
                  timestamp: Date.now(),
                },
              ]);

              toast(`${group} - ${from}`, {
                description: toastDescription,
                duration: 6000,
                action: {
                  label: "View",
                  onClick: () => {
                    setSelectedChat((prev) => {
                      if (prev && prev.id === message.data.chatId) return prev;
                      return {
                        id: message.data.chatId,
                        name: group,
                        isGroup: true,
                      };
                    });

                    setTimeout(() => {
                      if (message.data.messageId) {
                        const el = document.getElementById(`msg-${message.data.messageId}`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }, 500);
                  },
                },
                cancel: {
                  label: "Close",
                  onClick: () => {
                    console.log("Toast closed");
                  },
                },
              });

              // Show browser notification
              if (Notification.permission === "granted") {
                new Notification(`${group} - ${from}`, {
                  body: toastDescription,
                  icon: "/favicon.ico", // optional
                });
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                  if (permission === "granted") {
                    new Notification(`${group} - ${from}`, {
                      body: toastDescription,
                      icon: "/favicon.ico",
                    });
                  }
                });
              }

              // Save notification to DB
              console.log("Saving notification for userId:", userId);
              fetch("/api/notifications/save", {
                method: "POST",
                body: JSON.stringify({
                  userId,
                  title: `${group} - ${from}`,
                  description: toastDescription,
                  chatId: message.data.chatId ?? null,
                  messageId: message.data.messageId ?? null,
                }),
                headers: { "Content-Type": "application/json" },
              }).then(res => res.json()).then(data => {
                if (!data.success) {
                  console.error("Failed to save notification:", data.message);
                }
              }).catch(err => {
                console.error("Notification save error:", err);
              });
            }
          }
        } catch (err) {
          console.error("Error parsing WS message:", err);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");
      };

      // No need to close the socket here, context handles cleanup
    }
  }, [status, toasterReady, userId, setSelectedChat, socketRef]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  if (status === "loading" || delayed) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-lg">
        Checking auth...
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="relative h-screen w-full">
      <Navbar userId={userId} setSelectedChat={setSelectedChat} />
      <div className="flex h-full">
        <ChatSidebar onSelectChat={setSelectedChat} />
        <ChatWindow selectedChat={selectedChat} />
        {session?.user?.role === "admin" ? (
          <ActionsPanel />
        ) : (
          <InboxPanel setSelectedChat={setSelectedChat} />
        )}
      </div>
    </div>
  );
}
