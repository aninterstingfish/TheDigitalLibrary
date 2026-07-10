import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { sendParentalConsentEmail } from "@/lib/email";

const USERNAME_RE = /^[a-zA-Z0-9_@#!$%^&*:"<>?{}+=.\-]{3,30}$/;

export async function POST(req: NextRequest) {
  let body: { name?: string; username?: string; email?: string; password?: string; age?: number; parentEmail?: string; parentUsername?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { name, username, email, password, age, parentEmail, parentUsername } = body;

  if (!name?.trim() || !username?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }
  if (age === undefined || age === null || isNaN(age)) {
    return NextResponse.json({ error: "Please enter your age.", field: "age" }, { status: 400 });
  }
  if (age < 5 || age > 110) {
    return NextResponse.json({ error: "Please enter a valid age.", field: "age" }, { status: 400 });
  }

  const needsApproval = age < 13;

  if (needsApproval) {
    if (!parentEmail?.trim()) {
      return NextResponse.json({ error: "Please enter your parent or guardian's email.", field: "parentEmail" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
      return NextResponse.json({ error: "Enter a valid parent email address.", field: "parentEmail" }, { status: 400 });
    }
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

  let parentId: string | null = null;
  if (!needsApproval && parentUsername?.trim()) {
    const parent = await prisma.user.findFirst({ where: { username: parentUsername.trim() } });
    if (!parent) {
      return NextResponse.json({ error: "No account found with that parent username.", field: "parentUsername" }, { status: 400 });
    }
    parentId = parent.id;
    await prisma.notification.create({
      data: {
        userId: parent.id,
        type: "CHILD_LINKED",
        message: `${name.trim()} (@${username.trim()}) has linked their account to yours.`,
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

    if (needsApproval) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.consentRequest.create({
        data: {
          token,
          parentEmail: parentEmail!.trim().toLowerCase(),
          childId: user.id,
          expiresAt,
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      try {
        await sendParentalConsentEmail({
          parentEmail: parentEmail!.trim().toLowerCase(),
          childName: name.trim(),
          childUsername: username.trim(),
          approveUrl: `${appUrl}/api/auth/consent?token=${token}&action=approve`,
          declineUrl: `${appUrl}/api/auth/consent?token=${token}&action=decline`,
        });
      } catch (emailErr) {
        console.error("[register] Failed to send consent email:", emailErr);
      }

      return NextResponse.json({ pendingApproval: true, parentEmail: parentEmail!.trim().toLowerCase(), userId: user.id });
    }

    await createSession(user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
