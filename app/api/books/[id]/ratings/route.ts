import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const ratings = await prisma.bookRating.findMany({
    where: { bookId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      stars: true,
      review: true,
      createdAt: true,
      user: { select: { id: true, username: true, name: true } },
    },
  });

  return NextResponse.json(ratings);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { ownerId: true, title: true } });
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });

  // Must have borrowed this book at least once to rate it
  const hasBorrowed = await prisma.swap.findFirst({
    where: {
      ownerConfirmedReturn: true,
      request: { bookId, borrowerId: session.userId },
    },
  });
  if (!hasBorrowed) return NextResponse.json({ error: "You can only rate books you have borrowed." }, { status: 403 });

  let body: { stars?: number; review?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (!body.stars || body.stars < 1 || body.stars > 5) return NextResponse.json({ error: "Rating must be 1–5 stars." }, { status: 400 });
  if (body.review && body.review.length > 500) return NextResponse.json({ error: "Review too long (max 500 characters)." }, { status: 400 });

  try {
    const rating = await prisma.bookRating.create({
      data: { bookId, userId: session.userId, stars: body.stars, review: body.review ?? null },
      select: {
        id: true, stars: true, review: true, createdAt: true,
        user: { select: { id: true, username: true, name: true } },
      },
    });
    return NextResponse.json(rating, { status: 201 });
  } catch {
    return NextResponse.json({ error: "You have already rated this book." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const existing = await prisma.bookRating.findUnique({
    where: { bookId_userId: { bookId, userId: session.userId } },
  });
  if (!existing) return NextResponse.json({ error: "Rating not found." }, { status: 404 });

  await prisma.bookRating.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}
