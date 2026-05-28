"use client";

import { useState } from "react";

type BookRequest = {
  id: string;
  title: string;
  author: string | null;
  fulfilled: boolean;
  createdAt: string;
};

export default function BookRequestsClient({ initialRequests }: { initialRequests: BookRequest[] }) {
  const [requests, setRequests] = useState<BookRequest[]>(initialRequests);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [titleErr, setTitleErr] = useState("");
  const [formErr, setFormErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTitleErr("");
    setFormErr("");
    if (!title.trim()) { setTitleErr("Please enter a title."); return; }

    setLoading(true);
    const res = await fetch("/api/book-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), author: author.trim() || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.field === "title") setTitleErr(data.error);
      else setFormErr(data.error || "Something went wrong.");
      return;
    }
    setRequests((prev) => [data, ...prev]);
    setTitle("");
    setAuthor("");
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const res = await fetch(`/api/book-requests?id=${id}`, { method: "DELETE" });
    if (res.ok) setRequests((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
  }

  const open = requests.filter((r) => !r.fulfilled);
  const fulfilled = requests.filter((r) => r.fulfilled);

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-black">Request a book</h2>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-black">Title <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTitleErr(""); }}
            placeholder="e.g. The Hobbit"
            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${titleErr ? "border-red-300 bg-red-50" : "border-gray-200"}`}
          />
          {titleErr && <p className="text-red-500 text-xs">{titleErr}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-black">Author <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. J.R.R. Tolkien"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>
        {formErr && <p className="text-red-500 text-xs">{formErr}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add request"}
        </button>
      </form>

      {/* Open requests */}
      {open.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Watching ({open.length})</h2>
          <div className="space-y-2">
            {open.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-black">{r.title}</p>
                  {r.author && <p className="text-xs text-gray-400 mt-0.5">by {r.author}</p>}
                  <p className="text-xs text-gray-300 mt-0.5">Requested {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deleting === r.id}
                  className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-all disabled:opacity-50"
                >
                  {deleting === r.id ? "…" : "Remove"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fulfilled */}
      {fulfilled.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Found</h2>
          <div className="space-y-2">
            {fulfilled.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4 opacity-60">
                <div>
                  <p className="text-sm font-medium text-black line-through">{r.title}</p>
                  {r.author && <p className="text-xs text-gray-400 mt-0.5">by {r.author}</p>}
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Listed</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {requests.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400 text-sm">No requests yet.</p>
          <p className="text-gray-300 text-xs mt-1">Add a request above to get notified when a book is listed.</p>
        </div>
      )}
    </div>
  );
}
