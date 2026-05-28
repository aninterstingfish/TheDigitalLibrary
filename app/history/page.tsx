import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import HistoryClient from "./HistoryClient";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, username: true },
  });
  if (!user) redirect("/login");

  const [borrowedSwaps, lentSwaps] = await Promise.all([
    prisma.swap.findMany({
      where: {
        ownerConfirmedReturn: true,
        request: { borrowerId: session.userId },
      },
      include: {
        request: {
          include: {
            book: {
              select: { title: true, author: true, owner: { select: { username: true } } },
            },
          },
        },
      },
      orderBy: { returnConfirmedAt: "desc" },
    }),
    prisma.swap.findMany({
      where: {
        ownerConfirmedReturn: true,
        request: { book: { ownerId: session.userId } },
      },
      include: {
        request: {
          include: {
            book: { select: { title: true, author: true } },
            borrower: { select: { username: true } },
          },
        },
      },
      orderBy: { returnConfirmedAt: "desc" },
    }),
  ]);

  function ser(d: Date | null | undefined) { return d ? d.toISOString() : null; }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav active="/swaps" />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-black mb-1">Borrowing history</h1>
            <p className="text-gray-500 text-sm">Complete record for <strong>@{user.username}</strong></p>
          </div>
        </div>
        <HistoryClient
          userName={user.name}
          username={user.username}
          borrowed={borrowedSwaps.map((s) => ({
            id: s.id,
            bookTitle: s.request.book.title,
            bookAuthor: s.request.book.author,
            ownerUsername: s.request.book.owner.username,
            pickupDate: ser(s.pickupDate),
            returnDate: ser(s.returnDate),
            returnConfirmedAt: ser(s.returnConfirmedAt),
          }))}
          lent={lentSwaps.map((s) => ({
            id: s.id,
            bookTitle: s.request.book.title,
            bookAuthor: s.request.book.author,
            borrowerUsername: s.request.borrower.username,
            pickupDate: ser(s.pickupDate),
            returnDate: ser(s.returnDate),
            returnConfirmedAt: ser(s.returnConfirmedAt),
          }))}
        />
      </div>
    </div>
  );
}
