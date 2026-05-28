import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendParentalConsentEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  let body: { email?: string; identifier?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const raw = (body.identifier ?? body.email ?? "").trim();
  if (!raw) return NextResponse.json({ success: true });

  const isEmail = raw.includes("@");
  const user = await prisma.user.findFirst({
    where: {
      approved: false,
      ...(isEmail ? { email: raw.toLowerCase() } : { username: raw }),
    },
  });

  if (!user || !user.parentEmail) return NextResponse.json({ success: true });

  const newToken = randomBytes(32).toString("hex");
  await prisma.user.update({ where: { id: user.id }, data: { parentToken: newToken } });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendParentalConsentEmail({
    parentEmail: user.parentEmail,
    childName: user.name,
    childUsername: user.username,
    approvalUrl: `${appUrl}/approve-account?token=${newToken}`,
  });

  return NextResponse.json({ success: true });
}
