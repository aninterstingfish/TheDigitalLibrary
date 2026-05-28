import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  let body: { confirmedBy: "owner" | "borrower"; notReturned?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const swap = await prisma.swap.findUnique({
    where: { id },
    include: {
      request: {
        include: {
          book: { select: { id: true, title: true, ownerId: true } },
          borrower: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!swap) return NextResponse.json({ error: "Swap not found." }, { status: 404 });

  const isOwner = swap.request.book.ownerId === session.userId;
  const isBorrower = swap.request.borrower.id === session.userId;
  if (!isOwner && !isBorrower) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const now = new Date();

  if (body.confirmedBy === "owner" && isOwner) {
    const bookId = swap.request.book.id;
    await prisma.$transaction([
      prisma.swap.update({ where: { id }, data: { ownerConfirmedReturn: true, returnConfirmedAt: now } }),
      prisma.swapRequest.update({ where: { id: swap.requestId }, data: { status: "COMPLETED" } }),
      prisma.book.update({ where: { id: bookId }, data: { isAvailable: true } }),
    ]);

    if (body.notReturned) {
      await prisma.user.update({ where: { id: swap.request.borrower.id }, data: { nonReturns: { increment: 1 } } });
    }

    await notify(swap.request.borrower.id, "RETURN_CONFIRMED", `Return of "${swap.request.book.title}" confirmed — please leave a rating!`, `/swaps/${swap.requestId}`);

    const nextInQueue = await prisma.queueEntry.findFirst({
      where: { bookId, status: "WAITING" },
      orderBy: { position: "asc" },
      select: { user: { select: { username: true, name: true } } },
    });
    if (nextInQueue) {
      await notify(
        session.userId,
        "QUEUE_NEXT",
        `"${swap.request.book.title}" is back — @${nextInQueue.user.username} is next in queue. Visit the book to offer it to them.`,
        `/books/${bookId}`
      );
    }
  } else if (body.confirmedBy === "borrower" && isBorrower) {
    await prisma.swap.update({ where: { id }, data: { borrowerConfirmedReturn: true } });
    const borrower = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    await notify(swap.request.book.ownerId, "RETURN_PENDING", `${borrower?.name} says they've finished "${swap.request.book.title}" — confirm you got it back`, `/swaps/${swap.requestId}`);
  }

  return NextResponse.json({ success: true });
}
