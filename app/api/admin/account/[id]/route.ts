import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true, children: { where: { id: childId }, select: { id: true } } },
  });

  if (!admin?.isAdmin || !admin.children[0]) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: { action?: "pause" | "resume" | "delete" };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (body.action === "pause") {
    await prisma.user.update({ where: { id: childId }, data: { paused: true } });
    return NextResponse.json({ success: true });
  }

  if (body.action === "resume") {
    await prisma.user.update({ where: { id: childId }, data: { paused: false } });
    return NextResponse.json({ success: true });
  }

  if (body.action === "delete") {
    // Remove sessions, notifications, then delete user
    await prisma.notification.deleteMany({ where: { userId: childId } });
    await prisma.bookRequest.deleteMany({ where: { userId: childId } });
    await prisma.queueEntry.deleteMany({ where: { userId: childId } });
    await prisma.wishlistItem.deleteMany({ where: { userId: childId } });
    await prisma.readingList.deleteMany({ where: { userId: childId } });
    // Unlink parent
    await prisma.user.update({ where: { id: childId }, data: { parentId: null } });
    await prisma.user.delete({ where: { id: childId } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
