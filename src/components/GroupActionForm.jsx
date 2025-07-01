import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus, UserMinus, Shield, ShieldOff, Users } from "lucide-react"; // Add icon imports

export default function GroupActionForm({ action, groupInfo, onClose, refresh }) {
  const [numbers, setNumbers] = useState(""); // For add members only
  const [selected, setSelected] = useState([]); // For remove/promote/demote
  const [loading, setLoading] = useState(false);

  const base_api_url = process.env.NEXT_PUBLIC_BASE_API_URL;
  const base_api_port = process.env.NEXT_PUBLIC_BASE_API_PORT;

  // Helper function to get action icon
  const getActionIcon = () => {
    switch (action) {
      case "add":
        return <UserPlus className="w-4 h-4" />;
      case "remove":
        return <UserMinus className="w-4 h-4" />;
      case "promote":
        return <Shield className="w-4 h-4" />;
      case "demote":
        return <ShieldOff className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  // Helper function to get action text
  const getActionText = () => {
    switch (action) {
      case "add":
        return "Add Members";
      case "remove":
        return "Remove Members";
      case "promote":
        return "Make Admin";
      case "demote":
        return "Remove Admin";
      default:
        return "Submit";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let url = "";
    let body = {};
    
    if (action === "add") {
      url = `${base_api_url}:${base_api_port}/api/add-members`;
      body = {
        groupId: groupInfo.id,
        members: parseMembers(numbers),
      };
    } else if (["remove", "promote", "demote"].includes(action)) {
      url =
        action === "remove"
          ? `${base_api_url}:${base_api_port}/api/remove-members`
          : `${base_api_url}:${base_api_port}/api/manage-admins`;
      body = {
        groupId: groupInfo.id,
        members: selected,
        ...(action !== "remove" && { action }),
      };
    }
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message || "Action successful!");
        if (refresh) {
          await refresh(); // Call refresh function after successful action
        }
      } else {
        toast.error(data.error || "Action failed!");
      }
    } catch (err) {
      console.error("Action error:", err);
      toast.error("Network error");
    }
    
    setLoading(false);
    onClose();
  };

  // Helper: parse numbers and add @c.us if needed
  const parseMembers = (str) =>
    str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((num) =>
        /^\d{10}$/.test(num)
          ? "91" + num + "@c.us"
          : /^\d{12}$/.test(num)
          ? num + "@c.us"
          : num.endsWith("@c.us")
          ? num
          : num
      );

  // For remove/promote/demote, show participant picker
  if (["remove", "promote", "demote"].includes(action)) {
    // Filter participants for the action
    const filteredParticipants = groupInfo.participants
      ?.filter((p) => {
        if (p.isSuperAdmin) return false;
        if (action === "promote" && p.isAdmin) return false;
        if (action === "demote" && !p.isAdmin) return false; // Only show admins for Remove Admin
        return true;
      });

    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
          {filteredParticipants.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-4 flex flex-col items-center gap-2">
              {getActionIcon()}
              <span>
                {action === "promote"
                  ? "All participants are already admins."
                  : action === "demote"
                  ? "No admins to remove."
                  : "No participants found."}
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2 pb-1 border-b">
                <Users className="w-3 h-3" />
                <span>Select participants:</span>
              </div>
              {filteredParticipants.map((p) => {
                const id =
                  typeof p.id === "object" ? p.id._serialized : p.id;
                const label =
                  p.name ||
                  id.replace(/^91/, "").replace(/@c\.us$/, "");
                return (
                  <label
                    key={id}
                    className="flex items-center gap-2 py-1 cursor-pointer text-xs hover:bg-gray-100 rounded px-2"
                  >
                    <input
                      type="checkbox"
                      value={id}
                      checked={selected.includes(id)}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, id]
                            : prev.filter((v) => v !== id)
                        );
                      }}
                      className="accent-[#25D366]"
                    />
                    <span className="flex items-center gap-1">
                      {label}
                      {p.isAdmin && <span className="text-yellow-500">⭐</span>}
                      {p.isSuperAdmin && <span className="text-yellow-600">👑</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <Button
          type="submit"
          className="w-full rounded-full bg-[#25D366] hover:bg-[#20bd5c] text-white font-bold flex items-center justify-center gap-2"
          disabled={loading || selected.length === 0 || filteredParticipants.length === 0}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              {getActionIcon()}
              {getActionText()}
            </>
          )}
        </Button>
      </form>
    );
  }

  // For add members, keep input
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <UserPlus className="w-3 h-3" />
          <span>Enter member numbers:</span>
        </div>
        <Input
          placeholder="Members (e.g. 9999999999, 918888888888)"
          value={numbers}
          onChange={(e) => setNumbers(e.target.value)}
          className="rounded-full pl-4"
        />
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>Separate numbers with commas. 10-digit numbers need to be prefixed with 91.</span>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full rounded-full bg-[#25D366] hover:bg-[#20bd5c] text-white font-bold flex items-center justify-center gap-2"
        disabled={loading || !numbers}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Adding...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Add Members
          </>
        )}
      </Button>
    </form>
  );
}