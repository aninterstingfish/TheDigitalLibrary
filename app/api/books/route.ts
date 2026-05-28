import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const VALID_CONDITIONS = ["NEW", "MINOR_WEAR", "MAJOR_WEAR", "SEVERE_WEAR"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { title?: string; author?: string; series?: string; seriesNumber?: number; condition?: string; genres?: string[]; description?: string; coverPhoto?: string; labelType?: string; tags?: string[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const { title, author, series, seriesNumber, condition, genres, description, coverPhoto, labelType, tags } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required.", field: "title" }, { status: 400 });
  if (!condition || !VALID_CONDITIONS.includes(condition)) return NextResponse.json({ error: "Invalid condition.", field: "condition" }, { status: 400 });

  try {
    const VALID_LABELS = ["PERSONAL", "SCHOOL_PROPERTY", "DONATED"];
    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author?.trim() || null,
        series: series?.trim() || null,
        seriesNumber: seriesNumber ? Number(seriesNumber) : null,
        condition: condition as any,
        labelType: (labelType && VALID_LABELS.includes(labelType) ? labelType : "PERSONAL") as any,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        genres: JSON.stringify(Array.isArray(genres) ? genres : []),
        description: description?.trim() || null,
        coverPhoto: coverPhoto || null,
        ownerId: session.userId,
      },
    });

    // Notify users who requested this title
    const matchingRequests = await prisma.bookRequest.findMany({
      where: {
        fulfilled: false,
        title: { contains: title.trim(), mode: "insensitive" },
        userId: { not: session.userId },
      },
      select: { id: true, userId: true },
    });

    if (matchingRequests.length > 0) {
      await Promise.all(
        matchingRequests.map((r) =>
          prisma.notification.create({
            data: {
              userId: r.userId,
              type: "BOOK_REQUEST_MATCH",
              message: `A book matching your request "${title.trim()}" has been listed!`,
              link: `/books/${book.id}`,
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true, id: book.id });
  } catch (err) {
    console.error("[books/create]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
