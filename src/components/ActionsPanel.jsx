"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ActionsPanel() {
  const handleSend = () => {
    toast.success("Message sent via WhatsApp server!");
  };

  return (
    <aside className="w-[25%] p-4 bg-[#ECE5DD]">
      <div className="text-lg font-bold border-b pb-2 mb-4 text-[#075E54]">
        Actions
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">File upload</label>
          <Input type="file" className="bg-white" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Excel Upload</label>
          <Input type="file" className="bg-white" />
          <div className="mt-2">
            <label className="block text-sm font-medium mb-1">Field Name</label>
            <Input placeholder="e.g., PhoneNumber" className="bg-white" />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              className="bg-gray-800 text-white hover:bg-gray-900 rounded-full"
              onClick={() => toast.success("Data extracted from Excel!")}
            >
              Extract
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Add Message</label>
          <Textarea rows={4} placeholder="Enter custom message" className="bg-white" />
        </div>

        <div className="flex justify-end">
          <Button
            className="w-44 bg-[#25D366] text-white hover:bg-[#20bd5c] rounded-full"
            onClick={handleSend}
          >
            Send via WhatsApp
          </Button>
        </div>
      </div>
    </aside>
  );
}
