import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import AdminListBookForm from "./AdminListBookForm";

export default async function AdminListBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true, children: { where: { id: childId }, select: { id: true, name: true, username: true } } },
  });

  if (!admin?.isAdmin) redirect("/dashboard");

  const child = admin.children[0];
  if (!child) redirect("/admin");

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav active="/admin" />
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="mb-8">
          <a href="/admin" className="text-xs text-gray-400 hover:text-black transition-colors">← Back to panel</a>
          <h1 className="text-2xl font-bold text-black mt-3 mb-1">List a book</h1>
          <p className="text-gray-500 text-sm">Adding a book to <strong>@{child.username}</strong>&apos;s library on their behalf.</p>
        </div>
        <AdminListBookForm childId={child.id} childName={child.name} />
      </div>
    </div>
  );
}
