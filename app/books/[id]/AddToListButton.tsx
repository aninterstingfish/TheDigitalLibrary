"use client";

import { useState, useRef, useEffect } from "react";

type ReadingList = { id: string; name: string; itemCount: number };

export default function AddToListButton({ bookId }: { bookId: string }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ReadingList[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function openDropdown() {
    setOpen((v) => !v);
    if (!lists) {
      setLoading(true);
      const res = await fetch("/api/reading-lists");
      if (res.ok) setLists(await res.json());
      setLoading(false);
    }
  }

  async function addToList(listId: string, listName: string) {
    const res = await fetch(`/api/reading-lists/${listId}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    });
    if (res.ok) {
      setAdded((prev) => new Set(prev).add(listId));
      setFeedback(`Added to "${listName}"`);
      setTimeout(() => setFeedback(""), 2000);
    } else {
      const d = await res.json();
      setFeedback(d.error || "Something went wrong.");
      setTimeout(() => setFeedback(""), 2000);
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={openDropdown}
        className="flex-1 sm:flex-none px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-black hover:bg-gray-50 transition-all"
      >
        + Add to list
      </button>
      {feedback && (
        <div className="absolute bottom-full left-0 mb-2 bg-black text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
          {feedback}
        </div>
      )}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
          {loading ? (
            <p className="text-sm text-gray-400 px-4 py-3">Loading…</p>
          ) : !lists || lists.length === 0 ? (
            <div className="px-4 py-3">
              <p className="text-sm text-gray-500">No lists yet.</p>
              <a href="/reading-lists" className="text-xs text-black font-medium hover:underline mt-1 block">
                Create a list →
              </a>
            </div>
          ) : (
            lists.map((l) => (
              <button
                key={l.id}
                onClick={() => addToList(l.id, l.name)}
                disabled={added.has(l.id)}
                className="w-full text-left px-4 py-2.5 text-sm text-black hover:bg-gray-50 flex items-center justify-between disabled:opacity-50"
              >
                <span className="truncate">{l.name}</span>
                {added.has(l.id) && <span className="text-xs text-green-600 shrink-0 ml-2">✓</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
