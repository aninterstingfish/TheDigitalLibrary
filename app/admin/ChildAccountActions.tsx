"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChildAccountActions({ userId, paused }: { userId: string; paused: boolean }) {
  const [loading, setLoading] = useState("");
  const [err, setErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  async function act(action: "pause" | "resume" | "delete") {
    setLoading(action);
    setErr("");
    const res = await fetch(`/api/admin/account/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const d = await res.json();
      setErr(d.error || "Something went wrong.");
      setLoading("");
      return;
    }
    setLoading("");
    setConfirmDelete(false);
    router.refresh();
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-50">
      {err && <p className="text-red-500 text-xs mb-2">{err}</p>}
      {!confirmDelete ? (
        <div className="flex items-center gap-2 flex-wrap">
          {paused ? (
            <button onClick={() => act("resume")} disabled={loading === "resume"}
              className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100 transition-all disabled:opacity-50">
              {loading === "resume" ? "…" : "Resume account"}
            </button>
          ) : (
            <button onClick={() => act("pause")} disabled={loading === "pause"}
              className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-100 transition-all disabled:opacity-50">
              {loading === "pause" ? "…" : "Pause account"}
            </button>
          )}
          <button onClick={() => setConfirmDelete(true)}
            className="text-xs text-red-500 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 transition-all">
            Delete account
          </button>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-xs text-red-700 font-medium mb-2">Delete this account permanently? This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => act("delete")} disabled={loading === "delete"}
              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-red-600 transition-all disabled:opacity-50">
              {loading === "delete" ? "Deleting…" : "Yes, delete"}
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
