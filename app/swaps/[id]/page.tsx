import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New", MINOR_WEAR: "Minor Wear", MAJOR_WEAR: "Major Wear", SEVERE_WEAR: "Severe Wear",
};

function fmt(date: Date | null | undefined) {
  if (!date) return null;
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COUNTER_PROPOSED: "Counter offer sent",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  COUNTER_PROPOSED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default async function SwapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const request = await prisma.swapRequest.findUnique({
    where: { id },
    include: {
      book: {
        select: {
          id: true, title: true, author: true, coverPhoto: true, condition: true,
          owner: { select: { id: true, username: true, name: true } },
        },
      },
      borrower: { select: { id: true, username: true, name: true } },
      swap: true,
    },
  });

  if (!request) {
    const swap = await prisma.swap.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            book: {
              select: {
                id: true, title: true, author: true, coverPhoto: true, condition: true,
                owner: { select: { id: true, username: true, name: true } },
              },
            },
            borrower: { select: { id: true, username: true, name: true } },
          },
        },
      },
    });
    if (!swap) notFound();

    const isParty = swap.request.borrower.id === session.userId || swap.request.book.owner.id === session.userId;
    if (!isParty) redirect("/swaps");

    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <main className="max-w-2xl mx-auto px-6 py-10">
          <Link href="/swaps" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-black transition-colors mb-8">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back to swaps
          </Link>
          <SwapCard
            title={swap.request.book.title}
            author={swap.request.book.author}
            coverPhoto={swap.request.book.coverPhoto}
            condition={swap.request.book.condition}
            owner={swap.request.book.owner}
            borrower={swap.request.borrower}
            status="ACCEPTED"
            loanMode={swap.loanMode}
            pickupDate={swap.pickupDate}
            returnDate={swap.returnDate}
            bookId={swap.request.book.id}
          />
        </main>
      </div>
    );
  }

  const isParty = request.borrower.id === session.userId || request.book.owner.id === session.userId;
  if (!isParty) redirect("/swaps");

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/swaps" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-black transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to swaps
        </Link>
        <SwapCard
          title={request.book.title}
          author={request.book.author}
          coverPhoto={request.book.coverPhoto}
          condition={request.book.condition}
          owner={request.book.owner}
          borrower={request.borrower}
          status={request.status}
          loanMode={request.loanMode}
          pickupDate={request.requestedPickupDate}
          returnDate={request.requestedReturnDate}
          bookId={request.book.id}
        />
      </main>
    </div>
  );
}

function SwapCard({
  title, author, coverPhoto, condition, owner, borrower,
  status, loanMode, pickupDate, returnDate, bookId,
}: {
  title: string; author: string | null; coverPhoto: string | null; condition: string;
  owner: { username: string; name: string };
  borrower: { username: string; name: string };
  status: string; loanMode: string;
  pickupDate: Date | null; returnDate: Date | null | undefined;
  bookId: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Book header */}
      <div className="flex gap-4 p-6 border-b border-gray-50">
        <div className="w-16 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          {coverPhoto ? (
            <img src={coverPhoto} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <Link href={`/books/${bookId}`} className="font-bold text-black text-lg hover:underline underline-offset-2">{title}</Link>
          {author && <p className="text-gray-500 text-sm mt-0.5">{author}</p>}
          <p className="text-xs text-gray-400 mt-1">{CONDITION_LABELS[condition] ?? condition}</p>
        </div>
        <span className={`shrink-0 self-start text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_COLOR[status] ?? "bg-gray-100 text-gray-600"}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      {/* Details */}
      <div className="p-6 space-y-4">
        <Row label="Owner" value={`${owner.name} (@${owner.username})`} />
        <Row label="Borrower" value={`${borrower.name} (@${borrower.username})`} />
        <Row label="Loan type" value={loanMode === "READ_TILL_FINISH" ? "Read till finish" : "Fixed dates"} />
        {loanMode === "FIXED_DATE" && (
          <>
            {pickupDate && <Row label="Pickup date" value={fmt(pickupDate)!} />}
            {returnDate && <Row label="Return date" value={fmt(returnDate)!} />}
          </>
        )}
      </div>

      <div className="px-6 pb-6">
        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
          Full swap management — messaging, accept/reject, counter-offer, return confirmation — is coming soon.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-black text-right">{value}</span>
    </div>
  );
}
