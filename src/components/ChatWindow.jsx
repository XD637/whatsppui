"use client";
import React, { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { X } from "lucide-react";
import { Reply as ReplyIcon, MoreVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Dialog as ConfirmDialog,
  DialogContent as ConfirmDialogContent,
  DialogHeader as ConfirmDialogHeader,
  DialogTitle as ConfirmDialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import GroupActionForm from "./GroupActionForm";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ChatWindow({ selectedChat }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [groupActionModal, setGroupActionModal] = useState({ action: null, open: false });
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    msg: null,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [msgIdToDelete, setMsgIdToDelete] = useState(null);
  const fileInputRef = useRef();
  const messagesEndRef = useRef(null);
  const firstRenderRef = useRef(true);
  const [groupInfo, setGroupInfo] = useState(null);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const base_api_url = process.env.NEXT_PUBLIC_BASE_API_URL;
  const base_api_port = process.env.NEXT_PUBLIC_BASE_API_PORT;

  const fetchMessages = async () => {
    if (!selectedChat?.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${base_api_url}:${base_api_port}/api/chat-messages?chatId=${encodeURIComponent(
          selectedChat.id
        )}`
      );
      const data = await res.json();
      setMessages(data.success ? data.messages : []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMessages([]);
    fetchMessages();
  }, [selectedChat]);

  useEffect(() => {
    if (messagesEndRef.current) {
      const behavior = firstRenderRef.current ? "auto" : "smooth";
      messagesEndRef.current.scrollIntoView({ behavior });
      firstRenderRef.current = false;
    }
  }, [messages, selectedChat]);

  useEffect(() => {
    firstRenderRef.current = true;
  }, [selectedChat]);

  useEffect(() => {
    setGroupInfo(null);
    if (selectedChat?.id && selectedChat?.id.endsWith("@g.us")) {
      fetch(
        `${base_api_url}:${base_api_port}/api/group-info?groupId=${encodeURIComponent(
          selectedChat.id
        )}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setGroupInfo(data.group);
        })
        .catch(() => setGroupInfo(null));
    }
  }, [selectedChat]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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

  const handleSend = async () => {
    if (!messageText.trim() && !mediaFile) {
      return toast.error("Can't send empty message!");
    }
    if (!selectedChat?.id) return toast.error("No chat selected!");

    // If replying to a message
    if (replyTo) {
      if (!replyTo.id || (!messageText.trim() && !mediaFile)) {
        toast.error("Reply message and text or media are required!");
        return;
      }
      try {
        let res, data;
        if (mediaFile) {
          // Send as multipart/form-data
          const formData = new FormData();
          formData.append("messageId", replyTo.id);
          if (messageText.trim()) formData.append("replyText", messageText.trim());
          formData.append("media", mediaFile);

          res = await fetch(`${base_api_url}/api/reply-message`, {
            method: "POST",
            body: formData,
          });
        } else {
          // Send as JSON
          res = await fetch(`${base_api_url}:${base_api_port}/api/reply-message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messageId: replyTo.id,
              replyText: messageText.trim(),
            }),
          });
        }
        data = await res.json();
        if (data.success) {
          const newMessage = {
            id: Date.now().toString(),
            body: messageText.trim() || "[Media message]",
            from: selectedChat.id,
            author: "me",
            timestamp: Date.now(),
            sent: 1,
            // Add the reply object in the same format as your backend
            reply: replyTo
              ? {
                  toMessageId: replyTo.id,
                  toBody: replyTo.body,
                  toAuthor: replyTo.author,
                  toFromMe: replyTo.fromMe,
                  toType: replyTo.type,
                }
              : null,
            hasMedia: !!mediaFile,
          };
          setMessages((prev) => [...prev, newMessage]);
          setMessageText("");
          setMediaFile(null);
          setReplyTo(null);
          toast.success("Reply sent!");
        } else {
          toast.error(data.error || "Failed to send reply");
        }
      } catch (error) {
        console.error("Send reply error", error);
        toast.error("Error sending reply");
      }
      return;
    }

    try {
      const payload = {
        chatId: selectedChat.id,
        messageText: messageText.trim(),
      };

      const res = await fetch(
        `${base_api_url}:${base_api_port}/api/send-text-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        setMessageText("");
        setReplyTo(null);
        toast.success("Message sent!");
        // Do NOT append the message here; let WebSocket handle it!
      } else toast.error("Failed to send message");
    } catch (error) {
      console.error("Send message error", error);
      toast.error("Error sending message");
    }
  };

  const handleHighlight = (msgId) => {
    setHighlightedMsgId(msgId);
    setTimeout(() => setHighlightedMsgId(null), 1500);
    const el = document.getElementById(`msg-${msgId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, msg });
  };

  const handleReplyFromMenu = () => {
    setReplyTo(contextMenu.msg);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await fetch(
        `${base_api_url}:${base_api_port}/api/delete-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        setSelectedMsgId(null);
        toast.success("Message deleted!");
      } else {
        toast.error(data.error || "Failed to delete message");
      }
    } catch (err) {
      toast.error("Error deleting message");
    }
    setShowDeleteConfirm(false);
    setMsgIdToDelete(null);
  };

  useEffect(() => {
    function handleNewMessage(e) {
      if (
        e.detail &&
        e.detail.chatId === selectedChat?.id &&
        !loading // Only append if not loading
      ) {
        setMessages((prev) => [...prev, e.detail]);
      }
    }
    window.addEventListener("chat:new-message", handleNewMessage);
    return () =>
      window.removeEventListener("chat:new-message", handleNewMessage);
  }, [selectedChat?.id, loading]);

  return (
    <main className="w-[55%] p-4 bg-white flex flex-col justify-between border-r border-gray-300">
      <div className="text-lg font-bold border-b pb-6 mb-6 text-[#075E54] min-h-[40px] flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setShowGroupInfo((v) => !v)}
          title="Show group info"
        >
          <span>{selectedChat?.name || "Select a chat"}</span>
          {groupInfo && (
            showGroupInfo ? (
              <ChevronUp className="w-5 h-5 text-[#075E54]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#075E54]" />
            )
          )}
        </div>
        {groupInfo && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-2 p-2 rounded-full hover:bg-gray-100 transition"
                title="Group Actions"
              >
                <MoreVertical className="w-6 h-6 text-[#075E54]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
      className="
        w-56
        transition-all duration-200 ease-in-out
        data-[state=open]:opacity-100 data-[state=open]:translate-y-0
        data-[state=closed]:opacity-0 data-[state=closed]:-translate-y-2
      "
      sideOffset={8}
      align="end"
    >
      <DropdownMenuItem
        onClick={() => setGroupActionModal({ action: "add", open: true })}
      >
        Add Members
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setGroupActionModal({ action: "promote", open: true })}
      >
        Make Admin
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setGroupActionModal({ action: "demote", open: true })}
      >
        Remove Admin
      </DropdownMenuItem>
    </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {!selectedChat?.id ? (
        <div className="flex flex-1 flex-col items-center justify-start pt-16 h-full">
          <Image
            src="/square%20logo.png"
            alt="Logo"
            width={520}
            height={520}
            className="object-contain opacity-90 mb-6"
            priority
          />
          <div className="text-gray-400 text-xl font-semibold mt-2">
            Select a chat to start messaging
          </div>
          {/* Show a message below the image if it exists */}
          {messages.length > 0 && (
            <div className="mt-8 w-full max-w-md">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-700 shadow">
                {messages[0].body || <i>[Media message]</i>}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {groupInfo && showGroupInfo && (
            <div className="mb-4 p-4 rounded-lg bg-[#f7fafc] border border-[#e2e8f0] shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-semibold text-[#075E54]">
                  {groupInfo.name}
                </span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  Group
                </span>
              </div>
              {groupInfo.description && (
                <div className="text-xs text-gray-600 mb-2">
                  <span className="font-medium">Description:</span>{" "}
                  {groupInfo.description}
                </div>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-gray-700">
                <span>
                  <span className="font-medium">Owner:</span>{" "}
                  {typeof groupInfo.owner === "object"
                    ? groupInfo.owner._serialized
                    : groupInfo.owner}
                </span>
                {groupInfo.createdAt && (
                  <span>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(groupInfo.createdAt).toLocaleString()}
                  </span>
                )}
                <span>
                  <span className="font-medium">Participants:</span>{" "}
                  {groupInfo.participants?.length}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {groupInfo.participants?.slice(0, 8).map((p) => (
                  <span
                    key={typeof p.id === "object" ? p.id._serialized : p.id}
                    className={`px-2 py-1 rounded bg-gray-100 border text-xs cursor-pointer ${
                      p.isAdmin || p.isSuperAdmin
                        ? "border-green-400 text-green-700 font-semibold"
                        : "border-gray-200"
                    }`}
                    title={typeof p.id === "object" ? p.id._serialized : p.id}
                  >
                    {/* Show name if exists, else fallback to number */}
                    {p.name ||
                      (typeof p.id === "object" ? p.id._serialized : p.id)
                        .replace(/^91/, "")
                        .replace(/@c\.us$/, "")}
                    {p.isSuperAdmin ? " 👑" : p.isAdmin ? " ⭐" : ""}
                  </span>
                ))}
                {groupInfo.participants?.length > 8 && (
                  <button
                    className="text-xs text-blue-600 underline cursor-pointer"
                    onClick={() => setShowAllParticipants(true)}
                    type="button"
                  >
                    View all ({groupInfo.participants.length})
                  </button>
                )}
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button
                  size="sm"
                  className="bg-[#25D366] hover:bg-[#20bd5c] text-white rounded-full text-xs px-2 py-1"
                  onClick={() => setGroupActionModal({ action: "add", open: true })}
                >
                  Add Members
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full text-xs px-2 py-1"
                  onClick={() => setGroupActionModal({ action: "remove", open: true })}
                >
                  Remove Members
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs px-2 py-1"
                  onClick={() => setGroupActionModal({ action: "promote", open: true })}
                >
                  Make Admin
                </Button>
                <Button
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-xs px-2 py-1"
                  onClick={() => setGroupActionModal({ action: "demote", open: true })}
                >
                  Remove Admin
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto pr-2 flex flex-col ">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <AiOutlineLoading3Quarters className="animate-spin text-3xl text-[#075E54]" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex text-gray-500 text-sm justify-center">
                No messages found
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isSender = msg.sent === 1;
                  const repliedMsg = msg.reply;

                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className={`group relative max-w-[70%] px-4 py-2 rounded-lg text-sm
                        ${isSender ? "bg-[#DCF8C6] self-end ml-auto" : "bg-[#F0F0F0] self-start"}
                        ${highlightedMsgId === msg.id ? "ring-2 ring-green-400" : ""}
                        my-1 mx-4
                        cursor-pointer
                        ${selectedMsgId === msg.id ? "ring-2 ring-red-400" : ""}
                      `}
                      onClick={() => setSelectedMsgId(msg.id === selectedMsgId ? null : msg.id)}
                    >
                      {/* 3-dots menu top right */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 transition bg-white rounded-full shadow p-1 cursor-pointer"
                            style={{ zIndex: 2 }}
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-32" align="end" sideOffset={4}>
                          <DropdownMenuItem
                            onClick={() => {
                              setReplyTo(msg);
                            }}
                          >
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setMsgIdToDelete(msg.id);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="font-semibold text-xs mb-1 text-gray-700">
                        {isSender
                          ? "You"
                          : msg.author &&
                            !/^(\d{10,})@c\.us$/.test(msg.author) &&
                            !msg.author.endsWith("@g.us")
                          ? msg.author
                          : msg.from && msg.from.endsWith("@g.us")
                          ? selectedChat?.name || "Group"
                          : msg.from
                          ? msg.from.replace(/^91/, "").replace(/@c\.us$/, "")
                          : "Other"}
                      </div>
                      {/* Replied message UI */}
                      {repliedMsg && (
                        <div
                          className={`relative border-l-4 pl-3 mb-2 text-xs bg-green-50 rounded-md cursor-pointer transition
                            ${highlightedMsgId === repliedMsg.toMessageId ? "border-blue-500 bg-blue-100" : "border-green-400"}
                          `}
                          onClick={() => handleHighlight(repliedMsg.toMessageId)}
                          title="Go to replied message"
                          style={{
                            minHeight: 32,
                            marginBottom: 6,
                            paddingTop: 6,
                            paddingBottom: 6,
                            boxShadow: "0 1px 2px rgba(60,180,80,0.04)",
                          }}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <ReplyIcon className="w-3 h-3 text-green-600" />
                            <span className="font-semibold text-green-700 truncate max-w-[100px]">
                              {repliedMsg.toFromMe ? "You" : repliedMsg.toAuthor || "Other"}
                            </span>
                            {repliedMsg.toType && (
                              <span className="ml-1 mr-2 text-gray-400">
                                [{repliedMsg.toType}]
                              </span>
                            )}
                          </div>
                          <div className="truncate text-gray-700 font-medium max-w-[180px]">
                            {repliedMsg.toBody
                              ? repliedMsg.toBody.length > 60
                                ? repliedMsg.toBody.slice(0, 60) + "…"
                                : repliedMsg.toBody
                              : <i className="text-gray-400">[Media message]</i>}
                          </div>
                          <span className="absolute right-2 top-2 text-gray-300 text-xs">
                            {/* Optional: add a subtle quote bar or icon */}
                          </span>
                        </div>
                      )}
                      <div>
                        {/* If there is media, wrap text and image in a flex container */}
                        {msg.hasMedia && msg.media && msg.media.data ? (
                          <div className="flex flex-col max-w-xs">
                            {/* Media */}
                            {msg.media.mimetype.startsWith("image/") ? (
                              <img
                                src={`data:${msg.media.mimetype};base64,${msg.media.data}`}
                                alt={msg.media.filename || "media"}
                                className="max-w-xs max-h-60 rounded shadow mb-2"
                              />
                            ) : msg.media.mimetype.startsWith("video/") ? (
                              <video
                                controls
                                className="max-w-xs max-h-60 rounded shadow mb-2"
                                src={`data:${msg.media.mimetype};base64,${msg.media.data}`}
                              />
                            ) : (
                              <a
                                href={`data:${msg.media.mimetype};base64,${msg.media.data}`}
                                download={msg.media.filename || "file"}
                                className="text-blue-600 underline mb-2"
                              >
                                {msg.media.filename || "Download file"}
                              </a>
                            )}
                            {/* Message text, wrapped to image width */}
                            <div className="break-words max-w-xs">{msg.body || <i>[Media message]</i>}</div>
                          </div>
                        ) : (
                          // No media, just text
                          <div className="break-words max-w-xs">{msg.body || <i>[Media message]</i>}</div>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 text-right ">
                        {formatTime(msg.timestamp)}
                        {msg.failed && (
                          <span className="text-gray-500 text-xs ml-2">Failed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Reply preview UI */}
          {replyTo && (
            <div
              className="flex items-center gap-2 bg-gray-50 border-l-4 border-green-500 px-2 py-1 rounded mb-2 cursor-pointer max-w-xs"
              onClick={() => handleHighlight(replyTo.id)}
              title="Go to replied message"
              style={{ minHeight: 32 }}
            >
              <ReplyIcon className="w-4 h-4 text-green-600" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 truncate">Replying to:</div>
                <div className="text-xs text-gray-700 font-medium truncate max-w-[140px]">
                  {replyTo.body || "[Media message]"}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setReplyTo(null);
                }}
                className="text-gray-400 hover:text-gray-600 ml-1 cursor-pointer"
                tabIndex={-1}
                title="Cancel reply"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mt-2 flex gap-2 items-center">
            <Button
              type="button"
              className="rounded-full p-0 w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 cursor-pointer"
              onClick={() => fileInputRef.current.click()}
              title="Attach media"
            >
              <Plus className="w-6 h-6 text-[#075E54]" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*,video/*,application/pdf"
              onChange={handleMediaChange}
            />
            <Input
              placeholder="Type a message..."
              className="rounded-full flex-1 min-h-[48px] text-base cursor-pointer"
              style={{ height: "48px" }}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              className="bg-[#25D366] text-white hover:bg-[#20bd5c] rounded-full px-6 h-12 cursor-pointer"
              onClick={handleSend}
            >
              Send
            </Button>
          </div>

          {mediaFile && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-700 truncate">
                Selected: {mediaFile.name}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMediaFile(null)}
                className="text-red-500 cursor-pointer"
                title="Remove"
              >
                ×
              </Button>
            </div>
          )}

          {contextMenu.visible && (
            <div
              style={{
                position: "fixed",
                top: contextMenu.y,
                left: contextMenu.x,
                zIndex: 1000,
                background: "white",
                borderRadius: 6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                padding: "6px 0",
                minWidth: 120,
              }}
              onMouseLeave={() => setContextMenu({ ...contextMenu, visible: false })}
            >
              <button
                className="block w-full text-left text-xs px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={handleReplyFromMenu}
              >
                Reply
              </button>
            </div>
          )}

          <Dialog open={showAllParticipants} onOpenChange={setShowAllParticipants}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>All Participants</DialogTitle>
              </DialogHeader>
              <div className="max-h-72 overflow-y-auto space-y-1 mt-2">
                {groupInfo?.participants?.map((p) => (
                  <div
                    key={typeof p.id === "object" ? p.id._serialized : p.id}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                  >
                    <span
                      className="font-mono text-xs text-gray-700"
                      title={
                        (typeof p.id === "object" ? p.id._serialized : p.id)
                          .replace(/@c\.us$/, "")
                      }
                    >
                      {p.name
                        ? `${p.name} (${(typeof p.id === "object" ? p.id._serialized : p.id).replace(/@c\.us$/, "")})`
                        : (typeof p.id === "object" ? p.id._serialized : p.id).replace(/@c\.us$/, "")}
                    </span>
                    {p.isSuperAdmin ? (
                      <span title="Super Admin">👑</span>
                    ) : p.isAdmin ? (
                      <span title="Admin">⭐</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Confirm Delete Dialog */}
          <ConfirmDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <ConfirmDialogContent className="max-w-xs">
              <ConfirmDialogHeader>
                <ConfirmDialogTitle>Are you sure?</ConfirmDialogTitle>
              </ConfirmDialogHeader>
              <div className="py-2 text-sm text-gray-700">
                Do you really want to delete this message?
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setMsgIdToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => handleDeleteMessage(msgIdToDelete)}
                >
                  Delete
                </Button>
              </div>
            </ConfirmDialogContent>
          </ConfirmDialog>

          {/* Group Action Form - Add/Remove Participants */}
          {groupInfo && (
            <Dialog open={groupActionModal.open} onOpenChange={() => setGroupActionModal({ action: null, open: false })}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {groupActionModal.action === "add" && "Add Members"}
                    {groupActionModal.action === "remove" && "Remove Members"}
                    {groupActionModal.action === "promote" && "Make Admin"}
                    {groupActionModal.action === "demote" && "Remove Admin"}
                  </DialogTitle>
                </DialogHeader>
                <GroupActionForm
                  action={groupActionModal.action}
                  groupInfo={groupInfo}
                  onClose={() => setGroupActionModal({ action: null, open: false })}
                />
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </main>
  );
}