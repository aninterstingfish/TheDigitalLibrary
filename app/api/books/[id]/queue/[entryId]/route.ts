import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Owner: approve (OFFERED), decline, or set note (counter-offer message)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  const { id: bookId, entryId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { ownerId: true } });
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (book.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    select: { id: true, bookId: true, userId: true },
  });
  if (!entry || entry.bookId !== bookId) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  let body: { action?: string; note?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const { action, note } = body;

  if (action === "offer") {
    await prisma.queueEntry.update({ where: { id: entryId }, data: { status: "OFFERED", note: note?.trim() || null } });
    await prisma.notification.create({
      data: {
        userId: entry.userId,
        type: "QUEUE_OFFERED",
        message: `The book you're waiting for is now available for you! Visit the book page to request a loan.`,
        link: `/books/${bookId}`,
      },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "decline") {
    await prisma.queueEntry.delete({ where: { id: entryId } });
    // Re-number remaining
    const remaining = await prisma.queueEntry.findMany({ where: { bookId }, orderBy: { position: "asc" } });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.queueEntry.update({ where: { id: remaining[i].id }, data: { position: i + 1 } });
    }
    await prisma.notification.create({
      data: {
        userId: entry.userId,
        type: "QUEUE_DECLINED",
        message: `You were removed from the queue for a book.`,
        link: `/books/${bookId}`,
      },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "note") {
    await prisma.queueEntry.update({ where: { id: entryId }, data: { note: note?.trim() || null } });
    await prisma.notification.create({
      data: {
        userId: entry.userId,
        type: "QUEUE_NOTE",
        message: `The book owner left a note about your queue position.`,
        link: `/books/${bookId}`,
      },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
