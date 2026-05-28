import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import ApproveButton from "./ApproveButton";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true, name: true },
  });
  if (!admin?.isAdmin) redirect("/dashboard");

  const pending = await prisma.user.findMany({
    where: { approved: false },
    select: { id: true, name: true, username: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav active="/admin" />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-black mb-1">Admin panel</h1>
        <p className="text-gray-500 text-sm mb-8">Approve accounts for users under 13.</p>

        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400 text-sm">No accounts waiting for approval.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-black text-sm">{u.name}</p>
                  <p className="text-gray-400 text-xs">@{u.username} · {u.email}</p>
                  <p className="text-gray-300 text-xs mt-0.5">
                    Signed up {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <ApproveButton userId={u.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
