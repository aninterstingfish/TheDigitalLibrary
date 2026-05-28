"use client";

import { useState } from "react";
import Link from "next/link";

type BookRating = {
  id: string;
  stars: number;
  review: string | null;
  createdAt: string;
  user: { id: string; username: string; name: string };
};

export default function BookRatings({
  bookId,
  initialRatings,
  canRate,
  currentUserId,
}: {
  bookId: string;
  initialRatings: BookRating[];
  canRate: boolean;
  currentUserId: string;
}) {
  const [ratings, setRatings] = useState(initialRatings);
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const myRating = ratings.find((r) => r.user.id === currentUserId);
  const avg = ratings.length
    ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
    : null;

  async function submitRating() {
    if (!selected) { setError("Please select a star rating."); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/books/${bookId}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars: selected, review: review.trim() || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
    setRatings((prev) => [data, ...prev]);
    setSubmitted(true);
    setLoading(false);
  }

  async function deleteRating() {
    if (!myRating) return;
    setLoading(true);
    const res = await fetch(`/api/books/${bookId}/ratings`, { method: "DELETE" });
    if (res.ok) {
      setRatings((prev) => prev.filter((r) => r.id !== myRating.id));
      setSelected(0);
      setReview("");
      setSubmitted(false);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-black">Book ratings</h2>
        {avg && (
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-lg leading-none">★</span>
            <span className="font-bold text-black">{avg}</span>
            <span className="text-xs text-gray-400">({ratings.length} {ratings.length === 1 ? "rating" : "ratings"})</span>
          </div>
        )}
      </div>

      {canRate && !myRating && !submitted && (
        <div className="mb-5 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium text-black mb-2">Rate this book</p>
          <div className="flex gap-0.5 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setSelected(star)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                className="text-2xl transition-colors leading-none"
              >
                <span className={(hovered || selected) >= star ? "text-amber-400" : "text-gray-200"}>★</span>
              </button>
            ))}
          </div>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write a short review (optional)…"
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          <button
            onClick={submitRating}
            disabled={loading || !selected}
            className="mt-2 px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit rating"}
          </button>
        </div>
      )}

      {ratings.length === 0 ? (
        <p className="text-gray-400 text-sm">{canRate ? "Be the first to rate this book." : "No ratings yet."}</p>
      ) : (
        <div className="space-y-4">
          {ratings.map((r) => (
            <div key={r.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-600">
                {r.user.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/profile/${r.user.username}`} className="text-sm font-medium text-black hover:underline">
                    @{r.user.username}
                  </Link>
                  <span className="text-sm">
                    <span className="text-amber-400">{"★".repeat(r.stars)}</span>
                    <span className="text-gray-200">{"★".repeat(5 - r.stars)}</span>
                  </span>
                  {r.user.id === currentUserId && (
                    <button
                      onClick={deleteRating}
                      disabled={loading}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {r.review && <p className="text-sm text-gray-600 mt-0.5">{r.review}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
