import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { name?: string; yearGroup?: number | null; profilePhoto?: string | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: "Name cannot be empty.", field: "name" }, { status: 400 });
    if (!/^[a-zA-Z\s]+$/.test(body.name.trim())) return NextResponse.json({ error: "Name can only contain letters and spaces.", field: "name" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.yearGroup !== undefined && { yearGroup: body.yearGroup }),
        ...(body.profilePhoto !== undefined && { profilePhoto: body.profilePhoto }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[settings]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
