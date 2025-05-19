"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useChat } from "../app/ChatContext"; // Adjust path as needed

export default function ActionsPanel() {
  const { selectedChat } = useChat();

  const [excelFile, setExcelFile] = useState(null);
  const [fieldName, setFieldName] = useState("");
  const [extractedData, setExtractedData] = useState([]);
  const [mediaFile, setMediaFile] = useState(null);
  const [message, setMessage] = useState("");
  const [sendMode, setSendMode] = useState(""); // This is our realtime tag state

  const handleExcelChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 16) {
      toast.error("File size exceeds 16MB limit!");
      e.target.value = null;
      setMediaFile(null);
    } else {
      setMediaFile(file);
      toast.success(`Selected: ${file.name}`);
    }
  };

  const handleExtract = async () => {
    if (!excelFile || !fieldName) {
      toast.error("Please select a file and enter a field name!");
      return;
    }

    const formData = new FormData();
    formData.append("excel", excelFile);
    formData.append("fieldName", fieldName);

    try {
      const res = await fetch("http://192.168.0.169:3002/upload-excel", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        toast.success(`Extracted ${result.data.length} entries!`);
        setExtractedData(result.data);
      } else {
        toast.error("Failed to extract data!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }
  };

  const handleSend = async () => {
    if (!message || !mediaFile) {
      toast.error("Please enter a message and select a media file!");
      setSendMode("");
      return;
    }

    setSendMode(
      extractedData.length > 0
        ? "Using bulk send mode"
        : "Sending to selected chat group"
    );

    try {
      const formData = new FormData();
      formData.append("media", mediaFile);
      // Bulk: send array, Single: send string
      formData.append(
        "chatId",
        extractedData.length > 0
          ? JSON.stringify(extractedData)
          : selectedChat.id
      );
      formData.append("caption", message);

      const uploadRes = await fetch("http://192.168.0.169:4444/upload-media", {
        method: "POST",
        body: formData,
      });
      const uploadResult = await uploadRes.json();

      if (!uploadResult.success) {
        toast.error("Media upload failed");
        setSendMode("");
        return;
      }

      // Show results for bulk or single
      if (uploadResult.results && Array.isArray(uploadResult.results)) {
        const successCount = uploadResult.results.filter(r => r.success).length;
        toast.success(`Media sent to ${successCount} chat(s)!`);
      } else {
        toast.success("Media sent successfully!");
      }
    } catch (err) {
      toast.error("Media upload error");
    } finally {
      setSendMode("");
    }
  };

  return (
    <aside className="w-[25%] p-4 bg-[#ECE5DD]">
      <div className="text-lg font-bold border-b pb-2 mb-4 text-[#075E54]">
        Actions
      </div>

      <div className="space-y-4">
        {/* Excel Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Excel Upload</label>
          <Input type="file" className="bg-white" onChange={handleExcelChange} />
          <div className="mt-2">
            <label className="block text-sm font-medium mb-1">Field Name</label>
            <Input
              placeholder="e.g., Phone number"
              className="bg-white"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              className="bg-gray-800 text-white hover:bg-gray-900 rounded-full"
              onClick={handleExtract}
            >
              Extract
            </Button>
          </div>
          {extractedData.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto border p-2 rounded bg-white">
              <div className="text-sm font-medium mb-1 text-[#075E54]">
                Extracted Numbers ({extractedData.length})
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {extractedData.map((num, idx) => (
                  <li key={idx} className="truncate">
                    {num}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Upload Media (Max 16MB)</label>
          <Input
            type="file"
            className="bg-white"
            onChange={handleMediaChange}
            accept="image/*,video/*,application/pdf"
          />
          {mediaFile && (
            <p className="text-xs mt-1 text-gray-600 truncate">
              Selected: {mediaFile.name}
            </p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Add Message</label>
          <Textarea
            rows={4}
            placeholder="Enter custom message"
            className="bg-white"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Send Button */}
        <div className="flex flex-col items-end space-y-1">
          <Button
            className="w-44 bg-[#25D366] text-white hover:bg-[#20bd5c] rounded-full"
            onClick={handleSend}
          >
            Send via WhatsApp
          </Button>
          {/* Realtime send mode tag */}
          {sendMode && (
            <span className="text-xs text-gray-700 italic select-none">{sendMode}</span>
          )}
        </div>
      </div>
    </aside>

  );
}
