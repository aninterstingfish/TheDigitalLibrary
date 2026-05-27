import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { current?: string; next?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (!body.current || !body.next) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  if (body.next.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters.", field: "next" }, { status: 400 });
  if (!/[A-Z]/.test(body.next)) return NextResponse.json({ error: "Password must contain at least one capital letter.", field: "next" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { passwordHash: true } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const valid = await bcrypt.compare(body.current, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect.", field: "current" }, { status: 400 });

  const hash = await bcrypt.hash(body.next, 12);
  await prisma.user.update({ where: { id: session.userId }, data: { passwordHash: hash } });
  return NextResponse.json({ success: true });
}
