"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function ActionsPanel() {
  const [excelFile, setExcelFile] = useState(null);
  const [fieldName, setFieldName] = useState("");
  const [extractedData, setExtractedData] = useState([]);
  const [message, setMessage] = useState("");
  const [sendMode, setSendMode] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Bulk send to extracted numbers (text or media)
  const handleBulkSend = async () => {
    if (extractedData.length === 0) {
      toast.error("No extracted numbers to send!");
      return;
    }
    if (!message && !mediaFile) {
      toast.error("Please enter a message or select a media file!");
      return;
    }

    setSendMode("Using bulk send mode");
    setLoading(true);

    try {
      const formData = new FormData();
      if (mediaFile) formData.append("media", mediaFile);
      formData.append("chatId", JSON.stringify(extractedData));
      formData.append("caption", message);

      const uploadRes = await fetch("http://192.168.0.169:4444/upload-media", {
        method: "POST",
        body: formData,
      });
      const uploadResult = await uploadRes.json();

      if (!uploadResult.success) {
        toast.error("Bulk send failed");
        setSendMode("");
        setLoading(false);
        return;
      }

      const successCount = uploadResult.results?.filter(r => r.success).length || 0;
      toast.success(`Bulk sent to ${successCount} chat(s)!`);
    } catch (err) {
      toast.error("Bulk send error");
    } finally {
      setSendMode("");
      setLoading(false);
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

        {/* Media Upload for Bulk */}
        <div>
          <label className="block text-sm font-medium mb-1">Upload Media (Max 16MB, optional)</label>
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

        {/* Bulk Send Button */}
        <div className="flex flex-col items-end space-y-1">
          <Button
            className="w-44 bg-[#25D366] text-white hover:bg-[#20bd5c] rounded-full flex items-center justify-center gap-2"
            onClick={handleBulkSend}
            disabled={loading}
          >
            {loading && (
              <AiOutlineLoading3Quarters className="animate-spin text-xl" />
            )}
            <span>
              {loading ? "Sending..." : "Send Bulk via WhatsApp"}
            </span>
          </Button>
          {sendMode && (
            <span className="text-xs text-gray-700 italic select-none">{sendMode}</span>
          )}
        </div>
      </div>
    </aside>
  );
}
