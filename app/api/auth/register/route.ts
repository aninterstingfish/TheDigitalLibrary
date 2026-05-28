import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const USERNAME_RE = /^[a-zA-Z0-9_@#!$%^&*:"<>?{}+=.\-]{3,30}$/;

export async function POST(req: NextRequest) {
  let body: { name?: string; username?: string; email?: string; password?: string; age?: number; parentUsername?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { name, username, email, password, age, parentUsername } = body;

  if (!name?.trim() || !username?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }
  if (age === undefined || age === null || isNaN(age)) {
    return NextResponse.json({ error: "Please enter your age.", field: "age" }, { status: 400 });
  }
  if (age < 5 || age > 110) {
    return NextResponse.json({ error: "Please enter a valid age.", field: "age" }, { status: 400 });
  }
  if (age < 13 && !parentUsername?.trim()) {
    return NextResponse.json({ error: "Please enter your parent's username.", field: "parentUsername" }, { status: 400 });
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

  const existingUsername = await prisma.user.findFirst({ where: { username: username.trim() } });
  if (existingUsername) {
    return NextResponse.json({ error: "That username is already taken.", field: "username" }, { status: 400 });
  }
  const existingEmail = await prisma.user.findFirst({ where: { email: email.trim().toLowerCase() } });
  if (existingEmail) {
    return NextResponse.json({ error: "An account with that email already exists.", field: "email" }, { status: 400 });
  }

  const needsApproval = age < 13;
  let parentId: string | null = null;

  if (needsApproval) {
    const parent = await prisma.user.findFirst({ where: { username: parentUsername!.trim() } });
    if (!parent) {
      return NextResponse.json({ error: "Parent account not found.", code: "PARENT_NOT_FOUND" }, { status: 404 });
    }
    parentId = parent.id;
    // Notify the parent
    await prisma.notification.create({
      data: {
        userId: parent.id,
        type: "APPROVAL_NEEDED",
        message: `${name.trim()} has signed up and needs your approval. Visit your Admin panel to approve their account.`,
        link: "/admin",
      },
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        approved: !needsApproval,
        ...(parentId && { parentId }),
      },
    });

    if (needsApproval) return NextResponse.json({ pendingApproval: true });

    await createSession(user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
