import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { name?: string; yearGroup?: number | null; profilePhoto?: string | null; email?: string; username?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: "Name cannot be empty.", field: "name" }, { status: 400 });
    if (!/^[a-zA-Z\s]+$/.test(body.name.trim())) return NextResponse.json({ error: "Name can only contain letters and spaces.", field: "name" }, { status: 400 });
  }

  if (body.email !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return NextResponse.json({ error: "Enter a valid email address.", field: "email" }, { status: 400 });
    const existing = await prisma.user.findFirst({ where: { email: body.email.trim().toLowerCase(), NOT: { id: session.userId } } });
    if (existing) return NextResponse.json({ error: "Email already in use.", field: "email" }, { status: 400 });
  }

  if (body.username !== undefined) {
    const USERNAME_RE = /^[a-zA-Z0-9_@#!$%^&*:"<>?{}+=.\-]{3,30}$/;
    if (!USERNAME_RE.test(body.username.trim())) return NextResponse.json({ error: "Username must be 3–30 characters.", field: "username" }, { status: 400 });
    const existing = await prisma.user.findFirst({ where: { username: body.username.trim(), NOT: { id: session.userId } } });
    if (existing) return NextResponse.json({ error: "Username already taken.", field: "username" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.yearGroup !== undefined && { yearGroup: body.yearGroup }),
        ...(body.profilePhoto !== undefined && { profilePhoto: body.profilePhoto }),
        ...(body.email !== undefined && { email: body.email.trim().toLowerCase() }),
        ...(body.username !== undefined && { username: body.username.trim() }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[settings]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
