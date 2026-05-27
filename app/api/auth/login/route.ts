import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: username }] },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ success: true });
}
