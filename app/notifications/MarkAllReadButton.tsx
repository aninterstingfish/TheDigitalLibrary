"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function markAll() {
    setLoading(true);
    await fetch("/api/notifications/read", { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={markAll} disabled={loading}
      className="text-sm font-medium bg-black text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50">
      {loading ? "Marking…" : "Mark all read"}
    </button>
  );
}
