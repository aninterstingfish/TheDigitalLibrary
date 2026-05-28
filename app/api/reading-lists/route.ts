import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const lists = await prisma.readingList.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, description: true, isPublic: true, isTeacherList: true, createdAt: true,
      items: { select: { id: true } },
    },
  });

  return NextResponse.json(lists.map((l) => ({ ...l, itemCount: l.items.length })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { name?: string; description?: string; isPublic?: boolean; isTeacherList?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "List name is required.", field: "name" }, { status: 400 });
  if (name.length > 100) return NextResponse.json({ error: "Name too long.", field: "name" }, { status: 400 });

  // isTeacherList only allowed if user is a teacher
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { isTeacher: true } });
  const isTeacherList = Boolean(body.isTeacherList) && Boolean(user?.isTeacher);

  const list = await prisma.readingList.create({
    data: {
      name,
      description: body.description?.trim() || null,
      isPublic: Boolean(body.isPublic),
      isTeacherList,
      userId: session.userId,
    },
    select: { id: true, name: true, description: true, isPublic: true, isTeacherList: true, createdAt: true },
  });

  return NextResponse.json(list, { status: 201 });
}
