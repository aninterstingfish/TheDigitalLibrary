import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";
import SwapActions from "./SwapActions";

const CONDITION_LABELS: Record<string, string> = { NEW: "New", MINOR_WEAR: "Minor Wear", MAJOR_WEAR: "Major Wear", SEVERE_WEAR: "Severe Wear" };

function fmtDate(d: Date | null | undefined) {
  if (!d) return null;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default async function SwapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const request = await prisma.swapRequest.findUnique({
    where: { id },
    include: {
      book: { select: { id: true, title: true, author: true, coverPhoto: true, condition: true, ownerId: true, owner: { select: { id: true, username: true, name: true } } } },
      borrower: { select: { id: true, username: true, name: true } },
      swap: { include: { ratings: { select: { raterId: true, stars: true, review: true, role: true } } } },
    },
  });

  if (!request) notFound();

  const isOwner = request.book.ownerId === session.userId;
  const isBorrower = request.borrower.id === session.userId;
  if (!isOwner && !isBorrower) redirect("/swaps");

  const swap = request.swap;
  const myRating = swap?.ratings.find((r) => r.raterId === session.userId);
  const theirRating = swap?.ratings.find((r) => r.raterId !== session.userId);

  // Determine phase
  let phase: "PENDING" | "COUNTER" | "ACCEPTED_AWAITING" | "ACTIVE" | "RETURN_PENDING" | "RATING" | "DONE" | "CLOSED";
  if (["REJECTED", "CANCELLED"].includes(request.status)) {
    phase = "CLOSED";
  } else if (request.status === "COMPLETED" && swap?.ownerConfirmedReturn) {
    phase = myRating ? "DONE" : "RATING";
  } else if (swap?.ownerConfirmedReturn) {
    phase = myRating ? "DONE" : "RATING";
  } else if (swap?.handedOver) {
    phase = "ACTIVE";
  } else if (swap) {
    phase = "ACCEPTED_AWAITING";
  } else if (request.status === "COUNTER_PROPOSED") {
    phase = "COUNTER";
  } else {
    phase = "PENDING";
  }

  const effectivePickup = request.counterPickupDate ?? request.requestedPickupDate;
  const effectiveReturn = request.counterReturnDate ?? request.requestedReturnDate;
  const effectiveMode = request.counterLoanMode ?? request.loanMode;

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/swaps" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-black transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to swaps
        </Link>

        <div className="space-y-4">
          {/* Book card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
            <div className="w-16 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {request.book.coverPhoto
                ? <img src={request.book.coverPhoto} alt={request.book.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
              }
            </div>
            <div className="flex-1">
              <Link href={`/books/${request.book.id}`} className="font-bold text-black text-lg hover:underline underline-offset-2 leading-tight">{request.book.title}</Link>
              {request.book.author && <p className="text-gray-400 text-sm mt-0.5">{request.book.author}</p>}
              <p className="text-xs text-gray-400 mt-1">{CONDITION_LABELS[request.book.condition] ?? request.book.condition}</p>
              <div className="flex gap-3 mt-3 text-xs text-gray-500">
                <span>Owner: <Link href={`/profile/${request.book.owner.username}`} className="font-medium text-black hover:underline">@{request.book.owner.username}</Link></span>
                <span>Borrower: <Link href={`/profile/${request.borrower.username}`} className="font-medium text-black hover:underline">@{request.borrower.username}</Link></span>
              </div>
            </div>
          </div>

          {/* Loan details */}
          {phase !== "CLOSED" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Loan details</h2>
              <div className="space-y-2 text-sm">
                <Row label="Type" value={effectiveMode === "READ_TILL_FINISH" ? "Read till finish" : "Fixed dates"} />
                <Row label="Pickup" value={fmtDate(effectivePickup) ?? "—"} />
                {effectiveMode === "FIXED_DATE" && <Row label="Return" value={fmtDate(effectiveReturn) ?? "—"} />}
              </div>
              {request.status === "COUNTER_PROPOSED" && (
                <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                  Originally: {fmtDate(request.requestedPickupDate)}
                  {request.loanMode === "FIXED_DATE" && request.requestedReturnDate && ` → ${fmtDate(request.requestedReturnDate)}`}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <SwapActions
            requestId={request.id}
            swapId={swap?.id ?? null}
            phase={phase}
            isOwner={isOwner}
            isBorrower={isBorrower}
            loanMode={effectiveMode}
            myRating={myRating ? { stars: myRating.stars, review: myRating.review } : null}
            theirRating={theirRating ? { stars: theirRating.stars } : null}
            borrowerConfirmedReturn={swap?.borrowerConfirmedReturn ?? false}
            requestStatus={request.status}
          />
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="text-black font-medium">{value}</span>
    </div>
  );
}
