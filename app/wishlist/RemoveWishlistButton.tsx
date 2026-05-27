"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoveWishlistButton({ bookId }: { bookId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function remove() {
    setLoading(true);
    await fetch(`/api/wishlist/${bookId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={remove} disabled={loading} title="Remove from wishlist"
      className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}
