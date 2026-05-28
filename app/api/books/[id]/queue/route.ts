import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Join the queue for a book
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, ownerId: true, isAvailable: true },
  });

  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (book.ownerId === session.userId) return NextResponse.json({ error: "You can't queue your own book." }, { status: 400 });
  if (book.isAvailable) return NextResponse.json({ error: "Book is available — request a loan directly." }, { status: 400 });

  const existing = await prisma.queueEntry.findUnique({
    where: { bookId_userId: { bookId, userId: session.userId } },
  });
  if (existing) return NextResponse.json({ error: "You're already in the queue." }, { status: 400 });

  const lastEntry = await prisma.queueEntry.findFirst({
    where: { bookId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const entry = await prisma.queueEntry.create({
    data: {
      bookId,
      userId: session.userId,
      position: (lastEntry?.position ?? 0) + 1,
      status: "WAITING",
    },
  });

  // Notify book owner
  await prisma.notification.create({
    data: {
      userId: book.ownerId,
      type: "QUEUE_JOIN",
      message: `Someone joined the queue for your book.`,
      link: `/books/${bookId}`,
    },
  });

  return NextResponse.json({ success: true, entry });
}

// Leave the queue
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const entry = await prisma.queueEntry.findUnique({
    where: { bookId_userId: { bookId, userId: session.userId } },
  });

  if (!entry) return NextResponse.json({ error: "You're not in the queue." }, { status: 404 });

  await prisma.queueEntry.delete({ where: { id: entry.id } });

  // Re-number remaining entries
  const remaining = await prisma.queueEntry.findMany({
    where: { bookId },
    orderBy: { position: "asc" },
  });
  for (let i = 0; i < remaining.length; i++) {
    await prisma.queueEntry.update({ where: { id: remaining[i].id }, data: { position: i + 1 } });
  }

  return NextResponse.json({ success: true });
}
