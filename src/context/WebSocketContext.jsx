// context/WebSocketContext.jsx
"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const connect = () => {
      const socket = new WebSocket("ws://192.168.0.111:7777");

      socket.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
      };

      socket.onclose = () => {
        console.warn("WebSocket disconnected. Reconnecting in 2s...");
        setConnected(false);
        setTimeout(connect, 2000); // auto reconnect
      };

      socket.onerror = (err) => {
        console.error("WebSocket error", err);
        socket.close(); // trigger onclose and retry
      };

      socketRef.current = socket;
    };

    connect();

    return () => {
      socketRef.current?.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={socketRef}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
