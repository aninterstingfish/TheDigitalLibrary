import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: swapId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const swap = await prisma.swap.findUnique({
    where: { id: swapId },
    select: {
      request: {
        select: {
          borrowerId: true,
          book: { select: { ownerId: true } },
        },
      },
    },
  });

  if (!swap) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isParticipant = swap.request.borrowerId === session.userId || swap.request.book.ownerId === session.userId;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { swapId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: { select: { id: true, username: true, name: true } },
    },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: swapId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const swap = await prisma.swap.findUnique({
    where: { id: swapId },
    select: {
      handedOver: true,
      ownerConfirmedReturn: true,
      requestId: true,
      request: {
        select: {
          id: true,
          borrowerId: true,
          book: { select: { ownerId: true } },
        },
      },
    },
  });

  if (!swap) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isParticipant = swap.request.borrowerId === session.userId || swap.request.book.ownerId === session.userId;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  if (!swap.handedOver || swap.ownerConfirmedReturn) {
    return NextResponse.json({ error: "Messaging is only available during active loans." }, { status: 400 });
  }

  let body: { content?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const content = body.content?.trim();
  if (!content) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  if (content.length > 2000) return NextResponse.json({ error: "Message too long (max 2000 characters)." }, { status: 400 });

  const message = await prisma.message.create({
    data: { swapId, senderId: session.userId, content },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: { select: { id: true, username: true, name: true } },
    },
  });

  // Notify the other participant
  const otherId = swap.request.borrowerId === session.userId
    ? swap.request.book.ownerId
    : swap.request.borrowerId;

  await prisma.notification.create({
    data: {
      userId: otherId,
      type: "NEW_MESSAGE",
      message: `New message in your active swap.`,
      link: `/swaps/${swap.request.id}`,
    },
  });

  return NextResponse.json(message);
}
