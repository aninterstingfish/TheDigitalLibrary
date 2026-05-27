import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  let body: { confirmedBy: "owner" | "borrower" };
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
    await prisma.$transaction([
      prisma.swap.update({ where: { id }, data: { ownerConfirmedReturn: true, returnConfirmedAt: now } }),
      prisma.swapRequest.update({ where: { id: swap.requestId }, data: { status: "COMPLETED" } }),
      prisma.book.update({ where: { id: swap.request.book.id }, data: { isAvailable: true } }),
    ]);
    await notify(swap.request.borrower.id, "RETURN_CONFIRMED", `Return of "${swap.request.book.title}" confirmed — please leave a rating!`, `/swaps/${id}`);
  } else if (body.confirmedBy === "borrower" && isBorrower) {
    await prisma.swap.update({ where: { id }, data: { borrowerConfirmedReturn: true } });
    const borrower = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    await notify(swap.request.book.ownerId, "RETURN_PENDING", `${borrower?.name} says they've finished "${swap.request.book.title}" — confirm you got it back`, `/swaps/${id}`);
  }

  return NextResponse.json({ success: true });
}
