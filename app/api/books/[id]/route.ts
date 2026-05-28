import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const VALID_CONDITIONS = ["NEW", "MINOR_WEAR", "MAJOR_WEAR", "SEVERE_WEAR"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id }, select: { ownerId: true } });
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (book.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (body.condition && !VALID_CONDITIONS.includes(body.condition as string)) {
    return NextResponse.json({ error: "Invalid condition." }, { status: 400 });
  }

  try {
    const updated = await prisma.book.update({
      where: { id },
      data: {
        ...(body.title && { title: (body.title as string).trim() }),
        ...(body.author !== undefined && { author: (body.author as string)?.trim() || null }),
        ...(body.condition && { condition: body.condition as any }),
        ...(body.genres !== undefined && { genres: JSON.stringify(body.genres) }),
        ...(body.description !== undefined && { description: (body.description as string)?.trim() || null }),
        ...(body.coverPhoto !== undefined && { coverPhoto: body.coverPhoto as string | null }),
        ...(body.isCurrentlyReading !== undefined && { isCurrentlyReading: Boolean(body.isCurrentlyReading) }),
        ...(body.series !== undefined && { series: (body.series as string)?.trim() || null }),
        ...(body.seriesNumber !== undefined && { seriesNumber: body.seriesNumber ? Number(body.seriesNumber) : null }),
        ...(body.labelType && { labelType: body.labelType as any }),
        ...(body.tags !== undefined && { tags: JSON.stringify(Array.isArray(body.tags) ? body.tags : []) }),
      },
    });
    return NextResponse.json({ success: true, id: updated.id });
  } catch (err) {
    console.error("[books/update]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id }, select: { ownerId: true } });
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (book.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[books/delete]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
