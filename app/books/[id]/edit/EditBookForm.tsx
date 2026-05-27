"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const GENRES = ["Fiction","Non-Fiction","Science","History","Fantasy","Mystery","Biography","Self-Help","Textbook","Graphic Novel","Poetry","Other"];
const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "MINOR_WEAR", label: "Minor Wear" },
  { value: "MAJOR_WEAR", label: "Major Wear" },
  { value: "SEVERE_WEAR", label: "Severe Wear (Pages Missing)" },
];

type Initial = { title: string; author: string; condition: string; genres: string[]; description: string; coverPhoto: string | null };

export default function EditBookForm({ id, initial }: { id: string; initial: Initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [author, setAuthor] = useState(initial.author);
  const [condition, setCondition] = useState(initial.condition);
  const [genres, setGenres] = useState<string[]>(initial.genres);
  const [description, setDescription] = useState(initial.description);
  const [coverPreview, setCoverPreview] = useState<string | null>(initial.coverPhoto);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleGenre(g: string) {
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setErrors({ title: "Title is required." }); return; }
    if (!condition) { setErrors({ condition: "Please select a condition." }); return; }

    setIsLoading(true);

    let coverPhoto: string | null | undefined = undefined;
    if (coverFile) {
      const fd = new FormData();
      fd.append("file", coverFile);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const text = await up.text();
      const upData = text ? JSON.parse(text) : {};
      if (!up.ok) { setErrors({ cover: upData.error || "Upload failed." }); setIsLoading(false); return; }
      coverPhoto = upData.url;
    }

    const res = await fetch(`/api/books/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        author: author.trim() || null,
        condition,
        genres,
        description: description.trim() || null,
        ...(coverPhoto !== undefined && { coverPhoto }),
      }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) { setErrors({ form: data.error || "Something went wrong." }); setIsLoading(false); return; }
    router.push("/catalogue");
  }

  async function handleDelete() {
    if (!confirm("Remove this listing? This cannot be undone.")) return;
    setIsDeleting(true);
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    router.push("/catalogue");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-100 p-6">
      {/* Cover photo */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Cover photo</label>
        <div className="flex items-start gap-4">
          <button type="button" onClick={() => fileRef.current?.click()} className="group relative">
            {coverPreview ? (
              <div className="w-24 h-36 rounded-xl overflow-hidden border border-gray-200 relative">
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <span className="text-white text-xs font-medium">Change</span>
                </div>
              </div>
            ) : (
              <div className="w-24 h-36 rounded-xl border-2 border-dashed border-gray-200 group-hover:border-gray-400 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                <span className="text-xs">Upload</span>
              </div>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-2">JPEG, PNG or WebP · max 5 MB</p>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        {errors.cover && <p className="text-red-500 text-xs mt-1">{errors.cover}</p>}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-black mb-1.5">Title <span className="text-red-400">*</span></label>
        <input id="title" type="text" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }} className={ic(!!errors.title)} />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Author */}
      <div>
        <label htmlFor="author" className="block text-sm font-medium text-black mb-1.5">Author <span className="text-gray-400 font-normal">(optional)</span></label>
        <input id="author" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className={ic(false)} />
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Condition <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-2 gap-2">
          {CONDITIONS.map((c) => (
            <button key={c.value} type="button" onClick={() => { setCondition(c.value); setErrors((p) => ({ ...p, condition: "" })); }}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${condition === c.value ? "border-black bg-black text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}>
              {c.label}
            </button>
          ))}
        </div>
        {errors.condition && <p className="text-red-500 text-xs mt-1">{errors.condition}</p>}
      </div>

      {/* Genres */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Genres</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button key={g} type="button" onClick={() => toggleGenre(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${genres.includes(g) ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="desc" className="block text-sm font-medium text-black mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none" />
      </div>

      {errors.form && (
        <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          <span className="mt-px shrink-0">⚠</span><span>{errors.form}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={isLoading}
          className="flex-1 bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={handleDelete} disabled={isDeleting}
          className="px-5 py-3.5 rounded-xl text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {isDeleting ? "Removing…" : "Remove"}
        </button>
      </div>
    </form>
  );
}

function ic(hasError: boolean) {
  return `w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${hasError ? "border-red-300 bg-red-50" : "border-gray-200"}`;
}
