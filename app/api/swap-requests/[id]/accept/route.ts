import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  const request = await prisma.swapRequest.findUnique({
    where: { id },
    include: { book: { select: { title: true, ownerId: true } }, borrower: { select: { id: true, name: true } } },
  });
  if (!request) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  if (request.book.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (!["PENDING", "COUNTER_PROPOSED"].includes(request.status)) return NextResponse.json({ error: "Cannot accept in current state." }, { status: 400 });

  try {
    await prisma.$transaction([
      prisma.swapRequest.update({ where: { id }, data: { status: "ACCEPTED" } }),
      prisma.swap.create({
        data: {
          requestId: id,
          pickupDate: request.counterPickupDate ?? request.requestedPickupDate,
          returnDate: request.counterReturnDate ?? request.requestedReturnDate,
          loanMode: request.counterLoanMode ?? request.loanMode,
        },
      }),
      prisma.book.update({ where: { id: request.bookId }, data: { isAvailable: false } }),
    ]);

    const owner = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    await notify(request.borrower.id, "REQUEST_ACCEPTED", `${owner?.name} accepted your request for "${request.book.title}"`, `/swaps/${id}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[accept]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
