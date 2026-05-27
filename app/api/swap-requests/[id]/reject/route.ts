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
    include: { book: { select: { title: true, ownerId: true } }, borrower: { select: { id: true } } },
  });
  if (!request) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  if (request.book.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    await prisma.swapRequest.update({ where: { id }, data: { status: "REJECTED" } });
    const owner = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    await notify(request.borrower.id, "REQUEST_REJECTED", `${owner?.name} declined your request for "${request.book.title}"`, `/swaps/${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reject]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
