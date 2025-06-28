"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function GroupManager({ onClose }) {
  const [groupName, setGroupName] = useState("");
  const [participants, setParticipants] = useState("");
  const [loading, setLoading] = useState(false);

  var base_api_url = process.env.NEXT_PUBLIC_BASE_API_URL;
  var base_api_port = process.env.NEXT_PUBLIC_BASE_API_PORT;

  // Helper to parse comma-separated input
  const parseList = (str) =>
    str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleCreateGroup = async () => {
    setLoading(true);
    try {
      await fetch(`${base_api_url}:${base_api_port}/api/create-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName,
          participants: parseList(participants),
        }),
      });
      setGroupName("");
      setParticipants("");
      onClose(); // Always close modal after response
    } catch (err) {
      onClose(); // Also close modal on error
    }
    setLoading(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-md rounded-2xl p-0 border-0 shadow-xl"
        style={{ background: "#fff" }}
      >
        <div className="rounded-t-2xl bg-[#075E54] px-6 py-4 flex items-center gap-2">
          <Plus className="text-white" size={22} />
          <DialogHeader className="flex-1 p-0">
            <DialogTitle className="text-white text-lg font-bold p-0 m-0">
              Create WhatsApp Group
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="px-6 py-6">
          <div className="mb-4">
            <label className="block text-[#075E54] font-semibold mb-1">
              Group Name
            </label>
            <Input
              className="rounded-full border border-gray-300 focus:ring-2 focus:ring-[#25D366] bg-gray-50"
              placeholder="e.g. Sporada Alerts"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-[#075E54] font-semibold mb-1">
              Members
            </label>
            <Input
              className="rounded-full border border-gray-300 focus:ring-2 focus:ring-[#25D366] bg-gray-50"
              placeholder="e.g. 9999999999, 8888888888"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />
            <div className="text-xs text-gray-400 mt-1">
              Separate numbers with commas. 10-digit numbers need to be prefixed with 91.
            </div>
          </div>
          <Button
            onClick={handleCreateGroup}
            className="w-full rounded-full bg-[#25D366] hover:bg-[#20bd5c] text-white font-bold text-base py-3 flex items-center justify-center gap-2"
            disabled={loading || !groupName || !participants}
          >
            <Plus size={18} className="inline-block" />
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}