import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  let body: { accept?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const request = await prisma.swapRequest.findUnique({
    where: { id },
    include: { book: { select: { title: true, ownerId: true } }, borrower: { select: { id: true } } },
  });
  if (!request) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  if (request.borrowerId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (request.status !== "COUNTER_PROPOSED") return NextResponse.json({ error: "No counter offer to respond to." }, { status: 400 });

  const borrower = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });

  if (body.accept) {
    await prisma.$transaction([
      prisma.swapRequest.update({ where: { id }, data: { status: "ACCEPTED" } }),
      prisma.swap.create({
        data: {
          requestId: id,
          pickupDate: request.counterPickupDate!,
          returnDate: request.counterReturnDate,
          loanMode: request.counterLoanMode ?? request.loanMode,
        },
      }),
      prisma.book.update({ where: { id: request.bookId }, data: { isAvailable: false } }),
    ]);
    await notify(request.book.ownerId, "COUNTER_ACCEPTED", `${borrower?.name} accepted your counter offer for "${request.book.title}"`, `/swaps/${id}`);
  } else {
    await prisma.swapRequest.update({ where: { id }, data: { status: "CANCELLED" } });
    await notify(request.book.ownerId, "COUNTER_REJECTED", `${borrower?.name} declined your counter offer for "${request.book.title}"`, `/swaps/${id}`);
  }

  return NextResponse.json({ success: true });
}
