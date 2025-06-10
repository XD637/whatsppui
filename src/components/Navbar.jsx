"use client";

import React from "react";
import { signOut } from "next-auth/react";

export default function Navbar() {
  return (
    <nav className="w-full h-14 bg-[#075E54] text-white flex items-center justify-between px-6 shadow-md z-50">
      <h1 className="text-lg font-semibold">WhatsApp Dashboard</h1>
      <button
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
        className="bg-white text-[#075E54] px-3 py-1 rounded-full text-sm font-semibold hover:bg-green-100 transition"
      >
        Logout
      </button>
    </nav>
  );
}
