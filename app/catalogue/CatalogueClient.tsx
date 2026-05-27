"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const GENRES = ["Fiction","Non-Fiction","Science","History","Fantasy","Mystery","Biography","Self-Help","Textbook","Graphic Novel","Poetry","Other"];

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  MINOR_WEAR: "Minor Wear",
  MAJOR_WEAR: "Major Wear",
  SEVERE_WEAR: "Severe Wear",
};

const CONDITION_COLORS: Record<string, string> = {
  NEW: "bg-emerald-100 text-emerald-700",
  MINOR_WEAR: "bg-yellow-100 text-yellow-700",
  MAJOR_WEAR: "bg-orange-100 text-orange-700",
  SEVERE_WEAR: "bg-red-100 text-red-700",
};

type Book = {
  id: string;
  title: string;
  author: string | null;
  condition: string;
  coverPhoto: string | null;
  genres: string[];
  isAvailable: boolean;
  requestCount: number;
  owner: { username: string; name: string };
  isWishlisted: boolean;
  isOwnBook: boolean;
};

export default function CatalogueClient({ books }: { books: Book[] }) {
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [sortByRequests, setSortByRequests] = useState(true);
  const [wishlist, setWishlist] = useState<Set<string>>(
    new Set(books.filter((b) => b.isWishlisted).map((b) => b.id))
  );

  const filtered = useMemo(() => {
    let result = books;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(q));
    }
    if (selectedGenre) {
      result = result.filter((b) => b.genres.includes(selectedGenre));
    }
    if (selectedCondition) {
      result = result.filter((b) => b.condition === selectedCondition);
    }
    if (sortByRequests) {
      result = [...result].sort((a, b) => b.requestCount - a.requestCount);
    }
    return result;
  }, [books, query, selectedGenre, selectedCondition, sortByRequests]);

  async function toggleWishlist(bookId: string) {
    const isInWishlist = wishlist.has(bookId);
    const next = new Set(wishlist);
    if (isInWishlist) next.delete(bookId);
    else next.add(bookId);
    setWishlist(next);
    await fetch(`/api/wishlist/${bookId}`, { method: isInWishlist ? "DELETE" : "POST" });
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Search + sort row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>
        <button
          onClick={() => setSortByRequests((v) => !v)}
          className={`shrink-0 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
            sortByRequests ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          {sortByRequests ? "↓ Most requested" : "↓ Newest first"}
        </button>
      </div>

      {/* Genre chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Chip label="All genres" active={!selectedGenre} onClick={() => setSelectedGenre("")} />
        {GENRES.map((g) => (
          <Chip key={g} label={g} active={selectedGenre === g} onClick={() => setSelectedGenre(g === selectedGenre ? "" : g)} />
        ))}
      </div>

      {/* Condition chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Chip label="Any condition" active={!selectedCondition} onClick={() => setSelectedCondition("")} />
        {Object.entries(CONDITION_LABELS).map(([k, v]) => (
          <Chip key={k} label={v} active={selectedCondition === k} onClick={() => setSelectedCondition(k === selectedCondition ? "" : k)} />
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-5">
        {filtered.length} {filtered.length === 1 ? "book" : "books"}
        {query.trim() && ` matching "${query.trim()}"`}
        {selectedGenre && ` · ${selectedGenre}`}
        {selectedCondition && ` · ${CONDITION_LABELS[selectedCondition]}`}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-28">
          <p className="text-gray-500 text-lg font-medium">No books found</p>
          <p className="text-gray-300 text-sm mt-2">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isWishlisted={wishlist.has(book.id)}
              onWishlist={() => toggleWishlist(book.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        active ? "bg-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
      }`}
    >
      {label}
    </button>
  );
}

function BookCard({ book, isWishlisted, onWishlist }: { book: Book; isWishlisted: boolean; onWishlist: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Cover */}
      <div className="relative aspect-[2/3] bg-gray-100">
        {book.coverPhoto ? (
          <img src={book.coverPhoto} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        {!book.isAvailable && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full tracking-wide">On Loan</span>
          </div>
        )}

        {!book.isOwnBook && (
          <button
            onClick={onWishlist}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg
              className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? "text-red-500 fill-red-500" : "text-gray-400 fill-none"}`}
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <p className="font-semibold text-black text-xs leading-tight line-clamp-2">{book.title}</p>
          {book.author && <p className="text-gray-400 text-xs mt-0.5 truncate">{book.author}</p>}
        </div>

        {book.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {book.genres.slice(0, 2).map((g) => (
              <span key={g} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{g}</span>
            ))}
            {book.genres.length > 2 && <span className="text-xs text-gray-400">+{book.genres.length - 2}</span>}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONDITION_COLORS[book.condition] ?? "bg-gray-100 text-gray-600"}`}>
            {CONDITION_LABELS[book.condition] ?? book.condition}
          </span>
          <span className="text-xs text-gray-400 truncate ml-1">@{book.owner.username}</span>
        </div>

        {book.isOwnBook ? (
          <Link
            href={`/books/${book.id}/edit`}
            className="mt-1 w-full text-center text-xs font-semibold py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
          >
            Edit listing
          </Link>
        ) : (
          <Link
            href={book.isAvailable ? `/books/${book.id}` : "#"}
            className={`mt-1 w-full text-center text-xs font-semibold py-2 rounded-xl transition-all ${
              book.isAvailable
                ? "bg-black text-white hover:bg-zinc-800"
                : "bg-gray-100 text-gray-400 pointer-events-none"
            }`}
          >
            {book.isAvailable ? "Request loan" : "On loan"}
          </Link>
        )}
      </div>
    </div>
  );
}
