import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  let body: { stars?: number; review?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (!body.stars || body.stars < 1 || body.stars > 5) return NextResponse.json({ error: "Rating must be 1–5 stars." }, { status: 400 });
  if (body.review && body.review.length > 1000) return NextResponse.json({ error: "Review must be 1000 characters or fewer." }, { status: 400 });

  const swap = await prisma.swap.findUnique({
    where: { id },
    include: {
      request: {
        include: {
          book: { select: { title: true, ownerId: true } },
          borrower: { select: { id: true } },
        },
      },
    },
  });
  if (!swap) return NextResponse.json({ error: "Swap not found." }, { status: 404 });
  if (!swap.ownerConfirmedReturn) return NextResponse.json({ error: "Swap not yet completed." }, { status: 400 });

  const isOwner = swap.request.book.ownerId === session.userId;
  const isBorrower = swap.request.borrower.id === session.userId;
  if (!isOwner && !isBorrower) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const rateeId = isOwner ? swap.request.borrower.id : swap.request.book.ownerId;
  const role = isOwner ? "AS_OWNER" : "AS_BORROWER";

  try {
    await prisma.rating.create({
      data: { swapId: id, raterId: session.userId, rateeId, stars: body.stars, review: body.review ?? null, role },
    });
    const rater = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    await notify(rateeId, "RATING_RECEIVED", `${rater?.name} gave you ${body.stars} star${body.stars !== 1 ? "s" : ""} for "${swap.request.book.title}"`, `/profile/${(await prisma.user.findUnique({ where: { id: session.userId }, select: { username: true } }))?.username}`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "You have already rated this swap." }, { status: 400 });
  }
}
