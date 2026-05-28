import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Add a book to a reading list
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const list = await prisma.readingList.findUnique({ where: { id: listId }, select: { userId: true } });
  if (!list) return NextResponse.json({ error: "List not found." }, { status: 404 });
  if (list.userId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: { bookId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (!body.bookId) return NextResponse.json({ error: "bookId is required." }, { status: 400 });

  const book = await prisma.book.findUnique({ where: { id: body.bookId }, select: { id: true } });
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });

  try {
    const item = await prisma.readingListItem.create({
      data: { listId, bookId: body.bookId },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Book already in this list." }, { status: 400 });
  }
}

// Remove a book from a reading list
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const list = await prisma.readingList.findUnique({ where: { id: listId }, select: { userId: true } });
  if (!list) return NextResponse.json({ error: "List not found." }, { status: 404 });
  if (list.userId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  if (!bookId) return NextResponse.json({ error: "bookId is required." }, { status: 400 });

  const item = await prisma.readingListItem.findUnique({
    where: { listId_bookId: { listId, bookId } },
  });
  if (!item) return NextResponse.json({ error: "Book not in this list." }, { status: 404 });

  await prisma.readingListItem.delete({ where: { id: item.id } });
  return NextResponse.json({ success: true });
}
