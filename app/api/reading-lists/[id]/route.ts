import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const list = await prisma.readingList.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, name: true } },
      items: {
        orderBy: { addedAt: "asc" },
        include: {
          book: {
            select: {
              id: true, title: true, author: true, coverPhoto: true, condition: true,
              genres: true, isAvailable: true, series: true, seriesNumber: true,
              owner: { select: { username: true } },
            },
          },
        },
      },
    },
  });

  if (!list) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!list.isPublic && list.userId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  return NextResponse.json(list);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const list = await prisma.readingList.findUnique({ where: { id }, select: { userId: true } });
  if (!list) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (list.userId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: { name?: string; description?: string; isPublic?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  await prisma.readingList.update({
    where: { id },
    data: {
      ...(body.name?.trim() && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.isPublic !== undefined && { isPublic: Boolean(body.isPublic) }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const list = await prisma.readingList.findUnique({ where: { id }, select: { userId: true } });
  if (!list) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (list.userId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  await prisma.readingList.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
