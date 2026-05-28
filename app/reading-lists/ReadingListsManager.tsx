"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ReadingList = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  isTeacherList: boolean;
  itemCount: number;
};

export default function ReadingListsManager({
  initialLists,
  isTeacher,
}: {
  initialLists: ReadingList[];
  isTeacher: boolean;
}) {
  const router = useRouter();
  const [lists, setLists] = useState(initialLists);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isTeacherList, setIsTeacherList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createList(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/reading-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, isPublic, isTeacherList }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
    setLists((prev) => [{ ...data, itemCount: 0 }, ...prev]);
    setName("");
    setDescription("");
    setIsPublic(false);
    setIsTeacherList(false);
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function deleteList(id: string) {
    if (!confirm("Delete this list? This cannot be undone.")) return;
    const res = await fetch(`/api/reading-lists/${id}`, { method: "DELETE" });
    if (res.ok) setLists((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Reading lists</h1>
          <p className="text-gray-400 text-sm mt-1">Organise books into collections.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-all"
        >
          {showForm ? "Cancel" : "New list"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createList} className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1.5">List name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Summer reads, Must-borrow…"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this list for?"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-black">Public list</span>
            </label>
            {isTeacher && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTeacherList}
                  onChange={(e) => setIsTeacherList(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-black">Teacher-assigned</span>
              </label>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create list"}
          </button>
        </form>
      )}

      {/* Lists grid */}
      {lists.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400 text-sm">No lists yet.</p>
          <p className="text-gray-400 text-xs mt-1">Create a list to start organising your books.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lists.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-2 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/reading-lists/${l.id}`} className="font-semibold text-black hover:underline block truncate">
                    {l.name}
                  </Link>
                  {l.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{l.description}</p>}
                </div>
                <button
                  onClick={() => deleteList(l.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-lg leading-none"
                  aria-label="Delete list"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">{l.itemCount} {l.itemCount === 1 ? "book" : "books"}</span>
                {l.isPublic && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Public</span>
                )}
                {l.isTeacherList && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Teacher list</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
