import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const action = req.nextUrl.searchParams.get("action");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!token || (action !== "approve" && action !== "decline")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const consent = await prisma.consentRequest.findUnique({
    where: { token },
    include: { child: true },
  });

  if (!consent) {
    return NextResponse.redirect(new URL("/approve-account?status=invalid", req.url));
  }

  if (consent.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/approve-account?status=expired", req.url));
  }

  if (consent.status !== "PENDING") {
    const already = consent.status === "APPROVED" ? "approved" : "declined";
    return NextResponse.redirect(new URL(`/approve-account?status=${already}`, req.url));
  }

  if (action === "approve") {
    await prisma.$transaction([
      prisma.user.update({ where: { id: consent.childId }, data: { approved: true } }),
      prisma.consentRequest.update({ where: { id: consent.id }, data: { status: "APPROVED" } }),
    ]);
    return NextResponse.redirect(new URL(`/approve-account?status=approved&name=${encodeURIComponent(consent.child.name)}`, req.url));
  }

  // decline — delete the child account (ConsentRequest cascades)
  await prisma.user.delete({ where: { id: consent.childId } });
  return NextResponse.redirect(new URL("/approve-account?status=declined", req.url));
}
