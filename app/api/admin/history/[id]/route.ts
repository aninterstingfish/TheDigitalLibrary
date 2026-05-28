import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true, children: { where: { id: childId }, select: { id: true } } },
  });

  if (!admin?.isAdmin || !admin.children[0]) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [borrowed, lent] = await Promise.all([
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

  function ser(d: Date | null) { return d ? d.toISOString() : null; }

  return NextResponse.json({
    borrowed: borrowed.map((s) => ({
      bookTitle: s.request.book.title,
      bookAuthor: s.request.book.author,
      ownerUsername: s.request.book.owner.username,
      pickupDate: ser(s.pickupDate),
      returnConfirmedAt: ser(s.returnConfirmedAt),
    })),
    lent: lent.map((s) => ({
      bookTitle: s.request.book.title,
      bookAuthor: s.request.book.author,
      borrowerUsername: s.request.borrower.username,
      pickupDate: ser(s.pickupDate),
      returnConfirmedAt: ser(s.returnConfirmedAt),
    })),
  });
}
