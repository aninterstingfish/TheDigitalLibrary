"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const approve = async () => {
    setLoading(true);
    await fetch(`/api/admin/approve/${userId}`, { method: "POST" });
    setDone(true);
    setLoading(false);
    router.refresh();
  };

  if (done) return <span className="text-green-600 text-xs font-semibold">Approved ✓</span>;

  return (
    <button
      onClick={approve}
      disabled={loading}
      className="shrink-0 bg-black text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50"
    >
      {loading ? "Approving…" : "Approve"}
    </button>
  );
}
