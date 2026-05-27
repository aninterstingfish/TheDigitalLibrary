import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { username, password } = body;

  if (!username?.trim() || !password) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }

  const identifier = username.trim();
  const isEmail = identifier.includes("@") && identifier.includes(".");

  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: identifier.toLowerCase() }
      : { username: identifier },
  });

  if (!user) {
    const msg = isEmail
      ? "No account found with that email address."
      : "No account found with that username.";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  let valid: boolean;
  try {
    valid = await bcrypt.compare(password, user.passwordHash);
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  if (!user.approved) {
    return NextResponse.json({ error: `Account pending parental approval. Ask the parent at ${user.parentEmail} to check their email and click the confirmation link.` }, { status: 403 });
  }

  try {
    await createSession(user.id);
  } catch (err) {
    console.error("[login session]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
