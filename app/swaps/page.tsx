import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import SwapsTabs from "./SwapsTabs";

export default async function SwapsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [pendingRequests, activeAsOwner, myPendingRequests, activeAsBorrower] = await Promise.all([
    prisma.swapRequest.findMany({
      where: { book: { ownerId: session.userId }, status: { in: ["PENDING", "COUNTER_PROPOSED"] } },
      include: {
        book: { select: { id: true, title: true, coverPhoto: true } },
        borrower: { select: { username: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.swap.findMany({
      where: { ownerConfirmedReturn: false, request: { book: { ownerId: session.userId } } },
      include: {
        request: {
          include: {
            book: { select: { id: true, title: true, coverPhoto: true } },
            borrower: { select: { username: true, name: true } },
          },
        },
      },
      orderBy: { confirmedAt: "desc" },
    }),
    prisma.swapRequest.findMany({
      where: { borrowerId: session.userId, status: { in: ["PENDING", "COUNTER_PROPOSED"] } },
      include: {
        book: {
          select: {
            id: true, title: true, coverPhoto: true,
            owner: { select: { username: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.swap.findMany({
      where: { borrowerConfirmedReturn: false, request: { borrowerId: session.userId } },
      include: {
        request: {
          include: {
            book: {
              select: {
                id: true, title: true, coverPhoto: true,
                owner: { select: { username: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { confirmedAt: "desc" },
    }),
  ]);

  function ser(date: Date | null | undefined) {
    return date ? date.toISOString() : null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav active="/swaps" />
      <SwapsTabs
        pendingRequests={pendingRequests.map((r) => ({
          id: r.id, status: r.status, loanMode: r.loanMode,
          requestedPickupDate: ser(r.requestedPickupDate),
          requestedReturnDate: ser(r.requestedReturnDate),
          createdAt: ser(r.createdAt)!,
          book: r.book,
          borrower: r.borrower,
        }))}
        activeAsOwner={activeAsOwner.map((s) => ({
          id: s.id, loanMode: s.loanMode,
          pickupDate: ser(s.pickupDate),
          returnDate: ser(s.returnDate),
          confirmedAt: ser(s.confirmedAt)!,
          book: s.request.book,
          other: s.request.borrower,
        }))}
        myPendingRequests={myPendingRequests.map((r) => ({
          id: r.id, status: r.status, loanMode: r.loanMode,
          requestedPickupDate: ser(r.requestedPickupDate),
          requestedReturnDate: ser(r.requestedReturnDate),
          createdAt: ser(r.createdAt)!,
          book: r.book,
          owner: (r.book as any).owner,
        }))}
        activeAsBorrower={activeAsBorrower.map((s) => ({
          id: s.id, loanMode: s.loanMode,
          pickupDate: ser(s.pickupDate),
          returnDate: ser(s.returnDate),
          confirmedAt: ser(s.confirmedAt)!,
          book: s.request.book,
          other: (s.request.book as any).owner,
        }))}
      />
    </div>
  );
}
