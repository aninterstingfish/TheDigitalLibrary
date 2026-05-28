import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";
import QueueSection from "./QueueSection";
import BookRatings from "./BookRatings";
import AddToListButton from "./AddToListButton";

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

const LABEL_COLORS: Record<string, string> = {
  SCHOOL_PROPERTY: "bg-blue-50 text-blue-700",
  DONATED: "bg-green-50 text-green-700",
};

const LABEL_LABELS: Record<string, string> = {
  PERSONAL: "Personal",
  SCHOOL_PROPERTY: "School Property",
  DONATED: "Donated",
};

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const [book, hasBorrowed] = await Promise.all([
    prisma.book.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, name: true } },
        _count: { select: { requests: true } },
        wishlistedBy: { where: { userId: session.userId }, select: { id: true } },
        queueEntries: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            position: true,
            status: true,
            note: true,
            user: { select: { id: true, username: true, name: true } },
          },
        },
        bookRatings: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            stars: true,
            review: true,
            createdAt: true,
            user: { select: { id: true, username: true, name: true } },
          },
        },
      },
    }),
    prisma.swap.findFirst({
      where: { ownerConfirmedReturn: true, request: { bookId: id, borrowerId: session.userId } },
      select: { id: true },
    }),
  ]);

  if (!book) notFound();

  const isOwner = book.ownerId === session.userId;
  const genres: string[] = (() => { try { return JSON.parse(book.genres); } catch { return []; } })();
  const tags: string[] = (() => { try { const p = JSON.parse(book.tags ?? "[]"); return Array.isArray(p) ? p : []; } catch { return []; } })();
  const canRate = !isOwner && Boolean(hasBorrowed);

  const bookAvgRating = book.bookRatings.length
    ? (book.bookRatings.reduce((s, r) => s + r.stars, 0) / book.bookRatings.length).toFixed(1)
    : null;

  const myQueueEntry = book.queueEntries.find((e) => e.user.id === session.userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/catalogue" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-black transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to catalogue
        </Link>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-0">
              {/* Cover */}
              <div className="sm:w-48 h-64 sm:h-auto bg-gray-100 shrink-0 flex items-center justify-center relative">
                {book.coverPhoto ? (
                  <img src={book.coverPhoto} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-14 h-14 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
                {book.isCurrentlyReading && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="block text-center text-xs font-semibold bg-blue-500 text-white px-2 py-1 rounded-lg">Currently reading</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 flex-1 flex flex-col gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-black tracking-tight">{book.title}</h1>
                  {book.author && <p className="text-gray-500 text-sm mt-1">{book.author}</p>}
                  {book.series && (
                    <p className="text-gray-400 text-xs mt-1">
                      {book.series}{book.seriesNumber ? ` · Book ${book.seriesNumber}` : ""}
                    </p>
                  )}
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CONDITION_COLORS[book.condition] ?? "bg-gray-100 text-gray-600"}`}>
                    {CONDITION_LABELS[book.condition] ?? book.condition}
                  </span>
                  {book.labelType && book.labelType !== "PERSONAL" && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${LABEL_COLORS[book.labelType] ?? "bg-gray-100 text-gray-600"}`}>
                      {LABEL_LABELS[book.labelType] ?? book.labelType}
                    </span>
                  )}
                  {!book.isAvailable && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">On Loan</span>
                  )}
                </div>

                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {genres.map((g) => (
                      <span key={g} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{g}</span>
                    ))}
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2.5 py-0.5 rounded-full">#{t}</span>
                    ))}
                  </div>
                )}

                {book.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{book.description}</p>
                )}

                {/* Book rating summary */}
                {bookAvgRating && (
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 text-sm">★</span>
                    <span className="text-sm font-medium text-black">{bookAvgRating}</span>
                    <span className="text-xs text-gray-400">book rating ({book.bookRatings.length})</span>
                  </div>
                )}

                {/* Owner */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50 mt-auto">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {book.owner.name[0]}
                  </div>
                  <Link href={`/profile/${book.owner.username}`} className="text-sm font-medium text-black hover:underline">
                    @{book.owner.username}
                  </Link>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {isOwner ? (
                    <Link href={`/books/${id}/edit`} className="flex-1 text-center bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-zinc-800 transition-all">
                      Edit listing
                    </Link>
                  ) : book.isAvailable ? (
                    <>
                      <Link href={`/books/${id}/request`} className="flex-1 text-center bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-zinc-800 transition-all">
                        Request loan
                      </Link>
                      <AddToListButton bookId={id} />
                    </>
                  ) : (
                    <>
                      <div className="flex-1 text-center bg-gray-100 text-gray-400 text-sm font-semibold py-3 rounded-xl cursor-not-allowed">
                        Currently on loan
                      </div>
                      <AddToListButton bookId={id} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Queue section — shown to non-owners when book is on loan */}
          {!isOwner && !book.isAvailable && (
            <QueueSection
              bookId={book.id}
              myEntry={myQueueEntry ?? null}
              queueLength={book.queueEntries.length}
            />
          )}

          {/* Owner queue management */}
          {isOwner && book.queueEntries.length > 0 && (
            <QueueSection
              bookId={book.id}
              myEntry={null}
              queueLength={book.queueEntries.length}
              ownerEntries={book.queueEntries}
            />
          )}

          {/* Book ratings */}
          <BookRatings
            bookId={id}
            initialRatings={book.bookRatings.map((r) => ({
              ...r,
              createdAt: r.createdAt.toISOString(),
            }))}
            canRate={canRate}
            currentUserId={session.userId}
          />
        </div>
      </main>
    </div>
  );
}
