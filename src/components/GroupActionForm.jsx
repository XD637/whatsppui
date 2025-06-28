import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GroupActionForm({ action, groupInfo, onClose, refresh }) {
  const [numbers, setNumbers] = useState(""); // For add members only
  const [selected, setSelected] = useState([]); // For remove/promote/demote
  const [loading, setLoading] = useState(false);

  const base_api_url = process.env.NEXT_PUBLIC_BASE_API_URL;
  const base_api_port = process.env.NEXT_PUBLIC_BASE_API_PORT;

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
      if (action !== "add") {
        if (data.success) {
          toast.success(data.message || "Action successful!");
          if (refresh) refresh();
        } else {
          toast.error(data.error || "Action failed!");
        }
      } else {
        // For add, still refresh but no toast
        if (data.success && refresh) refresh();
      }
    } catch (err) {
      if (action !== "add") {
        toast.error("Network error");
      }
    }
    setLoading(false);
    onClose();
  };

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
            <div className="text-xs text-gray-500 text-center py-4">
              {action === "promote"
                ? "All participants are already admins."
                : action === "demote"
                ? "No admins to remove."
                : "No participants found."}
            </div>
          ) : (
            filteredParticipants.map((p) => {
              const id =
                typeof p.id === "object" ? p.id._serialized : p.id;
              const label =
                p.name ||
                id.replace(/^91/, "").replace(/@c\.us$/, "");
              return (
                <label
                  key={id}
                  className="flex items-center gap-2 py-1 cursor-pointer text-xs"
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
                  <span>
                    {label}
                    {p.isAdmin ? " ⭐" : ""}
                  </span>
                </label>
              );
            })
          )}
        </div>
        <Button
          type="submit"
          className="w-full rounded-full bg-[#25D366] hover:bg-[#20bd5c] text-white font-bold"
          disabled={loading || selected.length === 0 || filteredParticipants.length === 0}
        >
          {loading ? "Processing..." : "Submit"}
        </Button>
      </form>
    );
  }

  // For add members, keep input
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        placeholder="Members (e.g. 9999999999, 918888888888)"
        value={numbers}
        onChange={(e) => setNumbers(e.target.value)}
        className="rounded-full"
      />
      <Button
        type="submit"
        className="w-full rounded-full bg-[#25D366] hover:bg-[#20bd5c] text-white font-bold"
        disabled={loading || !numbers}
      >
        {loading ? "Processing..." : "Submit"}
      </Button>
    </form>
  );
}