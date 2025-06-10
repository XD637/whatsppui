"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import ActionsPanel from "@/components/ActionsPanel";
import Navbar from "@/components/Navbar";
import { useChat } from "./ChatContext";
import { toast } from "sonner";

export default function Home() {
  const { selectedChat, setSelectedChat } = useChat();
  const router = useRouter();
  const { status, data: session } = useSession();
  const [delayed, setDelayed] = useState(true);
  const [toasterReady, setToasterReady] = useState(false);
  const socketRef = useRef(null);

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
    if (status === "authenticated") {
      const socket = new WebSocket("ws://192.168.0.169:7777");
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connected");
      };

      socket.onmessage = (event) => {
        console.log("New message from WS:", event.data);
        try {
          const message = JSON.parse(event.data);

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

              toast(`${group} - ${from}`, {
                description: toastDescription,
                duration: 6000,
                action: {
                  label: "View",
                  onClick: () => {
                    console.log("Redirect or open chat logic here");
                  },
                },
                cancel: {
                  label: "Close",
                  onClick: () => {
                    console.log("Toast closed");
                  },
                },
              });
            }
          }
        } catch (err) {
          console.error("Error parsing WS message:", err);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");
      };

      return () => {
        socket.close();
      };
    }
  }, [status, toasterReady, userId]);

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
          <Navbar />
      <div className="flex h-full">
        <ChatSidebar onSelectChat={setSelectedChat} />
        <ChatWindow selectedChat={selectedChat} />
        {session?.user?.role === "admin" && <ActionsPanel />}
      </div>
    </div>
  );
}
