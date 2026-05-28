import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: session.userId }, select: { isAdmin: true } });
  if (!admin?.isAdmin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  await prisma.user.update({ where: { id }, data: { approved: true } });
  return NextResponse.json({ success: true });
}
