"use client";
import React, { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import ActionsPanel from "@/components/ActionsPanel";

export default function Home() {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="flex h-screen w-full">
      <ChatSidebar onSelectChat={setSelectedChat} />
      <ChatWindow selectedChat={selectedChat} />
      <ActionsPanel />
    </div>
  );
}
