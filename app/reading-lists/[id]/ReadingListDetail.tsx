"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Book = {
  id: string;
  title: string;
  author: string | null;
  coverPhoto: string | null;
  condition: string;
  isAvailable: boolean;
  series: string | null;
  seriesNumber: number | null;
  owner: { username: string };
};

type ListItem = { id: string; book: Book };

type ListData = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  isTeacherList: boolean;
  user: { id: string; username: string; name: string };
  items: ListItem[];
};

const CONDITION_COLORS: Record<string, string> = {
  NEW: "bg-emerald-100 text-emerald-700",
  MINOR_WEAR: "bg-yellow-100 text-yellow-700",
  MAJOR_WEAR: "bg-orange-100 text-orange-700",
  SEVERE_WEAR: "bg-red-100 text-red-700",
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  MINOR_WEAR: "Minor Wear",
  MAJOR_WEAR: "Major Wear",
  SEVERE_WEAR: "Severe Wear",
};

export default function ReadingListDetail({
  list: initialList,
  isOwner,
}: {
  list: ListData;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [list, setList] = useState(initialList);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(initialList.name);
  const [editDesc, setEditDesc] = useState(initialList.description ?? "");
  const [editPublic, setEditPublic] = useState(initialList.isPublic);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/reading-lists/${list.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null, isPublic: editPublic }),
    });
    if (res.ok) {
      setList((l) => ({ ...l, name: editName.trim(), description: editDesc.trim() || null, isPublic: editPublic }));
      setEditing(false);
    }
    setSaving(false);
  }

  async function deleteList() {
    if (!confirm("Delete this list? This cannot be undone.")) return;
    const res = await fetch(`/api/reading-lists/${list.id}`, { method: "DELETE" });
    if (res.ok) router.push("/reading-lists");
  }

  async function removeBook(bookId: string) {
    setRemoving(bookId);
    const res = await fetch(`/api/reading-lists/${list.id}/books?bookId=${bookId}`, { method: "DELETE" });
    if (res.ok) setList((l) => ({ ...l, items: l.items.filter((i) => i.book.id !== bookId) }));
    setRemoving(null);
  }

  return (
    <div>
      <Link href="/reading-lists" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-black transition-colors mb-8">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        My lists
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        {editing ? (
          <form onSubmit={saveEdit} className="space-y-3">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <input
              type="text"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editPublic} onChange={(e) => setEditPublic(e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
              <span className="text-sm text-black">Public list</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-black">{list.name}</h1>
                {list.isPublic && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Public</span>}
                {list.isTeacherList && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Teacher list</span>}
              </div>
              {list.description && <p className="text-gray-500 text-sm mt-1">{list.description}</p>}
              <p className="text-gray-400 text-xs mt-2">
                By <Link href={`/profile/${list.user.username}`} className="hover:underline">@{list.user.username}</Link>
                {" · "}{list.items.length} {list.items.length === 1 ? "book" : "books"}
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditing(true)} className="text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all">
                  Edit
                </button>
                <button onClick={deleteList} className="text-sm font-medium text-red-500 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all">
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Books grid */}
      {list.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400 text-sm">No books in this list yet.</p>
          {isOwner && (
            <p className="text-gray-400 text-xs mt-1">
              Browse the <Link href="/catalogue" className="text-black font-medium hover:underline">catalogue</Link> and use &ldquo;+ Add to list&rdquo; on any book.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {list.items.map(({ book }) => (
            <div key={book.id} className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
              <Link href={`/books/${book.id}`} className="block">
                <div className="aspect-[2/3] bg-gray-100 overflow-hidden">
                  {book.coverPhoto ? (
                    <img src={book.coverPhoto} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-black line-clamp-1">{book.title}</p>
                  {book.author && <p className="text-xs text-gray-400 truncate">{book.author}</p>}
                  {book.series && (
                    <p className="text-xs text-gray-300 truncate">{book.series}{book.seriesNumber ? ` #${book.seriesNumber}` : ""}</p>
                  )}
                  <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full ${CONDITION_COLORS[book.condition] ?? "bg-gray-100 text-gray-600"}`}>
                    {CONDITION_LABELS[book.condition] ?? book.condition}
                  </span>
                  {!book.isAvailable && (
                    <span className="inline-block mt-1 ml-1 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">On loan</span>
                  )}
                </div>
              </Link>
              {isOwner && (
                <button
                  onClick={() => removeBook(book.id)}
                  disabled={removing === book.id}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 rounded-full text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center text-sm shadow-sm disabled:opacity-50"
                  aria-label="Remove from list"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
