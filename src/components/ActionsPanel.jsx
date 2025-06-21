"use client";

import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { CheckCircle, XCircle } from "lucide-react"; // Add at the top for icons
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const FIELD_OPTIONS = ["Phone number", "Mobile", "Contact", "Custom"];

export default function ActionsPanel() {
  const fileInputRef = useRef(null);
  const [excelFile, setExcelFile] = useState(null);
  const [fieldName, setFieldName] = useState("");
  const [extractedData, setExtractedData] = useState([]);
  const [message, setMessage] = useState("");
  const [sendMode, setSendMode] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const base_api_url = process.env.BASE_API_URL;

  // For custom field input
  const [customField, setCustomField] = useState("");

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
      const res = await fetch("http://192.168.0.169:3002/upload-excel", { //need to change this URL to your backend endpoint
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        const start = Number(offset) || 0;
        const end = start + (Number(limit) || 50);
        const limited = result.data.slice(start, end);
        toast.success(`Extracted ${limited.length} entries!`);
        setExtractedData(limited);
      } else {
        toast.error("Failed to extract data!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }
  };

  const handleClearAll = () => {
    setExtractedData([]);
    setMessage("");
    setMediaFile(null);
    setSummary(null);
    setExcelFile(null);
    setFieldName("");
    setCustomField("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
    setProgress(0);
    setSummary(null);

    // Fake progress animation while waiting for backend
    let fakeProgress = 0;
    const progressInterval = setInterval(() => {
      fakeProgress += Math.random() * 10 + 5; // random step for more natural feel
      if (fakeProgress < 90) {
        setProgress(Math.floor(fakeProgress));
      }
    }, 200);

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
      console.log("uploadResult.results", uploadResult.results);

      clearInterval(progressInterval);
      setProgress(100);

      if (!uploadResult.success) {
        toast.error("Bulk send failed");
        setSendMode("");
        setLoading(false);
        return;
      }

      // Calculate summary
      const total = uploadResult.results.length;
      const successCount = uploadResult.results.filter((r) => r.success).length;
      const failCount = total - successCount;

      setSummary({
        total,
        successCount,
        failCount,
        results: uploadResult.results, // This should be the array from backend!
      });
      setLoading(false);
      setSendMode("");
      toast.success(`Bulk sent to ${successCount} chat(s)!`);
    } catch (err) {
      clearInterval(progressInterval);
      toast.error("Bulk send error");
      setLoading(false);
      setSendMode("");
      setProgress(0);
    }
  };

  return (
    <aside className="w-[25%] p-4 bg-[#ECE5DD]">
      <div className="text-lg font-bold border-b pb-2 mb-4 text-[#075E54]">
        Actions
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 cursor-pointer">
            Excel Upload
          </label>
          <Input
            type="file"
            className="bg-white cursor-pointer"
            onChange={handleExcelChange}
            ref={fileInputRef}
          />
          <div className="mt-2 flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 cursor-pointer">
                Field Name
              </label>
              <div className="flex gap-2 items-center">
                <Select
                  value={
                    FIELD_OPTIONS.includes(fieldName) ? fieldName : "Custom"
                  }
                  onValueChange={(val) => {
                    if (val === "Custom") {
                      setFieldName(customField);
                    } else {
                      setFieldName(val);
                      setCustomField("");
                    }
                  }}
                >
                  <SelectTrigger className="w-40 bg-white border text-sm cursor-pointer">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="cursor-pointer">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldName === "Custom" ||
                !FIELD_OPTIONS.includes(fieldName) ? (
                  <Input
                    placeholder="Type field name"
                    className="bg-white flex-1 border border-gray-300 cursor-pointer"
                    value={customField}
                    onChange={(e) => {
                      setCustomField(e.target.value);
                      setFieldName(e.target.value);
                    }}
                  />
                ) : null}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Choose a field or type your own (e.g. "Phone number")
              </div>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 cursor-pointer">
                Limit
              </label>
              <Input
                type="number"
                min={1}
                className="bg-white cursor-pointer"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 cursor-pointer">
                Offset
              </label>
              <Input
                type="number"
                min={0}
                className="bg-white cursor-pointer"
                value={offset}
                onChange={(e) => setOffset(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              className="bg-gray-800 text-white hover:bg-gray-900 rounded-full cursor-pointer"
              onClick={handleExtract}
            >
              Extract
            </Button>
            <Button
              className="bg-white text-black hover:bg-gray-100 rounded-full cursor-pointer"
              onClick={handleClearAll}
              type="button"
            >
              Clear All
            </Button>
          </div>
          {extractedData.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto border p-2 rounded bg-white">
              <div className="text-sm font-medium mb-1 text-[#075E54]">
                Extracted Numbers ({extractedData.length})
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {extractedData.map((num, idx) => (
                  <li key={idx} className="truncate cursor-pointer">
                    {num}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 cursor-pointer">
            Upload Media (Max 16MB, optional)
          </label>
          <Input
            type="file"
            className="bg-white cursor-pointer"
            onChange={handleMediaChange}
            accept="image/*,video/*,application/pdf"
          />
          {mediaFile && (
            <p className="text-xs mt-1 text-gray-600 truncate">
              Selected: {mediaFile.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 cursor-pointer">
            Add Message
          </label>
          <Textarea
            rows={4}
            placeholder="Enter custom message"
            className="bg-white cursor-pointer"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="flex flex-col items-end space-y-1">
          <Button
            className="w-44 bg-[#25D366] text-white hover:bg-[#20bd5c] rounded-full flex items-center justify-center gap-2 cursor-pointer"
            onClick={handleBulkSend}
            disabled={loading}
          >
            {loading && (
              <AiOutlineLoading3Quarters className="animate-spin text-xl" />
            )}
            <span>{loading ? "Sending..." : "Send Bulk via WhatsApp"}</span>
          </Button>
          {/* Progress Bar */}
          {loading && (
            <div className="w-full mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-[#25D366] transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1 text-right">
                {progress}%
              </div>
            </div>
          )}
          {/* Improved Summary */}
          {summary && (
            <div className="w-full mt-3 p-3 rounded bg-white border text-sm shadow flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[#075E54] flex items-center gap-2">
                  <CheckCircle className="text-[#25D366]" size={18} />
                  Bulk Send Summary
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded px-3 py-1 text-xs cursor-pointer"
                    >
                      View Detailed Summary
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-[#075E54]">
                        <CheckCircle className="text-[#25D366]" size={20} />
                        Detailed Bulk Send Results
                      </DialogTitle>
                      <DialogDescription>
                        See all numbers and their send status below.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-4 mb-4">
                      <span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs border border-neutral-200">
                        Total: <b>{summary.total}</b>
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs border border-emerald-100 flex items-center gap-1">
                        <CheckCircle size={14} /> Success:{" "}
                        <b>{summary.successCount}</b>
                      </span>
                      <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded text-xs border border-rose-100 flex items-center gap-1">
                        <XCircle size={14} /> Failed: <b>{summary.failCount}</b>
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto border rounded p-2 bg-gray-50">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1 px-2">#</th>
                            <th className="text-left py-1 px-2">Number</th>
                            <th className="text-left py-1 px-2">Status</th>
                            <th className="text-left py-1 px-2">Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.results.map((res, idx) => (
                            <tr key={idx} className="border-b last:border-0 cursor-pointer">
                              <td className="py-1 px-2">{idx + 1}</td>
                              <td className="py-1 px-2 font-mono">
                                {res.chatId ? (
                                  res.chatId
                                    .replace(/^91/, "")
                                    .replace(/@c\.us$/, "")
                                ) : (
                                  <span className="text-gray-400 italic">
                                    No number
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-2">
                                {res.success ? (
                                  <span className="text-green-700 flex items-center gap-1">
                                    <CheckCircle size={14} /> Success
                                  </span>
                                ) : (
                                  <span className="text-red-600 flex items-center gap-1">
                                    <XCircle size={14} /> Failed
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-2 text-red-600">
                                {res.error || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <DialogClose asChild>
                      <Button variant="outline" className="mt-4 cursor-pointer">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex gap-4 mb-4">
                <span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs border border-neutral-200">
                  Total: <b>{summary.total}</b>
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs border border-emerald-100 flex items-center gap-1">
                  <CheckCircle size={14} /> Success:{" "}
                  <b>{summary.successCount}</b>
                </span>
                <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded text-xs border border-rose-100 flex items-center gap-1">
                  <XCircle size={14} /> Failed: <b>{summary.failCount}</b>
                </span>
              </div>
              {summary.results.filter((r) => !r.success).length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs text-gray-500">
                    Show failed numbers
                  </summary>
                  <ul className="text-xs text-red-600 mt-1 pl-2 list-disc">
                    {summary.results
                      .filter((r) => !r.success)
                      .map((f, i) => (
                        <li key={i} className="cursor-pointer">
                          <span className="font-mono">
                            {f.chatId
                              ? f.chatId
                                  .replace(/^91/, "")
                                  .replace(/@c\.us$/, "")
                              : "No number"}
                          </span>{" "}
                          - {f.error}
                        </li>
                      ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          {sendMode && (
            <span className="text-xs text-gray-700 italic select-none">
              {sendMode}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
