import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { bookId?: string; loanMode?: string; pickupDate?: string; returnDate?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const { bookId, loanMode, pickupDate, returnDate } = body;
  if (!bookId || !loanMode || !pickupDate) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  if (!["FIXED_DATE", "READ_TILL_FINISH"].includes(loanMode)) return NextResponse.json({ error: "Invalid loan mode." }, { status: 400 });

  const book = await prisma.book.findUnique({ where: { id: bookId }, include: { owner: { select: { id: true, name: true } } } });
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (!book.isAvailable) return NextResponse.json({ error: "Book is not available." }, { status: 400 });
  if (book.ownerId === session.userId) return NextResponse.json({ error: "You cannot request your own book." }, { status: 400 });

  // Check borrow limit
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { borrowLimit: true } });
  const activeBorrows = await prisma.swap.count({ where: { request: { borrowerId: session.userId }, ownerConfirmedReturn: false } });
  if (user && activeBorrows >= user.borrowLimit) {
    return NextResponse.json({ error: `You have reached your borrow limit of ${user.borrowLimit} books.` }, { status: 400 });
  }

  try {
    const request = await prisma.swapRequest.create({
      data: {
        bookId,
        borrowerId: session.userId,
        requestedPickupDate: new Date(pickupDate),
        requestedReturnDate: returnDate ? new Date(returnDate) : null,
        loanMode: loanMode as "FIXED_DATE" | "READ_TILL_FINISH",
      },
    });

    const requester = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    await notify(book.owner.id, "SWAP_REQUEST", `${requester?.name} requested to borrow "${book.title}"`, `/swaps/${request.id}`);

    return NextResponse.json({ success: true, id: request.id });
  } catch (err) {
    console.error("[swap-requests/create]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
