import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import ReadingListsManager from "./ReadingListsManager";

export default async function ReadingListsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, lists] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { isTeacher: true } }),
    prisma.readingList.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        isTeacherList: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  const formattedLists = lists.map((l) => ({
    id: l.id,
    name: l.name,
    description: l.description,
    isPublic: l.isPublic,
    isTeacherList: l.isTeacherList,
    itemCount: l._count.items,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav active="/reading-lists" />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <ReadingListsManager initialLists={formattedLists} isTeacher={Boolean(user?.isTeacher)} />
      </main>
    </div>
  );
}
