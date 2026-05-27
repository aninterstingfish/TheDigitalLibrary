import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { bookId } = await params;

  try {
    await prisma.wishlistItem.create({ data: { userId: session.userId, bookId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { bookId } = await params;

  try {
    await prisma.wishlistItem.deleteMany({ where: { userId: session.userId, bookId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
