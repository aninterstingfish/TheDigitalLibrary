import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const requests = await prisma.bookRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, author: true, fulfilled: true, createdAt: true },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { title?: string; author?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const title = body.title?.trim();
  if (!title) return NextResponse.json({ error: "Title is required.", field: "title" }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: "Title too long.", field: "title" }, { status: 400 });

  const existing = await prisma.bookRequest.findFirst({
    where: { userId: session.userId, title: { equals: title, mode: "insensitive" }, fulfilled: false },
  });
  if (existing) return NextResponse.json({ error: "You already have an open request for this title.", field: "title" }, { status: 400 });

  const request = await prisma.bookRequest.create({
    data: { title, author: body.author?.trim() || null, userId: session.userId },
    select: { id: true, title: true, author: true, fulfilled: true, createdAt: true },
  });

  return NextResponse.json(request, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const existing = await prisma.bookRequest.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.bookRequest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
