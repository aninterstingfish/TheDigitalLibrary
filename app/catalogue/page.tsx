import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import CatalogueClient from "./CatalogueClient";

export default async function CataloguePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const books = await prisma.book.findMany({
    include: {
      owner: { select: { username: true, name: true } },
      _count: { select: { requests: true } },
      wishlistedBy: { where: { userId: session.userId }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    condition: b.condition as string,
    coverPhoto: b.coverPhoto,
    genres: (() => { try { return JSON.parse(b.genres) as string[]; } catch { return []; } })(),
    isAvailable: b.isAvailable,
    requestCount: b._count.requests,
    owner: b.owner,
    isWishlisted: b.wishlistedBy.length > 0,
    isOwnBook: b.ownerId === session.userId,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav active="/catalogue" />
      <CatalogueClient books={serialized} />
    </div>
  );
}
