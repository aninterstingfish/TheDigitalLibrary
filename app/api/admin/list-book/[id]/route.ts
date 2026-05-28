import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const VALID_CONDITIONS = ["NEW", "MINOR_WEAR", "MAJOR_WEAR", "SEVERE_WEAR"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true, children: { where: { id: childId }, select: { id: true } } },
  });

  if (!admin?.isAdmin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (!admin.children[0]) return NextResponse.json({ error: "Child account not found." }, { status: 404 });

  let body: { title?: string; author?: string; condition?: string; genres?: string[]; description?: string; coverPhoto?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const { title, author, condition, genres, description, coverPhoto } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required.", field: "title" }, { status: 400 });
  if (!condition || !VALID_CONDITIONS.includes(condition)) return NextResponse.json({ error: "Invalid condition.", field: "condition" }, { status: 400 });

  try {
    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author?.trim() || null,
        condition: condition as any,
        genres: JSON.stringify(Array.isArray(genres) ? genres : []),
        description: description?.trim() || null,
        coverPhoto: coverPhoto || null,
        ownerId: childId,
      },
    });
    return NextResponse.json({ success: true, id: book.id });
  } catch (err) {
    console.error("[admin/list-book]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
