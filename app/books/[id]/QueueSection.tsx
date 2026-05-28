"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QueueEntry = {
  id: string;
  position: number;
  status: string;
  note: string | null;
  user: { id: string; username: string; name: string };
};

export default function QueueSection({
  bookId,
  myEntry,
  queueLength,
  ownerEntries,
}: {
  bookId: string;
  myEntry: QueueEntry | null;
  queueLength: number;
  ownerEntries?: QueueEntry[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [err, setErr] = useState("");
  const [noteText, setNoteText] = useState("");
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);

  const isOwner = !!ownerEntries;

  async function joinQueue() {
    setLoading("join");
    setErr("");
    const res = await fetch(`/api/books/${bookId}/queue`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Failed."); setLoading(""); return; }
    router.refresh();
    setLoading("");
  }

  async function leaveQueue() {
    setLoading("leave");
    setErr("");
    const res = await fetch(`/api/books/${bookId}/queue`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); setErr(d.error || "Failed."); setLoading(""); return; }
    router.refresh();
    setLoading("");
  }

  async function ownerAction(entryId: string, action: string, note?: string) {
    setLoading(action + entryId);
    setErr("");
    const res = await fetch(`/api/books/${bookId}/queue/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Failed."); setLoading(""); return; }
    setShowNoteFor(null);
    setNoteText("");
    router.refresh();
    setLoading("");
  }

  if (isOwner) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Queue ({ownerEntries!.length} waiting)
        </h2>
        {err && <p className="text-red-500 text-xs mb-3">{err}</p>}
        <div className="space-y-3">
          {ownerEntries!.map((e) => (
            <div key={e.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-black">#{e.position} @{e.user.username}</p>
                  <p className="text-xs text-gray-400">{e.user.name}</p>
                  {e.note && <p className="text-xs text-gray-500 mt-1 italic">{e.note}</p>}
                  {e.status === "OFFERED" && (
                    <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Offered</span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {e.status !== "OFFERED" && (
                    <button
                      onClick={() => ownerAction(e.id, "offer")}
                      disabled={loading === "offer" + e.id}
                      className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-medium hover:bg-zinc-800 transition-all disabled:opacity-50">
                      {loading === "offer" + e.id ? "…" : "Offer"}
                    </button>
                  )}
                  <button
                    onClick={() => setShowNoteFor(showNoteFor === e.id ? null : e.id)}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 transition-all">
                    Note
                  </button>
                  <button
                    onClick={() => ownerAction(e.id, "decline")}
                    disabled={loading === "decline" + e.id}
                    className="text-xs text-red-500 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 transition-all disabled:opacity-50">
                    {loading === "decline" + e.id ? "…" : "Remove"}
                  </button>
                </div>
              </div>
              {showNoteFor === e.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Available from next Monday…"
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    onClick={() => ownerAction(e.id, "note", noteText)}
                    disabled={!noteText.trim() || loading === "note" + e.id}
                    className="px-3 py-2 bg-black text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50">
                    {loading === "note" + e.id ? "…" : "Send"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Borrower view
  if (myEntry) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Your queue position</h2>
        {err && <p className="text-red-500 text-xs mb-3">{err}</p>}
        <div className="flex items-center justify-between">
          <div>
            {myEntry.status === "OFFERED" ? (
              <>
                <p className="font-semibold text-green-600 text-sm">The book has been offered to you!</p>
                <p className="text-xs text-gray-400 mt-0.5">Request the loan from the owner to confirm.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-black">You&apos;re #{myEntry.position} in the queue</p>
                <p className="text-xs text-gray-400 mt-0.5">{queueLength} total waiting</p>
              </>
            )}
            {myEntry.note && <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-gray-200 pl-2">Owner: {myEntry.note}</p>}
          </div>
          <button
            onClick={leaveQueue}
            disabled={loading === "leave"}
            className="text-xs text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50 font-medium">
            {loading === "leave" ? "…" : "Leave queue"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Reserve this book</h2>
      <p className="text-sm text-gray-500 mb-4">
        This book is currently on loan. Join the queue to be notified when it&apos;s available.
        {queueLength > 0 && <span className="font-medium text-black"> {queueLength} {queueLength === 1 ? "person" : "people"} already waiting.</span>}
      </p>
      {err && <p className="text-red-500 text-xs mb-3">{err}</p>}
      <button
        onClick={joinQueue}
        disabled={loading === "join"}
        className="w-full bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50">
        {loading === "join" ? "Joining…" : "Join queue"}
      </button>
    </div>
  );
}
