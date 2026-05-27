import { NextResponse } from "next/server";
import { getSession, deleteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { password: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body.password) return NextResponse.json({ error: "Password is required to delete your account." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { passwordHash: true } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Incorrect password." }, { status: 400 });

  try {
    const ownedBooks = await prisma.book.findMany({ where: { ownerId: session.userId }, select: { id: true } });
    const bookIds = ownedBooks.map((b) => b.id);

    const allRequests = await prisma.swapRequest.findMany({
      where: { OR: [{ bookId: { in: bookIds } }, { borrowerId: session.userId }] },
      select: { id: true },
    });
    const requestIds = allRequests.map((r) => r.id);

    const allSwaps = await prisma.swap.findMany({ where: { requestId: { in: requestIds } }, select: { id: true } });
    const swapIds = allSwaps.map((s) => s.id);

    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: session.userId } }),
      prisma.wishlistItem.deleteMany({ where: { OR: [{ userId: session.userId }, { bookId: { in: bookIds } }] } }),
      prisma.message.deleteMany({ where: { OR: [{ swapId: { in: swapIds } }, { senderId: session.userId }] } }),
      prisma.rating.deleteMany({ where: { OR: [{ swapId: { in: swapIds } }, { raterId: session.userId }, { rateeId: session.userId }] } }),
      prisma.swap.deleteMany({ where: { id: { in: swapIds } } }),
      prisma.swapRequest.deleteMany({ where: { id: { in: requestIds } } }),
      prisma.book.deleteMany({ where: { id: { in: bookIds } } }),
      prisma.user.delete({ where: { id: session.userId } }),
    ]);

    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[delete-account]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
