// app/ClientProviders.jsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ChatProvider } from "./ChatContext";

export default function ClientProviders({ children }) {
  return (
    <SessionProvider>
      <ChatProvider>{children}</ChatProvider>
    </SessionProvider>
  );
}
