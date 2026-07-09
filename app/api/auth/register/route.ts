import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { sendParentalConsentEmail } from "@/lib/email";

const USERNAME_RE = /^[a-zA-Z0-9_@#!$%^&*:"<>?{}+=.\-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    username?: string;
    email?: string;
    password?: string;
    age?: number;
    parentEmail?: string;
    childEmail?: string;
    parentUsername?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, username, email, password, age, parentEmail, childEmail, parentUsername } = body;

  if (!name?.trim() || !username?.trim() || !password) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  if (age === undefined || age === null || isNaN(age)) {
    return NextResponse.json({ error: "Please enter your age.", field: "age" }, { status: 400 });
  }
  if (age < 5 || age > 110) {
    return NextResponse.json({ error: "Please enter a valid age.", field: "age" }, { status: 400 });
  }
  if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    return NextResponse.json({ error: "Name can only contain letters and spaces.", field: "name" }, { status: 400 });
  }
  if (!USERNAME_RE.test(username.trim())) {
    return NextResponse.json({ error: "Username contains invalid characters or is the wrong length.", field: "username" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters.", field: "password" }, { status: 400 });
  }
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json({ error: "Password must contain at least one capital letter.", field: "password" }, { status: 400 });
  }

  const needsConsent = age < 13;

  if (needsConsent) {
    // Under-13: email-based parental consent — no account created until parent approves
    if (!parentEmail?.trim() || !EMAIL_RE.test(parentEmail.trim())) {
      return NextResponse.json({ error: "Please enter a valid parent or guardian email address.", field: "parentEmail" }, { status: 400 });
    }

    // Check username not already taken in users or pending requests
    const [existingUser, existingRequest] = await Promise.all([
      prisma.user.findFirst({ where: { username: username.trim() } }),
      prisma.consentRequest.findFirst({ where: { username: username.trim(), expiresAt: { gt: new Date() } } }),
    ]);
    if (existingUser || existingRequest) {
      return NextResponse.json({ error: "That username is already taken.", field: "username" }, { status: 400 });
    }

    // childEmail: if provided, validate it; if parent typed the "no email" phrase, treat as null
    const normalizedChildEmail = childEmail?.trim().toLowerCase();
    const resolvedChildEmail =
      !normalizedChildEmail || normalizedChildEmail === "child does not have email"
        ? null
        : normalizedChildEmail;

    if (resolvedChildEmail && !EMAIL_RE.test(resolvedChildEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address for your child, or leave it blank.", field: "childEmail" }, { status: 400 });
    }

    // If child has an email, check it's not already in use
    if (resolvedChildEmail) {
      const existingEmail = await prisma.user.findFirst({ where: { email: resolvedChildEmail } });
      if (existingEmail) {
        return NextResponse.json({ error: "An account with that email already exists.", field: "childEmail" }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const request = await prisma.consentRequest.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        childEmail: resolvedChildEmail,
        passwordHash,
        parentEmail: parentEmail.trim().toLowerCase(),
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    try {
      await sendParentalConsentEmail({
        parentEmail: request.parentEmail,
        childName: request.name,
        childUsername: request.username,
        approveUrl: `${appUrl}/consent/${request.token}/approve`,
        declineUrl: `${appUrl}/consent/${request.token}/decline`,
      });
    } catch {
      // Email failed — delete the request so the child can try again
      await prisma.consentRequest.delete({ where: { id: request.id } });
      return NextResponse.json({ error: "We couldn't send the consent email. Please check the parent email address and try again.", field: "parentEmail" }, { status: 500 });
    }

    return NextResponse.json({ pendingConsent: true });
  }

  // Age 13+ — standard signup
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required.", field: "email" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address.", field: "email" }, { status: 400 });
  }

  const existingUsername = await prisma.user.findFirst({ where: { username: username.trim() } });
  if (existingUsername) {
    return NextResponse.json({ error: "That username is already taken.", field: "username" }, { status: 400 });
  }
  const existingEmail = await prisma.user.findFirst({ where: { email: email.trim().toLowerCase() } });
  if (existingEmail) {
    return NextResponse.json({ error: "An account with that email already exists.", field: "email" }, { status: 400 });
  }

  // Optional parent link for 13+
  let parentId: string | null = null;
  if (parentUsername?.trim()) {
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
        approved: true,
        ...(parentId && { parentId }),
      },
    });
    await createSession(user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
