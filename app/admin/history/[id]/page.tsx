import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import HistoryClient from "@/app/history/HistoryClient";

export default async function AdminChildHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true, children: { where: { id: childId }, select: { id: true, name: true, username: true } } },
  });

  if (!admin?.isAdmin) redirect("/dashboard");
  const child = admin.children[0];
  if (!child) redirect("/admin");

  const [borrowedSwaps, lentSwaps] = await Promise.all([
    prisma.swap.findMany({
      where: { ownerConfirmedReturn: true, request: { borrowerId: childId } },
      include: {
        request: {
          include: {
            book: { select: { title: true, author: true, owner: { select: { username: true } } } },
          },
        },
      },
      orderBy: { returnConfirmedAt: "desc" },
    }),
    prisma.swap.findMany({
      where: { ownerConfirmedReturn: true, request: { book: { ownerId: childId } } },
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
      <Nav active="/admin" />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <a href="/admin" className="text-xs text-gray-400 hover:text-black transition-colors">← Back to panel</a>
          <h1 className="text-2xl font-bold text-black mt-3 mb-1">Borrowing history</h1>
          <p className="text-gray-500 text-sm">Complete record for <strong>@{child.username}</strong> ({child.name})</p>
        </div>
        <HistoryClient
          userName={child.name}
          username={child.username}
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
