"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import ActionsPanel from "@/components/ActionsPanel";
import { useChat } from "./ChatContext";

export default function Home() {
  const { selectedChat, setSelectedChat } = useChat();
  const router = useRouter();
  const { status } = useSession();
  const [delayed, setDelayed] = useState(true); // For 3s delay

  useEffect(() => {
    const timer = setTimeout(() => setDelayed(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated" && !delayed) {
      router.push("/auth/login");
    }
  }, [status, router, delayed]);

  if (status === "loading" || delayed) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-lg">
        Checking auth...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Already redirected
  }

  return (
    <div className="flex h-screen w-full">
      <ChatSidebar onSelectChat={setSelectedChat} />
      <ChatWindow selectedChat={selectedChat} />
      <ActionsPanel />
    </div>
  );
}
