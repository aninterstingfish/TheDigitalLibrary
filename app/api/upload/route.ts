import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 5 MB)." }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Only JPEG, PNG and WebP images are allowed." }, { status: 400 });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
    const dir = join(process.cwd(), "public", "uploads", "books");

    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/uploads/books/${filename}` });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
