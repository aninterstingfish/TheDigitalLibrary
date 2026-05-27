import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const USERNAME_RE = /^[a-zA-Z0-9_@#!$%^&*:"<>?{}+=.\-]{3,30}$/;

export async function POST(req: NextRequest) {
  const { name, username, email, password } = await req.json();

  // Server-side validation (mirrors client)
  if (!name?.trim() || !username?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }
  if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    return NextResponse.json({ error: "Name can only contain letters and spaces.", field: "name" }, { status: 400 });
  }
  if (!USERNAME_RE.test(username.trim())) {
    return NextResponse.json({ error: "Username contains invalid characters or is the wrong length.", field: "username" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address.", field: "email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters.", field: "password" }, { status: 400 });
  }
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json({ error: "Password must contain at least one capital letter.", field: "password" }, { status: 400 });
  }

  // Uniqueness checks
  const existingUsername = await prisma.user.findFirst({ where: { username: username.trim() } });
  if (existingUsername) {
    return NextResponse.json({ error: "That username is already taken.", field: "username" }, { status: 400 });
  }

  const existingEmail = await prisma.user.findFirst({
    where: { email: email.trim().toLowerCase() },
  });
  if (existingEmail) {
    return NextResponse.json({ error: "An account with that email already exists.", field: "email" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name: name.trim(), username: username.trim(), email: email.trim().toLowerCase(), passwordHash },
  });

  await createSession(user.id);
  return NextResponse.json({ success: true });
}
