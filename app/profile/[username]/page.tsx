import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";

const CONDITION_COLORS: Record<string, string> = { NEW: "bg-emerald-100 text-emerald-700", MINOR_WEAR: "bg-yellow-100 text-yellow-700", MAJOR_WEAR: "bg-orange-100 text-orange-700", SEVERE_WEAR: "bg-red-100 text-red-700" };
const CONDITION_LABELS: Record<string, string> = { NEW: "New", MINOR_WEAR: "Minor Wear", MAJOR_WEAR: "Major Wear", SEVERE_WEAR: "Severe Wear" };

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true, name: true, username: true, profilePhoto: true, yearGroup: true, borrowLimit: true, createdAt: true,
      ownedBooks: {
        where: { isAvailable: true },
        select: { id: true, title: true, author: true, condition: true, coverPhoto: true, genres: true },
        orderBy: { createdAt: "desc" },
      },
      ratingsReceived: { select: { stars: true, review: true, role: true, createdAt: true, rater: { select: { name: true, username: true } } } },
    },
  });
  if (!user) notFound();

  const completedSwaps = await prisma.swap.count({ where: { request: { book: { ownerId: user.id } }, ownerConfirmedReturn: true } });
  const avgRating = user.ratingsReceived.length
    ? user.ratingsReceived.reduce((s, r) => s + r.stars, 0) / user.ratingsReceived.length
    : null;

  const isOwnProfile = session.userId === user.id;
  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-5 mb-5">
          <div className="w-16 h-16 rounded-full shrink-0 overflow-hidden bg-black flex items-center justify-center">
            {user.profilePhoto
              ? <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-xl">{initials}</span>
            }
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-black">{user.name}</h1>
            <p className="text-gray-400 text-sm">@{user.username}{user.yearGroup ? ` · Year ${user.yearGroup}` : ""}</p>
            <div className="flex items-center gap-5 mt-3">
              {avgRating !== null && (
                <div className="text-center">
                  <p className="text-lg font-bold text-black">{"★".repeat(Math.round(avgRating))}<span className="text-gray-200">{"★".repeat(5 - Math.round(avgRating))}</span></p>
                  <p className="text-xs text-gray-400">{avgRating.toFixed(1)} avg · {user.ratingsReceived.length} ratings</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-lg font-bold text-black">{completedSwaps}</p>
                <p className="text-xs text-gray-400">swaps completed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-black">{user.ownedBooks.length}</p>
                <p className="text-xs text-gray-400">books listed</p>
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <Link href="/settings" className="shrink-0 text-sm font-medium bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all">Edit profile</Link>
          )}
        </div>

        {/* Listed books */}
        {user.ownedBooks.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
            <h2 className="font-semibold text-black mb-4">Listed books</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {user.ownedBooks.map((book) => {
                const genres: string[] = (() => { try { return JSON.parse(book.genres); } catch { return []; } })();
                return (
                  <Link key={book.id} href={`/books/${book.id}`} className="group rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                    <div className="aspect-[2/3] bg-gray-100 overflow-hidden">
                      {book.coverPhoto
                        ? <img src={book.coverPhoto} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center"><svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
                      }
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-black line-clamp-1">{book.title}</p>
                      {book.author && <p className="text-xs text-gray-400 truncate">{book.author}</p>}
                      <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full ${CONDITION_COLORS[book.condition] ?? "bg-gray-100 text-gray-600"}`}>{CONDITION_LABELS[book.condition] ?? book.condition}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Ratings */}
        {user.ratingsReceived.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-black mb-4">Ratings received</h2>
            <div className="space-y-4">
              {user.ratingsReceived.slice(0, 5).map((r, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-600">
                    {r.rater.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${r.rater.username}`} className="text-sm font-medium text-black hover:underline">@{r.rater.username}</Link>
                      <span className="text-amber-400 text-sm">{"★".repeat(r.stars)}<span className="text-gray-200">{"★".repeat(5 - r.stars)}</span></span>
                      <span className="text-xs text-gray-400">{r.role === "AS_OWNER" ? "as owner" : "as borrower"}</span>
                    </div>
                    {r.review && <p className="text-sm text-gray-600 mt-0.5">{r.review}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
