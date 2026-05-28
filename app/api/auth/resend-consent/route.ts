import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendParentalConsentEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email } = body;
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email: email.trim().toLowerCase(), approved: false },
  });

  // Always return 200 to avoid leaking whether an account exists
  if (!user || !user.parentEmail) {
    return NextResponse.json({ success: true });
  }

  const newToken = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { parentToken: newToken },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const approvalUrl = `${appUrl}/approve-account?token=${newToken}`;

  await sendParentalConsentEmail({
    parentEmail: user.parentEmail,
    childName: user.name,
    childUsername: user.username,
    approvalUrl,
  });

  return NextResponse.json({ success: true });
}
