import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";
import RemoveWishlistButton from "./RemoveWishlistButton";

const CONDITION_COLORS: Record<string, string> = { NEW: "bg-emerald-100 text-emerald-700", MINOR_WEAR: "bg-yellow-100 text-yellow-700", MAJOR_WEAR: "bg-orange-100 text-orange-700", SEVERE_WEAR: "bg-red-100 text-red-700" };
const CONDITION_LABELS: Record<string, string> = { NEW: "New", MINOR_WEAR: "Minor Wear", MAJOR_WEAR: "Major Wear", SEVERE_WEAR: "Severe Wear" };

export default async function WishlistPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.userId },
    include: { book: { select: { id: true, title: true, author: true, condition: true, coverPhoto: true, genres: true, isAvailable: true, owner: { select: { username: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-1">Wishlist</h1>
        <p className="text-gray-500 text-sm mb-8">Books you&apos;re keeping an eye on.</p>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-gray-400 text-sm">Your wishlist is empty.</p>
            <Link href="/catalogue" className="inline-block mt-4 text-sm font-semibold text-black underline underline-offset-2">Browse the catalogue</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {items.map(({ book }) => {
              const genres: string[] = (() => { try { return JSON.parse(book.genres); } catch { return []; } })();
              return (
                <div key={book.id} className="group bg-white rounded-xl border border-gray-100 overflow-hidden relative">
                  <Link href={`/books/${book.id}`}>
                    <div className="aspect-[2/3] bg-gray-100 overflow-hidden">
                      {book.coverPhoto
                        ? <img src={book.coverPhoto} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center"><svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
                      }
                      {!book.isAvailable && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-full">On Loan</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link href={`/books/${book.id}`}>
                      <p className="text-xs font-semibold text-black line-clamp-1 hover:underline">{book.title}</p>
                      {book.author && <p className="text-xs text-gray-400 truncate">{book.author}</p>}
                    </Link>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${CONDITION_COLORS[book.condition] ?? "bg-gray-100 text-gray-600"}`}>{CONDITION_LABELS[book.condition] ?? book.condition}</span>
                      <RemoveWishlistButton bookId={book.id} />
                    </div>
                    {genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {genres.slice(0, 2).map((g) => <span key={g} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{g}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
