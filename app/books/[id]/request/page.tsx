import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import RequestForm from "./RequestForm";
import Link from "next/link";

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id },
    include: { owner: { select: { username: true, name: true, ratingsReceived: { select: { stars: true } } } } },
  });
  if (!book) notFound();
  if (book.ownerId === session.userId) redirect(`/books/${id}`);
  if (!book.isAvailable) redirect(`/books/${id}`);

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { borrowLimit: true } });
  const activeBorrows = await prisma.swap.count({ where: { request: { borrowerId: session.userId }, ownerConfirmedReturn: false } });
  const atLimit = user ? activeBorrows >= user.borrowLimit : false;

  const avgRating = book.owner.ratingsReceived.length
    ? (book.owner.ratingsReceived.reduce((s, r) => s + r.stars, 0) / book.owner.ratingsReceived.length).toFixed(1)
    : null;

  const CONDITION_LABELS: Record<string, string> = { NEW: "New", MINOR_WEAR: "Minor Wear", MAJOR_WEAR: "Major Wear", SEVERE_WEAR: "Severe Wear" };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-xl mx-auto px-6 py-10">
        <Link href={`/books/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-black transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>

        {/* Book summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 mb-6">
          <div className="w-14 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
            {book.coverPhoto
              ? <img src={book.coverPhoto} alt={book.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
            }
          </div>
          <div>
            <p className="font-semibold text-black">{book.title}</p>
            {book.author && <p className="text-gray-400 text-sm">{book.author}</p>}
            <p className="text-xs text-gray-400 mt-1">{CONDITION_LABELS[book.condition] ?? book.condition} · @{book.owner.username}{avgRating ? ` · ★ ${avgRating}` : ""}</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-black tracking-tight mb-1">Request loan</h1>
        <p className="text-gray-500 text-sm mb-6">Choose your dates and submit — the owner will accept, reject, or counter-propose.</p>

        {atLimit ? (
          <div className="bg-amber-50 border border-amber-100 text-amber-700 text-sm px-4 py-3 rounded-xl">
            You&apos;ve reached your borrow limit of {user?.borrowLimit} books. Return a book before requesting another.
          </div>
        ) : (
          <RequestForm bookId={id} />
        )}
      </main>
    </div>
  );
}
