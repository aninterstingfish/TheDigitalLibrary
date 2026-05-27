import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      ownedBooks: { select: { id: true, title: true, author: true, condition: true, description: true, genres: true, isAvailable: true, createdAt: true } },
      swapRequests: {
        include: {
          book: { select: { title: true } },
          swap: { select: { pickupDate: true, returnDate: true, loanMode: true, handedOver: true, ownerConfirmedReturn: true, confirmedAt: true } },
        },
      },
      ratingsGiven: { select: { stars: true, review: true, role: true, createdAt: true } },
      ratingsReceived: { select: { stars: true, review: true, role: true, createdAt: true, rater: { select: { username: true } } } },
      wishlist: { include: { book: { select: { title: true, author: true } } } },
      notifications: { select: { type: true, message: true, read: true, createdAt: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Strip password hash — never export it
  const { passwordHash: _omit, ...safeUser } = user;
  const payload = { exportedAt: new Date().toISOString(), ...safeUser };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cloud-library-data-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
