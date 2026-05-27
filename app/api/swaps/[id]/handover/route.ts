import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  let body: { happened: boolean; reason?: string; blame?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  try {
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
    if (swap.request.book.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    if (body.happened) {
      await prisma.swap.update({ where: { id }, data: { handedOver: true } });
      const owner = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
      await notify(swap.request.borrower.id, "SWAP_CONFIRMED", `${owner?.name} confirmed the handover of "${swap.request.book.title}"`, `/swaps/${swap.requestId}`);
    } else {
      const blame = body.blame ?? "unknown";
      await prisma.$transaction([
        prisma.swapRequest.update({ where: { id: swap.requestId }, data: { status: "CANCELLED" } }),
        prisma.book.update({ where: { id: swap.request.book.id }, data: { isAvailable: true } }),
      ]);

      if (blame === "borrower") {
        const current = await prisma.user.findUnique({ where: { id: swap.request.borrower.id }, select: { borrowLimit: true } });
        if (current && current.borrowLimit > 1) {
          await prisma.user.update({ where: { id: swap.request.borrower.id }, data: { borrowLimit: { decrement: 1 } } });
        }
        await notify(swap.request.borrower.id, "PENALTY", `Your borrow limit was reduced due to a missed swap for "${swap.request.book.title}"`, `/swaps/${swap.requestId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[handover]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
