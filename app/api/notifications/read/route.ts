import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  await prisma.notification.updateMany({ where: { userId: session.userId, read: false }, data: { read: true } });
  return NextResponse.json({ success: true });
}
