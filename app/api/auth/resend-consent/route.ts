import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendParentalConsentEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { userId } = body;
  if (!userId) return NextResponse.json({ success: true });

  const consent = await prisma.consentRequest.findUnique({
    where: { childId: userId },
    include: { child: true },
  });

  if (!consent || consent.status !== "PENDING") return NextResponse.json({ success: true });

  const newToken = randomBytes(32).toString("hex");
  const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.consentRequest.update({
    where: { id: consent.id },
    data: { token: newToken, expiresAt: newExpiry },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    await sendParentalConsentEmail({
      parentEmail: consent.parentEmail,
      childName: consent.child.name,
      childUsername: consent.child.username,
      approveUrl: `${appUrl}/api/auth/consent?token=${newToken}&action=approve`,
      declineUrl: `${appUrl}/api/auth/consent?token=${newToken}&action=decline`,
    });
  } catch (err) {
    console.error("[resend-consent]", err);
    return NextResponse.json({ error: "Failed to send email. Check Gmail credentials." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
