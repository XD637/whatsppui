"use client";
import React from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import ActionsPanel from "@/components/ActionsPanel";
import { useChat } from "./ChatContext"; // Import context

export default function Home() {
  const { selectedChat, setSelectedChat } = useChat(); // Use context

  return (
    <div className="flex h-screen w-full">
      <ChatSidebar onSelectChat={setSelectedChat} />
      <ChatWindow selectedChat={selectedChat} />
      <ActionsPanel />
    </div>
  );
}
