import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { name, username, email, password } = await req.json();

  if (!name || !username || !email || !password) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) {
    const field = existing.username === username ? "username" : "email";
    const msg =
      field === "username" ? "Username already taken." : "Email already registered.";
    return NextResponse.json({ error: msg, field }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, username, email, passwordHash },
  });

  await createSession(user.id);
  return NextResponse.json({ success: true });
}
