import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import ReadingListDetail from "./ReadingListDetail";

export default async function ReadingListPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const list = await prisma.readingList.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, name: true } },
      items: {
        orderBy: { addedAt: "asc" },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverPhoto: true,
              condition: true,
              isAvailable: true,
              series: true,
              seriesNumber: true,
              owner: { select: { username: true } },
            },
          },
        },
      },
    },
  });

  if (!list) notFound();
  if (!list.isPublic && list.userId !== session.userId) redirect("/reading-lists");

  const isOwner = list.userId === session.userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav active="/reading-lists" />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <ReadingListDetail list={list} isOwner={isOwner} />
      </main>
    </div>
  );
}
